/** A position in world coordinates. World units are meters. */
export interface Point {
  x: number;
  y: number;
}

/** A wall endpoint in the centerline graph. */
export interface PlanVertex {
  id: string;
  x: number;
  y: number;
}

/** What a gap in a wall represents. */
export type OpeningKind = "door" | "window" | "opening";

/**
 * A gap cut out of a wall. `t` is the opening's centre in the wall's own
 * parameterisation (0 at vertex a, 1 at vertex b); `width` is in meters, so it
 * survives a wall being split or rescaled untouched.
 */
export interface PlanOpening {
  id: string;
  t: number;
  width: number;
  kind: OpeningKind;
}

/**
 * A wall segment between two vertices, referenced by id. An optional quadratic
 * bezier control point makes the wall curved; curved walls are flattened to
 * segments before any face analysis. `openings` cut gaps out of the rendered
 * wall body without touching the centerline graph, so faces are unaffected.
 */
export interface PlanWall {
  id: string;
  a: string;
  b: string;
  thickness: number;
  curve?: Point;
  openings?: PlanOpening[];
}

/** The full centerline graph of a floor plan. */
export interface PlanGraph {
  vertices: PlanVertex[];
  walls: PlanWall[];
}

/**
 * An enclosed region derived from the wall graph. `vertexIds` lists the graph
 * vertices on the boundary in canonical rotation (lexicographically smallest
 * id first, counter-clockwise); `polygon` is the flattened boundary including
 * curved-wall interpolation points; `area` is in square meters, positive.
 */
export interface Face {
  vertexIds: string[];
  polygon: Point[];
  area: number;
}

/**
 * A persisted room row: the identity a face keeps across edits. `roomId` is
 * the Hive room link, `vertexIds` the face boundary at last save. `area`
 * (square meters at last save) refines Jaccard-tied matches when present.
 */
export interface PlanRoomMeta {
  id: string;
  name: string | null;
  roomId: string | null;
  vertexIds: string[];
  area?: number;
}
