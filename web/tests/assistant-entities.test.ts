import { expect, it } from "vitest";
import { assistantEntityReference } from "$lib/assistant-entities";
import { messageBlocks } from "$lib/assistant-markdown";

it("resolves entity destinations, including encoded room and group IDs", () => {
  for (const [href, kind, id] of [
    ["/devices/0x123", "device", "0x123"],
    ["/rooms?edit=living%20room", "room", "living room"],
    ["/groups?edit=bedroom+lights", "group", "bedroom lights"],
    ["/scenes/night", "scene", "night"],
    ["/automations/morning", "automation", "morning"],
    ["/effects/sunset", "effect", "sunset"],
  ]) expect(assistantEntityReference(href)).toEqual({ href, kind, id });
  for (const href of ["//example.com/devices/bulb", "https://example.com", "javascript:alert(1)", "/devices", "/devices/%", "/devices/%2Fother", "/rooms?edit=", "/devices/%00", "/profile"])
    expect(assistantEntityReference(href)).toBeNull();
});

it("renders standalone entity links as cards while preserving inline, table and code links", () => {
  const blocks = messageBlocks("Found this bulb:\n\n[Living room](/devices/0x123)\n\nSee [Room](/rooms?edit=living).\n\n| Name |\n| --- |\n| [Light](/devices/0x123) |\n\n```\n[Light](/devices/0x123)\n```");
  expect(blocks.map(b => b.kind)).toEqual(["text", "entity", "text", "table", "code"]);
  expect(blocks[1]).toEqual({ kind: "entity", text: "Living room", reference: { kind: "device", id: "0x123", href: "/devices/0x123" } });
});

it("keeps incomplete streamed links as text and recognizes the complete reference", () => {
  expect(messageBlocks("[Light](/devices/bulb")[0].kind).toBe("text");
  expect(messageBlocks("[Light](/devices/bulb)")[0].kind).toBe("entity");
});
