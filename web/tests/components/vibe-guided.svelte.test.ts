import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import VibeGuided from "$lib/components/vibe-guided.svelte";
import { createMockClient } from "../helpers/mock-client";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement;

function round(number: number, canFinish = number >= 3) {
  const preview = (r: number, g: number, b: number) => ({
    width: 2,
    height: 2,
    pixels: Array.from({ length: 4 }, () => ({ r, g, b })),
    swatches: [{ x: 0.5, y: 0.5, color: { r, g, b } }],
  });
  return {
    data: {
      guidedVibeRound: {
        round: number,
        canFinish,
        complete: number === 5,
        options: [
          {
            id: `round-${number}-dawn`,
            title: "Soft dawn",
            preview: preview(245, 193, 151),
          },
          {
            id: `round-${number}-forest`,
            title: "Deep forest",
            preview: preview(41, 94, 70),
          },
          {
            id: `round-${number}-sky`,
            title: "Open sky",
            preview: preview(85, 147, 219),
          },
          {
            id: `round-${number}-meadow`,
            title: "Meadow",
            preview: preview(125, 176, 72),
          },
          {
            id: `round-${number}-rose`,
            title: "Rose",
            preview: preview(211, 91, 145),
          },
        ],
      },
    },
  };
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  if (instance) void unmount(instance);
  instance = null;
  host.remove();
  vi.restoreAllMocks();
});

describe("VibeGuided", () => {
  it("loads five named choices and appends a keyboard-selectable answer", async () => {
    const mock = createMockClient();
    mock.queueResult(round(1));
    const onchange = vi.fn();
    instance = mount(VibeGuided, {
      target: host,
      props: {
        domain: "full_color",
        seed: "guided-seed",
        selectedIds: [],
        onchange,
        onuse: vi.fn(),
      },
      context: new Map([["$$_urql", mock.client]]),
    });

    await vi.waitFor(() => expect(host.getAttribute("data-never")).toBeNull());
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[aria-label="Guided vibe choices 1"] button')).toHaveLength(5),
    );
    expect(host.querySelector(".guided-round-stack")).not.toBeNull();
    const choice = host.querySelector('button[aria-label="Soft dawn"]') as HTMLButtonElement;
    expect(choice.classList).toContain("bg-transparent");
    expect(choice.classList).not.toContain("bg-card");
    expect(choice.classList).not.toContain("shadow-card");
    expect(choice.closest(".vibe-choice")?.querySelector(".field-glow")).toBeNull();
    choice.focus();
    choice.click();
    flushSync();
    expect(onchange).toHaveBeenCalledWith(["round-1-dawn"]);
    expect(mock.queries[0].variables).toEqual({
      input: { domain: "full_color", seed: "guided-seed", selectedIds: [] },
    });
  });

  it("offers completion after three choices without backward controls", async () => {
    const mock = createMockClient();
    mock.queueResult(round(4, true));
    const onchange = vi.fn();
    const onuse = vi.fn();
    const selectedIds = ["one", "two", "three"];
    instance = mount(VibeGuided, {
      target: host,
      props: { domain: "white_ambience", seed: "white-seed", selectedIds, onchange, onuse },
      context: new Map([["$$_urql", mock.client]]),
    });

    await vi.waitFor(() =>
      expect(host.querySelector('button[aria-label="Soft dawn"]')).not.toBeNull(),
    );
    const use = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Use this vibe"),
    );
    expect(use).toBeDefined();
    use!.click();
    flushSync();
    expect(onuse).toHaveBeenCalledOnce();
    expect(host.textContent).not.toContain("Back");
    expect(host.textContent).not.toContain("Choice 4 of 3–5");
    expect(onchange).not.toHaveBeenCalled();
  });

  it("keeps completion in place and disabled before three choices", async () => {
    const mock = createMockClient();
    mock.queueResult(round(1, false));
    instance = mount(VibeGuided, {
      target: host,
      props: {
        domain: "full_color",
        seed: "guided-seed",
        selectedIds: [],
        onchange: vi.fn(),
        onuse: vi.fn(),
      },
      context: new Map([["$$_urql", mock.client]]),
    });

    await vi.waitFor(() =>
      expect(host.querySelector('button[aria-label="Soft dawn"]')).not.toBeNull(),
    );
    const use = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Use this vibe"),
    );
    expect(use).toBeDefined();
    expect(use!.disabled).toBe(true);
  });

  it("finishes directly from the fifth choice", async () => {
    const mock = createMockClient();
    mock.queueResult(round(5, true));
    const onchange = vi.fn();
    const onuse = vi.fn();
    const selectedIds = ["one", "two", "three", "four"];
    instance = mount(VibeGuided, {
      target: host,
      props: {
        domain: "full_color",
        seed: "guided-seed",
        selectedIds,
        onchange,
        onuse,
      },
      context: new Map([["$$_urql", mock.client]]),
    });

    await vi.waitFor(() =>
      expect(host.querySelector('button[aria-label="Soft dawn"]')).not.toBeNull(),
    );
    host.querySelector<HTMLButtonElement>('button[aria-label="Soft dawn"]')!.click();
    flushSync();
    const expected = [...selectedIds, "round-5-dawn"];
    expect(onchange).toHaveBeenCalledWith(expected);
    expect(onuse).toHaveBeenCalledWith(expected);
    expect(
      mock.queries.some(
        (query) =>
          (query.variables as { input: { selectedIds: string[] } }).input.selectedIds.length === 5,
      ),
    ).toBe(false);
  });

  it("keeps the selections visible when the next round fails", async () => {
    const mock = createMockClient();
    mock.queueResult({ error: { message: "guided service unavailable" } });
    instance = mount(VibeGuided, {
      target: host,
      props: {
        domain: "full_color",
        seed: "failure-seed",
        selectedIds: ["one", "two", "three"],
        onchange: vi.fn(),
        onuse: vi.fn(),
      },
      context: new Map([["$$_urql", mock.client]]),
    });

    await vi.waitFor(() => expect(host.textContent).toContain("guided service unavailable"));
    expect(host.textContent).not.toContain("Choice 4 of 3–5");
    expect(host.textContent).toContain("Use this vibe");
  });
});
