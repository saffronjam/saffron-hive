import {
  ContactRole,
  ControlledLoadRole,
  TargetClauseConnector,
  TargetClauseOperator,
  TargetClauseSubject,
  type Capability,
  type Device,
} from "$lib/gql/graphql";
import { isHiveVisibleDevice, isRuntimeEnabledDevice } from "$lib/stores/devices";
import { sentenceCase } from "$lib/utils";

export interface GroupLite {
  id: string;
  name?: string | null;
  friendlyName?: string | null;
  icon?: string | null;
  removed?: boolean;
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

/**
 * Drop devices Hive must not command. Every runtime resolution in this module
 * runs through it, so the client resolves the same set the server commands.
 *
 * Callers must select `disabled` in their device query. An unselected field
 * arrives as `undefined` rather than a type error, which silently defeats this.
 */
function selectable(devices: Device[]): Device[] {
  return devices.filter(isRuntimeEnabledDevice);
}

/** A subject a target-expression clause matches against. */
export const CLAUSE_SUBJECTS = [
  { value: TargetClauseSubject.Room, label: "Room" },
  { value: TargetClauseSubject.Group, label: "Group" },
  { value: TargetClauseSubject.Device, label: "Device" },
  { value: TargetClauseSubject.DeviceType, label: "Device type" },
  { value: TargetClauseSubject.DeviceRole, label: "Device role" },
  { value: TargetClauseSubject.WritableCapability, label: "Can set" },
  { value: TargetClauseSubject.ReportedCapability, label: "Reports" },
] as const;
export type ClauseSubject = (typeof CLAUSE_SUBJECTS)[number]["value"];

/** How a clause's values are matched. */
export const CLAUSE_OPS = [
  { value: TargetClauseOperator.Is, label: "is" },
  { value: TargetClauseOperator.IsOneOf, label: "is one of" },
  { value: TargetClauseOperator.IsNot, label: "is not" },
  { value: TargetClauseOperator.IsNotOneOf, label: "is not one of" },
] as const;
export type ClauseOp = (typeof CLAUSE_OPS)[number]["value"];

/** Physical classifications selectable for device_type clauses. */
export const CLAUSE_DEVICE_TYPES = [
  "light",
  "plug",
  "climate",
  "speaker",
  "sensor",
  "button",
] as const;

/** Physical and semantic classifications selectable for device_role clauses. */
export const CLAUSE_DEVICE_ROLES = [...CLAUSE_DEVICE_TYPES, "appliance", "door", "window"] as const;

/** One rule in a target expression. connector is absent on the first clause. */
export interface Clause {
  connector?: TargetClauseConnector;
  subject: TargetClauseSubject;
  op: TargetClauseOperator;
  values: string[];
}

const CAPABILITY_LABELS: Record<string, string> = {
  color: "Full colour",
  color_temp: "Tunable white",
  brightness: "Dimming",
  on_off: "Switchable",
};

export function capabilityLabel(name: string, capabilities: Capability[] = []): string {
  return (
    CAPABILITY_LABELS[name] ??
    capabilities.find((capability) => capability.name === name)?.label ??
    sentenceCase(name)
  );
}

export function capabilityOptions(
  devices: Device[],
  subject: TargetClauseSubject.WritableCapability | TargetClauseSubject.ReportedCapability,
): { value: string; label: string }[] {
  const byName = new Map<string, Capability>();
  for (const device of devices) {
    for (const capability of device.capabilities ?? []) {
      const eligible =
        subject === TargetClauseSubject.WritableCapability
          ? capability.canSet
          : capability.reportsValue;
      if (eligible && !byName.has(capability.name)) byName.set(capability.name, capability);
    }
  }
  return Array.from(byName.values())
    .map((capability) => ({
      value: capability.name,
      label: capabilityLabel(capability.name, [capability]),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function deviceRoles(d: Pick<Device, "type" | "roles">): string[] {
  const out = new Set<string>([d.type]);
  if (d.type === "light" || d.roles.controlledLoad === ControlledLoadRole.Light) out.add("light");
  if (d.type === "climate" || d.roles.controlledLoad === ControlledLoadRole.Appliance)
    out.add("appliance");
  if (d.roles.contact === ContactRole.Door) out.add("door");
  if (d.roles.contact === ContactRole.Window) out.add("window");
  return Array.from(out);
}

/**
 * Resolve a target expression to its device set. Mirrors
 * `device.EvaluateExpression` on the backend: clauses fold left-to-right
 * (no precedence) with and = intersect, or = union; is_not* inverts against the
 * full device universe. An empty expression resolves to nothing.
 *
 * Runtime-disabled devices leave the universe, so they are matched by neither
 * an including clause nor the complement an is_not clause builds.
 */
export function evaluateExpression(
  expr: Clause[],
  allDevices: Device[],
  groups: GroupLite[],
  rooms: RoomLite[],
): Device[] {
  if (expr.length === 0) return [];
  const devices = selectable(allDevices);
  const byId = new Map(devices.map((d) => [d.id, d]));

  function clauseSet(c: Clause): Set<string> {
    const include = new Set<string>();
    if (c.subject === "room" || c.subject === "group" || c.subject === "device") {
      for (const v of c.values) {
        for (const d of resolveTargetDevices({ type: c.subject, id: v }, devices, groups, rooms)) {
          include.add(d.id);
        }
      }
    } else if (c.subject === TargetClauseSubject.DeviceType) {
      const want = new Set(c.values);
      for (const d of devices) if (want.has(d.type)) include.add(d.id);
    } else if (c.subject === TargetClauseSubject.DeviceRole) {
      const want = new Set(c.values);
      for (const d of devices) if (deviceRoles(d).some((r) => want.has(r))) include.add(d.id);
    } else if (
      c.subject === TargetClauseSubject.WritableCapability ||
      c.subject === TargetClauseSubject.ReportedCapability
    ) {
      const want = new Set(c.values);
      for (const d of devices) {
        const matches = d.capabilities.some(
          (capability) =>
            want.has(capability.name) &&
            (c.subject === TargetClauseSubject.WritableCapability
              ? capability.canSet
              : capability.reportsValue),
        );
        if (matches) include.add(d.id);
      }
    }
    if (c.op === TargetClauseOperator.IsNot || c.op === TargetClauseOperator.IsNotOneOf) {
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
    } else if (c.connector === TargetClauseConnector.Or) {
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
 *
 * Runtime-disabled devices are dropped, mirroring
 * `store.ResolveTargetDeviceIDs`. Editor surfaces that render a disabled
 * member greyed pass `{ includeDisabled: true }`; deleted devices stay hidden.
 */
export function resolveTargetDevices(
  target: { type: TargetKind; id: string },
  allDevices: Device[],
  groups: GroupLite[],
  rooms: RoomLite[],
  opts?: { includeDisabled?: boolean },
): Device[] {
  const pool = opts?.includeDisabled
    ? allDevices.filter(isHiveVisibleDevice)
    : selectable(allDevices);
  const deviceByID = new Map(pool.map((d) => [d.id, d]));
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
      if (!g || g.removed) return;
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
 * `name`; numeric min/max are widened to cover all members. Access flags are
 * merged so a capability is usable when any member supports the operation.
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
      merged.reportsValue = prev.reportsValue || c.reportsValue;
      merged.canSet = prev.canSet || c.canSet;
      merged.canGet = prev.canGet || c.canGet;
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
 * Capabilities that are numeric and settable. Powers target-list filtering and field-options listing for the
 * `change_value` automation action — adding a new numeric, settable
 * capability in the device layer makes it eligible here automatically.
 */
export function settableNumericCapabilities(caps: Capability[]): Capability[] {
  return caps.filter((c) => c.type === "numeric" && c.canSet);
}
