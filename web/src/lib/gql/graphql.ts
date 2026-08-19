/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
};

/**
 * One row marking that an effect is currently running on a target. volatile
 * mirrors the persistence flag — non-loop timeline runs and native runs are
 * volatile (wiped at process startup); loop timeline runs survive a restart.
 */
export type ActiveEffect = {
  __typename?: 'ActiveEffect';
  effect: Effect;
  id: Scalars['ID']['output'];
  startedAt: Scalars['DateTime']['output'];
  targetId: Scalars['ID']['output'];
  targetType: Scalars['String']['output'];
  volatile: Scalars['Boolean']['output'];
};

export type ActivityEvent = {
  __typename?: 'ActivityEvent';
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  payload: Scalars['String']['output'];
  source: ActivitySource;
  timestamp: Scalars['DateTime']['output'];
  type: Scalars['String']['output'];
};

export type ActivityFilter = {
  advanced?: InputMaybe<Scalars['Boolean']['input']>;
  before?: InputMaybe<Scalars['ID']['input']>;
  deviceId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  roomId?: InputMaybe<Scalars['ID']['input']>;
  since?: InputMaybe<Scalars['DateTime']['input']>;
  types?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ActivitySource = {
  __typename?: 'ActivitySource';
  id?: Maybe<Scalars['ID']['output']>;
  kind: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  roomId?: Maybe<Scalars['ID']['output']>;
  roomName?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type AddGroupMemberInput = {
  groupId: Scalars['ID']['input'];
  memberId: Scalars['ID']['input'];
  memberType: Scalars['String']['input'];
};

export type AddRoomMemberInput = {
  memberId: Scalars['ID']['input'];
  memberType: Scalars['String']['input'];
  roomId: Scalars['ID']['input'];
};

export type AggregatedHistoryTarget = {
  id?: InputMaybe<Scalars['ID']['input']>;
  type: AggregatedHistoryTargetType;
};

export enum AggregatedHistoryTargetType {
  Apartment = 'APARTMENT',
  Group = 'GROUP',
  Room = 'ROOM'
}

export type AggregatedSeries = {
  __typename?: 'AggregatedSeries';
  field: Scalars['String']['output'];
  points: Array<NumericSeriesPoint>;
};

export type AggregatedStateHistoryFilter = {
  bucketSeconds?: InputMaybe<Scalars['Int']['input']>;
  fields?: InputMaybe<Array<Scalars['String']['input']>>;
  from?: InputMaybe<Scalars['DateTime']['input']>;
  target: AggregatedHistoryTarget;
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

/**
 * An alarm is an actionable severity-tagged signal. Rows are persisted 1:1 per
 * raise; this type is the grouped projection — multiple raises sharing the same
 * id collapse into one Alarm whose message/severity/kind come from the latest
 * raise and whose count reflects the group size.
 */
export type Alarm = {
  __typename?: 'Alarm';
  count: Scalars['Int']['output'];
  firstRaisedAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  kind: AlarmKind;
  lastRaisedAt: Scalars['DateTime']['output'];
  latestRowId: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  severity: AlarmSeverity;
  source: Scalars['String']['output'];
};

export type AlarmEvent = {
  __typename?: 'AlarmEvent';
  alarm?: Maybe<Alarm>;
  clearedAlarmId?: Maybe<Scalars['ID']['output']>;
  kind: AlarmEventKind;
};

export enum AlarmEventKind {
  Cleared = 'CLEARED',
  Raised = 'RAISED'
}

export type AlarmFilter = {
  kinds?: InputMaybe<Array<AlarmKind>>;
  severities?: InputMaybe<Array<AlarmSeverity>>;
  since?: InputMaybe<Scalars['DateTime']['input']>;
  sources?: InputMaybe<Array<Scalars['String']['input']>>;
};

export enum AlarmKind {
  Auto = 'AUTO',
  OneShot = 'ONE_SHOT'
}

export enum AlarmSeverity {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

export type AuthPayload = {
  __typename?: 'AuthPayload';
  token: Scalars['String']['output'];
  user: User;
};

export type AutomationEdge = {
  __typename?: 'AutomationEdge';
  fromNodeId: Scalars['ID']['output'];
  toNodeId: Scalars['ID']['output'];
};

export type AutomationEdgeInput = {
  fromNodeId: Scalars['ID']['input'];
  toNodeId: Scalars['ID']['input'];
};

export type AutomationGraph = {
  __typename?: 'AutomationGraph';
  createdBy?: Maybe<User>;
  edges: Array<AutomationEdge>;
  enabled: Scalars['Boolean']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastFiredAt?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  nodes: Array<AutomationNode>;
};

export type AutomationNode = {
  __typename?: 'AutomationNode';
  config: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  positionX: Scalars['Float']['output'];
  positionY: Scalars['Float']['output'];
  /** JSON-encoded map of per-node runtime state (e.g. cycle_scenes index). */
  runtimeState: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type AutomationNodeActivationEvent = {
  __typename?: 'AutomationNodeActivationEvent';
  active: Scalars['Boolean']['output'];
  automationId: Scalars['ID']['output'];
  nodeId: Scalars['ID']['output'];
};

export type AutomationNodeInput = {
  config: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  positionX?: Scalars['Float']['input'];
  positionY?: Scalars['Float']['input'];
  type: Scalars['String']['input'];
};

export type Capability = {
  __typename?: 'Capability';
  canGet: Scalars['Boolean']['output'];
  canSet: Scalars['Boolean']['output'];
  category: CapabilityCategory;
  description?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  reportsValue: Scalars['Boolean']['output'];
  type: Scalars['String']['output'];
  unit?: Maybe<Scalars['String']['output']>;
  valueMax?: Maybe<Scalars['Float']['output']>;
  valueMin?: Maybe<Scalars['Float']['output']>;
  values?: Maybe<Array<Scalars['String']['output']>>;
};

export enum CapabilityCategory {
  Configuration = 'CONFIGURATION',
  Diagnostic = 'DIAGNOSTIC',
  State = 'STATE'
}

export type ChangePasswordInput = {
  newPassword: Scalars['String']['input'];
  oldPassword: Scalars['String']['input'];
};

export type Color = {
  __typename?: 'Color';
  b: Scalars['Int']['output'];
  g: Scalars['Int']['output'];
  r: Scalars['Int']['output'];
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
};

export type ColorInput = {
  b: Scalars['Int']['input'];
  g: Scalars['Int']['input'];
  r: Scalars['Int']['input'];
  x: Scalars['Float']['input'];
  y: Scalars['Float']['input'];
};

export type ConnectionTestResult = {
  __typename?: 'ConnectionTestResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export enum ContactRole {
  Door = 'DOOR',
  General = 'GENERAL',
  Window = 'WINDOW'
}

export enum ControlledLoadRole {
  Appliance = 'APPLIANCE',
  Light = 'LIGHT'
}

export type CreateAutomationInput = {
  edges: Array<AutomationEdgeInput>;
  enabled: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  nodes: Array<AutomationNodeInput>;
};

export type CreateEffectInput = {
  durationMs: Scalars['Int']['input'];
  icon?: InputMaybe<Scalars['String']['input']>;
  kind: EffectKind;
  loop: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  nativeName?: InputMaybe<Scalars['String']['input']>;
  tracks: Array<EffectTrackInput>;
};

export type CreateGroupInput = {
  name: Scalars['String']['input'];
  tags?: InputMaybe<Array<GroupTag>>;
};

export type CreateInitialUserInput = {
  /**
   * Bootstrap token generated on first boot and written to
   * `<data dir>/bootstrap.token` (also logged to stdout). Required so a stranger
   * who happens to hit the URL before the operator finishes setup cannot claim
   * the initial admin account.
   */
  bootstrapToken: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type CreateRoomInput = {
  name: Scalars['String']['input'];
};

export type CreateSceneInput = {
  actions: Array<SceneActionInput>;
  devicePayloads?: InputMaybe<Array<SceneDevicePayloadInput>>;
  name: Scalars['String']['input'];
};

export type CreateUserInput = {
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type Device = {
  __typename?: 'Device';
  available: Scalars['Boolean']['output'];
  capabilities: Array<Capability>;
  configuration: Array<DeviceConfigurationEntry>;
  /**
   * When true the device is excluded from every path that commands or watches it:
   * scene apply, automation and effect fan-out, target selectors, and the
   * unavailable / low-battery health checks. setDeviceState rejects it outright.
   * Its row, detail page, live subscriptions and state history are unaffected, and
   * it still renders as a member of the rooms, groups and scenes it belongs to.
   */
  disabled: Scalars['Boolean']['output'];
  /**
   * How bright this device shows on the floor plan when it reports no brightness
   * of its own, on the 0-254 scale device state uses. Null means full strength.
   */
  displayBrightness?: Maybe<Scalars['Int']['output']>;
  /**
   * The colour the floor plan gives this device when it reports none of its own,
   * as `#rrggbb`. Null leaves it to the map's default warm light.
   */
  displayColor?: Maybe<Scalars['String']['output']>;
  /**
   * The name the integration reports, refreshed on every adapter sync. Empty when
   * the integration has none.
   */
  friendlyName: Scalars['String']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastSeen?: Maybe<Scalars['DateTime']['output']>;
  /**
   * The user's name override. Null means unset, in which case the device shows the
   * name its integration reports, or its id when there is none. Clients render
   * `name ?? friendlyName ?? id`; `updateDevice(name: null)` clears the override.
   */
  name?: Maybe<Scalars['String']['output']>;
  roles: DeviceRoles;
  /**
   * False from the moment an integration discovers a device until the user opens
   * the device list, which is what marks it as new in the UI. An adapter re-sync
   * never resets it.
   */
  seen: Scalars['Boolean']['output'];
  source: Scalars['String']['output'];
  state?: Maybe<DeviceState>;
  type: Scalars['String']['output'];
};

export type DeviceActionEvent = {
  __typename?: 'DeviceActionEvent';
  action: Scalars['String']['output'];
  deviceId: Scalars['ID']['output'];
  firedAt: Scalars['DateTime']['output'];
};

export type DeviceAvailabilityEvent = {
  __typename?: 'DeviceAvailabilityEvent';
  available: Scalars['Boolean']['output'];
  deviceId: Scalars['ID']['output'];
};

export type DeviceConfigurationEntry = {
  __typename?: 'DeviceConfigurationEntry';
  booleanValue?: Maybe<Scalars['Boolean']['output']>;
  capability: Scalars['String']['output'];
  numberValue?: Maybe<Scalars['Float']['output']>;
  stringValue?: Maybe<Scalars['String']['output']>;
};

export type DeviceConfigurationEntryInput = {
  booleanValue?: InputMaybe<Scalars['Boolean']['input']>;
  capability: Scalars['String']['input'];
  numberValue?: InputMaybe<Scalars['Float']['input']>;
  stringValue?: InputMaybe<Scalars['String']['input']>;
};

export type DeviceConfigurationEvent = {
  __typename?: 'DeviceConfigurationEvent';
  deviceId: Scalars['ID']['output'];
  values: Array<DeviceConfigurationEntry>;
};

export type DeviceRoles = {
  __typename?: 'DeviceRoles';
  contact?: Maybe<ContactRole>;
  controlledLoad?: Maybe<ControlledLoadRole>;
};

/**
 * Current state of a device across every capability it reports. Every field is
 * nullable — null means the device has not reported (or does not report) that
 * value. Clients typically branch on Device.type to decide which fields to
 * display, but any field may be present on any device.
 */
export type DeviceState = {
  __typename?: 'DeviceState';
  battery?: Maybe<Scalars['Float']['output']>;
  brightness?: Maybe<Scalars['Int']['output']>;
  color?: Maybe<Color>;
  colorTemp?: Maybe<Scalars['Int']['output']>;
  /** True means closed; false means open. */
  contact?: Maybe<Scalars['Boolean']['output']>;
  current?: Maybe<Scalars['Float']['output']>;
  devicePosture?: Maybe<Scalars['String']['output']>;
  energy?: Maybe<Scalars['Float']['output']>;
  fanMode?: Maybe<Scalars['String']['output']>;
  humidity?: Maybe<Scalars['Float']['output']>;
  hvacMode?: Maybe<Scalars['String']['output']>;
  illuminance?: Maybe<Scalars['Float']['output']>;
  linkQuality?: Maybe<Scalars['Float']['output']>;
  occupancy?: Maybe<Scalars['Boolean']['output']>;
  on?: Maybe<Scalars['Boolean']['output']>;
  orientation?: Maybe<Scalars['String']['output']>;
  power?: Maybe<Scalars['Float']['output']>;
  pressure?: Maybe<Scalars['Float']['output']>;
  swing?: Maybe<Scalars['String']['output']>;
  targetTemperature?: Maybe<Scalars['Float']['output']>;
  temperature?: Maybe<Scalars['Float']['output']>;
  transition?: Maybe<Scalars['Float']['output']>;
  voltage?: Maybe<Scalars['Float']['output']>;
};

export type DeviceStateEvent = {
  __typename?: 'DeviceStateEvent';
  deviceId: Scalars['ID']['output'];
  state: DeviceState;
};

export type DeviceStateInput = {
  brightness?: InputMaybe<Scalars['Int']['input']>;
  color?: InputMaybe<ColorInput>;
  colorTemp?: InputMaybe<Scalars['Int']['input']>;
  fanMode?: InputMaybe<Scalars['String']['input']>;
  hvacMode?: InputMaybe<Scalars['String']['input']>;
  on?: InputMaybe<Scalars['Boolean']['input']>;
  swing?: InputMaybe<Scalars['String']['input']>;
  targetTemperature?: InputMaybe<Scalars['Float']['input']>;
  transition?: InputMaybe<Scalars['Float']['input']>;
};

export type Effect = {
  __typename?: 'Effect';
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  /**
   * For loop=true timeline effects, the loop length in milliseconds (the
   * position of the End line on the editor timeline). Inter-loop delay equals
   * durationMs minus the rightmost clip's end. For loop=false effects, this is
   * informational and reflects the rightmost clip end captured at save time.
   * Always 0 for native effects.
   */
  durationMs: Scalars['Int']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  kind: EffectKind;
  loop: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  nativeName?: Maybe<Scalars['String']['output']>;
  /**
   * Capabilities every target device must support for this effect to apply
   * cleanly. Derived from the union of clip kinds across all tracks for
   * timeline effects; empty for native effects (the per-device native option
   * list owns that filtering). native_effect clips inside a timeline
   * contribute no capability either; their support is gated by the device's
   * effect cap value list.
   */
  requiredCapabilities: Array<Scalars['String']['output']>;
  tracks: Array<EffectTrack>;
  updatedAt: Scalars['DateTime']['output'];
};

/**
 * A single clip on a track. config is a JSON document whose shape is
 * determined by kind — the inner config struct directly, e.g.
 * {"mode":"rgb","rgb":{"r":244,"g":42,"b":23}} for a SET_COLOR clip in rgb
 * mode, {"mode":"temp","temp":{"mireds":370}} for the same kind in temp mode.
 * transitionMinMs and transitionMaxMs bound a uniform random pick of the
 * actual transition sampled per clip-execution; equal bounds collapse to a
 * deterministic value.
 */
export type EffectClip = {
  __typename?: 'EffectClip';
  config: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  kind: EffectClipKind;
  startMs: Scalars['Int']['output'];
  transitionMaxMs: Scalars['Int']['output'];
  transitionMinMs: Scalars['Int']['output'];
};

export type EffectClipInput = {
  config: Scalars['String']['input'];
  kind: EffectClipKind;
  startMs: Scalars['Int']['input'];
  transitionMaxMs: Scalars['Int']['input'];
  transitionMinMs: Scalars['Int']['input'];
};

export enum EffectClipKind {
  NativeEffect = 'NATIVE_EFFECT',
  SetBrightness = 'SET_BRIGHTNESS',
  /**
   * Sets the color of the target — either RGB or color temperature, distinguished
   * by the config's "mode" field ("rgb" or "temp"). Required device capability is
   * derived per-clip from the mode (color vs color_temp).
   */
  SetColor = 'SET_COLOR',
  SetOnOff = 'SET_ON_OFF'
}

export enum EffectKind {
  Native = 'NATIVE',
  Timeline = 'TIMELINE'
}

/**
 * Clip boundary marker emitted by the runner. active=true on enter,
 * active=false on exit. runId identifies the in-flight run instance.
 * stepIndex is the clip's ordinal in the iteration's flat sorted-by-startMs
 * event list.
 */
export type EffectStepEvent = {
  __typename?: 'EffectStepEvent';
  active: Scalars['Boolean']['output'];
  effectId: Scalars['ID']['output'];
  runId: Scalars['ID']['output'];
  stepIndex: Scalars['Int']['output'];
};

/**
 * A single track inside a timeline effect. Tracks fire in parallel; clips
 * within a track are mutually exclusive in time. name is a user-supplied
 * label shown in the editor; empty string is valid and rendered as a
 * placeholder ("Track {n}").
 */
export type EffectTrack = {
  __typename?: 'EffectTrack';
  clips: Array<EffectClip>;
  id: Scalars['ID']['output'];
  index: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type EffectTrackInput = {
  clips: Array<EffectClipInput>;
  name: Scalars['String']['input'];
};

/**
 * The floor plan drawn on the /map page: a centerline wall graph, the room faces
 * derived from it, and the devices and groups placed on it. World units are
 * meters. Saved as a whole — updateFloorplan replaces every list in one
 * transaction.
 */
export type Floorplan = {
  __typename?: 'Floorplan';
  doorBindings: Array<FloorplanDoorBinding>;
  furniture: Array<FloorplanFurniture>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  openings: Array<FloorplanOpening>;
  placements: Array<FloorplanPlacement>;
  rooms: Array<FloorplanRoom>;
  vertices: Array<FloorplanVertex>;
  walls: Array<FloorplanWall>;
};

/** Connects one door-role contact sensor to one architectural door. */
export type FloorplanDoorBinding = {
  __typename?: 'FloorplanDoorBinding';
  deviceId: Scalars['ID']['output'];
  hingeSide: FloorplanDoorHingeSide;
  openingId: Scalars['ID']['output'];
  swingSide: FloorplanDoorSwingSide;
};

export type FloorplanDoorBindingInput = {
  deviceId: Scalars['ID']['input'];
  hingeSide: FloorplanDoorHingeSide;
  openingId: Scalars['ID']['input'];
  swingSide: FloorplanDoorSwingSide;
};

export enum FloorplanDoorHingeSide {
  End = 'END',
  Start = 'START'
}

export enum FloorplanDoorSwingSide {
  Left = 'LEFT',
  Right = 'RIGHT'
}

/**
 * A piece standing on the plan: a bed, a sofa, a plain box. `x`/`y` is its centre
 * and `width`/`height` its unrotated footprint in meters, `rotation` degrees
 * clockwise. `kind` names a shape in the client's catalogue. An occluder blocks
 * light where it stands.
 */
export type FloorplanFurniture = {
  __typename?: 'FloorplanFurniture';
  height: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  kind: Scalars['String']['output'];
  occluder: Scalars['Boolean']['output'];
  rotation: Scalars['Float']['output'];
  width: Scalars['Float']['output'];
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
};

export type FloorplanFurnitureInput = {
  height: Scalars['Float']['input'];
  id: Scalars['ID']['input'];
  kind: Scalars['String']['input'];
  occluder: Scalars['Boolean']['input'];
  rotation: Scalars['Float']['input'];
  width: Scalars['Float']['input'];
  x: Scalars['Float']['input'];
  y: Scalars['Float']['input'];
};

/**
 * A gap cut out of a wall body. t is the gap's centre in the wall's own
 * parameterisation (0 at vertexA, 1 at vertexB); width is in meters, so
 * splitting a wall rescales t while width carries across untouched. Openings
 * leave the centerline graph alone, so the derived room faces are the same with
 * or without them.
 */
export type FloorplanOpening = {
  __typename?: 'FloorplanOpening';
  id: Scalars['ID']['output'];
  kind: FloorplanOpeningKind;
  t: Scalars['Float']['output'];
  wallId: Scalars['ID']['output'];
  width: Scalars['Float']['output'];
};

export type FloorplanOpeningInput = {
  id: Scalars['ID']['input'];
  kind: FloorplanOpeningKind;
  t: Scalars['Float']['input'];
  wallId: Scalars['ID']['input'];
  width: Scalars['Float']['input'];
};

/**
 * What a gap in a wall represents. Daylight reaches a room through WINDOW
 * openings; DOOR and OPENING are bare gaps in the wall body.
 */
export enum FloorplanOpeningKind {
  Door = 'DOOR',
  Opening = 'OPENING',
  Window = 'WINDOW'
}

/**
 * Pins a target ref to a point on the plan. memberType is "device" or "group",
 * and each ref appears at most once on the map. Which devices belong to a room or
 * a group stays in membership — a placement is coordinates only.
 */
export type FloorplanPlacement = {
  __typename?: 'FloorplanPlacement';
  memberId: Scalars['ID']['output'];
  memberType: Scalars['String']['output'];
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
};

export type FloorplanPlacementInput = {
  memberId: Scalars['ID']['input'];
  memberType: Scalars['String']['input'];
  x: Scalars['Float']['input'];
  y: Scalars['Float']['input'];
};

/**
 * A derived face of the wall graph. name is the user's label (null when
 * anonymous); roomId links the face to a Hive room (null when unlinked, at most
 * one face per room). vertexIds holds the face's vertex ids in canonical
 * rotation so the face keeps its identity across edits.
 */
export type FloorplanRoom = {
  __typename?: 'FloorplanRoom';
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  roomId?: Maybe<Scalars['ID']['output']>;
  vertexIds: Array<Scalars['ID']['output']>;
};

export type FloorplanRoomInput = {
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  roomId?: InputMaybe<Scalars['ID']['input']>;
  vertexIds: Array<Scalars['ID']['input']>;
};

export type FloorplanVertex = {
  __typename?: 'FloorplanVertex';
  id: Scalars['ID']['output'];
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
};

export type FloorplanVertexInput = {
  id: Scalars['ID']['input'];
  x: Scalars['Float']['input'];
  y: Scalars['Float']['input'];
};

/**
 * A wall between two vertices of the plan graph. curveX/curveY, when set, are
 * the control point of a quadratic bezier; null means the wall is straight.
 */
export type FloorplanWall = {
  __typename?: 'FloorplanWall';
  curveX?: Maybe<Scalars['Float']['output']>;
  curveY?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  thickness: Scalars['Float']['output'];
  vertexA: Scalars['ID']['output'];
  vertexB: Scalars['ID']['output'];
};

export type FloorplanWallInput = {
  curveX?: InputMaybe<Scalars['Float']['input']>;
  curveY?: InputMaybe<Scalars['Float']['input']>;
  id: Scalars['ID']['input'];
  thickness: Scalars['Float']['input'];
  vertexA: Scalars['ID']['input'];
  vertexB: Scalars['ID']['input'];
};

export type Group = {
  __typename?: 'Group';
  createdBy?: Maybe<User>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  members: Array<GroupMember>;
  name: Scalars['String']['output'];
  resolvedDevices: Array<Device>;
  tags: Array<GroupTag>;
};

export type GroupMember = {
  __typename?: 'GroupMember';
  device?: Maybe<Device>;
  group?: Maybe<Group>;
  id: Scalars['ID']['output'];
  memberId: Scalars['ID']['output'];
  memberType: Scalars['String']['output'];
  room?: Maybe<Room>;
};

/**
 * GroupTag classifies a group by the role it represents on the dashboard.
 * A group can carry zero, one, or both tags. Tags drive the auto-generated
 * dashboard: a LIGHT-tagged group containing multiple bulbs renders as a
 * single virtual light card.
 */
export enum GroupTag {
  Light = 'LIGHT',
  Sensor = 'SENSOR'
}

export type Integration = {
  __typename?: 'Integration';
  configured: Scalars['Boolean']['output'];
  connected: Scalars['Boolean']['output'];
  deviceCount: Scalars['Int']['output'];
  enabled: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  provider: Scalars['String']['output'];
};

export type LogEntry = {
  __typename?: 'LogEntry';
  attrs: Scalars['String']['output'];
  level: Scalars['String']['output'];
  message: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type LoginInput = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * Adds a member and returns the whole group, so a caller holding the group
   * can apply the result without recomputing `resolvedDevices` itself.
   */
  addGroupMember: Group;
  /**
   * Adds a member and returns the whole room, so a caller holding the room
   * can apply the result without recomputing `resolvedDevices` itself.
   */
  addRoomMember: Room;
  applyScene: Scene;
  batchAddGroupDevices: Group;
  batchAddRoomMembers: Room;
  batchDeleteAlarms: Scalars['Int']['output'];
  batchDeleteAutomations: Scalars['Int']['output'];
  batchDeleteGroups: Scalars['Int']['output'];
  batchDeleteRooms: Scalars['Int']['output'];
  batchDeleteScenes: Scalars['Int']['output'];
  /**
   * Deletes the specified users. The currently authenticated user is silently
   * skipped if present in the list. Returns the number of users actually deleted.
   */
  batchDeleteUsers: Scalars['Int']['output'];
  changePassword: Scalars['Boolean']['output'];
  /**
   * Completes the forced first-login password change. Only callable while the
   * caller's `mustChangePassword` flag is set; the AuthDirective allowlists this
   * field for users in the forced-change state. Sets the new password hash and
   * clears the flag in one statement. Returns false if the caller was not in the
   * forced-change state.
   */
  completeFirstPasswordChange: Scalars['Boolean']['output'];
  createAutomation: AutomationGraph;
  createEffect: Effect;
  createGroup: Group;
  createInitialUser: AuthPayload;
  createRoom: Room;
  createScene: Scene;
  createUser: User;
  deleteAlarm: Scalars['Boolean']['output'];
  deleteAutomation: Scalars['Boolean']['output'];
  deleteEffect: Scalars['Boolean']['output'];
  deleteGroup: Scalars['Boolean']['output'];
  deleteIntegration: Scalars['Int']['output'];
  deleteRoom: Scalars['Boolean']['output'];
  deleteScene: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  /**
   * Fires a manual trigger node immediately. The automation must be enabled and
   * the node must be a trigger with mode=manual. Bypasses the automation's
   * cooldown. Intended for debugging automations from the editor.
   */
  fireAutomationTrigger: Scalars['Boolean']['output'];
  /**
   * Invalidates every JWT issued for the given user by bumping their
   * token_version. When userId is null the caller's own tokens are
   * invalidated, which logs them out of every device — useful when a session
   * may have been compromised. The current request still completes; the
   * next API call from any device (including this one) returns
   * UNAUTHENTICATED and forces a fresh login.
   */
  forceLogoutAllSessions: Scalars['Boolean']['output'];
  login: AuthPayload;
  /**
   * Clears the new-device flag for the given devices and returns how many rows
   * changed. The device list calls this with everything it renders.
   */
  markDevicesSeen: Scalars['Int']['output'];
  raiseAlarm: Alarm;
  /** Removes a member by membership id and returns the group it belonged to. */
  removeGroupMember: Group;
  /** Removes a member by membership id and returns the room it belonged to. */
  removeRoomMember: Room;
  resetUserPassword: Scalars['Boolean']['output'];
  /**
   * Starts effectId on the given target. Preempts any effect already
   * running on the target. Returns the resulting active-run row.
   */
  runEffect: ActiveEffect;
  /**
   * Starts a native effect by name on the given target without requiring a
   * stored Effect row. Preempts any effect already running on the target.
   * Native ad-hoc runs are fire-and-forget: no active_effects row is
   * persisted, so Query.activeEffects will not list them. The returned
   * ActiveEffect synthesises a transient view of the run.
   */
  runNativeEffect: ActiveEffect;
  /**
   * Requests a Zigbee topology scan. Returns immediately; the scan walks every
   * router on the mesh, takes minutes, and slows the network while it runs.
   * Completion is announced on the networkTopologyUpdated subscription.
   */
  scanZigbee2MqttNetwork: Scalars['Boolean']['output'];
  setDeviceConfiguration: Scalars['Boolean']['output'];
  setDeviceState: Device;
  /**
   * Simulate a device-fired action by publishing a synthetic
   * EventDeviceActionFired on the in-process event bus. Automations listening
   * for the action run as if the physical device emitted it; no command is
   * sent to the device itself. Useful for testing automations from the UI.
   */
  simulateDeviceAction: Scalars['Boolean']['output'];
  /**
   * Stops any effect currently running on the target. Returns true when a
   * run was active, false otherwise.
   */
  stopEffect: Scalars['Boolean']['output'];
  syncTuyaDevices: Array<Device>;
  testTuyaConnection: ConnectionTestResult;
  testZigbee2MqttConnection: ConnectionTestResult;
  toggleAutomation: AutomationGraph;
  updateAutomation: AutomationGraph;
  updateCurrentUser: User;
  updateDevice: Device;
  updateEffect: Effect;
  /**
   * Upserts the floorplan row and replaces its vertices, walls, rooms, and
   * placements with the input's sets in one transaction. Returns the saved plan.
   */
  updateFloorplan: Floorplan;
  updateGroup: Group;
  updateRoom: Room;
  updateScene: Scene;
  updateSetting: Setting;
  updateTuyaConfig: TuyaConfig;
  updateZigbee2MqttConfig: Zigbee2MqttConfig;
};


export type MutationAddGroupMemberArgs = {
  input: AddGroupMemberInput;
};


export type MutationAddRoomMemberArgs = {
  input: AddRoomMemberInput;
};


export type MutationApplySceneArgs = {
  sceneId: Scalars['ID']['input'];
};


export type MutationBatchAddGroupDevicesArgs = {
  deviceIds: Array<Scalars['ID']['input']>;
  groupId: Scalars['ID']['input'];
};


export type MutationBatchAddRoomMembersArgs = {
  members: Array<RoomMemberInput>;
  roomId: Scalars['ID']['input'];
};


export type MutationBatchDeleteAlarmsArgs = {
  alarmIds: Array<Scalars['ID']['input']>;
};


export type MutationBatchDeleteAutomationsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationBatchDeleteGroupsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationBatchDeleteRoomsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationBatchDeleteScenesArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationBatchDeleteUsersArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
};


export type MutationCompleteFirstPasswordChangeArgs = {
  newPassword: Scalars['String']['input'];
};


export type MutationCreateAutomationArgs = {
  input: CreateAutomationInput;
};


export type MutationCreateEffectArgs = {
  input: CreateEffectInput;
};


export type MutationCreateGroupArgs = {
  input: CreateGroupInput;
};


export type MutationCreateInitialUserArgs = {
  input: CreateInitialUserInput;
};


export type MutationCreateRoomArgs = {
  input: CreateRoomInput;
};


export type MutationCreateSceneArgs = {
  input: CreateSceneInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationDeleteAlarmArgs = {
  alarmId: Scalars['ID']['input'];
};


export type MutationDeleteAutomationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEffectArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteGroupArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteIntegrationArgs = {
  provider: Scalars['String']['input'];
};


export type MutationDeleteRoomArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSceneArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationFireAutomationTriggerArgs = {
  automationId: Scalars['ID']['input'];
  nodeId: Scalars['ID']['input'];
};


export type MutationForceLogoutAllSessionsArgs = {
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationMarkDevicesSeenArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationRaiseAlarmArgs = {
  input: RaiseAlarmInput;
};


export type MutationRemoveGroupMemberArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveRoomMemberArgs = {
  id: Scalars['ID']['input'];
};


export type MutationResetUserPasswordArgs = {
  id: Scalars['ID']['input'];
  newPassword: Scalars['String']['input'];
};


export type MutationRunEffectArgs = {
  effectId: Scalars['ID']['input'];
  targetId: Scalars['ID']['input'];
  targetType: Scalars['String']['input'];
};


export type MutationRunNativeEffectArgs = {
  nativeName: Scalars['String']['input'];
  targetId: Scalars['ID']['input'];
  targetType: Scalars['String']['input'];
};


export type MutationSetDeviceConfigurationArgs = {
  deviceId: Scalars['ID']['input'];
  settings: Array<DeviceConfigurationEntryInput>;
};


export type MutationSetDeviceStateArgs = {
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
};


export type MutationSimulateDeviceActionArgs = {
  action: Scalars['String']['input'];
  deviceId: Scalars['ID']['input'];
};


export type MutationStopEffectArgs = {
  targetId: Scalars['ID']['input'];
  targetType: Scalars['String']['input'];
};


export type MutationTestTuyaConnectionArgs = {
  input: TuyaConfigInput;
};


export type MutationTestZigbee2MqttConnectionArgs = {
  input: Zigbee2MqttConfigInput;
};


export type MutationToggleAutomationArgs = {
  enabled: Scalars['Boolean']['input'];
  id: Scalars['ID']['input'];
};


export type MutationUpdateAutomationArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAutomationInput;
};


export type MutationUpdateCurrentUserArgs = {
  input: UpdateCurrentUserInput;
};


export type MutationUpdateDeviceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
};


export type MutationUpdateEffectArgs = {
  input: UpdateEffectInput;
};


export type MutationUpdateFloorplanArgs = {
  input: UpdateFloorplanInput;
};


export type MutationUpdateGroupArgs = {
  id: Scalars['ID']['input'];
  input: UpdateGroupInput;
};


export type MutationUpdateRoomArgs = {
  id: Scalars['ID']['input'];
  input: UpdateRoomInput;
};


export type MutationUpdateSceneArgs = {
  id: Scalars['ID']['input'];
  input: UpdateSceneInput;
};


export type MutationUpdateSettingArgs = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};


export type MutationUpdateTuyaConfigArgs = {
  input: TuyaConfigInput;
};


export type MutationUpdateZigbee2MqttConfigArgs = {
  input: Zigbee2MqttConfigInput;
};

/**
 * A native effect option as offered by the editor. supportedDeviceCount is
 * the number of currently-known devices whose effect capability advertises
 * this value.
 */
export type NativeEffectOption = {
  __typename?: 'NativeEffectOption';
  displayName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  supportedDeviceCount: Scalars['Int']['output'];
};

/**
 * One integration provider's mesh snapshot: what its latest network scan
 * reported, at the time it reported it.
 */
export type NetworkTopology = {
  __typename?: 'NetworkTopology';
  links: Array<TopologyLink>;
  nodes: Array<TopologyNode>;
  provider: Scalars['String']['output'];
  scannedAt: Scalars['DateTime']['output'];
};

/** Announces that a provider's stored topology snapshot changed. */
export type NetworkTopologyEvent = {
  __typename?: 'NetworkTopologyEvent';
  linkCount: Scalars['Int']['output'];
  nodeCount: Scalars['Int']['output'];
  provider: Scalars['String']['output'];
  scannedAt: Scalars['DateTime']['output'];
};

export type NumericSeriesPoint = {
  __typename?: 'NumericSeriesPoint';
  at: Scalars['DateTime']['output'];
  value: Scalars['Float']['output'];
};

export type Query = {
  __typename?: 'Query';
  activeEffects: Array<ActiveEffect>;
  activity: Array<ActivityEvent>;
  aggregatedStateHistory: Array<AggregatedSeries>;
  alarms: Array<Alarm>;
  automation?: Maybe<AutomationGraph>;
  automations: Array<AutomationGraph>;
  device?: Maybe<Device>;
  devices: Array<Device>;
  effect?: Maybe<Effect>;
  effects: Array<Effect>;
  /** The floor plan. Null until the first save. */
  floorplan?: Maybe<Floorplan>;
  group?: Maybe<Group>;
  groups: Array<Group>;
  integrations: Array<Integration>;
  logs: Array<LogEntry>;
  me?: Maybe<User>;
  nativeEffectOptions: Array<NativeEffectOption>;
  /** Every provider's stored mesh snapshot. Empty until a scan completes. */
  networkTopologies: Array<NetworkTopology>;
  room?: Maybe<Room>;
  rooms: Array<Room>;
  scene?: Maybe<Scene>;
  scenes: Array<Scene>;
  settings: Array<Setting>;
  setupStatus: SetupStatus;
  stateHistory: Array<StateSeries>;
  stateHistoryFields: Array<Scalars['String']['output']>;
  tuyaConfig?: Maybe<TuyaConfig>;
  users: Array<User>;
  zigbee2MqttConfig?: Maybe<Zigbee2MqttConfig>;
};


export type QueryActivityArgs = {
  filter?: InputMaybe<ActivityFilter>;
};


export type QueryAggregatedStateHistoryArgs = {
  filter: AggregatedStateHistoryFilter;
};


export type QueryAlarmsArgs = {
  filter?: InputMaybe<AlarmFilter>;
};


export type QueryAutomationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDeviceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEffectArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGroupArgs = {
  id: Scalars['ID']['input'];
};


export type QueryLogsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRoomArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySceneArgs = {
  id: Scalars['ID']['input'];
};


export type QueryStateHistoryArgs = {
  filter: StateHistoryFilter;
};

export type RaiseAlarmInput = {
  alarmId: Scalars['ID']['input'];
  kind: AlarmKind;
  message: Scalars['String']['input'];
  severity: AlarmSeverity;
  source?: InputMaybe<Scalars['String']['input']>;
};

export type Room = {
  __typename?: 'Room';
  createdBy?: Maybe<User>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  members: Array<RoomMember>;
  name: Scalars['String']['output'];
  resolvedDevices: Array<Device>;
};

export type RoomMember = {
  __typename?: 'RoomMember';
  device?: Maybe<Device>;
  group?: Maybe<Group>;
  id: Scalars['ID']['output'];
  memberId: Scalars['ID']['output'];
  memberType: Scalars['String']['output'];
};

export type RoomMemberInput = {
  memberId: Scalars['ID']['input'];
  memberType: Scalars['String']['input'];
};

export type Scene = {
  __typename?: 'Scene';
  actions: Array<SceneAction>;
  /**
   * Non-null while this scene is currently the state of its devices: every
   * device the scene reached at apply time is still in the scene-relevant
   * state the scene asked for. Any change to a scene-relevant field (on,
   * brightness, colorTemp, color) on any of those devices clears this back
   * to null. Use the presence of a value as "is this scene active right now".
   */
  activatedAt?: Maybe<Scalars['DateTime']['output']>;
  createdBy?: Maybe<User>;
  /**
   * Per-device payload overrides the user has saved explicitly. Devices that
   * inherit their room/group default do NOT appear here. Use this for the
   * scene editor's override rows; use effectivePayloads for display tint.
   */
  devicePayloads: Array<SceneDevicePayload>;
  /**
   * One payload per unique device reached by the scene's action targets
   * (rooms, groups, or direct devices), in the same order apply-scene would
   * command them. Devices without an explicit override appear with a
   * capability-filtered default (warm-white on), so consumers can tint cards,
   * preview apply behaviour, etc. without re-implementing the resolution.
   */
  effectivePayloads: Array<SceneDevicePayload>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  /**
   * Rooms this scene is present in, derived from device overlap. A scene
   * appears in a room iff the set of devices its actions resolve to shares
   * at least one device with the room's resolved devices. Drives the
   * per-room dashboard drawer's scene list — no explicit tagging, no
   * separate config.
   */
  rooms: Array<Room>;
};

export type SceneAction = {
  __typename?: 'SceneAction';
  /** Populated when targetType is "expression"; empty for direct targets. */
  expression: Array<TargetClause>;
  /** Optional user label for an expression (Selector) target; empty otherwise. */
  name: Scalars['String']['output'];
  /** Null when targetType is "expression"; otherwise the direct device/group/room. */
  target?: Maybe<SceneTarget>;
  targetId: Scalars['ID']['output'];
  targetType: Scalars['String']['output'];
};

export type SceneActionInput = {
  expression?: InputMaybe<Array<TargetClauseInput>>;
  name?: InputMaybe<Scalars['String']['input']>;
  targetId: Scalars['ID']['input'];
  targetType: Scalars['String']['input'];
};

/**
 * Emitted whenever a scene's activation state flips. activatedAt is non-null
 * when the scene just became active, null when it was deactivated by a
 * device-state change.
 */
export type SceneActiveEvent = {
  __typename?: 'SceneActiveEvent';
  activatedAt?: Maybe<Scalars['DateTime']['output']>;
  sceneId: Scalars['ID']['output'];
};

export type SceneDevicePayload = {
  __typename?: 'SceneDevicePayload';
  deviceId: Scalars['ID']['output'];
  payload: Scalars['String']['output'];
};

/**
 * SceneDevicePayloadInput is one entry in a scene's per-device payload list.
 * The payload field is a JSON string carrying a tagged-union body. Three shapes
 * are supported:
 *
 *   static:        {"kind":"static","on":true,"brightness":200,"colorTemp":370}
 *   effect:        {"kind":"effect","effect_id":"<id>"}
 *   native_effect: {"kind":"native_effect","native_name":"<name>"}
 *
 * The static shape's optional desired-state fields (on, brightness, colorTemp,
 * color, transition) are filtered against the device's writable capabilities at
 * apply time. The effect shape starts the named stored timeline/native effect
 * run on this device when the scene is applied. The native_effect shape starts
 * an auto-discovered native effect (one whose name appears in
 * nativeEffectOptions) on this device. Deactivating the scene stops any runs
 * started for either effect shape.
 */
export type SceneDevicePayloadInput = {
  deviceId: Scalars['ID']['input'];
  payload: Scalars['String']['input'];
};

export type SceneTarget = Device | Group | Room;

export type Setting = {
  __typename?: 'Setting';
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type SetupStatus = {
  __typename?: 'SetupStatus';
  hasInitialUser: Scalars['Boolean']['output'];
};

export type StateHistoryFilter = {
  bucketSeconds?: InputMaybe<Scalars['Int']['input']>;
  deviceIds: Array<Scalars['ID']['input']>;
  fields?: InputMaybe<Array<Scalars['String']['input']>>;
  from?: InputMaybe<Scalars['DateTime']['input']>;
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

export type StateSeries = {
  __typename?: 'StateSeries';
  deviceId: Scalars['ID']['output'];
  field: Scalars['String']['output'];
  points: Array<StateSeriesPoint>;
  valueType: StateSeriesValueType;
};

export type StateSeriesPoint = {
  __typename?: 'StateSeriesPoint';
  at: Scalars['DateTime']['output'];
  booleanValue?: Maybe<Scalars['Boolean']['output']>;
  numberValue?: Maybe<Scalars['Float']['output']>;
  textValue?: Maybe<Scalars['String']['output']>;
};

export enum StateSeriesValueType {
  Boolean = 'BOOLEAN',
  Number = 'NUMBER',
  Text = 'TEXT'
}

export type Subscription = {
  __typename?: 'Subscription';
  activityStream: ActivityEvent;
  alarmEvent: AlarmEvent;
  automationNodeActivated: AutomationNodeActivationEvent;
  deviceActionFired: DeviceActionEvent;
  deviceAdded: Device;
  deviceAvailabilityChanged: DeviceAvailabilityEvent;
  deviceConfigurationChanged: DeviceConfigurationEvent;
  deviceRemoved: Scalars['ID']['output'];
  deviceStateChanged: DeviceStateEvent;
  /**
   * Fires when a device's user-owned metadata changes — name override, icon,
   * roles, display colour, disabled — carrying the full updated device. This is
   * what keeps a second open tab's rename in step without a reload.
   */
  deviceUpdated: Device;
  /**
   * Step-boundary events from the effect runner. When runId is provided,
   * only events for that run are delivered; otherwise every effect run's
   * step boundaries are broadcast.
   */
  effectStepActivated: EffectStepEvent;
  logStream: LogEntry;
  /**
   * Fires after a merged topology snapshot is persisted, so a consumer that
   * re-queries on it always reads the new snapshot. When provider is given,
   * only that provider's updates are delivered.
   */
  networkTopologyUpdated: NetworkTopologyEvent;
  sceneActiveChanged: SceneActiveEvent;
};


export type SubscriptionActivityStreamArgs = {
  advanced?: InputMaybe<Scalars['Boolean']['input']>;
};


export type SubscriptionAutomationNodeActivatedArgs = {
  automationId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionDeviceActionFiredArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionDeviceConfigurationChangedArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionDeviceStateChangedArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionEffectStepActivatedArgs = {
  runId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionNetworkTopologyUpdatedArgs = {
  provider?: InputMaybe<Scalars['String']['input']>;
};

/**
 * A single rule in a target expression. connector is null on the first clause and
 * "and"/"or" on subsequent clauses (evaluated left-to-right). subject is one of
 * room/group/device/device_type/device_role; op is is/is_one_of/is_not/is_not_one_of.
 */
export type TargetClause = {
  __typename?: 'TargetClause';
  connector?: Maybe<Scalars['String']['output']>;
  op: Scalars['String']['output'];
  subject: Scalars['String']['output'];
  values: Array<Scalars['String']['output']>;
};

export type TargetClauseInput = {
  connector?: InputMaybe<Scalars['String']['input']>;
  op: Scalars['String']['input'];
  subject: Scalars['String']['input'];
  values: Array<Scalars['String']['input']>;
};

export enum TemperatureUnit {
  Celsius = 'CELSIUS',
  Fahrenheit = 'FAHRENHEIT'
}

export enum Theme {
  Dark = 'DARK',
  Light = 'LIGHT'
}

export enum TimeFormat {
  TwelveHour = 'TWELVE_HOUR',
  TwentyFourHour = 'TWENTY_FOUR_HOUR'
}

/**
 * One undirected edge in a mesh snapshot. Kinds: "parent" joins a leaf to the
 * node that speaks for it (source is the child), "route" is a relay's active
 * uplink toward the hub, "neighbour" records radio contact with no claim that
 * traffic flows there. A stale link was carried forward from an earlier scan
 * because the node slept through the latest one; observedAt is when it was
 * actually seen.
 */
export type TopologyLink = {
  __typename?: 'TopologyLink';
  kind: Scalars['String']['output'];
  observedAt: Scalars['DateTime']['output'];
  quality: Scalars['Float']['output'];
  rawQuality: Scalars['Int']['output'];
  source: Scalars['ID']['output'];
  stale: Scalars['Boolean']['output'];
  target: Scalars['ID']['output'];
};

/**
 * One device in a mesh snapshot. `id` is the node's provider-scoped identity;
 * `deviceId` is set when the node is a registered Hive device. Roles: "hub" is
 * the network's point of entry, "relay" forwards traffic for others, "leaf"
 * speaks only for itself.
 */
export type TopologyNode = {
  __typename?: 'TopologyNode';
  deviceId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  role: Scalars['String']['output'];
};

export type TuyaConfig = {
  __typename?: 'TuyaConfig';
  accessId: Scalars['String']['output'];
  accessSecret: Scalars['String']['output'];
  enabled: Scalars['Boolean']['output'];
  region: Scalars['String']['output'];
};

export type TuyaConfigInput = {
  accessId: Scalars['String']['input'];
  accessSecret: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  region: Scalars['String']['input'];
};

export type UpdateAutomationInput = {
  edges?: InputMaybe<Array<AutomationEdgeInput>>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  nodes?: InputMaybe<Array<AutomationNodeInput>>;
};

export type UpdateCurrentUserInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  temperatureUnit?: InputMaybe<TemperatureUnit>;
  theme?: InputMaybe<Theme>;
  timeFormat?: InputMaybe<TimeFormat>;
};

export type UpdateDeviceInput = {
  disabled?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Sets the floor-plan display brightness (0-254). Pass null to clear it and
   * show the device at full strength. Omit the field to leave it alone.
   */
  displayBrightness?: InputMaybe<Scalars['Int']['input']>;
  /**
   * Sets the floor-plan display colour (`#rrggbb`). Pass null to clear it and
   * fall back to the map's default. Omit the field to leave it alone.
   */
  displayColor?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  /**
   * Sets the name override. Pass null to clear it and fall back to the
   * integration's name. Omit the field to leave it alone.
   */
  name?: InputMaybe<Scalars['String']['input']>;
  roles?: InputMaybe<UpdateDeviceRolesInput>;
};

export type UpdateDeviceRolesInput = {
  contact?: InputMaybe<ContactRole>;
  controlledLoad?: InputMaybe<ControlledLoadRole>;
};

export type UpdateEffectInput = {
  durationMs?: InputMaybe<Scalars['Int']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  loop?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  nativeName?: InputMaybe<Scalars['String']['input']>;
  tracks?: InputMaybe<Array<EffectTrackInput>>;
};

/**
 * The whole plan in one input: the client sends every vertex, wall, opening,
 * room, and placement it wants persisted, and the server replaces the stored plan
 * with exactly this set. Ids are client-generated and stable across saves.
 */
export type UpdateFloorplanInput = {
  doorBindings: Array<FloorplanDoorBindingInput>;
  furniture: Array<FloorplanFurnitureInput>;
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  openings: Array<FloorplanOpeningInput>;
  placements: Array<FloorplanPlacementInput>;
  rooms: Array<FloorplanRoomInput>;
  vertices: Array<FloorplanVertexInput>;
  walls: Array<FloorplanWallInput>;
};

export type UpdateGroupInput = {
  icon?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<GroupTag>>;
};

export type UpdateRoomInput = {
  icon?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSceneInput = {
  actions?: InputMaybe<Array<SceneActionInput>>;
  devicePayloads?: InputMaybe<Array<SceneDevicePayloadInput>>;
  icon?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  /**
   * Avatar filename on the server, relative to the avatars endpoint. Null when
   * no avatar has been uploaded; clients fall back to rendered initials. Resolve
   * to a URL by prefixing with `/avatars/`.
   */
  avatarPath?: Maybe<Scalars['String']['output']>;
  /**
   * Timestamp the user was created; used on the profile page as "member since".
   * Present on full user loads, null on attribution references.
   */
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  /**
   * When true, the user must change their password before any other authenticated
   * operation will succeed. Set automatically when an admin creates a user or
   * resets their password; cleared when the user completes the forced-change
   * flow. Present on full user loads (`me`, `users`, `AuthPayload.user`); null
   * on attribution references.
   */
  mustChangePassword?: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  /**
   * Temperature unit applied at render time across sensor cards, dashboard
   * aggregates, and the state-history chart. Backend always stores Celsius;
   * conversion is purely a frontend concern. Present on full user loads, null
   * on attribution references.
   */
  temperatureUnit?: Maybe<TemperatureUnit>;
  /**
   * UI theme preference stored per user. Present on full user loads (`me`,
   * `users`). Null on attribution references (e.g. `scene.createdBy`), which
   * only populate `id`, `username`, and `name`.
   */
  theme?: Maybe<Theme>;
  /**
   * Clock format used everywhere absolute timestamps render (chart tooltips,
   * activity feed fallbacks, logs page). Date portion is fixed `YYYY-MM-DD`.
   * Present on full user loads, null on attribution references.
   */
  timeFormat?: Maybe<TimeFormat>;
  username: Scalars['String']['output'];
};

export type Zigbee2MqttConfig = {
  __typename?: 'Zigbee2MqttConfig';
  broker: Scalars['String']['output'];
  enabled: Scalars['Boolean']['output'];
  password: Scalars['String']['output'];
  /**
   * Daily scan time. Kept while the schedule is off so re-enabling restores the
   * chosen time; null means never set.
   */
  scanHour?: Maybe<Scalars['Int']['output']>;
  scanMinute?: Maybe<Scalars['Int']['output']>;
  /** Whether a topology scan runs automatically every day at scanHour:scanMinute. */
  scanScheduleEnabled: Scalars['Boolean']['output'];
  /**
   * When the in-flight topology scan was requested, null when none is running.
   * The scan reports nothing until it finishes, so elapsed time is the only
   * honest progress there is.
   */
  scanStartedAt?: Maybe<Scalars['DateTime']['output']>;
  useWss: Scalars['Boolean']['output'];
  username: Scalars['String']['output'];
};

export type Zigbee2MqttConfigInput = {
  broker: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  password: Scalars['String']['input'];
  /**
   * Daily scan time. Null while the schedule is disabled keeps the stored time,
   * so switching the schedule off never erases it.
   */
  scanHour?: InputMaybe<Scalars['Int']['input']>;
  scanMinute?: InputMaybe<Scalars['Int']['input']>;
  /** Enabling requires scanHour and scanMinute to be set. */
  scanScheduleEnabled: Scalars['Boolean']['input'];
  useWss: Scalars['Boolean']['input'];
  username: Scalars['String']['input'];
};

export type E2EAutomationsDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EAutomationsDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name?: string | null, friendlyName: string, type: string }> };

export type E2ECreateAutomationMutationVariables = Exact<{
  input: CreateAutomationInput;
}>;


export type E2ECreateAutomationMutation = { __typename?: 'Mutation', createAutomation: { __typename?: 'AutomationGraph', id: string, name: string, enabled: boolean, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }> } };

export type E2EAutomationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EAutomationQuery = { __typename?: 'Query', automation?: { __typename?: 'AutomationGraph', id: string, name: string, enabled: boolean, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }> } | null };

export type E2EAutomationsQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EAutomationsQuery = { __typename?: 'Query', automations: Array<{ __typename?: 'AutomationGraph', id: string, name: string, enabled: boolean }> };

export type E2EUpdateAutomationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAutomationInput;
}>;


export type E2EUpdateAutomationMutation = { __typename?: 'Mutation', updateAutomation: { __typename?: 'AutomationGraph', id: string, name: string, enabled: boolean, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }> } };

export type E2EToggleAutomationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  enabled: Scalars['Boolean']['input'];
}>;


export type E2EToggleAutomationMutation = { __typename?: 'Mutation', toggleAutomation: { __typename?: 'AutomationGraph', id: string, enabled: boolean } };

export type E2EDeleteAutomationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EDeleteAutomationMutation = { __typename?: 'Mutation', deleteAutomation: boolean };

export type E2EAutomationsCreateGroupMutationVariables = Exact<{
  input: CreateGroupInput;
}>;


export type E2EAutomationsCreateGroupMutation = { __typename?: 'Mutation', createGroup: { __typename?: 'Group', id: string, name: string } };

export type E2EAutomationsAddGroupMemberMutationVariables = Exact<{
  input: AddGroupMemberInput;
}>;


export type E2EAutomationsAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'Group', id: string } };

export type E2EAutomationsDeleteGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EAutomationsDeleteGroupMutation = { __typename?: 'Mutation', deleteGroup: boolean };

export type E2EDevicesListQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EDevicesListQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name?: string | null, friendlyName: string, source: string, type: string, available: boolean, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, temperature?: number | null, humidity?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null } | null }> };

export type E2EDeviceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EDeviceQuery = { __typename?: 'Query', device?: { __typename?: 'Device', id: string, name?: string | null, friendlyName: string, source: string, type: string, available: boolean, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, temperature?: number | null, humidity?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null } | null } | null };

export type E2ESetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type E2ESetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string, name?: string | null, type: string, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null } | null } };

export type E2EUpdateDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
}>;


export type E2EUpdateDeviceMutation = { __typename?: 'Mutation', updateDevice: { __typename?: 'Device', id: string, name?: string | null } };

export type E2EDevicesDeviceStateChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type E2EDevicesDeviceStateChangedSubscription = { __typename?: 'Subscription', deviceStateChanged: { __typename?: 'DeviceStateEvent', deviceId: string, state: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null } } };

export type E2EErrorsSceneQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EErrorsSceneQuery = { __typename?: 'Query', scene?: { __typename?: 'Scene', id: string, name: string } | null };

export type E2EErrorsAutomationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EErrorsAutomationQuery = { __typename?: 'Query', automation?: { __typename?: 'AutomationGraph', id: string, name: string } | null };

export type E2EErrorsAddGroupMemberMutationVariables = Exact<{
  input: AddGroupMemberInput;
}>;


export type E2EErrorsAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'Group', id: string } };

export type E2EErrorsDeleteSceneMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EErrorsDeleteSceneMutation = { __typename?: 'Mutation', deleteScene: boolean };

export type E2EErrorsCreateGroupMutationVariables = Exact<{
  input: CreateGroupInput;
}>;


export type E2EErrorsCreateGroupMutation = { __typename?: 'Mutation', createGroup: { __typename?: 'Group', id: string } };

export type E2EErrorsDeleteGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EErrorsDeleteGroupMutation = { __typename?: 'Mutation', deleteGroup: boolean };

export type E2ECreateGroupMutationVariables = Exact<{
  input: CreateGroupInput;
}>;


export type E2ECreateGroupMutation = { __typename?: 'Mutation', createGroup: { __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name?: string | null }> } };

export type E2EAddGroupMemberMutationVariables = Exact<{
  input: AddGroupMemberInput;
}>;


export type E2EAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'Group', id: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string, device?: { __typename?: 'Device', id: string, name?: string | null } | null }> } };

export type E2EGroupQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EGroupQuery = { __typename?: 'Query', group?: { __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name?: string | null }> } | null };

export type E2EDeleteGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EDeleteGroupMutation = { __typename?: 'Mutation', deleteGroup: boolean };

export type E2EGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name?: string | null }> }> };

export type E2EUpdateGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateGroupInput;
}>;


export type E2EUpdateGroupMutation = { __typename?: 'Mutation', updateGroup: { __typename?: 'Group', id: string, name: string } };

export type E2ERemoveGroupMemberMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2ERemoveGroupMemberMutation = { __typename?: 'Mutation', removeGroupMember: { __typename?: 'Group', id: string, members: Array<{ __typename?: 'GroupMember', id: string }> } };

export type E2EGroupsDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EGroupsDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name?: string | null }> };

export type E2EScenesDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EScenesDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name?: string | null, type: string }> };

export type E2ECreateSceneMutationVariables = Exact<{
  input: CreateSceneInput;
}>;


export type E2ECreateSceneMutation = { __typename?: 'Mutation', createScene: { __typename?: 'Scene', id: string, name: string, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }> } };

export type E2EApplySceneMutationVariables = Exact<{
  sceneId: Scalars['ID']['input'];
}>;


export type E2EApplySceneMutation = { __typename?: 'Mutation', applyScene: { __typename?: 'Scene', id: string, name: string } };

export type E2ESceneQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2ESceneQuery = { __typename?: 'Query', scene?: { __typename?: 'Scene', id: string, name: string, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }> } | null };

export type E2EDeleteSceneMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EDeleteSceneMutation = { __typename?: 'Mutation', deleteScene: boolean };

export type E2EScenesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EScenesQuery = { __typename?: 'Query', scenes: Array<{ __typename?: 'Scene', id: string, name: string, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }> }> };

export type E2EUpdateSceneMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateSceneInput;
}>;


export type E2EUpdateSceneMutation = { __typename?: 'Mutation', updateScene: { __typename?: 'Scene', id: string, name: string, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }> } };

export type E2EScenesCreateGroupMutationVariables = Exact<{
  input: CreateGroupInput;
}>;


export type E2EScenesCreateGroupMutation = { __typename?: 'Mutation', createGroup: { __typename?: 'Group', id: string, name: string } };

export type E2EScenesAddGroupMemberMutationVariables = Exact<{
  input: AddGroupMemberInput;
}>;


export type E2EScenesAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'Group', id: string } };

export type E2EScenesDeleteGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EScenesDeleteGroupMutation = { __typename?: 'Mutation', deleteGroup: boolean };

export type E2EDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name?: string | null, friendlyName: string, source: string, type: string, available: boolean }> };

export type E2EStateHistoryDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EStateHistoryDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name?: string | null, friendlyName: string, type: string }> };

export type E2EStateHistoryQueryVariables = Exact<{
  filter: StateHistoryFilter;
}>;


export type E2EStateHistoryQuery = { __typename?: 'Query', stateHistory: Array<{ __typename?: 'StateSeries', deviceId: string, field: string, valueType: StateSeriesValueType, points: Array<{ __typename?: 'StateSeriesPoint', at: any, numberValue?: number | null, booleanValue?: boolean | null, textValue?: string | null }> }> };

export type E2EDeviceStateChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type E2EDeviceStateChangedSubscription = { __typename?: 'Subscription', deviceStateChanged: { __typename?: 'DeviceStateEvent', deviceId: string, state: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, temperature?: number | null, humidity?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null } } };

export type E2EDeviceAvailabilityChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type E2EDeviceAvailabilityChangedSubscription = { __typename?: 'Subscription', deviceAvailabilityChanged: { __typename?: 'DeviceAvailabilityEvent', deviceId: string, available: boolean } };

export type E2EDeviceAddedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type E2EDeviceAddedSubscription = { __typename?: 'Subscription', deviceAdded: { __typename?: 'Device', id: string, friendlyName: string, type: string, source: string } };

export type E2EDeviceRemovedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type E2EDeviceRemovedSubscription = { __typename?: 'Subscription', deviceRemoved: string };

export type E2EAutomationNodeActivatedSubscriptionVariables = Exact<{
  automationId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type E2EAutomationNodeActivatedSubscription = { __typename?: 'Subscription', automationNodeActivated: { __typename?: 'AutomationNodeActivationEvent', automationId: string, nodeId: string, active: boolean } };

export type E2EDeviceStateChangedFilteredSubscriptionVariables = Exact<{
  deviceId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type E2EDeviceStateChangedFilteredSubscription = { __typename?: 'Subscription', deviceStateChanged: { __typename?: 'DeviceStateEvent', deviceId: string, state: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, temperature?: number | null, humidity?: number | null } } };

export type E2ESubscriptionsDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2ESubscriptionsDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name?: string | null, friendlyName: string, type: string }> };

export type E2ESubscriptionsCreateAutomationMutationVariables = Exact<{
  input: CreateAutomationInput;
}>;


export type E2ESubscriptionsCreateAutomationMutation = { __typename?: 'Mutation', createAutomation: { __typename?: 'AutomationGraph', id: string, name: string, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string }> } };

export type E2ESubscriptionsDeleteAutomationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2ESubscriptionsDeleteAutomationMutation = { __typename?: 'Mutation', deleteAutomation: boolean };

export type E2ECreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type E2ECreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'User', id: string, username: string, name: string, avatarPath?: string | null, theme?: Theme | null } };

export type E2EUpdateCurrentUserMutationVariables = Exact<{
  input: UpdateCurrentUserInput;
}>;


export type E2EUpdateCurrentUserMutation = { __typename?: 'Mutation', updateCurrentUser: { __typename?: 'User', id: string, name: string, theme?: Theme | null } };

export type E2EDeleteUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EDeleteUserMutation = { __typename?: 'Mutation', deleteUser: boolean };

export type E2EResetPasswordMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  p: Scalars['String']['input'];
}>;


export type E2EResetPasswordMutation = { __typename?: 'Mutation', resetUserPassword: boolean };

export type E2EMeQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EMeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, username: string, name: string, theme?: Theme | null, avatarPath?: string | null } | null };

export type DeleteAlarmMutationVariables = Exact<{
  alarmId: Scalars['ID']['input'];
}>;


export type DeleteAlarmMutation = { __typename?: 'Mutation', deleteAlarm: boolean };

export type BatchDeleteAlarmsMutationVariables = Exact<{
  alarmIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type BatchDeleteAlarmsMutation = { __typename?: 'Mutation', batchDeleteAlarms: number };

export type DashboardApplianceCardSetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type DashboardApplianceCardSetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string, state?: { __typename?: 'DeviceState', on?: boolean | null } | null } };

export type DashboardLightCardSetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type DashboardLightCardSetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null } | null } };

export type DashboardIntegrationsQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardIntegrationsQuery = { __typename?: 'Query', integrations: Array<{ __typename?: 'Integration', provider: string, configured: boolean }> };

export type DeviceCardSetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type DeviceCardSetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null } | null } };

export type DeviceCardSimulateActionMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  action: Scalars['String']['input'];
}>;


export type DeviceCardSimulateActionMutation = { __typename?: 'Mutation', simulateDeviceAction: boolean };

export type DeviceTableSetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type DeviceTableSetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null } };

export type UpdateDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
}>;


export type UpdateDeviceMutation = { __typename?: 'Mutation', updateDevice: { __typename?: 'Device', id: string, name?: string | null, icon?: string | null, disabled: boolean, friendlyName: string, seen: boolean, roles: { __typename?: 'DeviceRoles', controlledLoad?: ControlledLoadRole | null, contact?: ContactRole | null } } };

export type MarkDevicesSeenMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type MarkDevicesSeenMutation = { __typename?: 'Mutation', markDevicesSeen: number };

export type NativeEffectOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type NativeEffectOptionsQuery = { __typename?: 'Query', nativeEffectOptions: Array<{ __typename?: 'NativeEffectOption', name: string, displayName: string, supportedDeviceCount: number }> };

export type EffectRunTargetDrawerRunEffectMutationVariables = Exact<{
  effectId: Scalars['ID']['input'];
  targetType: Scalars['String']['input'];
  targetId: Scalars['ID']['input'];
}>;


export type EffectRunTargetDrawerRunEffectMutation = { __typename?: 'Mutation', runEffect: { __typename?: 'ActiveEffect', id: string } };

export type EffectRunTargetDrawerRunNativeEffectMutationVariables = Exact<{
  nativeName: Scalars['String']['input'];
  targetType: Scalars['String']['input'];
  targetId: Scalars['ID']['input'];
}>;


export type EffectRunTargetDrawerRunNativeEffectMutation = { __typename?: 'Mutation', runNativeEffect: { __typename?: 'ActiveEffect', id: string } };

export type EffectTimelineEditorNativeOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type EffectTimelineEditorNativeOptionsQuery = { __typename?: 'Query', nativeEffectOptions: Array<{ __typename?: 'NativeEffectOption', name: string, displayName: string, supportedDeviceCount: number }> };

export type EffectsPageNativeOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type EffectsPageNativeOptionsQuery = { __typename?: 'Query', nativeEffectOptions: Array<{ __typename?: 'NativeEffectOption', name: string, displayName: string, supportedDeviceCount: number }> };

export type RoomsPageSetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type RoomsPageSetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null } | null } };

export type StateHistoryQueryVariables = Exact<{
  filter: StateHistoryFilter;
}>;


export type StateHistoryQuery = { __typename?: 'Query', stateHistory: Array<{ __typename?: 'StateSeries', deviceId: string, field: string, valueType: StateSeriesValueType, points: Array<{ __typename?: 'StateSeriesPoint', at: any, numberValue?: number | null, booleanValue?: boolean | null, textValue?: string | null }> }> };

export type AggregatedStateHistoryQueryVariables = Exact<{
  filter: AggregatedStateHistoryFilter;
}>;


export type AggregatedStateHistoryQuery = { __typename?: 'Query', aggregatedStateHistory: Array<{ __typename?: 'AggregatedSeries', field: string, points: Array<{ __typename?: 'NumericSeriesPoint', at: any, value: number }> }> };

export type SceneQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SceneQuery = { __typename?: 'Query', scene?: { __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string, name: string, expression: Array<{ __typename?: 'TargetClause', connector?: string | null, subject: string, op: string, values: Array<string> }>, target?: { __typename: 'Device', id: string, type: string, available: boolean, disabled: boolean, friendlyName: string, seen: boolean, lastSeen?: any | null, deviceName?: string | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, canSet: boolean, reportsValue: boolean, canGet: boolean, category: CapabilityCategory, label?: string | null, description?: string | null }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null } | { __typename: 'Group', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name?: string | null, type: string, source: string, available: boolean, disabled: boolean, friendlyName: string, seen: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, canSet: boolean, reportsValue: boolean, canGet: boolean, category: CapabilityCategory, label?: string | null, description?: string | null }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> } | { __typename: 'Room', id: string, name: string, icon?: string | null, resolvedDevices: Array<{ __typename?: 'Device', id: string, name?: string | null, type: string, source: string, available: boolean, disabled: boolean, friendlyName: string, seen: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, canSet: boolean, reportsValue: boolean, canGet: boolean, category: CapabilityCategory, label?: string | null, description?: string | null }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> } | null }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }> } | null };

export type AutomationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AutomationQuery = { __typename?: 'Query', automation?: { __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string, positionX: number, positionY: number, runtimeState: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }> } | null };

export type EffectEditQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type EffectEditQuery = { __typename?: 'Query', effect?: { __typename?: 'Effect', id: string, name: string, icon?: string | null, kind: EffectKind, nativeName?: string | null, loop: boolean, durationMs: number, requiredCapabilities: Array<string>, tracks: Array<{ __typename?: 'EffectTrack', id: string, index: number, name: string, clips: Array<{ __typename?: 'EffectClip', id: string, startMs: number, transitionMinMs: number, transitionMaxMs: number, kind: EffectClipKind, config: string }> }> } | null };

export type MapPageSetDisplayColorMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
}>;


export type MapPageSetDisplayColorMutation = { __typename?: 'Mutation', updateDevice: { __typename?: 'Device', id: string, displayColor?: string | null, displayBrightness?: number | null } };

export type MapNetworkTopologiesQueryVariables = Exact<{ [key: string]: never; }>;


export type MapNetworkTopologiesQuery = { __typename?: 'Query', networkTopologies: Array<{ __typename?: 'NetworkTopology', provider: string, scannedAt: any, nodes: Array<{ __typename?: 'TopologyNode', id: string, deviceId?: string | null, role: string }>, links: Array<{ __typename?: 'TopologyLink', source: string, target: string, kind: string, quality: number, stale: boolean }> }> };

export type MapPageTopologyUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type MapPageTopologyUpdatedSubscription = { __typename?: 'Subscription', networkTopologyUpdated: { __typename?: 'NetworkTopologyEvent', provider: string, scannedAt: any } };

export type MapPageDeviceTxSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type MapPageDeviceTxSubscription = { __typename?: 'Subscription', deviceStateChanged: { __typename?: 'DeviceStateEvent', deviceId: string } };

export type MapPageActionTxSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type MapPageActionTxSubscription = { __typename?: 'Subscription', deviceActionFired: { __typename?: 'DeviceActionEvent', deviceId: string } };

export type SetupStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type SetupStatusQuery = { __typename?: 'Query', setupStatus: { __typename?: 'SetupStatus', hasInitialUser: boolean } };

export type GroupCommandsSetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type GroupCommandsSetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null } | null } };

export type ActiveAlarmsQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveAlarmsQuery = { __typename?: 'Query', alarms: Array<{ __typename?: 'Alarm', id: string, latestRowId: string, severity: AlarmSeverity, kind: AlarmKind, message: string, source: string, count: number, firstRaisedAt: any, lastRaisedAt: any }> };

export type AlarmEventsSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type AlarmEventsSubscription = { __typename?: 'Subscription', alarmEvent: { __typename?: 'AlarmEvent', kind: AlarmEventKind, clearedAlarmId?: string | null, alarm?: { __typename?: 'Alarm', id: string, latestRowId: string, severity: AlarmSeverity, kind: AlarmKind, message: string, source: string, count: number, firstRaisedAt: any, lastRaisedAt: any } | null } };

export type AutomationFieldsFragment = { __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, lastFiredAt?: any | null, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null };

export type AutomationsStoreQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationsStoreQuery = { __typename?: 'Query', automations: Array<{ __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, lastFiredAt?: any | null, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type AutomationsStoreCreateMutationVariables = Exact<{
  input: CreateAutomationInput;
}>;


export type AutomationsStoreCreateMutation = { __typename?: 'Mutation', createAutomation: { __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, lastFiredAt?: any | null, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type AutomationsStoreUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAutomationInput;
}>;


export type AutomationsStoreUpdateMutation = { __typename?: 'Mutation', updateAutomation: { __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, lastFiredAt?: any | null, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type AutomationsStoreToggleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  enabled: Scalars['Boolean']['input'];
}>;


export type AutomationsStoreToggleMutation = { __typename?: 'Mutation', toggleAutomation: { __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, lastFiredAt?: any | null, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type AutomationsStoreDeleteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AutomationsStoreDeleteMutation = { __typename?: 'Mutation', deleteAutomation: boolean };

export type AutomationsStoreBatchDeleteMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type AutomationsStoreBatchDeleteMutation = { __typename?: 'Mutation', batchDeleteAutomations: number };

export type DevicesInitQueryVariables = Exact<{ [key: string]: never; }>;


export type DevicesInitQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name?: string | null, icon?: string | null, displayColor?: string | null, displayBrightness?: number | null, source: string, type: string, available: boolean, disabled: boolean, friendlyName: string, seen: boolean, lastSeen?: any | null, roles: { __typename?: 'DeviceRoles', controlledLoad?: ControlledLoadRole | null, contact?: ContactRole | null }, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, label?: string | null, description?: string | null, category: CapabilityCategory, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, reportsValue: boolean, canSet: boolean, canGet: boolean }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, occupancy?: boolean | null, contact?: boolean | null, orientation?: string | null, devicePosture?: string | null, linkQuality?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null, configuration: Array<{ __typename?: 'DeviceConfigurationEntry', capability: string, booleanValue?: boolean | null, numberValue?: number | null, stringValue?: string | null }> }> };

export type DeviceStoreStateChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceStoreStateChangedSubscription = { __typename?: 'Subscription', deviceStateChanged: { __typename?: 'DeviceStateEvent', deviceId: string, state: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, occupancy?: boolean | null, contact?: boolean | null, orientation?: string | null, devicePosture?: string | null, linkQuality?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } } };

export type DeviceStoreConfigurationChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceStoreConfigurationChangedSubscription = { __typename?: 'Subscription', deviceConfigurationChanged: { __typename?: 'DeviceConfigurationEvent', deviceId: string, values: Array<{ __typename?: 'DeviceConfigurationEntry', capability: string, booleanValue?: boolean | null, numberValue?: number | null, stringValue?: string | null }> } };

export type DeviceAvailabilityChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceAvailabilityChangedSubscription = { __typename?: 'Subscription', deviceAvailabilityChanged: { __typename?: 'DeviceAvailabilityEvent', deviceId: string, available: boolean } };

export type DeviceAddedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceAddedSubscription = { __typename?: 'Subscription', deviceAdded: { __typename?: 'Device', id: string, name?: string | null, friendlyName: string, seen: boolean, disabled: boolean, source: string, type: string, available: boolean, lastSeen?: any | null, roles: { __typename?: 'DeviceRoles', controlledLoad?: ControlledLoadRole | null, contact?: ContactRole | null }, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, label?: string | null, description?: string | null, category: CapabilityCategory, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, reportsValue: boolean, canSet: boolean, canGet: boolean }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, occupancy?: boolean | null, contact?: boolean | null, orientation?: string | null, devicePosture?: string | null, linkQuality?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null, configuration: Array<{ __typename?: 'DeviceConfigurationEntry', capability: string, booleanValue?: boolean | null, numberValue?: number | null, stringValue?: string | null }> } };

export type DeviceRemovedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceRemovedSubscription = { __typename?: 'Subscription', deviceRemoved: string };

export type DeviceStoreUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceStoreUpdatedSubscription = { __typename?: 'Subscription', deviceUpdated: { __typename?: 'Device', id: string, name?: string | null, icon?: string | null, displayColor?: string | null, displayBrightness?: number | null, source: string, type: string, available: boolean, disabled: boolean, friendlyName: string, seen: boolean, lastSeen?: any | null, roles: { __typename?: 'DeviceRoles', controlledLoad?: ControlledLoadRole | null, contact?: ContactRole | null }, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, label?: string | null, description?: string | null, category: CapabilityCategory, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, reportsValue: boolean, canSet: boolean, canGet: boolean }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, occupancy?: boolean | null, contact?: boolean | null, orientation?: string | null, devicePosture?: string | null, linkQuality?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null, configuration: Array<{ __typename?: 'DeviceConfigurationEntry', capability: string, booleanValue?: boolean | null, numberValue?: number | null, stringValue?: string | null }> } };

export type EffectFieldsFragment = { __typename?: 'Effect', id: string, name: string, icon?: string | null, kind: EffectKind, nativeName?: string | null, loop: boolean, durationMs: number, requiredCapabilities: Array<string>, tracks: Array<{ __typename?: 'EffectTrack', id: string, clips: Array<{ __typename?: 'EffectClip', id: string }> }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null };

export type EffectsStoreQueryVariables = Exact<{ [key: string]: never; }>;


export type EffectsStoreQuery = { __typename?: 'Query', effects: Array<{ __typename?: 'Effect', id: string, name: string, icon?: string | null, kind: EffectKind, nativeName?: string | null, loop: boolean, durationMs: number, requiredCapabilities: Array<string>, tracks: Array<{ __typename?: 'EffectTrack', id: string, clips: Array<{ __typename?: 'EffectClip', id: string }> }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type EffectsStoreCreateMutationVariables = Exact<{
  input: CreateEffectInput;
}>;


export type EffectsStoreCreateMutation = { __typename?: 'Mutation', createEffect: { __typename?: 'Effect', id: string, name: string, icon?: string | null, kind: EffectKind, nativeName?: string | null, loop: boolean, durationMs: number, requiredCapabilities: Array<string>, tracks: Array<{ __typename?: 'EffectTrack', id: string, clips: Array<{ __typename?: 'EffectClip', id: string }> }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type EffectsStoreUpdateMutationVariables = Exact<{
  input: UpdateEffectInput;
}>;


export type EffectsStoreUpdateMutation = { __typename?: 'Mutation', updateEffect: { __typename?: 'Effect', id: string, name: string, icon?: string | null, kind: EffectKind, nativeName?: string | null, loop: boolean, durationMs: number, requiredCapabilities: Array<string>, tracks: Array<{ __typename?: 'EffectTrack', id: string, clips: Array<{ __typename?: 'EffectClip', id: string }> }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type EffectsStoreDeleteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type EffectsStoreDeleteMutation = { __typename?: 'Mutation', deleteEffect: boolean };

export type FloorplanFieldsFragment = { __typename?: 'Floorplan', id: string, name: string, vertices: Array<{ __typename?: 'FloorplanVertex', id: string, x: number, y: number }>, walls: Array<{ __typename?: 'FloorplanWall', id: string, vertexA: string, vertexB: string, thickness: number, curveX?: number | null, curveY?: number | null }>, openings: Array<{ __typename?: 'FloorplanOpening', id: string, wallId: string, t: number, width: number, kind: FloorplanOpeningKind }>, doorBindings: Array<{ __typename?: 'FloorplanDoorBinding', openingId: string, deviceId: string, hingeSide: FloorplanDoorHingeSide, swingSide: FloorplanDoorSwingSide }>, rooms: Array<{ __typename?: 'FloorplanRoom', id: string, name?: string | null, roomId?: string | null, vertexIds: Array<string> }>, placements: Array<{ __typename?: 'FloorplanPlacement', memberType: string, memberId: string, x: number, y: number }>, furniture: Array<{ __typename?: 'FloorplanFurniture', id: string, kind: string, x: number, y: number, width: number, height: number, rotation: number, occluder: boolean }> };

export type FloorplanStoreQueryVariables = Exact<{ [key: string]: never; }>;


export type FloorplanStoreQuery = { __typename?: 'Query', floorplan?: { __typename?: 'Floorplan', id: string, name: string, vertices: Array<{ __typename?: 'FloorplanVertex', id: string, x: number, y: number }>, walls: Array<{ __typename?: 'FloorplanWall', id: string, vertexA: string, vertexB: string, thickness: number, curveX?: number | null, curveY?: number | null }>, openings: Array<{ __typename?: 'FloorplanOpening', id: string, wallId: string, t: number, width: number, kind: FloorplanOpeningKind }>, doorBindings: Array<{ __typename?: 'FloorplanDoorBinding', openingId: string, deviceId: string, hingeSide: FloorplanDoorHingeSide, swingSide: FloorplanDoorSwingSide }>, rooms: Array<{ __typename?: 'FloorplanRoom', id: string, name?: string | null, roomId?: string | null, vertexIds: Array<string> }>, placements: Array<{ __typename?: 'FloorplanPlacement', memberType: string, memberId: string, x: number, y: number }>, furniture: Array<{ __typename?: 'FloorplanFurniture', id: string, kind: string, x: number, y: number, width: number, height: number, rotation: number, occluder: boolean }> } | null };

export type FloorplanStoreUpdateMutationVariables = Exact<{
  input: UpdateFloorplanInput;
}>;


export type FloorplanStoreUpdateMutation = { __typename?: 'Mutation', updateFloorplan: { __typename?: 'Floorplan', id: string, name: string, vertices: Array<{ __typename?: 'FloorplanVertex', id: string, x: number, y: number }>, walls: Array<{ __typename?: 'FloorplanWall', id: string, vertexA: string, vertexB: string, thickness: number, curveX?: number | null, curveY?: number | null }>, openings: Array<{ __typename?: 'FloorplanOpening', id: string, wallId: string, t: number, width: number, kind: FloorplanOpeningKind }>, doorBindings: Array<{ __typename?: 'FloorplanDoorBinding', openingId: string, deviceId: string, hingeSide: FloorplanDoorHingeSide, swingSide: FloorplanDoorSwingSide }>, rooms: Array<{ __typename?: 'FloorplanRoom', id: string, name?: string | null, roomId?: string | null, vertexIds: Array<string> }>, placements: Array<{ __typename?: 'FloorplanPlacement', memberType: string, memberId: string, x: number, y: number }>, furniture: Array<{ __typename?: 'FloorplanFurniture', id: string, kind: string, x: number, y: number, width: number, height: number, rotation: number, occluder: boolean }> } };

export type GroupFieldsFragment = { __typename?: 'Group', id: string, name: string, icon?: string | null, tags: Array<GroupTag>, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null };

export type GroupsStoreQueryVariables = Exact<{ [key: string]: never; }>;


export type GroupsStoreQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, icon?: string | null, tags: Array<GroupTag>, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type GroupsStoreCreateMutationVariables = Exact<{
  input: CreateGroupInput;
}>;


export type GroupsStoreCreateMutation = { __typename?: 'Mutation', createGroup: { __typename?: 'Group', id: string, name: string, icon?: string | null, tags: Array<GroupTag>, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type GroupsStoreUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateGroupInput;
}>;


export type GroupsStoreUpdateMutation = { __typename?: 'Mutation', updateGroup: { __typename?: 'Group', id: string, name: string, icon?: string | null, tags: Array<GroupTag>, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type GroupsStoreDeleteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GroupsStoreDeleteMutation = { __typename?: 'Mutation', deleteGroup: boolean };

export type GroupsStoreBatchDeleteMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type GroupsStoreBatchDeleteMutation = { __typename?: 'Mutation', batchDeleteGroups: number };

export type GroupsStoreAddMemberMutationVariables = Exact<{
  input: AddGroupMemberInput;
}>;


export type GroupsStoreAddMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'Group', id: string, name: string, icon?: string | null, tags: Array<GroupTag>, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type GroupsStoreRemoveMemberMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GroupsStoreRemoveMemberMutation = { __typename?: 'Mutation', removeGroupMember: { __typename?: 'Group', id: string, name: string, icon?: string | null, tags: Array<GroupTag>, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, username: string, name: string, avatarPath?: string | null, theme?: Theme | null, timeFormat?: TimeFormat | null, temperatureUnit?: TemperatureUnit | null, createdAt?: any | null, mustChangePassword?: boolean | null } | null };

export type RoomFieldsFragment = { __typename?: 'Room', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'RoomMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null };

export type RoomsStoreQueryVariables = Exact<{ [key: string]: never; }>;


export type RoomsStoreQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'RoomMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type RoomsStoreCreateMutationVariables = Exact<{
  input: CreateRoomInput;
}>;


export type RoomsStoreCreateMutation = { __typename?: 'Mutation', createRoom: { __typename?: 'Room', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'RoomMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type RoomsStoreUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateRoomInput;
}>;


export type RoomsStoreUpdateMutation = { __typename?: 'Mutation', updateRoom: { __typename?: 'Room', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'RoomMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type RoomsStoreDeleteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RoomsStoreDeleteMutation = { __typename?: 'Mutation', deleteRoom: boolean };

export type RoomsStoreBatchDeleteMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type RoomsStoreBatchDeleteMutation = { __typename?: 'Mutation', batchDeleteRooms: number };

export type RoomsStoreAddMemberMutationVariables = Exact<{
  input: AddRoomMemberInput;
}>;


export type RoomsStoreAddMemberMutation = { __typename?: 'Mutation', addRoomMember: { __typename?: 'Room', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'RoomMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type RoomsStoreRemoveMemberMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RoomsStoreRemoveMemberMutation = { __typename?: 'Mutation', removeRoomMember: { __typename?: 'Room', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'RoomMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type SceneFieldsFragment = { __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null }>, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, effectivePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null };

export type ScenesStoreQueryVariables = Exact<{ [key: string]: never; }>;


export type ScenesStoreQuery = { __typename?: 'Query', scenes: Array<{ __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null }>, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, effectivePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type ScenesStoreCreateMutationVariables = Exact<{
  input: CreateSceneInput;
}>;


export type ScenesStoreCreateMutation = { __typename?: 'Mutation', createScene: { __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null }>, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, effectivePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type ScenesStoreUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateSceneInput;
}>;


export type ScenesStoreUpdateMutation = { __typename?: 'Mutation', updateScene: { __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null }>, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, effectivePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type ScenesStoreDeleteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ScenesStoreDeleteMutation = { __typename?: 'Mutation', deleteScene: boolean };

export type ScenesStoreBatchDeleteMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type ScenesStoreBatchDeleteMutation = { __typename?: 'Mutation', batchDeleteScenes: number };

export type ScenesStoreApplyMutationVariables = Exact<{
  sceneId: Scalars['ID']['input'];
}>;


export type ScenesStoreApplyMutation = { __typename?: 'Mutation', applyScene: { __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null }>, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, effectivePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type ScenesStoreActiveChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type ScenesStoreActiveChangedSubscription = { __typename?: 'Subscription', sceneActiveChanged: { __typename?: 'SceneActiveEvent', sceneId: string, activatedAt?: any | null } };

export type ActivityQueryVariables = Exact<{
  filter?: InputMaybe<ActivityFilter>;
}>;


export type ActivityQuery = { __typename?: 'Query', activity: Array<{ __typename?: 'ActivityEvent', id: string, type: string, timestamp: any, message: string, payload: string, source: { __typename?: 'ActivitySource', kind: string, id?: string | null, name?: string | null, type?: string | null, roomId?: string | null, roomName?: string | null } }> };

export type ActivityStreamSubscriptionVariables = Exact<{
  advanced?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type ActivityStreamSubscription = { __typename?: 'Subscription', activityStream: { __typename?: 'ActivityEvent', id: string, type: string, timestamp: any, message: string, payload: string, source: { __typename?: 'ActivitySource', kind: string, id?: string | null, name?: string | null, type?: string | null, roomId?: string | null, roomName?: string | null } } };

export type AutomationEditUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAutomationInput;
}>;


export type AutomationEditUpdateMutation = { __typename?: 'Mutation', updateAutomation: { __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string, positionX: number, positionY: number, runtimeState: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }> } };

export type DeleteAutomationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAutomationMutation = { __typename?: 'Mutation', deleteAutomation: boolean };

export type ToggleAutomationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  enabled: Scalars['Boolean']['input'];
}>;


export type ToggleAutomationMutation = { __typename?: 'Mutation', toggleAutomation: { __typename?: 'AutomationGraph', id: string, enabled: boolean } };

export type AutomationEditFireTriggerMutationVariables = Exact<{
  automationId: Scalars['ID']['input'];
  nodeId: Scalars['ID']['input'];
}>;


export type AutomationEditFireTriggerMutation = { __typename?: 'Mutation', fireAutomationTrigger: boolean };

export type AutomationEditEffectsQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationEditEffectsQuery = { __typename?: 'Query', effects: Array<{ __typename?: 'Effect', id: string, name: string }>, nativeEffectOptions: Array<{ __typename?: 'NativeEffectOption', name: string, displayName: string }> };

export type AutomationEditNodeActivatedSubscriptionVariables = Exact<{
  automationId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type AutomationEditNodeActivatedSubscription = { __typename?: 'Subscription', automationNodeActivated: { __typename?: 'AutomationNodeActivationEvent', automationId: string, nodeId: string, active: boolean } };

export type CompleteFirstPasswordChangeMutationVariables = Exact<{
  newPassword: Scalars['String']['input'];
}>;


export type CompleteFirstPasswordChangeMutation = { __typename?: 'Mutation', completeFirstPasswordChange: boolean };

export type SetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type SetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string } };

export type DeviceDetailSetConfigurationMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  settings: Array<DeviceConfigurationEntryInput> | DeviceConfigurationEntryInput;
}>;


export type DeviceDetailSetConfigurationMutation = { __typename?: 'Mutation', setDeviceConfiguration: boolean };

export type DeviceDetailUpdateDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
}>;


export type DeviceDetailUpdateDeviceMutation = { __typename?: 'Mutation', updateDevice: { __typename?: 'Device', id: string, name?: string | null, icon?: string | null, disabled: boolean, friendlyName: string, seen: boolean, roles: { __typename?: 'DeviceRoles', controlledLoad?: ControlledLoadRole | null, contact?: ContactRole | null } } };

export type EffectEditUpdateMutationVariables = Exact<{
  input: UpdateEffectInput;
}>;


export type EffectEditUpdateMutation = { __typename?: 'Mutation', updateEffect: { __typename?: 'Effect', id: string, name: string, icon?: string | null, loop: boolean, durationMs: number, requiredCapabilities: Array<string>, tracks: Array<{ __typename?: 'EffectTrack', id: string, index: number, name: string, clips: Array<{ __typename?: 'EffectClip', id: string, startMs: number, transitionMinMs: number, transitionMaxMs: number, kind: EffectClipKind, config: string }> }> } };

export type IntegrationsPageQueryVariables = Exact<{ [key: string]: never; }>;


export type IntegrationsPageQuery = { __typename?: 'Query', integrations: Array<{ __typename?: 'Integration', provider: string, name: string, configured: boolean, enabled: boolean, connected: boolean, deviceCount: number, message?: string | null }> };

export type DeleteIntegrationMutationVariables = Exact<{
  provider: Scalars['String']['input'];
}>;


export type DeleteIntegrationMutation = { __typename?: 'Mutation', deleteIntegration: number };

export type TuyaConfigPageQueryVariables = Exact<{ [key: string]: never; }>;


export type TuyaConfigPageQuery = { __typename?: 'Query', tuyaConfig?: { __typename?: 'TuyaConfig', accessId: string, accessSecret: string, region: string, enabled: boolean } | null };

export type UpdateTuyaConfigMutationVariables = Exact<{
  input: TuyaConfigInput;
}>;


export type UpdateTuyaConfigMutation = { __typename?: 'Mutation', updateTuyaConfig: { __typename?: 'TuyaConfig', accessId: string, accessSecret: string, region: string, enabled: boolean } };

export type TestTuyaConnectionMutationVariables = Exact<{
  input: TuyaConfigInput;
}>;


export type TestTuyaConnectionMutation = { __typename?: 'Mutation', testTuyaConnection: { __typename?: 'ConnectionTestResult', success: boolean, message: string } };

export type SyncTuyaDevicesMutationVariables = Exact<{ [key: string]: never; }>;


export type SyncTuyaDevicesMutation = { __typename?: 'Mutation', syncTuyaDevices: Array<{ __typename?: 'Device', id: string }> };

export type Zigbee2MqttConfigPageQueryVariables = Exact<{ [key: string]: never; }>;


export type Zigbee2MqttConfigPageQuery = { __typename?: 'Query', zigbee2MqttConfig?: { __typename?: 'Zigbee2MqttConfig', broker: string, username: string, password: string, useWss: boolean, enabled: boolean, scanScheduleEnabled: boolean, scanHour?: number | null, scanMinute?: number | null, scanStartedAt?: any | null } | null };

export type UpdateZigbee2MqttConfigMutationVariables = Exact<{
  input: Zigbee2MqttConfigInput;
}>;


export type UpdateZigbee2MqttConfigMutation = { __typename?: 'Mutation', updateZigbee2MqttConfig: { __typename?: 'Zigbee2MqttConfig', broker: string, username: string, password: string, useWss: boolean, enabled: boolean, scanScheduleEnabled: boolean, scanHour?: number | null, scanMinute?: number | null, scanStartedAt?: any | null } };

export type TestZigbee2MqttConnectionMutationVariables = Exact<{
  input: Zigbee2MqttConfigInput;
}>;


export type TestZigbee2MqttConnectionMutation = { __typename?: 'Mutation', testZigbee2MqttConnection: { __typename?: 'ConnectionTestResult', success: boolean, message: string } };

export type ScanZigbee2MqttNetworkMutationVariables = Exact<{ [key: string]: never; }>;


export type ScanZigbee2MqttNetworkMutation = { __typename?: 'Mutation', scanZigbee2MqttNetwork: boolean };

export type Zigbee2MqttLastScanQueryVariables = Exact<{ [key: string]: never; }>;


export type Zigbee2MqttLastScanQuery = { __typename?: 'Query', networkTopologies: Array<{ __typename?: 'NetworkTopology', provider: string, scannedAt: any }> };

export type Zigbee2MqttScanUpdatesSubscriptionVariables = Exact<{
  provider?: InputMaybe<Scalars['String']['input']>;
}>;


export type Zigbee2MqttScanUpdatesSubscription = { __typename?: 'Subscription', networkTopologyUpdated: { __typename?: 'NetworkTopologyEvent', provider: string, scannedAt: any, nodeCount: number, linkCount: number } };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', token: string, user: { __typename?: 'User', id: string, username: string, name: string, avatarPath?: string | null, theme?: Theme | null, createdAt?: any | null, mustChangePassword?: boolean | null } } };

export type LogsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type LogsQuery = { __typename?: 'Query', logs: Array<{ __typename?: 'LogEntry', timestamp: any, level: string, message: string, attrs: string }> };

export type LogStreamSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type LogStreamSubscription = { __typename?: 'Subscription', logStream: { __typename?: 'LogEntry', timestamp: any, level: string, message: string, attrs: string } };

export type ProfileUpdateCurrentUserMutationVariables = Exact<{
  input: UpdateCurrentUserInput;
}>;


export type ProfileUpdateCurrentUserMutation = { __typename?: 'Mutation', updateCurrentUser: { __typename?: 'User', id: string, username: string, name: string, avatarPath?: string | null, theme?: Theme | null, timeFormat?: TimeFormat | null, temperatureUnit?: TemperatureUnit | null, createdAt?: any | null, mustChangePassword?: boolean | null } };

export type ProfileChangePasswordMutationVariables = Exact<{
  input: ChangePasswordInput;
}>;


export type ProfileChangePasswordMutation = { __typename?: 'Mutation', changePassword: boolean };

export type ProfileForceLogoutAllMutationVariables = Exact<{ [key: string]: never; }>;


export type ProfileForceLogoutAllMutation = { __typename?: 'Mutation', forceLogoutAllSessions: boolean };

export type SceneEditUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateSceneInput;
}>;


export type SceneEditUpdateMutation = { __typename?: 'Mutation', updateScene: { __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string, name: string, expression: Array<{ __typename?: 'TargetClause', connector?: string | null, subject: string, op: string, values: Array<string> }>, target?: { __typename: 'Device', id: string, type: string, available: boolean, disabled: boolean, friendlyName: string, seen: boolean, lastSeen?: any | null, deviceName?: string | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, canSet: boolean, reportsValue: boolean, canGet: boolean, category: CapabilityCategory, label?: string | null, description?: string | null }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null } | { __typename: 'Group', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name?: string | null, type: string, source: string, available: boolean, disabled: boolean, friendlyName: string, seen: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, canSet: boolean, reportsValue: boolean, canGet: boolean, category: CapabilityCategory, label?: string | null, description?: string | null }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> } | { __typename: 'Room', id: string, name: string, icon?: string | null, resolvedDevices: Array<{ __typename?: 'Device', id: string, name?: string | null, type: string, source: string, available: boolean, disabled: boolean, friendlyName: string, seen: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, canSet: boolean, reportsValue: boolean, canGet: boolean, category: CapabilityCategory, label?: string | null, description?: string | null }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> } | null }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }> } };

export type SceneEditSetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type SceneEditSetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string } };

export type SceneEditEffectsQueryVariables = Exact<{ [key: string]: never; }>;


export type SceneEditEffectsQuery = { __typename?: 'Query', effects: Array<{ __typename?: 'Effect', id: string, name: string, icon?: string | null, kind: EffectKind, nativeName?: string | null, loop: boolean, requiredCapabilities: Array<string> }>, nativeEffectOptions: Array<{ __typename?: 'NativeEffectOption', name: string, displayName: string, supportedDeviceCount: number }> };

export type SettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type SettingsQuery = { __typename?: 'Query', settings: Array<{ __typename?: 'Setting', key: string, value: string }> };

export type UpdateSettingMutationVariables = Exact<{
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
}>;


export type UpdateSettingMutation = { __typename?: 'Mutation', updateSetting: { __typename?: 'Setting', key: string, value: string } };

export type CreateInitialUserMutationVariables = Exact<{
  input: CreateInitialUserInput;
}>;


export type CreateInitialUserMutation = { __typename?: 'Mutation', createInitialUser: { __typename?: 'AuthPayload', token: string, user: { __typename?: 'User', id: string, username: string, name: string } } };

export type UsersListQueryVariables = Exact<{ [key: string]: never; }>;


export type UsersListQuery = { __typename?: 'Query', users: Array<{ __typename?: 'User', id: string, username: string, name: string, avatarPath?: string | null }> };

export type UsersCreateMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type UsersCreateMutation = { __typename?: 'Mutation', createUser: { __typename?: 'User', id: string, username: string, name: string, avatarPath?: string | null } };

export type UsersDeleteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UsersDeleteMutation = { __typename?: 'Mutation', deleteUser: boolean };

export type UsersBatchDeleteMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type UsersBatchDeleteMutation = { __typename?: 'Mutation', batchDeleteUsers: number };

export type UsersResetPasswordMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type UsersResetPasswordMutation = { __typename?: 'Mutation', resetUserPassword: boolean };

export const AutomationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationGraph"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastFiredAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationFieldsFragment, unknown>;
export const EffectFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"nativeName"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}},{"kind":"Field","name":{"kind":"Name","value":"tracks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"clips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<EffectFieldsFragment, unknown>;
export const FloorplanFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FloorplanFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Floorplan"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"vertices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"walls"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"vertexA"}},{"kind":"Field","name":{"kind":"Name","value":"vertexB"}},{"kind":"Field","name":{"kind":"Name","value":"thickness"}},{"kind":"Field","name":{"kind":"Name","value":"curveX"}},{"kind":"Field","name":{"kind":"Name","value":"curveY"}}]}},{"kind":"Field","name":{"kind":"Name","value":"openings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wallId"}},{"kind":"Field","name":{"kind":"Name","value":"t"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"doorBindings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"openingId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"hingeSide"}},{"kind":"Field","name":{"kind":"Name","value":"swingSide"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"vertexIds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"placements"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"furniture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"rotation"}},{"kind":"Field","name":{"kind":"Name","value":"occluder"}}]}}]}}]} as unknown as DocumentNode<FloorplanFieldsFragment, unknown>;
export const GroupFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GroupFieldsFragment, unknown>;
export const RoomFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoomFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RoomFieldsFragment, unknown>;
export const SceneFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SceneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scene"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"effectivePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]} as unknown as DocumentNode<SceneFieldsFragment, unknown>;
export const E2EAutomationsDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EAutomationsDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<E2EAutomationsDevicesQuery, E2EAutomationsDevicesQueryVariables>;
export const E2ECreateAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ECreateAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<E2ECreateAutomationMutation, E2ECreateAutomationMutationVariables>;
export const E2EAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<E2EAutomationQuery, E2EAutomationQueryVariables>;
export const E2EAutomationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EAutomations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<E2EAutomationsQuery, E2EAutomationsQueryVariables>;
export const E2EUpdateAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EUpdateAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<E2EUpdateAutomationMutation, E2EUpdateAutomationMutationVariables>;
export const E2EToggleAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EToggleAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<E2EToggleAutomationMutation, E2EToggleAutomationMutationVariables>;
export const E2EDeleteAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EDeleteAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EDeleteAutomationMutation, E2EDeleteAutomationMutationVariables>;
export const E2EAutomationsCreateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EAutomationsCreateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<E2EAutomationsCreateGroupMutation, E2EAutomationsCreateGroupMutationVariables>;
export const E2EAutomationsAddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EAutomationsAddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<E2EAutomationsAddGroupMemberMutation, E2EAutomationsAddGroupMemberMutationVariables>;
export const E2EAutomationsDeleteGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EAutomationsDeleteGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EAutomationsDeleteGroupMutation, E2EAutomationsDeleteGroupMutationVariables>;
export const E2EDevicesListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EDevicesList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<E2EDevicesListQuery, E2EDevicesListQueryVariables>;
export const E2EDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"device"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<E2EDeviceQuery, E2EDeviceQueryVariables>;
export const E2ESetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ESetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}}]}}]}}]}}]} as unknown as DocumentNode<E2ESetDeviceStateMutation, E2ESetDeviceStateMutationVariables>;
export const E2EUpdateDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EUpdateDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<E2EUpdateDeviceMutation, E2EUpdateDeviceMutationVariables>;
export const E2EDevicesDeviceStateChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"E2EDevicesDeviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}}]}}]}}]}}]} as unknown as DocumentNode<E2EDevicesDeviceStateChangedSubscription, E2EDevicesDeviceStateChangedSubscriptionVariables>;
export const E2EErrorsSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EErrorsScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<E2EErrorsSceneQuery, E2EErrorsSceneQueryVariables>;
export const E2EErrorsAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EErrorsAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<E2EErrorsAutomationQuery, E2EErrorsAutomationQueryVariables>;
export const E2EErrorsAddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EErrorsAddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<E2EErrorsAddGroupMemberMutation, E2EErrorsAddGroupMemberMutationVariables>;
export const E2EErrorsDeleteSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EErrorsDeleteScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EErrorsDeleteSceneMutation, E2EErrorsDeleteSceneMutationVariables>;
export const E2EErrorsCreateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EErrorsCreateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<E2EErrorsCreateGroupMutation, E2EErrorsCreateGroupMutationVariables>;
export const E2EErrorsDeleteGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EErrorsDeleteGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EErrorsDeleteGroupMutation, E2EErrorsDeleteGroupMutationVariables>;
export const E2ECreateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ECreateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<E2ECreateGroupMutation, E2ECreateGroupMutationVariables>;
export const E2EAddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EAddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"device"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<E2EAddGroupMemberMutation, E2EAddGroupMemberMutationVariables>;
export const E2EGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"group"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<E2EGroupQuery, E2EGroupQueryVariables>;
export const E2EDeleteGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EDeleteGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EDeleteGroupMutation, E2EDeleteGroupMutationVariables>;
export const E2EGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<E2EGroupsQuery, E2EGroupsQueryVariables>;
export const E2EUpdateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EUpdateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<E2EUpdateGroupMutation, E2EUpdateGroupMutationVariables>;
export const E2ERemoveGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ERemoveGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<E2ERemoveGroupMemberMutation, E2ERemoveGroupMemberMutationVariables>;
export const E2EGroupsDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EGroupsDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<E2EGroupsDevicesQuery, E2EGroupsDevicesQueryVariables>;
export const E2EScenesDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EScenesDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<E2EScenesDevicesQuery, E2EScenesDevicesQueryVariables>;
export const E2ECreateSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ECreateScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}}]}}]}}]} as unknown as DocumentNode<E2ECreateSceneMutation, E2ECreateSceneMutationVariables>;
export const E2EApplySceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EApplyScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"applyScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sceneId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<E2EApplySceneMutation, E2EApplySceneMutationVariables>;
export const E2ESceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}}]}}]}}]} as unknown as DocumentNode<E2ESceneQuery, E2ESceneQueryVariables>;
export const E2EDeleteSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EDeleteScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EDeleteSceneMutation, E2EDeleteSceneMutationVariables>;
export const E2EScenesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EScenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}}]}}]}}]} as unknown as DocumentNode<E2EScenesQuery, E2EScenesQueryVariables>;
export const E2EUpdateSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EUpdateScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}}]}}]}}]} as unknown as DocumentNode<E2EUpdateSceneMutation, E2EUpdateSceneMutationVariables>;
export const E2EScenesCreateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EScenesCreateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<E2EScenesCreateGroupMutation, E2EScenesCreateGroupMutationVariables>;
export const E2EScenesAddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EScenesAddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<E2EScenesAddGroupMemberMutation, E2EScenesAddGroupMemberMutationVariables>;
export const E2EScenesDeleteGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EScenesDeleteGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EScenesDeleteGroupMutation, E2EScenesDeleteGroupMutationVariables>;
export const E2EDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}}]}}]} as unknown as DocumentNode<E2EDevicesQuery, E2EDevicesQueryVariables>;
export const E2EStateHistoryDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EStateHistoryDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<E2EStateHistoryDevicesQuery, E2EStateHistoryDevicesQueryVariables>;
export const E2EStateHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EStateHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StateHistoryFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stateHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"valueType"}},{"kind":"Field","name":{"kind":"Name","value":"points"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"at"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"textValue"}}]}}]}}]}}]} as unknown as DocumentNode<E2EStateHistoryQuery, E2EStateHistoryQueryVariables>;
export const E2EDeviceStateChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"E2EDeviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<E2EDeviceStateChangedSubscription, E2EDeviceStateChangedSubscriptionVariables>;
export const E2EDeviceAvailabilityChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"E2EDeviceAvailabilityChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceAvailabilityChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}}]}}]} as unknown as DocumentNode<E2EDeviceAvailabilityChangedSubscription, E2EDeviceAvailabilityChangedSubscriptionVariables>;
export const E2EDeviceAddedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"E2EDeviceAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}}]}}]}}]} as unknown as DocumentNode<E2EDeviceAddedSubscription, E2EDeviceAddedSubscriptionVariables>;
export const E2EDeviceRemovedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"E2EDeviceRemoved"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceRemoved"}}]}}]} as unknown as DocumentNode<E2EDeviceRemovedSubscription, E2EDeviceRemovedSubscriptionVariables>;
export const E2EAutomationNodeActivatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"E2EAutomationNodeActivated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationNodeActivated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"automationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationId"}},{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<E2EAutomationNodeActivatedSubscription, E2EAutomationNodeActivatedSubscriptionVariables>;
export const E2EDeviceStateChangedFilteredDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"E2EDeviceStateChangedFiltered"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}}]}}]}}]}}]} as unknown as DocumentNode<E2EDeviceStateChangedFilteredSubscription, E2EDeviceStateChangedFilteredSubscriptionVariables>;
export const E2ESubscriptionsDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2ESubscriptionsDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<E2ESubscriptionsDevicesQuery, E2ESubscriptionsDevicesQueryVariables>;
export const E2ESubscriptionsCreateAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ESubscriptionsCreateAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]}}]} as unknown as DocumentNode<E2ESubscriptionsCreateAutomationMutation, E2ESubscriptionsCreateAutomationMutationVariables>;
export const E2ESubscriptionsDeleteAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ESubscriptionsDeleteAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2ESubscriptionsDeleteAutomationMutation, E2ESubscriptionsDeleteAutomationMutationVariables>;
export const E2ECreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ECreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}}]}}]}}]} as unknown as DocumentNode<E2ECreateUserMutation, E2ECreateUserMutationVariables>;
export const E2EUpdateCurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EUpdateCurrentUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCurrentUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCurrentUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}}]}}]}}]} as unknown as DocumentNode<E2EUpdateCurrentUserMutation, E2EUpdateCurrentUserMutationVariables>;
export const E2EDeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EDeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EDeleteUserMutation, E2EDeleteUserMutationVariables>;
export const E2EResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"p"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetUserPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"p"}}}]}]}}]} as unknown as DocumentNode<E2EResetPasswordMutation, E2EResetPasswordMutationVariables>;
export const E2EMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EMe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}}]}}]}}]} as unknown as DocumentNode<E2EMeQuery, E2EMeQueryVariables>;
export const DeleteAlarmDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAlarm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"alarmId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAlarm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"alarmId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"alarmId"}}}]}]}}]} as unknown as DocumentNode<DeleteAlarmMutation, DeleteAlarmMutationVariables>;
export const BatchDeleteAlarmsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BatchDeleteAlarms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"alarmIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteAlarms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"alarmIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"alarmIds"}}}]}]}}]} as unknown as DocumentNode<BatchDeleteAlarmsMutation, BatchDeleteAlarmsMutationVariables>;
export const DashboardApplianceCardSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DashboardApplianceCardSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}}]}}]}}]}}]} as unknown as DocumentNode<DashboardApplianceCardSetDeviceStateMutation, DashboardApplianceCardSetDeviceStateMutationVariables>;
export const DashboardLightCardSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DashboardLightCardSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}}]}}]}}]}}]} as unknown as DocumentNode<DashboardLightCardSetDeviceStateMutation, DashboardLightCardSetDeviceStateMutationVariables>;
export const DashboardIntegrationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardIntegrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"configured"}}]}}]}}]} as unknown as DocumentNode<DashboardIntegrationsQuery, DashboardIntegrationsQueryVariables>;
export const DeviceCardSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceCardSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceCardSetDeviceStateMutation, DeviceCardSetDeviceStateMutationVariables>;
export const DeviceCardSimulateActionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceCardSimulateAction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"action"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulateDeviceAction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"action"},"value":{"kind":"Variable","name":{"kind":"Name","value":"action"}}}]}]}}]} as unknown as DocumentNode<DeviceCardSimulateActionMutation, DeviceCardSimulateActionMutationVariables>;
export const DeviceTableSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceTableSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DeviceTableSetDeviceStateMutation, DeviceTableSetDeviceStateMutationVariables>;
export const UpdateDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"controlledLoad"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}}]}}]}}]} as unknown as DocumentNode<UpdateDeviceMutation, UpdateDeviceMutationVariables>;
export const MarkDevicesSeenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkDevicesSeen"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markDevicesSeen"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<MarkDevicesSeenMutation, MarkDevicesSeenMutationVariables>;
export const NativeEffectOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NativeEffectOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nativeEffectOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDeviceCount"}}]}}]}}]} as unknown as DocumentNode<NativeEffectOptionsQuery, NativeEffectOptionsQueryVariables>;
export const EffectRunTargetDrawerRunEffectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EffectRunTargetDrawerRunEffect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"effectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"targetType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetType"}}},{"kind":"Argument","name":{"kind":"Name","value":"targetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<EffectRunTargetDrawerRunEffectMutation, EffectRunTargetDrawerRunEffectMutationVariables>;
export const EffectRunTargetDrawerRunNativeEffectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EffectRunTargetDrawerRunNativeEffect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nativeName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runNativeEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"nativeName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nativeName"}}},{"kind":"Argument","name":{"kind":"Name","value":"targetType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetType"}}},{"kind":"Argument","name":{"kind":"Name","value":"targetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<EffectRunTargetDrawerRunNativeEffectMutation, EffectRunTargetDrawerRunNativeEffectMutationVariables>;
export const EffectTimelineEditorNativeOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EffectTimelineEditorNativeOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nativeEffectOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDeviceCount"}}]}}]}}]} as unknown as DocumentNode<EffectTimelineEditorNativeOptionsQuery, EffectTimelineEditorNativeOptionsQueryVariables>;
export const EffectsPageNativeOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EffectsPageNativeOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nativeEffectOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDeviceCount"}}]}}]}}]} as unknown as DocumentNode<EffectsPageNativeOptionsQuery, EffectsPageNativeOptionsQueryVariables>;
export const RoomsPageSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsPageSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}}]}}]}}]}}]} as unknown as DocumentNode<RoomsPageSetDeviceStateMutation, RoomsPageSetDeviceStateMutationVariables>;
export const StateHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StateHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StateHistoryFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stateHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"valueType"}},{"kind":"Field","name":{"kind":"Name","value":"points"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"at"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"textValue"}}]}}]}}]}}]} as unknown as DocumentNode<StateHistoryQuery, StateHistoryQueryVariables>;
export const AggregatedStateHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AggregatedStateHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AggregatedStateHistoryFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aggregatedStateHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"points"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"at"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]} as unknown as DocumentNode<AggregatedStateHistoryQuery, AggregatedStateHistoryQueryVariables>;
export const SceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Scene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"expression"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connector"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"op"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}},{"kind":"Field","name":{"kind":"Name","value":"target"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"deviceName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"canSet"}},{"kind":"Field","name":{"kind":"Name","value":"reportsValue"}},{"kind":"Field","name":{"kind":"Name","value":"canGet"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"canSet"}},{"kind":"Field","name":{"kind":"Name","value":"reportsValue"}},{"kind":"Field","name":{"kind":"Name","value":"canGet"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"canSet"}},{"kind":"Field","name":{"kind":"Name","value":"reportsValue"}},{"kind":"Field","name":{"kind":"Name","value":"canGet"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]}}]} as unknown as DocumentNode<SceneQuery, SceneQueryVariables>;
export const AutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Automation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"positionX"}},{"kind":"Field","name":{"kind":"Name","value":"positionY"}},{"kind":"Field","name":{"kind":"Name","value":"runtimeState"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationQuery, AutomationQueryVariables>;
export const EffectEditDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EffectEdit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"effect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"nativeName"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}},{"kind":"Field","name":{"kind":"Name","value":"tracks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"clips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startMs"}},{"kind":"Field","name":{"kind":"Name","value":"transitionMinMs"}},{"kind":"Field","name":{"kind":"Name","value":"transitionMaxMs"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}}]}}]}}]}}]} as unknown as DocumentNode<EffectEditQuery, EffectEditQueryVariables>;
export const MapPageSetDisplayColorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MapPageSetDisplayColor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayColor"}},{"kind":"Field","name":{"kind":"Name","value":"displayBrightness"}}]}}]}}]} as unknown as DocumentNode<MapPageSetDisplayColorMutation, MapPageSetDisplayColorMutationVariables>;
export const MapNetworkTopologiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MapNetworkTopologies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkTopologies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"scannedAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"links"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"target"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"quality"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]} as unknown as DocumentNode<MapNetworkTopologiesQuery, MapNetworkTopologiesQueryVariables>;
export const MapPageTopologyUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"MapPageTopologyUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkTopologyUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"scannedAt"}}]}}]}}]} as unknown as DocumentNode<MapPageTopologyUpdatedSubscription, MapPageTopologyUpdatedSubscriptionVariables>;
export const MapPageDeviceTxDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"MapPageDeviceTx"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}}]}}]}}]} as unknown as DocumentNode<MapPageDeviceTxSubscription, MapPageDeviceTxSubscriptionVariables>;
export const MapPageActionTxDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"MapPageActionTx"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceActionFired"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}}]}}]}}]} as unknown as DocumentNode<MapPageActionTxSubscription, MapPageActionTxSubscriptionVariables>;
export const SetupStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"setupStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setupStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasInitialUser"}}]}}]}}]} as unknown as DocumentNode<SetupStatusQuery, SetupStatusQueryVariables>;
export const GroupCommandsSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupCommandsSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}}]}}]}}]}}]} as unknown as DocumentNode<GroupCommandsSetDeviceStateMutation, GroupCommandsSetDeviceStateMutationVariables>;
export const ActiveAlarmsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActiveAlarms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alarms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"latestRowId"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"firstRaisedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRaisedAt"}}]}}]}}]} as unknown as DocumentNode<ActiveAlarmsQuery, ActiveAlarmsQueryVariables>;
export const AlarmEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AlarmEvents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alarmEvent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"clearedAlarmId"}},{"kind":"Field","name":{"kind":"Name","value":"alarm"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"latestRowId"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"firstRaisedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRaisedAt"}}]}}]}}]}}]} as unknown as DocumentNode<AlarmEventsSubscription, AlarmEventsSubscriptionVariables>;
export const AutomationsStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationsStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationGraph"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastFiredAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationsStoreQuery, AutomationsStoreQueryVariables>;
export const AutomationsStoreCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationsStoreCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationGraph"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastFiredAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationsStoreCreateMutation, AutomationsStoreCreateMutationVariables>;
export const AutomationsStoreUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationsStoreUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationGraph"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastFiredAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationsStoreUpdateMutation, AutomationsStoreUpdateMutationVariables>;
export const AutomationsStoreToggleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationsStoreToggle"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationGraph"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastFiredAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationsStoreToggleMutation, AutomationsStoreToggleMutationVariables>;
export const AutomationsStoreDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationsStoreDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<AutomationsStoreDeleteMutation, AutomationsStoreDeleteMutationVariables>;
export const AutomationsStoreBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationsStoreBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteAutomations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<AutomationsStoreBatchDeleteMutation, AutomationsStoreBatchDeleteMutationVariables>;
export const DevicesInitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DevicesInit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"displayColor"}},{"kind":"Field","name":{"kind":"Name","value":"displayBrightness"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"controlledLoad"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"reportsValue"}},{"kind":"Field","name":{"kind":"Name","value":"canSet"}},{"kind":"Field","name":{"kind":"Name","value":"canGet"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"occupancy"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}},{"kind":"Field","name":{"kind":"Name","value":"orientation"}},{"kind":"Field","name":{"kind":"Name","value":"devicePosture"}},{"kind":"Field","name":{"kind":"Name","value":"linkQuality"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"capability"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"stringValue"}}]}}]}}]}}]} as unknown as DocumentNode<DevicesInitQuery, DevicesInitQueryVariables>;
export const DeviceStoreStateChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceStoreStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"occupancy"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}},{"kind":"Field","name":{"kind":"Name","value":"orientation"}},{"kind":"Field","name":{"kind":"Name","value":"devicePosture"}},{"kind":"Field","name":{"kind":"Name","value":"linkQuality"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceStoreStateChangedSubscription, DeviceStoreStateChangedSubscriptionVariables>;
export const DeviceStoreConfigurationChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceStoreConfigurationChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceConfigurationChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"values"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"capability"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"stringValue"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceStoreConfigurationChangedSubscription, DeviceStoreConfigurationChangedSubscriptionVariables>;
export const DeviceAvailabilityChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceAvailabilityChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceAvailabilityChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}}]}}]} as unknown as DocumentNode<DeviceAvailabilityChangedSubscription, DeviceAvailabilityChangedSubscriptionVariables>;
export const DeviceAddedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"controlledLoad"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"reportsValue"}},{"kind":"Field","name":{"kind":"Name","value":"canSet"}},{"kind":"Field","name":{"kind":"Name","value":"canGet"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"occupancy"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}},{"kind":"Field","name":{"kind":"Name","value":"orientation"}},{"kind":"Field","name":{"kind":"Name","value":"devicePosture"}},{"kind":"Field","name":{"kind":"Name","value":"linkQuality"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"capability"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"stringValue"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceAddedSubscription, DeviceAddedSubscriptionVariables>;
export const DeviceRemovedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceRemoved"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceRemoved"}}]}}]} as unknown as DocumentNode<DeviceRemovedSubscription, DeviceRemovedSubscriptionVariables>;
export const DeviceStoreUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceStoreUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"displayColor"}},{"kind":"Field","name":{"kind":"Name","value":"displayBrightness"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"controlledLoad"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"reportsValue"}},{"kind":"Field","name":{"kind":"Name","value":"canSet"}},{"kind":"Field","name":{"kind":"Name","value":"canGet"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"occupancy"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}},{"kind":"Field","name":{"kind":"Name","value":"orientation"}},{"kind":"Field","name":{"kind":"Name","value":"devicePosture"}},{"kind":"Field","name":{"kind":"Name","value":"linkQuality"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"capability"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"stringValue"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceStoreUpdatedSubscription, DeviceStoreUpdatedSubscriptionVariables>;
export const EffectsStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EffectsStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"effects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"nativeName"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}},{"kind":"Field","name":{"kind":"Name","value":"tracks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"clips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<EffectsStoreQuery, EffectsStoreQueryVariables>;
export const EffectsStoreCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EffectsStoreCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEffectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"nativeName"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}},{"kind":"Field","name":{"kind":"Name","value":"tracks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"clips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<EffectsStoreCreateMutation, EffectsStoreCreateMutationVariables>;
export const EffectsStoreUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EffectsStoreUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEffectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"nativeName"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}},{"kind":"Field","name":{"kind":"Name","value":"tracks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"clips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<EffectsStoreUpdateMutation, EffectsStoreUpdateMutationVariables>;
export const EffectsStoreDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EffectsStoreDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<EffectsStoreDeleteMutation, EffectsStoreDeleteMutationVariables>;
export const FloorplanStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FloorplanStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"floorplan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FloorplanFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FloorplanFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Floorplan"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"vertices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"walls"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"vertexA"}},{"kind":"Field","name":{"kind":"Name","value":"vertexB"}},{"kind":"Field","name":{"kind":"Name","value":"thickness"}},{"kind":"Field","name":{"kind":"Name","value":"curveX"}},{"kind":"Field","name":{"kind":"Name","value":"curveY"}}]}},{"kind":"Field","name":{"kind":"Name","value":"openings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wallId"}},{"kind":"Field","name":{"kind":"Name","value":"t"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"doorBindings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"openingId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"hingeSide"}},{"kind":"Field","name":{"kind":"Name","value":"swingSide"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"vertexIds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"placements"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"furniture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"rotation"}},{"kind":"Field","name":{"kind":"Name","value":"occluder"}}]}}]}}]} as unknown as DocumentNode<FloorplanStoreQuery, FloorplanStoreQueryVariables>;
export const FloorplanStoreUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FloorplanStoreUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateFloorplanInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFloorplan"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FloorplanFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FloorplanFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Floorplan"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"vertices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"walls"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"vertexA"}},{"kind":"Field","name":{"kind":"Name","value":"vertexB"}},{"kind":"Field","name":{"kind":"Name","value":"thickness"}},{"kind":"Field","name":{"kind":"Name","value":"curveX"}},{"kind":"Field","name":{"kind":"Name","value":"curveY"}}]}},{"kind":"Field","name":{"kind":"Name","value":"openings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wallId"}},{"kind":"Field","name":{"kind":"Name","value":"t"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"doorBindings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"openingId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"hingeSide"}},{"kind":"Field","name":{"kind":"Name","value":"swingSide"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"vertexIds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"placements"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"furniture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"rotation"}},{"kind":"Field","name":{"kind":"Name","value":"occluder"}}]}}]}}]} as unknown as DocumentNode<FloorplanStoreUpdateMutation, FloorplanStoreUpdateMutationVariables>;
export const GroupsStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GroupsStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GroupsStoreQuery, GroupsStoreQueryVariables>;
export const GroupsStoreCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupsStoreCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GroupsStoreCreateMutation, GroupsStoreCreateMutationVariables>;
export const GroupsStoreUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupsStoreUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GroupsStoreUpdateMutation, GroupsStoreUpdateMutationVariables>;
export const GroupsStoreDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupsStoreDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<GroupsStoreDeleteMutation, GroupsStoreDeleteMutationVariables>;
export const GroupsStoreBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupsStoreBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteGroups"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<GroupsStoreBatchDeleteMutation, GroupsStoreBatchDeleteMutationVariables>;
export const GroupsStoreAddMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupsStoreAddMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GroupsStoreAddMemberMutation, GroupsStoreAddMemberMutationVariables>;
export const GroupsStoreRemoveMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupsStoreRemoveMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GroupsStoreRemoveMemberMutation, GroupsStoreRemoveMemberMutationVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"timeFormat"}},{"kind":"Field","name":{"kind":"Name","value":"temperatureUnit"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"mustChangePassword"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const RoomsStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RoomsStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoomFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoomFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RoomsStoreQuery, RoomsStoreQueryVariables>;
export const RoomsStoreCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsStoreCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRoomInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoomFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoomFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RoomsStoreCreateMutation, RoomsStoreCreateMutationVariables>;
export const RoomsStoreUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsStoreUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRoomInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoomFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoomFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RoomsStoreUpdateMutation, RoomsStoreUpdateMutationVariables>;
export const RoomsStoreDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsStoreDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RoomsStoreDeleteMutation, RoomsStoreDeleteMutationVariables>;
export const RoomsStoreBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsStoreBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteRooms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<RoomsStoreBatchDeleteMutation, RoomsStoreBatchDeleteMutationVariables>;
export const RoomsStoreAddMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsStoreAddMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddRoomMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRoomMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoomFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoomFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RoomsStoreAddMemberMutation, RoomsStoreAddMemberMutationVariables>;
export const RoomsStoreRemoveMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsStoreRemoveMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeRoomMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoomFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoomFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RoomsStoreRemoveMemberMutation, RoomsStoreRemoveMemberMutationVariables>;
export const ScenesStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ScenesStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SceneFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SceneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scene"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"effectivePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]} as unknown as DocumentNode<ScenesStoreQuery, ScenesStoreQueryVariables>;
export const ScenesStoreCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScenesStoreCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SceneFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SceneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scene"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"effectivePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]} as unknown as DocumentNode<ScenesStoreCreateMutation, ScenesStoreCreateMutationVariables>;
export const ScenesStoreUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScenesStoreUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SceneFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SceneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scene"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"effectivePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]} as unknown as DocumentNode<ScenesStoreUpdateMutation, ScenesStoreUpdateMutationVariables>;
export const ScenesStoreDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScenesStoreDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ScenesStoreDeleteMutation, ScenesStoreDeleteMutationVariables>;
export const ScenesStoreBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScenesStoreBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteScenes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<ScenesStoreBatchDeleteMutation, ScenesStoreBatchDeleteMutationVariables>;
export const ScenesStoreApplyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScenesStoreApply"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"applyScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sceneId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SceneFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SceneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scene"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"effectivePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]} as unknown as DocumentNode<ScenesStoreApplyMutation, ScenesStoreApplyMutationVariables>;
export const ScenesStoreActiveChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ScenesStoreActiveChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sceneActiveChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sceneId"}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]}}]} as unknown as DocumentNode<ScenesStoreActiveChangedSubscription, ScenesStoreActiveChangedSubscriptionVariables>;
export const ActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Activity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"roomName"}}]}}]}}]}}]} as unknown as DocumentNode<ActivityQuery, ActivityQueryVariables>;
export const ActivityStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ActivityStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"advanced"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activityStream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"advanced"},"value":{"kind":"Variable","name":{"kind":"Name","value":"advanced"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"roomName"}}]}}]}}]}}]} as unknown as DocumentNode<ActivityStreamSubscription, ActivityStreamSubscriptionVariables>;
export const AutomationEditUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationEditUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"positionX"}},{"kind":"Field","name":{"kind":"Name","value":"positionY"}},{"kind":"Field","name":{"kind":"Name","value":"runtimeState"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationEditUpdateMutation, AutomationEditUpdateMutationVariables>;
export const DeleteAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAutomationMutation, DeleteAutomationMutationVariables>;
export const ToggleAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<ToggleAutomationMutation, ToggleAutomationMutationVariables>;
export const AutomationEditFireTriggerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationEditFireTrigger"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nodeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fireAutomationTrigger"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"automationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"nodeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nodeId"}}}]}]}}]} as unknown as DocumentNode<AutomationEditFireTriggerMutation, AutomationEditFireTriggerMutationVariables>;
export const AutomationEditEffectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationEditEffects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"effects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nativeEffectOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}}]} as unknown as DocumentNode<AutomationEditEffectsQuery, AutomationEditEffectsQueryVariables>;
export const AutomationEditNodeActivatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AutomationEditNodeActivated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationNodeActivated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"automationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationId"}},{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<AutomationEditNodeActivatedSubscription, AutomationEditNodeActivatedSubscriptionVariables>;
export const CompleteFirstPasswordChangeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"completeFirstPasswordChange"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completeFirstPasswordChange"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}}]}]}}]} as unknown as DocumentNode<CompleteFirstPasswordChangeMutation, CompleteFirstPasswordChangeMutationVariables>;
export const SetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SetDeviceStateMutation, SetDeviceStateMutationVariables>;
export const DeviceDetailSetConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailSetConfiguration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"settings"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceConfigurationEntryInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceConfiguration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"settings"},"value":{"kind":"Variable","name":{"kind":"Name","value":"settings"}}}]}]}}]} as unknown as DocumentNode<DeviceDetailSetConfigurationMutation, DeviceDetailSetConfigurationMutationVariables>;
export const DeviceDetailUpdateDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailUpdateDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"controlledLoad"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}}]}}]}}]} as unknown as DocumentNode<DeviceDetailUpdateDeviceMutation, DeviceDetailUpdateDeviceMutationVariables>;
export const EffectEditUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EffectEditUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEffectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}},{"kind":"Field","name":{"kind":"Name","value":"tracks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"clips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startMs"}},{"kind":"Field","name":{"kind":"Name","value":"transitionMinMs"}},{"kind":"Field","name":{"kind":"Name","value":"transitionMaxMs"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}}]}}]}}]}}]} as unknown as DocumentNode<EffectEditUpdateMutation, EffectEditUpdateMutationVariables>;
export const IntegrationsPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"IntegrationsPage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"configured"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}},{"kind":"Field","name":{"kind":"Name","value":"deviceCount"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<IntegrationsPageQuery, IntegrationsPageQueryVariables>;
export const DeleteIntegrationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteIntegration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"provider"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteIntegration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"provider"},"value":{"kind":"Variable","name":{"kind":"Name","value":"provider"}}}]}]}}]} as unknown as DocumentNode<DeleteIntegrationMutation, DeleteIntegrationMutationVariables>;
export const TuyaConfigPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TuyaConfigPage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tuyaConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessId"}},{"kind":"Field","name":{"kind":"Name","value":"accessSecret"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<TuyaConfigPageQuery, TuyaConfigPageQueryVariables>;
export const UpdateTuyaConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTuyaConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TuyaConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTuyaConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessId"}},{"kind":"Field","name":{"kind":"Name","value":"accessSecret"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<UpdateTuyaConfigMutation, UpdateTuyaConfigMutationVariables>;
export const TestTuyaConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestTuyaConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TuyaConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testTuyaConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<TestTuyaConnectionMutation, TestTuyaConnectionMutationVariables>;
export const SyncTuyaDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SyncTuyaDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncTuyaDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SyncTuyaDevicesMutation, SyncTuyaDevicesMutationVariables>;
export const Zigbee2MqttConfigPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Zigbee2MqttConfigPage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"zigbee2MqttConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"broker"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"password"}},{"kind":"Field","name":{"kind":"Name","value":"useWss"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"scanScheduleEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"scanHour"}},{"kind":"Field","name":{"kind":"Name","value":"scanMinute"}},{"kind":"Field","name":{"kind":"Name","value":"scanStartedAt"}}]}}]}}]} as unknown as DocumentNode<Zigbee2MqttConfigPageQuery, Zigbee2MqttConfigPageQueryVariables>;
export const UpdateZigbee2MqttConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateZigbee2MqttConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Zigbee2MqttConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateZigbee2MqttConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"broker"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"password"}},{"kind":"Field","name":{"kind":"Name","value":"useWss"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"scanScheduleEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"scanHour"}},{"kind":"Field","name":{"kind":"Name","value":"scanMinute"}},{"kind":"Field","name":{"kind":"Name","value":"scanStartedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateZigbee2MqttConfigMutation, UpdateZigbee2MqttConfigMutationVariables>;
export const TestZigbee2MqttConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestZigbee2MqttConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Zigbee2MqttConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testZigbee2MqttConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<TestZigbee2MqttConnectionMutation, TestZigbee2MqttConnectionMutationVariables>;
export const ScanZigbee2MqttNetworkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScanZigbee2MqttNetwork"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scanZigbee2MqttNetwork"}}]}}]} as unknown as DocumentNode<ScanZigbee2MqttNetworkMutation, ScanZigbee2MqttNetworkMutationVariables>;
export const Zigbee2MqttLastScanDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Zigbee2MqttLastScan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkTopologies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"scannedAt"}}]}}]}}]} as unknown as DocumentNode<Zigbee2MqttLastScanQuery, Zigbee2MqttLastScanQueryVariables>;
export const Zigbee2MqttScanUpdatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"Zigbee2MqttScanUpdates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"provider"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkTopologyUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"provider"},"value":{"kind":"Variable","name":{"kind":"Name","value":"provider"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"scannedAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodeCount"}},{"kind":"Field","name":{"kind":"Name","value":"linkCount"}}]}}]}}]} as unknown as DocumentNode<Zigbee2MqttScanUpdatesSubscription, Zigbee2MqttScanUpdatesSubscriptionVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"mustChangePassword"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const LogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Logs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"attrs"}}]}}]}}]} as unknown as DocumentNode<LogsQuery, LogsQueryVariables>;
export const LogStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"LogStream"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logStream"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"attrs"}}]}}]}}]} as unknown as DocumentNode<LogStreamSubscription, LogStreamSubscriptionVariables>;
export const ProfileUpdateCurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProfileUpdateCurrentUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCurrentUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCurrentUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"timeFormat"}},{"kind":"Field","name":{"kind":"Name","value":"temperatureUnit"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"mustChangePassword"}}]}}]}}]} as unknown as DocumentNode<ProfileUpdateCurrentUserMutation, ProfileUpdateCurrentUserMutationVariables>;
export const ProfileChangePasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProfileChangePassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangePasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changePassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ProfileChangePasswordMutation, ProfileChangePasswordMutationVariables>;
export const ProfileForceLogoutAllDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProfileForceLogoutAll"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"forceLogoutAllSessions"}}]}}]} as unknown as DocumentNode<ProfileForceLogoutAllMutation, ProfileForceLogoutAllMutationVariables>;
export const SceneEditUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SceneEditUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"expression"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connector"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"op"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}},{"kind":"Field","name":{"kind":"Name","value":"target"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"deviceName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"canSet"}},{"kind":"Field","name":{"kind":"Name","value":"reportsValue"}},{"kind":"Field","name":{"kind":"Name","value":"canGet"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"canSet"}},{"kind":"Field","name":{"kind":"Name","value":"reportsValue"}},{"kind":"Field","name":{"kind":"Name","value":"canGet"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"canSet"}},{"kind":"Field","name":{"kind":"Name","value":"reportsValue"}},{"kind":"Field","name":{"kind":"Name","value":"canGet"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]}}]} as unknown as DocumentNode<SceneEditUpdateMutation, SceneEditUpdateMutationVariables>;
export const SceneEditSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SceneEditSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SceneEditSetDeviceStateMutation, SceneEditSetDeviceStateMutationVariables>;
export const SceneEditEffectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SceneEditEffects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"effects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"nativeName"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nativeEffectOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDeviceCount"}}]}}]}}]} as unknown as DocumentNode<SceneEditEffectsQuery, SceneEditEffectsQueryVariables>;
export const SettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]} as unknown as DocumentNode<SettingsQuery, SettingsQueryVariables>;
export const UpdateSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]} as unknown as DocumentNode<UpdateSettingMutation, UpdateSettingMutationVariables>;
export const CreateInitialUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createInitialUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateInitialUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createInitialUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateInitialUserMutation, CreateInitialUserMutationVariables>;
export const UsersListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UsersList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}}]}}]}}]} as unknown as DocumentNode<UsersListQuery, UsersListQueryVariables>;
export const UsersCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UsersCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}}]}}]}}]} as unknown as DocumentNode<UsersCreateMutation, UsersCreateMutationVariables>;
export const UsersDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UsersDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<UsersDeleteMutation, UsersDeleteMutationVariables>;
export const UsersBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UsersBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<UsersBatchDeleteMutation, UsersBatchDeleteMutationVariables>;
export const UsersResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UsersResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetUserPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}}]}]}}]} as unknown as DocumentNode<UsersResetPasswordMutation, UsersResetPasswordMutationVariables>;