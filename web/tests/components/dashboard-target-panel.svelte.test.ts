import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount, type ComponentProps } from "svelte";
import DashboardTargetPanel from "$lib/components/dashboard-target-panel.svelte";
import BulkBrightnessSlider from "$lib/components/bulk-brightness-slider.svelte";
import { CapabilityCategory, ContactRole, ControlledLoadRole, type Device } from "$lib/gql/graphql";
import { createMockClient } from "../helpers/mock-client";

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

function device(id: string, overrides: Partial<Device> = {}): Device {
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
    state: { on: true, brightness: 100 } as Device["state"],
    ...overrides,
  };
}

const lamp = device("Lamp");
const unassigned = device("Unassigned");
const disabled = device("Disabled", { disabled: true });
const deleted = device("Deleted", { deleted: true });
const appliance = device("Fan", {
  type: "plug",
  roles: { controlledLoad: ControlledLoadRole.Appliance, contact: null },
});
const devices = [lamp, unassigned, disabled, deleted, appliance];
const room = {
  id: "room",
  name: "Test room",
  members: [lamp, disabled, deleted, appliance].map((d) => ({
    memberType: "device",
    memberId: d.id,
  })),
};
const preview = { width: 1, height: 1, pixels: [{ r: 255, g: 0, b: 0 }], swatches: [] };
const scenes = [
  { id: "local", name: "Local scene", rooms: [{ id: room.id }], preview },
  { id: "elsewhere", name: "Other scene", rooms: [{ id: "another" }], preview },
];
let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement | null = null;

afterEach(async () => {
  if (instance) await unmount(instance);
  instance = null;
  host?.remove();
  host = null;
  vi.useRealTimers();
});

function renderPanel(overrides: Partial<ComponentProps<typeof DashboardTargetPanel>> = {}) {
  const mock = createMockClient();
  host = document.createElement("div");
  document.body.appendChild(host);
  instance = mount(DashboardTargetPanel, {
    target: host,
    context: new Map([["$$_urql", mock.client]]),
    props: {
      target: { kind: "apartment" },
      presentation: "desktop",
      devices,
      groups: [],
      rooms: [overrides.target?.kind === "room" ? overrides.target.room : room],
      scenes,
      client: mock.client,
      sensorHistoryEnabled: false,
      onapplyscene: vi.fn(),
      onstopscene: vi.fn(),
      ...overrides,
    },
  });
  flushSync();
  return mock;
}

describe("dashboard target panel", () => {
  it("omits apartment scenes and commands only enabled lights across the apartment", () => {
    const mock = renderPanel();
    expect(host!.textContent).not.toContain("Local scene");
    expect(host!.textContent).not.toContain("Other scene");
    expect(host!.textContent).not.toContain("Fan");
    expect(host!.querySelectorAll('[role="switch"]')).toHaveLength(1);
    host!.querySelector<HTMLElement>('[role="switch"]')!.click();
    expect(mock.mutations[0].variables).toEqual({
      target: { type: "DEVICE_SET", deviceIds: [lamp.id, unassigned.id] },
      state: { on: false },
    });
  });

  it("filters room scenes and keeps room lighting separate from appliances", () => {
    const mock = renderPanel({ target: { kind: "room", room } });
    expect(host!.textContent).toContain("Local scene");
    expect(host!.textContent).not.toContain("Other scene");
    expect(host!.textContent).not.toContain("Disabled");
    expect(host!.textContent).not.toContain("Deleted");
    expect(host!.textContent).toContain("Fan");
    const switches = host!.querySelectorAll<HTMLElement>('[role="switch"]');
    expect(switches).toHaveLength(3);
    switches[0].click();
    expect(mock.mutations[0].variables).toEqual({
      target: { type: "DEVICE_SET", deviceIds: [lamp.id] },
      state: { on: false },
    });
    expect(host!.querySelectorAll('[role="slider"]')).toHaveLength(2);
  });

  it("does not apply scenes on mount and invokes the matching scene action", () => {
    const apply = vi.fn();
    const stop = vi.fn();
    renderPanel({
      target: { kind: "room", room },
      scenes: [
        { ...scenes[0], activatedAt: "2026-01-01" },
        { ...scenes[1], rooms: [{ id: room.id }] },
      ],
      onapplyscene: apply,
      onstopscene: stop,
    });
    expect(apply).not.toHaveBeenCalled();
    const cards = [...host!.querySelectorAll<HTMLElement>('[role="button"]')];
    cards.find((card) => card.textContent?.includes("Local scene"))!.click();
    cards.find((card) => card.textContent?.includes("Other scene"))!.click();
    expect(stop).toHaveBeenCalledWith(expect.objectContaining({ id: "local" }));
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ id: "elsewhere" }));
  });

  it("keeps an appliance outside a mixed group's lighting switch", () => {
    const group = {
      id: "mixed",
      name: "Mixed group",
      tags: [],
      members: [lamp, appliance].map((d) => ({ memberType: "device", memberId: d.id })),
    };
    const groupedRoom = { ...room, members: [{ memberType: "group", memberId: group.id }] };
    const mock = renderPanel({ target: { kind: "room", room: groupedRoom }, groups: [group] });
    host!.querySelectorAll<HTMLElement>('[role="switch"]')[1].click();
    expect(mock.mutations[0].variables).toEqual({
      target: { type: "DEVICE_SET", deviceIds: [lamp.id] },
      state: { on: false },
    });
  });

  it.each(["desktop", "compact"] as const)(
    "omits empty lighting and appliance sections in %s",
    (presentation) => {
      renderPanel({
        target: { kind: "room", room: { ...room, members: [] } },
        presentation,
        scenes: [],
      });
      expect(host!.querySelector('[role="switch"]')).toBeNull();
      expect(host!.querySelector('[role="slider"]')).toBeNull();
      expect(host!.querySelector("section")).toBeNull();
      expect(host!.textContent).not.toContain("No lights");
    },
  );

  it.each(["desktop", "compact"] as const)(
    "keeps appliances without a lighting section in %s",
    (presentation) => {
      const applianceRoom = {
        ...room,
        members: [{ memberType: "device", memberId: appliance.id }],
      };
      renderPanel({ target: { kind: "room", room: applianceRoom }, presentation, scenes: [] });
      expect(host!.textContent).toContain("Fan");
      expect(host!.querySelectorAll("section")).toHaveLength(1);
      expect(host!.textContent).not.toContain("No lights");
    },
  );

  it.each(["desktop", "compact"] as const)(
    "omits lighting-count subtitles in %s",
    (presentation) => {
      const lightRoom = { ...room, members: [{ memberType: "device", memberId: lamp.id }] };
      renderPanel({ target: { kind: "room", room: lightRoom }, presentation, scenes: [] });
      expect(host!.querySelector(".target-panel > div p")).toBeNull();
      expect(host!.querySelectorAll("section")).toHaveLength(1);
      expect(host!.textContent).toContain("Lamp");
    },
  );

  it("retains compact contact status beneath the room name", () => {
    const door = device("Door", {
      type: "sensor",
      roles: { controlledLoad: null, contact: ContactRole.Door },
      state: { contact: true } as Device["state"],
    });
    const contactRoom = {
      ...room,
      members: [lamp, door].map((d) => ({ memberType: "device", memberId: d.id })),
    };
    renderPanel({
      target: { kind: "room", room: contactRoom },
      presentation: "compact",
      devices: [lamp, door],
    });
    expect(host!.querySelector(".target-panel > div p")?.textContent?.trim()).toBe("Door closed");
  });

  it("retains compact whole-card interaction without visible brightness sliders", () => {
    renderPanel({ target: { kind: "room", room }, presentation: "compact" });
    expect(host!.querySelector('[role="slider"]')).toBeNull();
    expect(host!.querySelector('[role="switch"]')).toBeNull();
  });

  it("puts desktop readings and contacts in separate boxes beneath the lighting card", () => {
    const sensor = device("Climate", {
      type: "sensor",
      state: { temperature: 22, humidity: 41 } as Device["state"],
    });
    const door = device("Door", {
      type: "sensor",
      roles: { controlledLoad: null, contact: ContactRole.Door },
      state: { contact: true } as Device["state"],
    });
    const sensorRoom = {
      ...room,
      members: [lamp, sensor, door].map((d) => ({ memberType: "device", memberId: d.id })),
    };
    renderPanel({ target: { kind: "room", room: sensorRoom }, devices: [lamp, sensor, door] });
    expect(host!.querySelector("[data-dashboard-sensors]")?.textContent).toContain("Temperature");
    expect(host!.querySelector("[data-dashboard-sensors]")?.textContent).toContain("Humidity");
    expect(host!.querySelector("[data-dashboard-contacts]")?.textContent).toContain("Door closed");
    const mainCard = host!.querySelector(".target-panel > div");
    expect(mainCard?.textContent).not.toContain("Door closed");
    expect(mainCard?.textContent).not.toContain("°C");
    expect(host!.querySelector('[class*="tint-fill-horizontal"]')).toBeNull();
    expect(host!.querySelector('[aria-label="Scenes"]')).not.toBeNull();
  });
});

describe("brightness interaction lifetime", () => {
  function renderSlider() {
    host = document.createElement("div");
    document.body.appendChild(host);
    const changed = vi.fn();
    instance = mount(BulkBrightnessSlider, {
      target: host,
      props: { devices: [lamp], onbrightness: changed },
    });
    flushSync();
    return { changed, slider: host.querySelector<HTMLElement>('[role="slider"]')! };
  }

  it("cancels a queued brightness command when the control is destroyed", async () => {
    vi.useFakeTimers();
    const { changed } = renderSlider();
    const track = host!.querySelector<HTMLElement>('[data-slot="slider"]')!;
    vi.spyOn(track, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 254, 20));
    track.dispatchEvent(
      new MouseEvent("pointerdown", { clientX: 110, clientY: 10, button: 0, bubbles: true }),
    );
    flushSync();
    document.dispatchEvent(
      new MouseEvent("pointermove", { clientX: 120, clientY: 10, bubbles: true }),
    );
    flushSync();
    expect(changed).toHaveBeenCalledTimes(1);
    await unmount(instance!);
    instance = null;
    await vi.advanceTimersByTimeAsync(2000);
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it("commits each keyboard value immediately", () => {
    vi.useFakeTimers();
    const { changed, slider } = renderSlider();
    slider.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    flushSync();
    expect(host!.querySelector('[role="slider"]')).toBe(slider);
    slider.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    flushSync();
    expect(changed).toHaveBeenLastCalledWith(102);
  });
});
