import type { Capability, Device } from "$lib/gql/graphql";

export interface GroupLite {
  id: string;
  name?: string;
  icon?: string | null;
  members: { memberType: string; memberId: string }[];
}

export interface RoomLite {
  id: string;
  name?: string;
  icon?: string | null;
  // members is the canonical room composition (mirroring GroupLite). Some
  // pages fetch the server-flattened device list instead and supply
  // `resolvedDevices`; either is sufficient.
  members?: { memberType: string; memberId: string }[];
  resolvedDevices?: { id: string }[];
}

export type TargetKind = "device" | "group" | "room";

/** A subject a target-expression clause matches against. */
export const CLAUSE_SUBJECTS = [
  { value: "room", label: "Room" },
  { value: "group", label: "Group" },
  { value: "device", label: "Device" },
  { value: "device_type", label: "Device type" },
  { value: "device_role", label: "Device role" },
] as const;
export type ClauseSubject = (typeof CLAUSE_SUBJECTS)[number]["value"];

/** How a clause's values are matched. */
export const CLAUSE_OPS = [
  { value: "is", label: "is" },
  { value: "is_one_of", label: "is one of" },
  { value: "is_not", label: "is not" },
  { value: "is_not_one_of", label: "is not one of" },
] as const;
export type ClauseOp = (typeof CLAUSE_OPS)[number]["value"];

/** Device kinds selectable for device_type / device_role clauses. */
export const CLAUSE_KINDS = ["light", "plug", "climate", "speaker", "sensor", "button"] as const;

/** One rule in a target expression. connector is absent on the first clause. */
export interface Clause {
  connector?: string;
  subject: string;
  op: string;
  values: string[];
}

const ROLE_TAGS: Record<string, string> = { LIGHT: "light" };

function deviceRoles(d: Pick<Device, "type" | "tags">): string[] {
  const out = new Set<string>([d.type]);
  for (const t of d.tags ?? []) {
    if (ROLE_TAGS[t]) out.add(ROLE_TAGS[t]);
  }
  return Array.from(out);
}

/**
 * Resolve a target expression to its device set. Mirrors
 * `device.EvaluateExpression` on the backend: clauses fold left-to-right
 * (no precedence) with and = intersect, or = union; is_not* inverts against the
 * full device universe. An empty expression resolves to nothing.
 */
export function evaluateExpression(
  expr: Clause[],
  devices: Device[],
  groups: GroupLite[],
  rooms: RoomLite[],
): Device[] {
  if (expr.length === 0) return [];
  const byId = new Map(devices.map((d) => [d.id, d]));

  function clauseSet(c: Clause): Set<string> {
    const include = new Set<string>();
    if (c.subject === "room" || c.subject === "group" || c.subject === "device") {
      for (const v of c.values) {
        for (const d of resolveTargetDevices({ type: c.subject, id: v }, devices, groups, rooms)) {
          include.add(d.id);
        }
      }
    } else if (c.subject === "device_type") {
      const want = new Set(c.values);
      for (const d of devices) if (want.has(d.type)) include.add(d.id);
    } else if (c.subject === "device_role") {
      const want = new Set(c.values);
      for (const d of devices) if (deviceRoles(d).some((r) => want.has(r))) include.add(d.id);
    }
    if (c.op === "is_not" || c.op === "is_not_one_of") {
      const excluded = new Set<string>();
      for (const d of devices) if (!include.has(d.id)) excluded.add(d.id);
      return excluded;
    }
    return include;
  }

  let acc = new Set<string>();
  expr.forEach((c, i) => {
    const set = clauseSet(c);
    if (i === 0) {
      acc = set;
    } else if (c.connector === "or") {
      for (const id of set) acc.add(id);
    } else {
      const next = new Set<string>();
      for (const id of acc) if (set.has(id)) next.add(id);
      acc = next;
    }
  });

  const out: Device[] = [];
  for (const id of acc) {
    const d = byId.get(id);
    if (d) out.push(d);
  }
  return out;
}

/**
 * Resolve a target (device / group / room) to the flat list of member devices
 * it covers. Groups may nest other groups or rooms; resolution is iterative
 * with a seen-set to stop cycles.
 */
export function resolveTargetDevices(
  target: { type: TargetKind; id: string },
  devices: Device[],
  groups: GroupLite[],
  rooms: RoomLite[],
): Device[] {
  const deviceByID = new Map(devices.map((d) => [d.id, d]));
  const groupByID = new Map(groups.map((g) => [g.id, g]));
  const roomByID = new Map(rooms.map((r) => [r.id, r]));

  const collected = new Map<string, Device>();
  const seenGroups = new Set<string>();
  const seenRooms = new Set<string>();

  function walk(type: TargetKind, id: string) {
    if (type === "device") {
      const d = deviceByID.get(id);
      if (d) collected.set(d.id, d);
      return;
    }
    if (type === "group") {
      if (seenGroups.has(id)) return;
      seenGroups.add(id);
      const g = groupByID.get(id);
      if (!g) return;
      for (const m of g.members ?? []) {
        if (m.memberType === "device") walk("device", m.memberId);
        else if (m.memberType === "group") walk("group", m.memberId);
        else if (m.memberType === "room") walk("room", m.memberId);
      }
      return;
    }
    if (type === "room") {
      if (seenRooms.has(id)) return;
      seenRooms.add(id);
      const r = roomByID.get(id);
      if (!r) return;
      if (r.resolvedDevices) {
        for (const d of r.resolvedDevices) walk("device", d.id);
        return;
      }
      for (const m of r.members ?? []) {
        if (m.memberType === "device") walk("device", m.memberId);
        else if (m.memberType === "group") walk("group", m.memberId);
      }
    }
  }

  walk(target.type, target.id);
  return Array.from(collected.values());
}

/**
 * Capability union across a set of devices. Capabilities are deduped by
 * `name`; numeric min/max are widened to cover all members. Access is
 * bitwise-OR'd so a cap is "settable" if any member exposes set access.
 */
export function capabilityUnion(devices: Device[]): Capability[] {
  const byName = new Map<string, Capability>();
  for (const d of devices) {
    for (const c of d.capabilities) {
      const prev = byName.get(c.name);
      if (!prev) {
        byName.set(c.name, { ...c });
        continue;
      }
      const merged: Capability = { ...prev };
      merged.access = (prev.access ?? 0) | (c.access ?? 0);
      if (c.valueMin != null) {
        merged.valueMin = prev.valueMin != null ? Math.min(prev.valueMin, c.valueMin) : c.valueMin;
      }
      if (c.valueMax != null) {
        merged.valueMax = prev.valueMax != null ? Math.max(prev.valueMax, c.valueMax) : c.valueMax;
      }
      byName.set(c.name, merged);
    }
  }
  return Array.from(byName.values());
}

/** Return the capability union for a target, resolving through groups/rooms. */
export function capabilityUnionForTarget(
  target: { type: TargetKind; id: string },
  devices: Device[],
  groups: GroupLite[],
  rooms: RoomLite[],
): Capability[] {
  return capabilityUnion(resolveTargetDevices(target, devices, groups, rooms));
}

export function hasCapability(caps: Capability[], name: string): boolean {
  return caps.some((c) => c.name === name);
}

/**
 * Capabilities that are numeric and settable (have set-access in the access
 * bitmask). Powers target-list filtering and field-options listing for the
 * `change_value` automation action — adding a new numeric, settable
 * capability in the device layer makes it eligible here automatically.
 */
export function settableNumericCapabilities(caps: Capability[]): Capability[] {
  return caps.filter((c) => c.type === "numeric" && (c.access & 4) !== 0);
}
