import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import DeviceRolesEditor from "$lib/components/device-roles-editor.svelte";
import { ContactRole } from "$lib/gql/graphql";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  if (instance) unmount(instance);
  host?.remove();
  instance = null;
  host = null;
});

function render(contactMapped: boolean) {
  host = document.createElement("div");
  document.body.appendChild(host);
  instance = mount(DeviceRolesEditor, {
    target: host,
    props: {
      value: { controlledLoad: null, contact: ContactRole.Door },
      onchange: vi.fn(),
      contactMapped,
    },
  });
  flushSync();
  return host;
}

describe("DeviceRolesEditor", () => {
  it("locks a mapped contact role and explains why", () => {
    const editor = render(true);
    const trigger = editor.querySelector("button");

    expect(trigger?.disabled).toBe(true);
    expect(trigger?.className).not.toContain("cursor-");
    expect(trigger?.className).toContain("enabled:hover");
    expect(editor.textContent).toContain("Used in map");
  });

  it("keeps an unmapped contact role selectable", () => {
    const editor = render(false);

    expect(editor.querySelector("button")?.disabled).toBe(false);
    expect(editor.textContent).not.toContain("Used in map");
  });
});
