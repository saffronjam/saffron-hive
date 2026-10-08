import { describe, expect, it } from "vitest";
import type { SummaryLookups } from "$lib/components/graph/automation-summary";
import { CapabilityCategory, type Device } from "$lib/gql/graphql";
import { Names } from "$lib/automation-dsl/names";
import { formatDocument, printAutomation } from "$lib/automation-dsl/print";
import { parseAutomation } from "$lib/automation-dsl/parse";
import type { JsonObject, WireAutomation, WireNode } from "$lib/automation-dsl/model";

function device(id: string, name: string): Device {
  return {
    id,
    name,
    friendlyName: name,
    type: "light",
    disabled: false,
    deleted: false,
    roles: {},
    capabilities: [
      {
        name: "on_off",
        type: "binary",
        category: CapabilityCategory.State,
        canSet: true,
        reportsValue: true,
        canGet: false,
      },
    ],
  } as unknown as Device;
}

const lookups: SummaryLookups = {
  devices: [
    device("0xmotion", "Motion sensor"),
    device("0xlamp", "Lava lamp"),
    device("0xswitch", "Bedroom switch"),
    device("0xtwin1", "Twin"),
    device("0xtwin2", "Twin"),
  ],
  groups: [{ id: "g-all", name: "All lights", members: [] }],
  rooms: [
    { id: "r-bed", name: "Bedroom", members: [] },
    { id: "r-kit", name: "Kitchen", members: [] },
  ] as unknown as SummaryLookups["rooms"],
  scenes: [
    { id: "s-cozy", name: "Cozy" },
    { id: "s-night", name: "Night" },
  ],
  effects: [
    { kind: "timeline", id: "fx-sunrise", name: "Sunrise" },
    { kind: "native", nativeName: "candle", name: "Candle" },
  ],
  webhooks: [{ id: "wh-door", name: "Doorbell" }],
};

const names = new Names(lookups);

function node(id: string, type: WireNode["type"], config: object): WireNode {
  return { id, type, config: JSON.stringify(config) };
}

function canonical(wire: WireAutomation) {
  return {
    name: wire.name,
    definitions: JSON.parse(wire.definitions || "{}"),
    nodes: wire.nodes
      .map((n) => ({ id: n.id, type: n.type, config: JSON.parse(n.config) }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    edges: wire.edges.map((e) => `${e.fromNodeId}>${e.toNodeId}`).sort(),
  };
}

/** Prints, re-reads the formatted text and parses it back. */
function roundTrip(wire: WireAutomation) {
  const doc = printAutomation(wire, names);
  const text = formatDocument(doc);
  const parsed = parseAutomation(JSON.parse(text), names);
  expect(parsed.diagnostics).toEqual([]);
  expect(canonical(parsed.automation!)).toEqual(canonical(wire));
  return doc;
}

const motionOff = {
  kind: "event",
  event_type: "device.state_changed",
  filter_expr:
    'trigger.device_id == "0xmotion" && trigger.payload.state.presence != nil && trigger.payload.state.presence == false',
  hold_ms: 10000,
  device_id: "0xmotion",
};

const lampOff = {
  action_type: "set_device_state",
  target_type: "room",
  target_id: "r-bed",
  target_expr: [],
  payload: JSON.stringify({ on: false }),
};

describe("automation language", () => {
  it("prints a simple automation as a rule with names and no ids", () => {
    const doc = roundTrip({
      name: "Motion off",
      definitions: "{}",
      nodes: [
        node("t1", "trigger", motionOff),
        node("c1", "condition", { expr: 'time.between("22:00", "06:00")' }),
        node("a1", "action", lampOff),
      ],
      edges: [
        { fromNodeId: "t1", toNodeId: "c1" },
        { fromNodeId: "c1", toNodeId: "a1" },
      ],
    });
    expect(doc).toEqual({
      name: "Motion off",
      rules: [
        {
          when: { device: "Motion sensor", state: { presence: false }, for: "10s" },
          if: { time: { between: ["22:00", "06:00"] } },
          do: { set: { room: "Bedroom", state: { on: false } } },
        },
      ],
    });
  });

  it("joins several conditions with an AND and several triggers with an OR", () => {
    const press = {
      kind: "event",
      event_type: "device.action_fired",
      filter_expr: 'trigger.device_id == "0xswitch" && trigger.payload.action == "single"',
    };
    const schedule = { kind: "schedule", cron_expr: "0 30 7 * * MON,FRI" };
    const doc = roundTrip({
      name: "Morning",
      definitions: "{}",
      nodes: [
        node("t1", "trigger", press),
        node("t2", "trigger", schedule),
        node("c1", "condition", { expr: 'day.in("mon", "fri")' }),
        node("c2", "condition", { expr: 'any_of({"room": "r-bed"}, "on", true)' }),
        node("o1", "operator", { kind: "or" }),
        node("o2", "operator", { kind: "and" }),
        node("a1", "action", {
          action_type: "activate_scene",
          target_type: "",
          target_id: "",
          target_expr: [],
          payload: JSON.stringify({ scene_id: "s-cozy" }),
        }),
      ],
      edges: [
        { fromNodeId: "t1", toNodeId: "o1" },
        { fromNodeId: "t2", toNodeId: "o1" },
        { fromNodeId: "o1", toNodeId: "o2" },
        { fromNodeId: "c1", toNodeId: "o2" },
        { fromNodeId: "c2", toNodeId: "o2" },
        { fromNodeId: "o2", toNodeId: "a1" },
      ],
    });
    const rule = (doc.rules as JsonObject[])[0];
    expect(rule.when).toEqual([
      { device: "Bedroom switch", event: "single" },
      { schedule: { at: "07:30", days: ["mon", "fri"] } },
    ]);
    expect(rule.if).toEqual([
      { day: ["mon", "fri"] },
      { any: { room: "Bedroom", state: { on: true } } },
    ]);
    expect(rule.do).toEqual({ scene: "Cozy" });
  });

  it("falls back to the graph form for a NOT operator", () => {
    const doc = roundTrip({
      name: "Not",
      definitions: "{}",
      nodes: [
        node("t1", "trigger", motionOff),
        node("c1", "condition", { expr: 'scene_active("s-night")' }),
        node("o1", "operator", { kind: "not" }),
        node("a1", "action", lampOff),
      ],
      edges: [
        { fromNodeId: "c1", toNodeId: "o1" },
        { fromNodeId: "t1", toNodeId: "a1" },
        { fromNodeId: "o1", toNodeId: "a1" },
      ],
    });
    expect(doc.graph).toContainEqual({ id: "o1", op: "not", after: ["c1"] });
    expect(doc.graph).toContainEqual({ id: "c1", if: { scene_active: "Night" } });
  });

  it("round-trips every trigger, condition and action kind", () => {
    const triggers = [
      motionOff,
      {
        kind: "event",
        event_type: "device.availability_changed",
        filter_expr: 'trigger.device_id == "0xlamp"',
        cooldown_ms: 30000,
      },
      { kind: "schedule", cron_expr: "*/15 * * * * *" },
      { kind: "schedule", cron_expr: "0 0 */2 * * *", grace_ms: 500 },
      { kind: "schedule", cron_expr: "0 0 12 1 * *" },
      {
        kind: "event",
        event_type: "webhook.received",
        filter_expr: "true",
        endpoint_id: "wh-door",
        webhook_filters: [{ source: "body", path: "a", operator: "exists" }],
      },
      {
        kind: "event",
        event_type: "device.state_changed",
        filter_expr:
          'trigger.device_id == "0xlamp" && trigger.payload.state.brightness != nil && trigger.payload.state.brightness > 100',
      },
      {
        kind: "event",
        event_type: "device.state_changed",
        filter_expr: "trigger.payload.state.on == true",
      },
    ];
    const conditions = [
      'time.after("07:00")',
      'device("0xlamp").on == true && device("0xlamp").brightness >= 203',
      'room("r-kit").on == false',
      'all_of({"group": "g-all"}, "on", false)',
      'count_of({"room": "r-bed"}, "on", true) > 2',
      'avg_of({"where": [{"subject": "room", "op": "is_one_of", "values": ["r-bed", "r-kit"]}]}, "temperature") < 19.5',
      'since({"device": "0xmotion"}, "presence") > duration("10m")',
      '!(time.between("01:00", "02:00"))',
      "trigger.payload.state.on == true || false",
    ];
    const target = { target_type: "device", target_id: "0xlamp", target_expr: [] };
    const actions = [
      {
        action_type: "set_device_state",
        ...target,
        payload: JSON.stringify({
          on: true,
          brightness: 203,
          colorTemp: 370,
          color: { r: 255, g: 136, b: 0 },
          transition: 2,
        }),
      },
      {
        action_type: "toggle_device_state",
        target_type: "expression",
        target_id: "",
        target_expr: [
          { subject: "device_type", op: "is", values: ["light"] },
          { connector: "or", subject: "room", op: "is_not", values: ["r-kit"] },
        ],
        payload: "",
      },
      {
        action_type: "cycle_scenes",
        target_type: "",
        target_id: "",
        target_expr: [],
        payload: JSON.stringify({ scenes: ["s-cozy", "s-night"] }),
      },
      {
        action_type: "run_effect",
        ...target,
        payload: JSON.stringify({ effect_id: "fx-sunrise" }),
      },
      { action_type: "run_effect", ...target, payload: JSON.stringify({ native_name: "candle" }) },
      {
        action_type: "change_value",
        target_type: "group",
        target_id: "g-all",
        target_expr: [],
        payload: JSON.stringify({ field: "brightness", delta: -10, mode: "percent" }),
      },
      {
        action_type: "configure_device",
        ...target,
        payload: JSON.stringify({
          settings: [
            {
              capability: "power_on_behavior",
              booleanValue: null,
              numberValue: null,
              stringValue: "off",
            },
          ],
        }),
      },
      {
        action_type: "raise_alarm",
        target_type: "",
        target_id: "",
        target_expr: [],
        payload: JSON.stringify({
          alarm_id: "leak",
          severity: "high",
          kind: "auto",
          message: "Water",
        }),
      },
      {
        action_type: "clear_alarm",
        target_type: "",
        target_id: "",
        target_expr: [],
        payload: JSON.stringify({ alarm_id: "leak" }),
      },
    ];
    const nodes: WireNode[] = [
      ...triggers.map((config, i) => node(`t${i + 1}`, "trigger", config)),
      ...conditions.map((expr, i) => node(`c${i + 1}`, "condition", { expr })),
      ...actions.map((config, i) => node(`a${i + 1}`, "action", config)),
    ];
    const edges = nodes
      .filter((n) => n.type !== "trigger")
      .map((n) => ({ fromNodeId: "t1", toNodeId: n.id }));
    roundTrip({ name: "Everything", definitions: "{}", nodes, edges });
  });

  it("reads clock arithmetic and name-based conditions as structure", () => {
    const doc = printAutomation(
      {
        name: "Legacy",
        definitions: "{}",
        nodes: [
          node("t1", "trigger", motionOff),
          node("c1", "condition", {
            expr: "(time.hour * 60 + time.minute) >= 420 && (time.hour * 60 + time.minute) < 1350",
          }),
          node("c2", "condition", { expr: 'device("Lava lamp").on == true' }),
          node("o1", "operator", { kind: "and" }),
          node("a1", "action", lampOff),
        ],
        edges: [
          { fromNodeId: "t1", toNodeId: "o1" },
          { fromNodeId: "c1", toNodeId: "o1" },
          { fromNodeId: "c2", toNodeId: "o1" },
          { fromNodeId: "o1", toNodeId: "a1" },
        ],
      },
      names,
    );
    expect((doc.rules as JsonObject[])[0].if).toEqual([
      { time: { between: ["07:00", "22:30"] } },
      { device: "Lava lamp", state: { on: true } },
    ]);
  });

  it("prints only the ids parsing would not assign by itself", () => {
    const doc = roundTrip({
      name: "Ids",
      definitions: "{}",
      nodes: [node("t2", "trigger", motionOff), node("a1", "action", lampOff)],
      edges: [{ fromNodeId: "t2", toNodeId: "a1" }],
    });
    expect((doc.rules as JsonObject[])[0]).toEqual({
      when: { id: "t2", device: "Motion sensor", state: { presence: false }, for: "10s" },
      do: { set: { room: "Bedroom", state: { on: false } } },
    });
  });

  it("compiles macros into definitions and calls", () => {
    const text = {
      name: "Macros",
      define: {
        night: { time: { between: ["22:00", "06:00"] } },
        bedroom_lights: { where: [{ room: "Bedroom" }, { can: "brightness" }] },
        dim: { set: { target: "$bedroom_lights", state: { on: true, brightness: "$1" } } },
        lights_on: { any: { target: "$bedroom_lights", state: { on: true } } },
      },
      rules: [
        {
          when: { device: "Motion sensor", state: { presence: true } },
          if: ["$night", { not: "$lights_on" }],
          do: [{ $dim: ["20%"] }, { toggle: { target: "$bedroom_lights" } }],
        },
      ],
    };
    const parsed = parseAutomation(text, names);
    expect(parsed.diagnostics).toEqual([]);
    const wire = parsed.automation!;
    expect(JSON.parse(wire.definitions)).toEqual({
      night: { kind: "condition", expr: 'time.between("22:00", "06:00")' },
      bedroom_lights: {
        kind: "target",
        target_expr: [
          { subject: "room", op: "is", values: ["r-bed"] },
          { subject: "writable_capability", op: "is", values: ["brightness"] },
        ],
      },
      dim: {
        kind: "action",
        params: 1,
        action: {
          action_type: "set_device_state",
          target_type: "macro",
          target_id: "bedroom_lights",
          target_expr: [],
          payload: { on: true, brightness: "$1" },
        },
      },
      lights_on: { kind: "condition", expr: 'any_of({"macro": "bedroom_lights"}, "on", true)' },
    });
    const configs = wire.nodes.map((n) => JSON.parse(n.config));
    expect(configs).toContainEqual({ use: "night" });
    expect(configs).toContainEqual({ use: "lights_on", negate: true });
    expect(configs).toContainEqual({ use: "dim", args: [51] });
    expect(printAutomation(wire, names)).toEqual(text);
  });

  it("tells apart same-named scenes and devices by their rooms", () => {
    const clashing = new Names({
      ...lookups,
      devices: [...lookups.devices, device("0xlamp2", "Lava lamp")],
      rooms: [
        { id: "r-bed", name: "Bedroom", members: [{ memberType: "device", memberId: "0xlamp" }] },
        { id: "r-kit", name: "Kitchen", members: [{ memberType: "device", memberId: "0xlamp2" }] },
      ] as unknown as SummaryLookups["rooms"],
      scenes: [
        { id: "s-bed", name: "Cozy", rooms: [{ id: "r-bed", name: "Bedroom" }] },
        { id: "s-kit", name: "Cozy", rooms: [{ id: "r-kit", name: "Kitchen" }] },
        { id: "s-none", name: "Cozy", rooms: [] },
        { id: "s-night", name: "Night", rooms: [{ id: "r-bed", name: "Bedroom" }] },
      ],
    });
    const wire: WireAutomation = {
      name: "Clash",
      definitions: "{}",
      nodes: [
        node("t1", "trigger", motionOff),
        node("a1", "action", {
          action_type: "cycle_scenes",
          target_type: "",
          target_id: "",
          target_expr: [],
          payload: JSON.stringify({ scenes: ["s-bed", "s-kit", "s-none", "s-night"] }),
        }),
        node("a2", "action", { ...lampOff, target_type: "device", target_id: "0xlamp2" }),
      ],
      edges: [
        { fromNodeId: "t1", toNodeId: "a1" },
        { fromNodeId: "t1", toNodeId: "a2" },
      ],
    };
    const doc = printAutomation(wire, clashing);
    expect((doc.rules as JsonObject[])[0].do).toEqual([
      { cycle: ["Cozy (Bedroom)", "Cozy (Kitchen)", "s-none", "Night"] },
      { set: { device: "Lava lamp (Kitchen)", state: { on: false } } },
    ]);
    const parsed = parseAutomation(JSON.parse(formatDocument(doc)), clashing);
    expect(parsed.diagnostics).toEqual([]);
    expect(canonical(parsed.automation!)).toEqual(canonical(wire));
    const bare = parseAutomation(
      { name: "Bare", rules: [{ when: doc.rules && (doc.rules as JsonObject[])[0].when, do: { scene: "Cozy" } }] },
      clashing,
    );
    expect(bare.diagnostics[0].message).toContain("More than one match");
  });

  it("locates unknown names, keys, times and macros", () => {
    const parsed = parseAutomation(
      {
        name: "Broken",
        rules: [
          {
            when: { device: "Nobody", state: { on: true } },
            if: [
              { time: { between: ["25:00", "06:00"] } },
              "$missing",
              { device: "Twin", state: { on: true } },
            ],
            do: { sett: { room: "Bedroom" } },
          },
        ],
      },
      names,
    );
    expect(parsed.automation).toBeNull();
    expect(parsed.diagnostics.map((d) => d.path)).toEqual([
      ["rules", 0, "when", "device"],
      ["rules", 0, "if", 0, "time", "between", 0],
      ["rules", 0, "if", 1],
      ["rules", 0, "if", 2, "device"],
      ["rules", 0, "do"],
    ]);
    expect(parsed.diagnostics[3].message).toContain("Twin");
  });
});
