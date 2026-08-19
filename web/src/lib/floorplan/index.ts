export type {
  Face,
  OpeningKind,
  DoorHingeSide,
  DoorSwingSide,
  PlanDoorBinding,
  PlanGraph,
  PlanOpening,
  PlanRoomMeta,
  PlanVertex,
  PlanWall,
  Point,
} from "./types";
export {
  doorBindingGeometry,
  doorBindingViews,
  doorLeafAngle,
  doorSnapTarget,
  pruneDoorBindings,
} from "./door-bindings";
export type { DoorBindingGeometry, DoorBindingView, DoorSnapTarget } from "./door-bindings";
export {
  CURVE_SEGMENTS,
  DEFAULT_WALL_THICKNESS,
  MAX_WALL_THICKNESS,
  MIN_WALL_THICKNESS,
  arcLengthAtT,
  controlForApex,
  flattenWall,
  nearestPointInFace,
  pointInPolygon,
  pointSegmentDistance,
  pointSegmentProjection,
  poleOfInaccessibility,
  polygonBounds,
  projectOntoWall,
  segmentIntersection,
  shoelaceArea,
  tAtArcLength,
  vertexMap,
  wallApex,
  wallMetrics,
} from "./geometry";
export type { WallMetrics } from "./geometry";
export {
  DEFAULT_OPENING_WIDTH_M,
  MIN_OPENING_WIDTH_M,
  clampOpening,
  openingAnchor,
  openingSpan,
  openingTRange,
  solidSpans,
} from "./openings";
export { DEFAULT_MERGE_TOLERANCE, EXACT_EPSILON, normalizeGraph } from "./graph";
export { detectFaces, faceContainingPoint } from "./faces";
export {
  addOpening,
  addRoomClipped,
  bendWall,
  MIN_WALL_LENGTH_M,
  clampWallDrag,
  cloneGraph,
  carryWallCurves,
  connectPoints,
  curveCollidesAnotherWall,
  removeOpenings,
  resizeAtCorner,
  setOpeningKind,
  setWallThickness,
  stampRoom,
  trimWallsInsideFaces,
  withOpening,
} from "./edit";
export {
  hitFace,
  hitOpening,
  hitOpeningEnd,
  hitVertex,
  hitWall,
  grabTarget,
  openingViews,
  sweptSelection,
} from "./hit-test";
export type { GrabInput, OpeningEndHit, OpeningView, PlanGrab } from "./hit-test";
export { detachFace, detachWallEnds, facePairKeys, wallPairKey } from "./detach";
export type { DetachResult, IdMint, WallDetachResult } from "./detach";
export { faceKey, matchFaces } from "./identity";
export type { FaceAssignment, MatchResult } from "./identity";
export {
  ANGLE_STEP_DEG,
  DEFAULT_GRID_SIZE,
  SNAP_THRESHOLD_PX,
  ROOM_SNAP_REACH_M,
  gridSlide,
  resolveSnap,
  snapRectOffset,
  snapGuides,
} from "./snapping";
export type { SnapContext, SnapIndicator, SnapResult } from "./snapping";
export { MITER_LIMIT, wallOutline } from "./offset";
export { faceAreaM2, faceBounds, formatArea, formatMeters, wallLength } from "./measure";
export { planLabels } from "./labels";
export type { LabelTone, PlanLabel, PlanLabelInput } from "./labels";
