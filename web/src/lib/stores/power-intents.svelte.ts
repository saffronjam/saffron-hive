import { deviceStore, isRuntimeEnabledDevice, type Device } from "$lib/stores/devices";

const CONFIRMATION_TIMEOUT_MS = 10_000;

interface PowerBatch {
  accepted: boolean;
  timer: ReturnType<typeof setTimeout>;
}

interface PowerIntent {
  batch: PowerBatch;
  on: boolean;
  brightness: number | null | undefined;
  initialState: Device["state"];
  needsEcho: boolean;
}

interface CommandResult {
  error?: unknown;
  data?: { setTargetState: boolean } | null;
}

/** Transient control feedback, kept separate from confirmed device state and disk snapshots. */
export class PowerIntents {
  private pending = $state.raw(new Map<string, PowerIntent>());
  private live: Record<string, Device> = {};

  has(devices: readonly Device[]): boolean {
    return devices.some((device) => this.pending.has(device.id));
  }

  device(device: Device): Device {
    const intent = this.pending.get(device.id);
    if (!intent || !isRuntimeEnabledDevice(device)) return device;
    return {
      ...device,
      state: { ...device.state, on: intent.on, brightness: intent.brightness },
    };
  }

  devices(devices: readonly Device[]): Device[] {
    return devices.map((device) => this.device(device));
  }

  private replace(next: Map<string, PowerIntent>) {
    const active = new Set([...next.values()].map((intent) => intent.batch));
    for (const { batch } of this.pending.values()) {
      if (!active.has(batch)) clearTimeout(batch.timer);
    }
    this.pending = next;
  }

  private release(batch: PowerBatch) {
    this.replace(new Map([...this.pending].filter(([, intent]) => intent.batch !== batch)));
  }

  clear(devices?: readonly Device[]) {
    if (this.pending.size === 0 || (devices && !this.has(devices))) return;
    if (!devices) {
      this.replace(new Map());
      return;
    }
    const ids = new Set(devices.map((device) => device.id));
    this.replace(new Map([...this.pending].filter(([id]) => !ids.has(id))));
  }

  reconcile(devices: Record<string, Device>) {
    this.live = devices;
    if (this.pending.size === 0) return;
    const next = new Map(
      [...this.pending].filter(([id]) => devices[id] && isRuntimeEnabledDevice(devices[id])),
    );
    const waiting = new Set<PowerBatch>();
    for (const [id, intent] of next) {
      const state = devices[id].state;
      if (
        !intent.batch.accepted ||
        state?.on !== intent.on ||
        (intent.needsEcho && state === intent.initialState)
      ) {
        waiting.add(intent.batch);
      }
    }
    for (const [id, intent] of next) {
      if (!waiting.has(intent.batch)) next.delete(id);
    }
    if (next.size !== this.pending.size) this.replace(next);
  }

  async toggle(
    devices: readonly Device[],
    on: boolean,
    send: () => Promise<CommandResult>,
  ): Promise<void> {
    const targets = devices.filter(isRuntimeEnabledDevice);
    if (targets.length === 0) return;
    const batch: PowerBatch = {
      accepted: false,
      timer: setTimeout(() => this.release(batch), CONFIRMATION_TIMEOUT_MS),
    };
    const next = new Map(this.pending);
    for (const device of targets) {
      next.set(device.id, {
        batch,
        on,
        brightness: this.device(device).state?.brightness,
        initialState: device.state,
        needsEcho: this.pending.has(device.id) || device.state?.on !== on,
      });
    }
    this.replace(next);
    try {
      const result = await send();
      if (result.error || result.data?.setTargetState !== true) {
        this.release(batch);
        return;
      }
      batch.accepted = true;
      this.reconcile(this.live);
    } catch {
      this.release(batch);
    }
  }
}

export const powerIntents = new PowerIntents();
deviceStore.subscribe((devices) => powerIntents.reconcile(devices));
