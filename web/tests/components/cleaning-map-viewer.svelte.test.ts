import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { flushSync, mount, tick, unmount } from "svelte";
import DreameMapViewer from "../../src/lib/components/cleaning-map-viewer.svelte";
import { cleaningMapFixture } from "../fixtures/cleaning-map";

const originalScroll = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollTo",
);
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(SVGSVGElement.prototype, "width", {
    configurable: true,
    value: { baseVal: { value: 800 } },
  });
  Object.defineProperty(SVGSVGElement.prototype, "height", {
    configurable: true,
    value: { baseVal: { value: 400 } },
  });
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterAll(() => {
  vi.unstubAllGlobals();
  if (originalScroll)
    Object.defineProperty(HTMLElement.prototype, "scrollTo", originalScroll);
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
});

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement;
afterEach(async () => {
  if (instance) await unmount(instance);
  instance = null;
  host.remove();
});

describe("saved vacuum map", () => {
  it("renders saved geometry and dock in the shared map viewport", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    instance = mount(DreameMapViewer, {
      target: host,
      props: { maps: [cleaningMapFixture] },
    });
    flushSync();
    expect(
      host.querySelector('g[role="img"]')?.getAttribute("aria-label"),
    ).toBe("Ground floor");
    expect(host.querySelectorAll("svg text")).toHaveLength(2);
    expect(host.querySelector("svg text")?.textContent).toContain("Kitchen");
    expect(host.querySelectorAll("svg polygon")).toHaveLength(1);
    expect(host.querySelectorAll("svg circle")).toHaveLength(0);
    expect(host.textContent).not.toContain("Robot position");
    const zoomIn = host.querySelector<HTMLButtonElement>(
      '[aria-label="Zoom in"]',
    )!;
    const zoomOut = host.querySelector<HTMLButtonElement>(
      '[aria-label="Zoom out"]',
    )!;
    const world = host.querySelector("svg > g")!;
    const initial = world.getAttribute("transform");
    zoomIn.click();
    await tick();
    flushSync();
    expect(world.getAttribute("transform")).not.toBe(initial);
    zoomOut.click();
    await tick();
    flushSync();
    expect(world.getAttribute("transform")).toBe(initial);
  });
  it.each([0, 90, 180, 270])(
    "keeps labels upright at %s degrees",
    (rotation) => {
      host = document.createElement("div");
      document.body.appendChild(host);
      instance = mount(DreameMapViewer, {
        target: host,
        props: { maps: [cleaningMapFixture], rotation },
      });
      flushSync();
      expect(
        host.querySelector('g[role="img"]')?.getAttribute("transform"),
      ).toContain(`rotate(${rotation} `);
      expect(
        host.querySelector("svg text")?.getAttribute("transform"),
      ).toContain(`rotate(${-rotation} `);
    },
  );
});
