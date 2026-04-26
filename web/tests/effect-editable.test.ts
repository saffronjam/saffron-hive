import { describe, it, expect } from "vitest";
import {
  computeRequiredCapabilities,
  defaultClipConfig,
  editableToInputTracks,
  effectToEditable,
  findFreeStartOnTrack,
  maxClipEnd,
  newEditableClip,
  newEditableTrack,
  parseClipConfig,
  stringifyClipConfig,
  validateTimelineEffect,
  type EditableClip,
  type EditableTrack,
} from "$lib/effect-editable";
import { EffectClipKind } from "$lib/gql/graphql";

function clip(
  partial: Partial<EditableClip> & Pick<EditableClip, "kind" | "config">,
): EditableClip {
  return {
    uid: partial.uid ?? crypto.randomUUID(),
    startMs: partial.startMs ?? 0,
    transitionMinMs: partial.transitionMinMs ?? 0,
    transitionMaxMs: partial.transitionMaxMs ?? 0,
    kind: partial.kind,
    config: partial.config,
  };
}

function track(clips: EditableClip[], name = ""): EditableTrack {
  return { uid: crypto.randomUUID(), name, clips };
}

describe("defaultClipConfig", () => {
  it("returns sensible defaults for each kind", () => {
    expect(defaultClipConfig("set_on_off")).toEqual({
      kind: "set_on_off",
      config: { value: true },
    });
    expect(defaultClipConfig("set_brightness")).toEqual({
      kind: "set_brightness",
      config: { value: 200 },
    });
    expect(defaultClipConfig("set_color_rgb")).toEqual({
      kind: "set_color_rgb",
      config: { r: 255, g: 0, b: 0 },
    });
    expect(defaultClipConfig("set_color_temp")).toEqual({
      kind: "set_color_temp",
      config: { mireds: 370 },
    });
    expect(defaultClipConfig("native_effect")).toEqual({
      kind: "native_effect",
      config: { name: "" },
    });
  });
});

describe("parseClipConfig / stringifyClipConfig", () => {
  it("round-trips a set_brightness config", () => {
    const c = defaultClipConfig("set_brightness");
    const raw = stringifyClipConfig(c);
    expect(parseClipConfig("set_brightness", raw)).toEqual(c);
  });

  it("round-trips a set_color_rgb config", () => {
    const c = { kind: "set_color_rgb" as const, config: { r: 12, g: 34, b: 56 } };
    expect(parseClipConfig("set_color_rgb", stringifyClipConfig(c))).toEqual(c);
  });

  it("clamps brightness out of range", () => {
    const out = parseClipConfig("set_brightness", JSON.stringify({ value: 9999 }));
    expect(out).toEqual({ kind: "set_brightness", config: { value: 254 } });
  });

  it("falls back on invalid JSON", () => {
    const out = parseClipConfig("set_color_temp", "not-json");
    expect(out).toEqual({ kind: "set_color_temp", config: { mireds: 370 } });
  });
});

describe("effectToEditable / editableToInputTracks", () => {
  it("round-trips an effect with one track and two clips", () => {
    const sourced = {
      tracks: [
        {
          id: "t1",
          index: 0,
          name: "Lights",
          clips: [
            {
              id: "c2",
              startMs: 1000,
              transitionMinMs: 200,
              transitionMaxMs: 400,
              kind: EffectClipKind.SetBrightness,
              config: JSON.stringify({ value: 200 }),
            },
            {
              id: "c1",
              startMs: 0,
              transitionMinMs: 100,
              transitionMaxMs: 100,
              kind: EffectClipKind.SetOnOff,
              config: JSON.stringify({ value: true }),
            },
          ],
        },
      ],
    };

    const editable = effectToEditable(sourced);
    expect(editable).toHaveLength(1);
    expect(editable[0].clips).toHaveLength(2);
    expect(editable[0].clips[0].startMs).toBe(0);
    expect(editable[0].clips[1].startMs).toBe(1000);

    const dto = editableToInputTracks(editable);
    expect(dto).toHaveLength(1);
    expect(dto[0].clips).toHaveLength(2);
    expect(dto[0].clips[0].kind).toBe(EffectClipKind.SetOnOff);
    expect(dto[0].clips[0].startMs).toBe(0);
    expect(dto[0].clips[1].kind).toBe(EffectClipKind.SetBrightness);
    expect(dto[0].clips[1].startMs).toBe(1000);
  });

  it("sorts tracks by index when hydrating", () => {
    const sourced = {
      tracks: [
        { id: "t2", index: 1, name: "B", clips: [] },
        { id: "t1", index: 0, name: "A", clips: [] },
      ],
    };
    const editable = effectToEditable(sourced);
    expect(editable).toHaveLength(2);
    expect(editable.every((t) => t.clips.length === 0)).toBe(true);
    expect(editable[0].name).toBe("A");
    expect(editable[1].name).toBe("B");
  });

  it("preserves track names through editable round-trip", () => {
    const tracks: EditableTrack[] = [track([], "Mood"), track([], "Accent")];
    const dto = editableToInputTracks(tracks);
    expect(dto.map((t) => t.name)).toEqual(["Mood", "Accent"]);
  });
});

describe("computeRequiredCapabilities", () => {
  it("returns the union of clip-kind capabilities", () => {
    const tracks = [
      track([
        clip({ kind: "set_on_off", config: defaultClipConfig("set_on_off") }),
        clip({ kind: "set_brightness", config: defaultClipConfig("set_brightness") }),
      ]),
      track([clip({ kind: "set_color_rgb", config: defaultClipConfig("set_color_rgb") })]),
    ];
    expect(computeRequiredCapabilities(tracks)).toEqual(["on_off", "brightness", "color"]);
  });

  it("ignores native_effect clips", () => {
    const tracks = [
      track([clip({ kind: "native_effect", config: defaultClipConfig("native_effect") })]),
    ];
    expect(computeRequiredCapabilities(tracks)).toEqual([]);
  });

  it("dedupes capabilities across tracks", () => {
    const tracks = [
      track([clip({ kind: "set_brightness", config: defaultClipConfig("set_brightness") })]),
      track([clip({ kind: "set_brightness", config: defaultClipConfig("set_brightness") })]),
    ];
    expect(computeRequiredCapabilities(tracks)).toEqual(["brightness"]);
  });
});

describe("validateTimelineEffect", () => {
  const validClip: EditableClip = clip({
    kind: "set_brightness",
    config: defaultClipConfig("set_brightness"),
    startMs: 0,
    transitionMinMs: 100,
    transitionMaxMs: 100,
  });

  it("accepts a valid non-loop effect", () => {
    expect(validateTimelineEffect("Sunrise", 100, false, [track([validClip])])).toBeNull();
  });

  it("accepts an empty effect with empty name being the only failure", () => {
    expect(validateTimelineEffect("OK", 0, false, [])).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(validateTimelineEffect("", 100, false, [track([validClip])])).toEqual({
      field: "name",
      message: "Pick a name",
    });
  });

  it("rejects a negative duration", () => {
    expect(validateTimelineEffect("OK", -1, false, [])).toMatchObject({ field: "duration" });
  });

  it("rejects overlapping clips on a track", () => {
    const a = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      startMs: 0,
      transitionMaxMs: 500,
    });
    const b = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      startMs: 200,
      transitionMaxMs: 500,
    });
    expect(validateTimelineEffect("OK", 1000, false, [track([a, b])])).toMatchObject({
      field: "clip",
      trackIndex: 0,
    });
  });

  it("allows touching clip boundaries on a track", () => {
    const a = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      startMs: 0,
      transitionMaxMs: 500,
    });
    const b = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      startMs: 500,
      transitionMaxMs: 500,
    });
    expect(validateTimelineEffect("OK", 1000, false, [track([a, b])])).toBeNull();
  });

  it("rejects a clip extending past durationMs when looping", () => {
    const c = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      startMs: 800,
      transitionMaxMs: 500,
    });
    expect(validateTimelineEffect("OK", 1000, true, [track([c])])).toMatchObject({
      field: "clip",
      message: expect.stringMatching(/loop end/i),
    });
  });

  it("rejects an invalid native_effect clip (empty name)", () => {
    const c = clip({
      kind: "native_effect",
      config: { kind: "native_effect", config: { name: "" } },
    });
    expect(validateTimelineEffect("OK", 0, false, [track([c])])).toMatchObject({ field: "clip" });
  });

  it("rejects transition bounds where max < min", () => {
    const c = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      transitionMinMs: 500,
      transitionMaxMs: 100,
    });
    expect(validateTimelineEffect("OK", 1000, false, [track([c])])).toMatchObject({
      field: "clip",
    });
  });
});

describe("maxClipEnd", () => {
  it("returns 0 for no clips", () => {
    expect(maxClipEnd([])).toBe(0);
    expect(maxClipEnd([newEditableTrack()])).toBe(0);
  });

  it("returns the rightmost clip end across tracks", () => {
    const a = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      startMs: 100,
      transitionMaxMs: 200,
    });
    const b = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      startMs: 500,
      transitionMaxMs: 250,
    });
    expect(maxClipEnd([track([a]), track([b])])).toBe(750);
  });
});

describe("findFreeStartOnTrack", () => {
  it("returns the desired start on an empty track", () => {
    expect(findFreeStartOnTrack(track([]), 200, 100)).toBe(200);
  });

  it("uses an early gap when the desired start does not fit later", () => {
    const a = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      startMs: 0,
      transitionMaxMs: 200,
    });
    const b = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      startMs: 800,
      transitionMaxMs: 100,
    });
    const t = track([a, b]);
    expect(findFreeStartOnTrack(t, 250, 200)).toBe(250);
  });

  it("snaps the candidate inside a gap that fits but is offset", () => {
    const a = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      startMs: 0,
      transitionMaxMs: 200,
    });
    const b = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      startMs: 800,
      transitionMaxMs: 100,
    });
    const t = track([a, b]);
    expect(findFreeStartOnTrack(t, 100, 100)).toBe(200);
    expect(findFreeStartOnTrack(t, 750, 100)).toBe(700);
  });

  it("returns null when no gap fits the requested width", () => {
    const a = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      startMs: 0,
      transitionMaxMs: 1000,
    });
    const t = track([a]);
    expect(findFreeStartOnTrack(t, 100, 200)).toBe(1000);
  });

  it("falls back to the open right tail when interior gaps are too small", () => {
    const a = clip({
      kind: "set_brightness",
      config: defaultClipConfig("set_brightness"),
      startMs: 100,
      transitionMaxMs: 50,
    });
    const t = track([a]);
    expect(findFreeStartOnTrack(t, 110, 200)).toBe(150);
  });
});

describe("newEditableClip / newEditableTrack", () => {
  it("creates a clip with sensible default transition", () => {
    const c = newEditableClip("set_brightness");
    expect(c.transitionMinMs).toBe(c.transitionMaxMs);
    expect(c.transitionMaxMs).toBeGreaterThan(0);
  });

  it("creates a zero-transition clip for set_on_off", () => {
    const c = newEditableClip("set_on_off");
    expect(c.transitionMaxMs).toBe(0);
  });

  it("creates an empty track", () => {
    expect(newEditableTrack().clips).toEqual([]);
  });
});
