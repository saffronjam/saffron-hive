import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import DeviceStateEditor from "$lib/components/graph/device-state-editor.svelte";
import { CapabilityCategory, type Capability } from "$lib/gql/graphql";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  if (instance) unmount(instance);
  host?.remove();
  instance = null;
  host = null;
});

function capability(name: string): Capability {
  return {
    name,
    type: "binary",
    label: null,
    description: null,
    category: CapabilityCategory.State,
    values: null,
    valueMin: null,
    valueMax: null,
    unit: null,
    reportsValue: true,
    canSet: true,
    canGet: true,
  };
}

function render(capabilities?: Capability[], disabled = false, value = "{}") {
  host = document.createElement("div");
  document.body.appendChild(host);
  instance = mount(DeviceStateEditor, {
    target: host,
    props: {
      target: null,
      value,
      onchange: vi.fn(),
      devices: [],
      groups: [],
      rooms: [],
      capabilities,
      disabled,
      compact: true,
    },
  });
  flushSync();
  return host;
}

describe("DeviceStateEditor", () => {
  it("renders actions for an expression capability union", () => {
    const editor = render([capability("on_off")]);

    expect(editor.textContent).toContain("Power");
    expect(editor.textContent).not.toContain("Pick a target");
  });

  it("renders no helper before a simple target is selected", () => {
    const editor = render();

    expect(editor.textContent).not.toContain("Pick a target");
  });

  it("dims the complete state editor without a forbidden cursor when disabled", () => {
    const editor = render([capability("on_off")], true, '{"on":true}');
    const stateFields = editor.querySelector<HTMLElement>(".opacity-50");
    const powerSwitch = editor.querySelector<HTMLElement>('[data-slot="switch"]');

    expect(stateFields).not.toBeNull();
    expect(powerSwitch?.hasAttribute("data-disabled")).toBe(true);
    expect(powerSwitch?.className).not.toContain("cursor-not-allowed");
  });
});
