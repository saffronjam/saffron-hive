import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, unmount } from "svelte";
import DeviceImage from "$lib/components/device-image.svelte";
import { auth } from "$lib/stores/auth.svelte";

let component: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement | null = null;

beforeEach(() => {
  auth.setToken("test-token");
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(() => {
  if (component) unmount(component);
  host?.remove();
  component = null;
  host = null;
  auth.clearToken();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("DeviceImage", () => {
  it("shows a browser-cached image without a fade", async () => {
    const cached = new Response(new Blob(["image"], { type: "image/png" }), { status: 200 });
    vi.stubGlobal("caches", {
      open: vi.fn().mockResolvedValue({ match: vi.fn().mockResolvedValue(cached) }),
    });
    const fetchMock = vi.spyOn(globalThis, "fetch");
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:cached-device-image");

    component = mount(DeviceImage, {
      target: host!,
      props: { deviceId: "0x123", version: "v1", alt: "Cached sensor" },
    });

    await vi.waitFor(() =>
      expect(host!.querySelector("img")?.getAttribute("src")).toBe("blob:cached-device-image"),
    );
    const image = host!.querySelector("img")!;
    expect(fetchMock).not.toHaveBeenCalled();
    expect(image.classList).toContain("opacity-100");
    expect(image.classList).not.toContain("transition-opacity");
  });

  it("loads through Hive with authorization and revokes the object URL", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(new Blob(["image"], { type: "image/png" }), { status: 200 }));
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:device-image");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const onavailability = vi.fn();
    component = mount(DeviceImage, {
      target: host!,
      props: {
        deviceId: "0x123",
        version: "v1",
        alt: "Sensor device",
        onavailability,
      },
    });

    await vi.waitFor(() =>
      expect(host!.querySelector("img")?.getAttribute("src")).toBe("blob:device-image"),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/device-images/0x123?v=v1",
      expect.objectContaining({ headers: { Authorization: "Bearer test-token" } }),
    );
    expect(create).toHaveBeenCalledOnce();
    const image = host!.querySelector("img")!;
    expect(image.classList).toContain("opacity-0");
    image.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(image.classList).toContain("opacity-100"));
    expect(onavailability).toHaveBeenCalledWith(true);
    unmount(component);
    component = null;
    expect(revoke).toHaveBeenCalledWith("blob:device-image");
  });

  it("reports an unavailable image without exposing an upstream URL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 404 }));
    const onavailability = vi.fn();
    component = mount(DeviceImage, {
      target: host!,
      props: { deviceId: "missing", version: "v1", alt: "Missing device", onavailability },
    });
    await vi.waitFor(() => expect(onavailability).toHaveBeenCalledWith(false));
    expect(host!.innerHTML).not.toContain("http");
  });
});
