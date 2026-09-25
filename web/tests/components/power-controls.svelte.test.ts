import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import { House } from "@lucide/svelte";
import DashboardTargetPanel from "$lib/components/dashboard-target-panel.svelte";
import DeviceCollectionCard from "$lib/components/device-collection-card.svelte";
import DeviceCard from "$lib/components/device-card.svelte";
import { commitGroupBrightness, commitGroupToggle } from "$lib/group-commands";
import { controlIntents } from "$lib/stores/control-intents.svelte";
import { deviceStore, type Device } from "$lib/stores/devices";
import { CapabilityCategory } from "$lib/gql/graphql";
import { createMockClient } from "../helpers/mock-client";

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

function light(id: string, brightness: number): Device {
  return {
    id,
    name: id,
    friendlyName: id,
    source: "zigbee2mqtt",
    type: "light",
    available: true,
    disabled: false,
    deleted: false,
    seen: true,
    roles: { controlledLoad: null, contact: null },
    configuration: [],
    capabilities: ["on_off", "brightness"].map((name) => ({
      name,
      type: "numeric",
      category: CapabilityCategory.State,
      canSet: true,
      canGet: true,
      reportsValue: true,
    })),
    state: { on: true, brightness },
  };
}

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement;

afterEach(async () => {
  if (instance) await unmount(instance);
  instance = null;
  host?.remove();
  controlIntents.clear();
  deviceStore.clear();
  vi.useRealTimers();
});

type Surface = "apartment" | "dashboard room" | "room card" | "group card" | "device card";

function render(surface: Surface) {
  vi.useFakeTimers();
  const devices = $state(
    surface === "device card" ? [light("a", 80)] : [light("a", 80), light("b", 220)],
  );
  deviceStore.hydrate(devices);
  const room = {
    id: "room",
    name: "Room",
    members: devices.map((device) => ({ memberType: "device", memberId: device.id })),
  };
  const mock = createMockClient();
  const context = new Map([["$$_urql", mock.client]]);
  host = document.createElement("div");
  document.body.appendChild(host);
  if (surface === "apartment" || surface === "dashboard room") {
    instance = mount(DashboardTargetPanel, {
      target: host,
      context,
      props: {
        target: surface === "apartment" ? { kind: "apartment" } : { kind: "room", room },
        presentation: "desktop",
        devices,
        rooms: [room],
        groups: [],
        scenes: [],
        client: mock.client,
        sensorHistoryEnabled: false,
        onapplyscene: vi.fn(),
        onstopscene: vi.fn(),
      },
    });
  } else if (surface === "device card") {
    instance = mount(DeviceCard, {
      target: host,
      context,
      props: {
        get device() {
          return devices[0];
        },
        onrename: vi.fn(),
        oniconchange: vi.fn(),
        onAddTo: vi.fn(),
        ontoggleenabled: vi.fn(),
        ondelete: vi.fn(),
        onrestore: vi.fn(),
      },
    });
  } else {
    instance = mount(DeviceCollectionCard, {
      target: host,
      context,
      props: {
        entity: room,
        entityType: surface === "room card" ? "room" : "group",
        fallbackIcon: House,
        devices,
        ontoggle: (on: boolean) => commitGroupToggle(mock.client, devices, on),
        onbrightness: (value: number) => commitGroupBrightness(mock.client, devices, value),
      },
    });
  }
  flushSync();
  return {
    ...mock,
    devices,
    toggle: () => host.querySelector<HTMLElement>('[role="switch"]')!,
    slider: () => host.querySelector<HTMLElement>('[role="slider"]')!,
    report(index: number, on: boolean, brightness: number) {
      const device = { ...devices[index], state: { on, brightness } };
      devices[index] = device;
      deviceStore.updateState(device.id, device.state);
      flushSync();
    },
  };
}

describe("optimistic card power controls", () => {
  it.each<Surface>(["apartment", "dashboard room", "room card", "group card", "device card"])(
    "holds %s off through staggered device reports",
    async (surface) => {
      const view = render(surface);
      view.queueMutationResult({ data: { setTargetState: true } });
      view.toggle().click();
      flushSync();
      expect(view.toggle().getAttribute("aria-checked")).toBe("false");
      expect(view.slider().getAttribute("aria-valuenow")).toBe("0");
      await vi.advanceTimersByTimeAsync(2_000);
      if (view.devices.length > 1) {
        view.report(0, false, 80);
        view.report(1, true, 20);
        expect(view.toggle().getAttribute("aria-checked")).toBe("false");
        expect(view.slider().getAttribute("aria-valuenow")).toBe("0");
      }
      view.devices.forEach((device, index) =>
        view.report(index, false, device.state?.brightness ?? 0),
      );
      expect(controlIntents.has(view.devices)).toBe(false);
      expect(view.slider().getAttribute("aria-valuenow")).toBe("0");
      view.report(0, true, 150);
      expect(view.toggle().getAttribute("aria-checked")).toBe("true");
      expect(view.slider().getAttribute("aria-valuenow")).toBe("150");
    },
  );

  it("rolls a rejected toggle back to confirmed state", async () => {
    const view = render("apartment");
    view.queueMutationResult({ error: { message: "Rejected" } });
    view.toggle().click();
    flushSync();
    expect(view.slider().getAttribute("aria-valuenow")).toBe("0");
    await vi.advanceTimersByTimeAsync(0);
    flushSync();
    expect(view.toggle().getAttribute("aria-checked")).toBe("true");
    expect(view.slider().getAttribute("aria-valuenow")).toBe("150");
  });

  it("cancels a queued brightness update when power is turned off", async () => {
    const view = render("device card");
    const track = host.querySelector<HTMLElement>('[data-slot="slider"]')!;
    vi.spyOn(track, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 254, 20));
    track.dispatchEvent(
      new MouseEvent("pointerdown", { clientX: 110, clientY: 10, button: 0, bubbles: true }),
    );
    flushSync();
    document.dispatchEvent(
      new MouseEvent("pointermove", { clientX: 120, clientY: 10, bubbles: true }),
    );
    flushSync();
    view.queueMutationResult({ data: { setTargetState: true } });
    view.toggle().click();
    flushSync();
    expect(view.slider().getAttribute("aria-valuenow")).toBe("0");
    await vi.advanceTimersByTimeAsync(3_000);
    flushSync();
    expect(view.mutations).toHaveLength(2);
    expect(view.slider().getAttribute("aria-valuenow")).toBe("0");
    expect(view.toggle().getAttribute("aria-checked")).toBe("false");
  });

  it("lets a brightness adjustment supersede a pending off command", async () => {
    const view = render("device card");
    view.queueMutationResult({ data: { setTargetState: true } });
    view.toggle().click();
    flushSync();
    await vi.advanceTimersByTimeAsync(0);
    expect(view.slider().getAttribute("aria-valuenow")).toBe("0");
    view.slider().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    flushSync();
    expect(controlIntents.has(view.devices, "power")).toBe(false);
    expect(controlIntents.has(view.devices, "brightness")).toBe(true);
    expect(view.slider().getAttribute("aria-valuenow")).toBe("1");
    expect(view.mutations.at(-1)?.variables).toEqual({
      target: { type: "DEVICE_SET", deviceIds: ["a"] },
      state: { on: true, brightness: 1 },
    });
  });
});
