/** What a placement points at: a single device, or a whole group. */
export type PlacementMemberType = "device" | "group";

export interface PlacementRef {
  memberType: PlacementMemberType;
  memberId: string;
}

export interface Placement extends PlacementRef {
  x: number;
  y: number;
}

export interface PlacementConflict {
  /** Placements that must leave the map for the incoming one to make sense. */
  displaced: Placement[];
  /** Device ids the incoming placement and the displaced ones both cover. */
  sharedDeviceIds: string[];
}

/** Stable key for a placement, the way `faceKey` identifies a room. */
export function placementKey(ref: PlacementRef): string {
  return `${ref.memberType}:${ref.memberId}`;
}

export function sameRef(a: PlacementRef, b: PlacementRef): boolean {
  return a.memberType === b.memberType && a.memberId === b.memberId;
}

/**
 * Placements that overlap the incoming one — the same ref (a move), or any
 * placement whose devices it shares.
 *
 * Overlap is resolved here rather than in the database because it cannot be
 * enforced there: adding a device to a group from the groups page creates an
 * overlap with nobody touching the map, and rejecting that would make the plan
 * unsaveable. The rule is simply that the incoming placement wins, in both
 * directions — dropping a group displaces its individually placed members, and
 * dropping a device displaces a group already covering it.
 */
export function placementConflicts(
  incoming: PlacementRef,
  existing: Placement[],
  devicesOf: (ref: PlacementRef) => string[],
): PlacementConflict {
  const incomingDevices = new Set(devicesOf(incoming));
  const displaced: Placement[] = [];
  const shared = new Set<string>();

  for (const placement of existing) {
    if (sameRef(placement, incoming)) {
      // The same thing placed again is a move, not a conflict.
      displaced.push(placement);
      continue;
    }
    const overlap = devicesOf(placement).filter((id) => incomingDevices.has(id));
    if (overlap.length === 0) continue;
    displaced.push(placement);
    for (const id of overlap) shared.add(id);
  }

  return { displaced, sharedDeviceIds: [...shared] };
}

/** True when the conflict removes something the user should be asked about. */
export function needsConfirmation(incoming: PlacementRef, conflict: PlacementConflict): boolean {
  return conflict.displaced.some((p) => !sameRef(p, incoming));
}

/**
 * The placement list after dropping `incoming`: everything it displaces goes,
 * then it lands. One list assignment, so a single history snapshot captures
 * both halves and undo restores them together.
 */
export function applyPlacement(
  existing: Placement[],
  incoming: Placement,
  conflict: PlacementConflict,
): Placement[] {
  const dropped = new Set(conflict.displaced.map(placementKey));
  return [...existing.filter((p) => !dropped.has(placementKey(p))), incoming];
}
