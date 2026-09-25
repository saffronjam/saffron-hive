import { deviceStore, isRuntimeEnabledDevice, type Device } from "$lib/stores/devices";

const CONFIRMATION_TIMEOUT_MS = 10_000;
const RECONCILIATION_RETRY_MS = 3_000;

type ControlKind = "power" | "brightness";

interface ControlBatch {
  kind: ControlKind;
  accepted: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

interface ControlIntent {
  batch: ControlBatch;
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
export class ControlIntents {
  private pending = $state.raw(new Map<string, ControlIntent>());
  private live: Record<string, Device> = {};

  has(devices: readonly Device[], kind?: ControlKind): boolean {
    return devices.some((device) => {
      const intent = this.pending.get(device.id);
      return intent !== undefined && (kind === undefined || intent.batch.kind === kind);
    });
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

  private replace(next: Map<string, ControlIntent>) {
    const active = new Set([...next.values()].map((intent) => intent.batch));
    for (const { batch } of this.pending.values()) {
      if (!active.has(batch)) clearTimeout(batch.timer);
    }
    this.pending = next;
  }

  private release(batch: ControlBatch) {
    this.replace(new Map([...this.pending].filter(([, intent]) => intent.batch !== batch)));
  }

  private hasBatch(batch: ControlBatch): boolean {
    return [...this.pending.values()].some((intent) => intent.batch === batch);
  }

  private async refreshBatch(batch: ControlBatch, refresh: () => Promise<boolean>): Promise<void> {
    if (!this.hasBatch(batch)) return;
    let refreshed = false;
    try {
      refreshed = await refresh();
    } catch {
      refreshed = false;
    }
    if (!this.hasBatch(batch)) return;
    if (refreshed) this.release(batch);
    else
      batch.timer = setTimeout(
        () => void this.refreshBatch(batch, refresh),
        RECONCILIATION_RETRY_MS,
      );
  }

  clear(devices?: readonly Device[], kind?: ControlKind) {
    if (this.pending.size === 0 || (devices && !this.has(devices, kind))) return;
    if (!devices) {
      this.replace(new Map());
      return;
    }
    const ids = new Set(devices.map((device) => device.id));
    this.replace(
      new Map(
        [...this.pending].filter(
          ([id, intent]) => !ids.has(id) || (kind !== undefined && intent.batch.kind !== kind),
        ),
      ),
    );
  }

  reconcile(devices: Record<string, Device>) {
    this.live = devices;
    if (this.pending.size === 0) return;
    const next = new Map(
      [...this.pending].filter(([id]) => devices[id] && isRuntimeEnabledDevice(devices[id])),
    );
    const waiting = new Set<ControlBatch>();
    for (const [id, intent] of next) {
      const state = devices[id].state;
      if (
        !intent.batch.accepted ||
        state?.on !== intent.on ||
        (intent.batch.kind === "brightness" && state?.brightness !== intent.brightness) ||
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

  toggle(
    devices: readonly Device[],
    on: boolean,
    send: () => Promise<CommandResult>,
    refresh: () => Promise<boolean>,
  ): Promise<void> {
    return this.send(devices, { kind: "power", on }, send, refresh);
  }

  brightness(
    devices: readonly Device[],
    brightness: number,
    send: () => Promise<CommandResult>,
    refresh: () => Promise<boolean>,
  ): Promise<void> {
    return this.send(devices, { kind: "brightness", on: true, brightness }, send, refresh);
  }

  private async send(
    devices: readonly Device[],
    desired: { kind: "power"; on: boolean } | { kind: "brightness"; on: true; brightness: number },
    send: () => Promise<CommandResult>,
    refresh: () => Promise<boolean>,
  ): Promise<void> {
    const targets = devices.filter(isRuntimeEnabledDevice);
    if (targets.length === 0) return;
    const batch: ControlBatch = {
      kind: desired.kind,
      accepted: false,
    };
    const next = new Map(this.pending);
    for (const device of targets) {
      next.set(device.id, {
        batch,
        on: desired.on,
        brightness:
          desired.kind === "brightness"
            ? desired.brightness
            : this.device(device).state?.brightness,
        initialState: device.state,
        needsEcho:
          this.pending.has(device.id) ||
          device.state?.on !== desired.on ||
          (desired.kind === "brightness" && device.state?.brightness !== desired.brightness),
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
      if (this.hasBatch(batch)) {
        batch.timer = setTimeout(
          () => void this.refreshBatch(batch, refresh),
          CONFIRMATION_TIMEOUT_MS,
        );
      }
    } catch {
      this.release(batch);
    }
  }
}

export const controlIntents = new ControlIntents();
deviceStore.subscribe((devices) => controlIntents.reconcile(devices));
