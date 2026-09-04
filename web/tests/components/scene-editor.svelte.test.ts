import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, tick, unmount } from "svelte";
import SceneEditor from "$lib/components/scene-editor.svelte";
import VibeSourcePicker from "$lib/components/vibe-source-picker.svelte";
import { createMockClient } from "../helpers/mock-client";
import type { EditorState, ScenePreview } from "$lib/scene-editable";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement;

const preview: ScenePreview = {
  width: 1,
  height: 1,
  pixels: [{ r: 120, g: 80, b: 200 }],
  swatches: [{ x: 0.5, y: 0.5, color: { r: 120, g: 80, b: 200 } }],
};

const editor: EditorState = {
  targets: [],
  dynamicSource: {
    domain: "full_color",
    sourceKind: "preset",
    presetId: "night-sky",
    guidedSelectedIds: [],
    seed: "19",
    brightness: 0.8,
    movement: 0.4,
    cycleSeconds: 720,
    gridWidth: 1,
    gridHeight: 1,
    samples: [{ lightness: 0.6, chroma: 0.2, hue: 280 }],
  },
  overrides: new Map(),
  supportingStates: new Map(),
};

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(async () => {
  if (instance) await unmount(instance);
  instance = null;
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("SceneEditor", () => {
  it("does not emit an edit while mounting a saved Vibe", async () => {
    const mock = createMockClient();
    const onchange = vi.fn();
    instance = mount(SceneEditor, {
      target: host,
      props: { editor, preview, devices: [], groups: [], rooms: [], onchange },
      context: new Map([["$$_urql", mock.client]]),
    });

    flushSync();
    await tick();
    expect(host.textContent).toContain("Night Sky");
    expect(onchange).not.toHaveBeenCalled();
    expect(host.textContent).not.toContain("Fallback");
    expect(host.textContent).not.toContain("Used by lights without an override");
  });

  it("shows manual scene devices in separate full-width columns", async () => {
    const mock = createMockClient();
    instance = mount(SceneEditor, {
      target: host,
      props: {
        editor: { ...editor, dynamicSource: null },
        preview,
        devices: [],
        groups: [],
        rooms: [],
        onchange: vi.fn(),
      },
      context: new Map([["$$_urql", mock.client]]),
    });

    flushSync();
    expect(host.textContent).toContain("Targets");
    expect(host.textContent).toContain("Add source");
    expect(host.textContent).not.toContain("Lighting");
    expect(host.textContent).not.toContain("Fallback");
    expect(host.querySelector('[aria-label="About supporting devices"]')).toBeNull();
    expect(host.querySelector('[role="tab"]')).toBeNull();
    expect(
      Array.from(host.querySelectorAll("h2")).map((heading) => heading.textContent?.trim()),
    ).toEqual(["Targets", "Supporting devices"]);
    expect(host.querySelectorAll("section")).toHaveLength(2);
  });

  it("keeps targets and supporting devices tabbed beside a Vibe", async () => {
    const mock = createMockClient();
    instance = mount(SceneEditor, {
      target: host,
      props: { editor, preview, devices: [], groups: [], rooms: [], onchange: vi.fn() },
      context: new Map([["$$_urql", mock.client]]),
    });

    flushSync();
    expect(host.textContent).toContain("Night Sky");
    expect(host.querySelector('[role="tab"][data-value="targets"]')).not.toBeNull();
    expect(host.querySelector('[role="tab"][data-value="supporting"]')).not.toBeNull();
  });

  it("keeps target tree rows out of text selection and tab navigation", async () => {
    const mock = createMockClient();
    instance = mount(SceneEditor, {
      target: host,
      props: {
        editor: {
          ...editor,
          dynamicSource: null,
          targets: [
            {
              uid: "selector-1",
              type: "expression",
              id: "",
              name: "Flori",
              expression: [],
            },
          ],
        },
        preview,
        devices: [],
        groups: [],
        rooms: [],
        onchange: vi.fn(),
      },
      context: new Map([["$$_urql", mock.client]]),
    });

    flushSync();
    expect(host.textContent).toContain("Flori");
    const targets = Array.from(host.querySelectorAll("section")).find((section) =>
      section.textContent?.includes("Targets"),
    );
    expect(targets?.classList.contains("select-none")).toBe(true);
    const row = targets?.querySelector<HTMLElement>('[role="button"]');
    expect(row?.getAttribute("tabindex")).toBe("-1");
    const expansion = row?.nextElementSibling;
    expect(expansion?.classList.contains("grid-rows-[0fr]")).toBe(true);
    row?.click();
    flushSync();
    expect(expansion?.classList.contains("grid-rows-[1fr]")).toBe(true);
    expect(row?.nextElementSibling).toBe(expansion);
  });

  it("replaces edit actions with capture while keeping the mode control in place", async () => {
    const mock = createMockClient();
    instance = mount(SceneEditor, {
      target: host,
      props: {
        editor: { ...editor, dynamicSource: null },
        preview,
        devices: [],
        groups: [],
        rooms: [],
        onchange: vi.fn(),
        showAddVibeInTargets: false,
      },
      context: new Map([["$$_urql", mock.client]]),
    });

    const targets = Array.from(host.querySelectorAll("section")).find((section) =>
      section.textContent?.includes("Targets"),
    );
    const button = (name: string) =>
      Array.from(targets?.querySelectorAll("button") ?? []).find(
        (candidate) => candidate.textContent?.trim() === name,
      );
    flushSync();
    expect(button("Add")).toBeDefined();
    expect(button("Selector")).toBeUndefined();
    const modeControl = button("Edit")?.parentElement;
    button("Live")?.click();
    await vi.waitFor(() => expect(button("Capture all")).toBeDefined(), { interval: 1 });
    expect(button("Add")).toBeUndefined();
    expect(button("Selector")).toBeUndefined();
    expect(button("Edit")?.parentElement).toBe(modeControl);
  });

  it("shuffles immediately and omits capability tallies", async () => {
    const mock = createMockClient();
    const onchange = vi.fn();
    instance = mount(SceneEditor, {
      target: host,
      props: { editor, preview, devices: [], groups: [], rooms: [], onchange },
      context: new Map([["$$_urql", mock.client]]),
    });

    const shuffle = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Shuffle",
    );
    expect(shuffle).toBeDefined();
    shuffle!.click();
    flushSync();
    expect(onchange).toHaveBeenCalledOnce();
    const next = onchange.mock.calls[0][0] as EditorState;
    expect(next.dynamicSource).not.toBeNull();
    expect(next.dynamicSource?.seed).not.toBe("19");
    expect(host.textContent).not.toContain("Tunable white");
    expect(host.textContent).not.toContain("Skipped");
  });

  it("removes a vibe without changing per-device states", async () => {
    const mock = createMockClient();
    const onchange = vi.fn();
    const state: EditorState = {
      ...editor,
      overrides: new Map([
        ["light-1", { kind: "state", deviceId: "light-1", state: { colorTemp: 280 } }],
      ]),
    };
    instance = mount(SceneEditor, {
      target: host,
      props: { editor: state, preview, devices: [], groups: [], rooms: [], onchange },
      context: new Map([["$$_urql", mock.client]]),
    });

    const remove = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Remove",
    );
    expect(remove).toBeDefined();
    remove!.click();
    flushSync();
    expect(onchange).toHaveBeenCalledOnce();
    const next = onchange.mock.calls[0][0] as EditorState;
    expect(next.dynamicSource).toBeNull();
    expect(next.overrides).toEqual(state.overrides);
  });

  it("offers every dynamic source", async () => {
    const mock = createMockClient();
    instance = mount(VibeSourcePicker, {
      target: host,
      props: { onselect: vi.fn() },
      context: new Map([["$$_urql", mock.client]]),
    });

    flushSync();
    expect(host.textContent).toContain("Gallery");
    expect(host.textContent).toContain("Photo");
    expect(host.textContent).toContain("Guided");
  });
});
