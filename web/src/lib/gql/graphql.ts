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
  message?: Maybe<Scalars['String']['output']>;
  messageArguments: Scalars['String']['output'];
  messageCode?: Maybe<Scalars['String']['output']>;
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
  /** Whether the stored graph can be loaded by the automation engine. */
  compilable: Scalars['Boolean']['output'];
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

export type CommandTargetInput = {
  deviceIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  type: CommandTargetType;
};

export enum CommandTargetType {
  Device = 'DEVICE',
  DeviceSet = 'DEVICE_SET',
  Group = 'GROUP',
  Room = 'ROOM'
}

export enum ConnectionTestCode {
  AuthenticationFailed = 'AUTHENTICATION_FAILED',
  Connected = 'CONNECTED',
  Failed = 'FAILED',
  Timeout = 'TIMEOUT',
  TlsFailed = 'TLS_FAILED',
  Unavailable = 'UNAVAILABLE',
  Unconfigured = 'UNCONFIGURED',
  Unreachable = 'UNREACHABLE'
}

export type ConnectionTestResult = {
  __typename?: 'ConnectionTestResult';
  code: ConnectionTestCode;
  diagnostic?: Maybe<Scalars['String']['output']>;
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

export type CreateGuestInput = {
  durationMinutes: Scalars['Int']['input'];
  name: Scalars['String']['input'];
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
  definition: SceneDefinitionInput;
  name: Scalars['String']['input'];
};

export type CreateUserInput = {
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type CreateWebhookEndpointInput = {
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  rateLimitCount?: InputMaybe<Scalars['Int']['input']>;
  rateLimitWindowMs?: InputMaybe<Scalars['Int']['input']>;
};

export type DashboardLocalization = {
  __typename?: 'DashboardLocalization';
  defaultContentLanguage: Language;
  localizedNameSets: Array<LocalizedNameSet>;
  translateStandardRoomNames: Scalars['Boolean']['output'];
};

export type DesiredSceneState = {
  __typename?: 'DesiredSceneState';
  brightness?: Maybe<Scalars['Int']['output']>;
  color?: Maybe<Color>;
  colorTemp?: Maybe<Scalars['Int']['output']>;
  fanMode?: Maybe<Scalars['String']['output']>;
  hvacMode?: Maybe<Scalars['String']['output']>;
  on?: Maybe<Scalars['Boolean']['output']>;
  swing?: Maybe<Scalars['String']['output']>;
  targetTemperature?: Maybe<Scalars['Float']['output']>;
  transition?: Maybe<Scalars['Float']['output']>;
};

export type DesiredSceneStateInput = {
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

export type Device = {
  __typename?: 'Device';
  available: Scalars['Boolean']['output'];
  capabilities: Array<Capability>;
  configuration: Array<DeviceConfigurationEntry>;
  /**
   * When true the device is hidden from Hive surfaces except the opt-in deleted
   * device list and its direct detail page. Its integration, history, metadata,
   * memberships and other references remain intact. Deleted devices are disabled;
   * restoring one leaves it disabled until the user enables it separately.
   */
  deleted: Scalars['Boolean']['output'];
  /**
   * When true the device is excluded from every path that commands or watches it:
   * scene apply, automation and effect fan-out, target selectors, and the
   * unavailable / low-battery health checks. setTargetState rejects it outright.
   * Its row, detail page, live subscriptions and state history are unaffected, and
   * it still renders as a member of the rooms, groups and scenes it belongs to.
   */
  disabled: Scalars['Boolean']['output'];
  /**
   * The visual brightness used when this device reports no brightness of its own,
   * on the 0-254 scale device state uses. Null means full strength.
   */
  displayBrightness?: Maybe<Scalars['Int']['output']>;
  /**
   * The visual colour used when this device reports none of its own, as `#rrggbb`.
   * Null uses the default warm-light colour.
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
  /** Zigbee2MQTT detail, available only for Zigbee2MQTT devices. */
  zigbee2Mqtt?: Maybe<Zigbee2MqttDeviceMetadata>;
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

export type DynamicSceneSource = {
  __typename?: 'DynamicSceneSource';
  brightness: Scalars['Float']['output'];
  cycleSeconds: Scalars['Float']['output'];
  domain: VibeFieldDomain;
  gridHeight: Scalars['Int']['output'];
  gridWidth: Scalars['Int']['output'];
  guidedSelectedIds: Array<Scalars['ID']['output']>;
  movement: Scalars['Float']['output'];
  presetId?: Maybe<Scalars['ID']['output']>;
  samples: Array<VibeFieldSample>;
  seed: Scalars['String']['output'];
  sourceKind: VibeSourceKind;
};

export type DynamicSceneSourceInput = {
  brightness?: InputMaybe<Scalars['Float']['input']>;
  cycleSeconds?: InputMaybe<Scalars['Float']['input']>;
  movement?: InputMaybe<Scalars['Float']['input']>;
  seed?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<VibeSourceInput>;
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
  source: Scalars['String']['output'];
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
  id?: InputMaybe<Scalars['ID']['input']>;
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
  /** The name the integration reports. Empty for groups created in Hive. */
  friendlyName: Scalars['String']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  members: Array<GroupMember>;
  /**
   * The user's name override. Null means unset, in which case the group shows the
   * name its integration reports, or its id when there is none. Clients render
   * `name ?? friendlyName ?? id`; `updateGroup(name: null)` clears the override.
   */
  name?: Maybe<Scalars['String']['output']>;
  removed: Scalars['Boolean']['output'];
  resolvedDevices: Array<Device>;
  source: Scalars['String']['output'];
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

export type Guest = {
  __typename?: 'Guest';
  createdAt: Scalars['DateTime']['output'];
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type GuestAuthPayload = {
  __typename?: 'GuestAuthPayload';
  guest: Guest;
  token: Scalars['String']['output'];
};

export type GuestChangeEvent = {
  __typename?: 'GuestChangeEvent';
  guest?: Maybe<Guest>;
  guestId: Scalars['ID']['output'];
  kind: GuestChangeKind;
};

export enum GuestChangeKind {
  Created = 'CREATED',
  Expired = 'EXPIRED',
  Extended = 'EXTENDED',
  Revoked = 'REVOKED'
}

export type GuidedVibeOption = {
  __typename?: 'GuidedVibeOption';
  id: Scalars['ID']['output'];
  labelId: Scalars['String']['output'];
  preview: ScenePreview;
};

export type GuidedVibeRecipeInput = {
  domain: VibeFieldDomain;
  seed: Scalars['String']['input'];
  selectedIds: Array<Scalars['ID']['input']>;
};

export type GuidedVibeRound = {
  __typename?: 'GuidedVibeRound';
  canFinish: Scalars['Boolean']['output'];
  complete: Scalars['Boolean']['output'];
  options: Array<GuidedVibeOption>;
  round: Scalars['Int']['output'];
};

export type GuidedVibeRoundInput = {
  domain: VibeFieldDomain;
  seed: Scalars['String']['input'];
  selectedIds: Array<Scalars['ID']['input']>;
};

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

export enum Language {
  En = 'EN',
  Ru = 'RU',
  Sv = 'SV'
}

export type LocalizedName = {
  __typename?: 'LocalizedName';
  language: Language;
  value: Scalars['String']['output'];
};

export type LocalizedNameInput = {
  language: Language;
  value: Scalars['String']['input'];
};

export type LocalizedNameSet = {
  __typename?: 'LocalizedNameSet';
  entityId: Scalars['ID']['output'];
  entityType: Scalars['String']['output'];
  sourceLanguage: Language;
  translations: Array<LocalizedName>;
};

export type LocalizedNameSetInput = {
  entityId: Scalars['ID']['input'];
  entityType: Scalars['String']['input'];
  sourceLanguage: Language;
  translations: Array<LocalizedNameInput>;
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

export enum MaintenanceKind {
  Battery = 'BATTERY',
  Firmware = 'FIRMWARE',
  Posture = 'POSTURE',
  Storage = 'STORAGE'
}

export type MaintenanceTask = {
  __typename?: 'MaintenanceTask';
  actionUrl?: Maybe<Scalars['String']['output']>;
  context?: Maybe<Scalars['String']['output']>;
  currentValue?: Maybe<Scalars['String']['output']>;
  device?: Maybe<Device>;
  id: Scalars['ID']['output'];
  kind: MaintenanceKind;
  targetValue?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
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
  batchDeleteDevices: Scalars['Int']['output'];
  batchDeleteEffects: Scalars['Int']['output'];
  batchDeleteGroups: Scalars['Int']['output'];
  batchDeleteGuests: Scalars['Int']['output'];
  batchDeleteRooms: Scalars['Int']['output'];
  batchDeleteScenes: Scalars['Int']['output'];
  /**
   * Deletes the specified users. The currently authenticated user is silently
   * skipped if present in the list. Returns the number of users actually deleted.
   */
  batchDeleteUsers: Scalars['Int']['output'];
  batchDeleteWebhookEndpoints: Scalars['Int']['output'];
  batchRestoreDevices: Scalars['Int']['output'];
  changePassword: Scalars['Boolean']['output'];
  /**
   * Completes the forced first-login password change. Only callable while the
   * caller's `mustChangePassword` flag is set; the AuthDirective allowlists this
   * field for users in the forced-change state. Sets the new password hash and
   * clears the flag in one statement. Returns false if the caller was not in the
   * forced-change state.
   */
  completeFirstPasswordChange: Scalars['Boolean']['output'];
  completeMaintenanceTasks: Array<Scalars['ID']['output']>;
  createAutomation: AutomationGraph;
  createEffect: Effect;
  createGroup: Group;
  createGuest: Guest;
  createInitialUser: AuthPayload;
  createRoom: Room;
  createScene: Scene;
  createUser: User;
  createWebhookEndpoint: WebhookSecretResult;
  deactivateScene: Scene;
  deleteAlarm: Scalars['Boolean']['output'];
  deleteAutomation: Scalars['Boolean']['output'];
  deleteDevice: Device;
  deleteEffect: Scalars['Boolean']['output'];
  deleteGroup: Scalars['Boolean']['output'];
  deleteGuest: Scalars['Boolean']['output'];
  deleteIntegration: Scalars['Int']['output'];
  deleteRoom: Scalars['Boolean']['output'];
  deleteScene: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  deleteWebhookEndpoint: Scalars['Boolean']['output'];
  extendGuest: Guest;
  /**
   * Fires a trigger node immediately inside its enabled automation. The trigger's
   * configured event or schedule does not need to occur. Intended for testing a
   * saved automation from the live graph.
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
  guestLogin: GuestAuthPayload;
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
  restoreDevice: Device;
  rotateWebhookEndpointSecret: WebhookSecretResult;
  /**
   * Starts effectId on the given target. Preempts any effect already
   * running on the target. Returns the resulting active-run row.
   */
  runEffect: ActiveEffect;
  /**
   * Requests a native effect and waits briefly for each target device to report
   * whether it started. Devices without a verifiable readback return UNCONFIRMED.
   */
  runNativeEffect: NativeEffectRunResult;
  /**
   * Requests a Zigbee topology scan. Returns immediately; the scan walks every
   * router on the mesh, takes minutes, and slows the network while it runs.
   * Completion is announced on the networkTopologyUpdated subscription.
   */
  scanZigbee2MqttNetwork: Scalars['Boolean']['output'];
  setDeviceConfiguration: Scalars['Boolean']['output'];
  setTargetState: Scalars['Boolean']['output'];
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
  updateLocalizedNameSet: LocalizedNameSet;
  updateRoom: Room;
  updateScene: Scene;
  updateSetting: Setting;
  updateTuyaConfig: TuyaConfig;
  updateWebhookEndpoint: WebhookEndpoint;
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


export type MutationBatchDeleteDevicesArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationBatchDeleteEffectsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationBatchDeleteGroupsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationBatchDeleteGuestsArgs = {
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


export type MutationBatchDeleteWebhookEndpointsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationBatchRestoreDevicesArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
};


export type MutationCompleteFirstPasswordChangeArgs = {
  newPassword: Scalars['String']['input'];
};


export type MutationCompleteMaintenanceTasksArgs = {
  ids: Array<Scalars['ID']['input']>;
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


export type MutationCreateGuestArgs = {
  input: CreateGuestInput;
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


export type MutationCreateWebhookEndpointArgs = {
  input: CreateWebhookEndpointInput;
};


export type MutationDeactivateSceneArgs = {
  sceneId: Scalars['ID']['input'];
};


export type MutationDeleteAlarmArgs = {
  alarmId: Scalars['ID']['input'];
};


export type MutationDeleteAutomationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDeviceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEffectArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteGroupArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteGuestArgs = {
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


export type MutationDeleteWebhookEndpointArgs = {
  id: Scalars['ID']['input'];
};


export type MutationExtendGuestArgs = {
  durationMinutes: Scalars['Int']['input'];
  id: Scalars['ID']['input'];
};


export type MutationFireAutomationTriggerArgs = {
  automationId: Scalars['ID']['input'];
  nodeId: Scalars['ID']['input'];
};


export type MutationForceLogoutAllSessionsArgs = {
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationGuestLoginArgs = {
  name: Scalars['String']['input'];
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


export type MutationRestoreDeviceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRotateWebhookEndpointSecretArgs = {
  id: Scalars['ID']['input'];
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


export type MutationSetTargetStateArgs = {
  state: DeviceStateInput;
  target: CommandTargetInput;
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


export type MutationUpdateLocalizedNameSetArgs = {
  input: LocalizedNameSetInput;
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


export type MutationUpdateWebhookEndpointArgs = {
  id: Scalars['ID']['input'];
  input: UpdateWebhookEndpointInput;
};


export type MutationUpdateZigbee2MqttConfigArgs = {
  input: Zigbee2MqttConfigInput;
};

export type NativeEffectDeviceRunResult = {
  __typename?: 'NativeEffectDeviceRunResult';
  deviceId: Scalars['ID']['output'];
  status: NativeEffectRunStatus;
};

export type NativeEffectDeviceSupport = {
  __typename?: 'NativeEffectDeviceSupport';
  deviceId: Scalars['ID']['output'];
  status: NativeEffectSupportStatus;
};

/** A native effect option offered by connected integrations. */
export type NativeEffectOption = {
  __typename?: 'NativeEffectOption';
  confirmedDeviceCount: Scalars['Int']['output'];
  displayName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  source: Scalars['String']['output'];
  unsupportedDeviceCount: Scalars['Int']['output'];
  untestedDeviceCount: Scalars['Int']['output'];
};

export type NativeEffectRunResult = {
  __typename?: 'NativeEffectRunResult';
  devices: Array<NativeEffectDeviceRunResult>;
  runId: Scalars['ID']['output'];
};

export enum NativeEffectRunStatus {
  Confirmed = 'CONFIRMED',
  Unconfirmed = 'UNCONFIRMED',
  Unsupported = 'UNSUPPORTED'
}

export enum NativeEffectSupportStatus {
  Confirmed = 'CONFIRMED',
  Unsupported = 'UNSUPPORTED',
  Untested = 'UNTESTED'
}

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

export type PhotoSampleInput = {
  domain: VibeFieldDomain;
  height: Scalars['Int']['input'];
  rgbBase64: Scalars['String']['input'];
  seed: Scalars['String']['input'];
  width: Scalars['Int']['input'];
};

export type PresetVibeRecipeInput = {
  presetId: Scalars['ID']['input'];
  seed?: InputMaybe<Scalars['String']['input']>;
};

export type PreviewPixel = {
  __typename?: 'PreviewPixel';
  b: Scalars['Int']['output'];
  g: Scalars['Int']['output'];
  r: Scalars['Int']['output'];
};

export type PreviewSwatch = {
  __typename?: 'PreviewSwatch';
  color: PreviewPixel;
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
};

export type PreviewVibeInput = {
  brightness?: InputMaybe<Scalars['Float']['input']>;
  cycleSeconds?: InputMaybe<Scalars['Float']['input']>;
  movement?: InputMaybe<Scalars['Float']['input']>;
  source: VibeSourceInput;
};

export type Query = {
  __typename?: 'Query';
  activeEffects: Array<ActiveEffect>;
  activity: Array<ActivityEvent>;
  aggregatedStateHistory: Array<AggregatedSeries>;
  alarms: Array<Alarm>;
  automation?: Maybe<AutomationGraph>;
  automations: Array<AutomationGraph>;
  currentGuest?: Maybe<Guest>;
  dashboardLocalization: DashboardLocalization;
  device?: Maybe<Device>;
  devices: Array<Device>;
  effect?: Maybe<Effect>;
  effects: Array<Effect>;
  /** The floor plan. Null until the first save. */
  floorplan?: Maybe<Floorplan>;
  group?: Maybe<Group>;
  groups: Array<Group>;
  guests: Array<Guest>;
  guidedVibeRound: GuidedVibeRound;
  integrations: Array<Integration>;
  localizedNameSets: Array<LocalizedNameSet>;
  logs: Array<LogEntry>;
  maintenanceTasks: Array<MaintenanceTask>;
  me?: Maybe<User>;
  nativeEffectOptions: Array<NativeEffectOption>;
  nativeEffectSupport: Array<NativeEffectDeviceSupport>;
  /** Every provider's stored mesh snapshot. Empty until a scan completes. */
  networkTopologies: Array<NetworkTopology>;
  previewVibe: VibePreviewResult;
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
  vibePresets: Array<VibePreset>;
  webhookDeliveries: Array<WebhookDelivery>;
  webhookEndpoint?: Maybe<WebhookEndpoint>;
  webhookEndpoints: Array<WebhookEndpoint>;
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


export type QueryGuidedVibeRoundArgs = {
  input: GuidedVibeRoundInput;
};


export type QueryLogsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryNativeEffectSupportArgs = {
  name: Scalars['String']['input'];
};


export type QueryPreviewVibeArgs = {
  input: PreviewVibeInput;
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


export type QueryWebhookDeliveriesArgs = {
  before?: InputMaybe<Scalars['DateTime']['input']>;
  endpointId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryWebhookEndpointArgs = {
  id: Scalars['ID']['input'];
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
  activatedAt?: Maybe<Scalars['DateTime']['output']>;
  createdBy?: Maybe<User>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lighting: SceneLighting;
  name: Scalars['String']['output'];
  preview: ScenePreview;
  rooms: Array<Room>;
  supportingStates: Array<SceneSupportingState>;
  targets: Array<SceneTargetEntry>;
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

export type SceneDefinitionInput = {
  lighting: SceneLightingInput;
  supportingStates: Array<SceneSupportingStateInput>;
  targets: Array<SceneTargetInput>;
};

export type SceneLightOverride = {
  __typename?: 'SceneLightOverride';
  deviceId: Scalars['ID']['output'];
  effectId?: Maybe<Scalars['ID']['output']>;
  kind: SceneLightOverrideKind;
  nativeEffectName?: Maybe<Scalars['String']['output']>;
  state?: Maybe<DesiredSceneState>;
};

export type SceneLightOverrideInput = {
  deviceId: Scalars['ID']['input'];
  effectId?: InputMaybe<Scalars['ID']['input']>;
  kind: SceneLightOverrideKind;
  nativeEffectName?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<DesiredSceneStateInput>;
};

export enum SceneLightOverrideKind {
  Effect = 'effect',
  NativeEffect = 'native_effect',
  State = 'state'
}

export type SceneLighting = {
  __typename?: 'SceneLighting';
  dynamicSource?: Maybe<DynamicSceneSource>;
  overrides: Array<SceneLightOverride>;
};

export type SceneLightingInput = {
  dynamicSource?: InputMaybe<DynamicSceneSourceInput>;
  overrides: Array<SceneLightOverrideInput>;
};

export type ScenePreview = {
  __typename?: 'ScenePreview';
  height: Scalars['Int']['output'];
  pixels: Array<PreviewPixel>;
  swatches: Array<PreviewSwatch>;
  width: Scalars['Int']['output'];
};

export type SceneSupportingState = {
  __typename?: 'SceneSupportingState';
  deviceId: Scalars['ID']['output'];
  state: DesiredSceneState;
};

export type SceneSupportingStateInput = {
  deviceId: Scalars['ID']['input'];
  state: DesiredSceneStateInput;
};

export type SceneTarget = Device | Group | Room;

export type SceneTargetEntry = {
  __typename?: 'SceneTargetEntry';
  expression: Array<TargetClause>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  target?: Maybe<SceneTarget>;
  targetId: Scalars['ID']['output'];
  targetType: SceneTargetType;
};

export type SceneTargetInput = {
  expression?: InputMaybe<Array<TargetClauseInput>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  targetId?: InputMaybe<Scalars['ID']['input']>;
  targetType: SceneTargetType;
};

export enum SceneTargetType {
  Device = 'device',
  Expression = 'expression',
  Group = 'group',
  Room = 'room'
}

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
   * roles, display colour, disabled, deleted — carrying the full updated device. This is
   * what keeps a second open tab's rename in step without a reload.
   */
  deviceUpdated: Device;
  /**
   * Step-boundary events from the effect runner. When runId is provided,
   * only events for that run are delivered; otherwise every effect run's
   * step boundaries are broadcast.
   */
  effectStepActivated: EffectStepEvent;
  groupsChanged: Array<Scalars['ID']['output']>;
  guestChanged: GuestChangeEvent;
  logStream: LogEntry;
  maintenanceChanged: Scalars['DateTime']['output'];
  nativeEffectSupportChanged: Scalars['DateTime']['output'];
  /**
   * Fires after a merged topology snapshot is persisted, so a consumer that
   * re-queries on it always reads the new snapshot. When provider is given,
   * only that provider's updates are delivered.
   */
  networkTopologyUpdated: NetworkTopologyEvent;
  sceneActiveChanged: SceneActiveEvent;
  webhookDeliveryRecorded: WebhookDelivery;
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


export type SubscriptionWebhookDeliveryRecordedArgs = {
  endpointId?: InputMaybe<Scalars['ID']['input']>;
};

/** A single rule in a target expression, evaluated from left to right. */
export type TargetClause = {
  __typename?: 'TargetClause';
  connector?: Maybe<TargetClauseConnector>;
  op: TargetClauseOperator;
  subject: TargetClauseSubject;
  values: Array<Scalars['String']['output']>;
};

export enum TargetClauseConnector {
  And = 'and',
  Or = 'or'
}

export type TargetClauseInput = {
  connector?: InputMaybe<TargetClauseConnector>;
  op: TargetClauseOperator;
  subject: TargetClauseSubject;
  values: Array<Scalars['String']['input']>;
};

export enum TargetClauseOperator {
  Is = 'is',
  IsNot = 'is_not',
  IsNotOneOf = 'is_not_one_of',
  IsOneOf = 'is_one_of'
}

export enum TargetClauseSubject {
  Device = 'device',
  DeviceRole = 'device_role',
  DeviceType = 'device_type',
  Group = 'group',
  ReportedCapability = 'reported_capability',
  Room = 'room',
  WritableCapability = 'writable_capability'
}

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
  hapticsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  language?: InputMaybe<Language>;
  name?: InputMaybe<Scalars['String']['input']>;
  temperatureUnit?: InputMaybe<TemperatureUnit>;
  theme?: InputMaybe<Theme>;
  timeFormat?: InputMaybe<TimeFormat>;
};

export type UpdateDeviceInput = {
  disabled?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Sets the visual fallback brightness (0-254). Pass null to clear it and show
   * the device at full strength. Omit the field to leave it alone.
   */
  displayBrightness?: InputMaybe<Scalars['Int']['input']>;
  /**
   * Sets the visual fallback colour (`#rrggbb`). Pass null to clear it and use
   * the default warm-light colour. Omit the field to leave it alone.
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
  definition?: InputMaybe<SceneDefinitionInput>;
  icon?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateWebhookEndpointInput = {
  enabled: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  rateLimitCount: Scalars['Int']['input'];
  rateLimitWindowMs: Scalars['Int']['input'];
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
  /**
   * Whether supported touch devices provide brief haptic feedback for direct
   * interactions. Present on full user loads, null on attribution references.
   */
  hapticsEnabled?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  /** UI language preference. Present on full user loads. */
  language?: Maybe<Language>;
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

export enum VibeFieldDomain {
  FullColor = 'full_color',
  WhiteAmbience = 'white_ambience'
}

export type VibeFieldSample = {
  __typename?: 'VibeFieldSample';
  brightness?: Maybe<Scalars['Float']['output']>;
  chroma?: Maybe<Scalars['Float']['output']>;
  hue?: Maybe<Scalars['Float']['output']>;
  lightness?: Maybe<Scalars['Float']['output']>;
  mireds?: Maybe<Scalars['Float']['output']>;
};

export type VibePreset = {
  __typename?: 'VibePreset';
  brightness: Scalars['Float']['output'];
  category: Scalars['String']['output'];
  cycleSeconds: Scalars['Float']['output'];
  domain: VibeFieldDomain;
  id: Scalars['ID']['output'];
  movement: Scalars['Float']['output'];
  preview: ScenePreview;
  seed: Scalars['String']['output'];
};

export type VibePreviewResult = {
  __typename?: 'VibePreviewResult';
  brightness: Scalars['Float']['output'];
  cycleSeconds: Scalars['Float']['output'];
  domain: VibeFieldDomain;
  maximumLightness: Scalars['Float']['output'];
  minimumLightness: Scalars['Float']['output'];
  movement: Scalars['Float']['output'];
  preview: ScenePreview;
  seed: Scalars['String']['output'];
};

export type VibeSourceInput = {
  guided?: InputMaybe<GuidedVibeRecipeInput>;
  photo?: InputMaybe<PhotoSampleInput>;
  preset?: InputMaybe<PresetVibeRecipeInput>;
};

export enum VibeSourceKind {
  Guided = 'guided',
  Photo = 'photo',
  Preset = 'preset'
}

export type WebhookDelivery = {
  __typename?: 'WebhookDelivery';
  body?: Maybe<Scalars['String']['output']>;
  bodySize: Scalars['Int']['output'];
  clientIp: Scalars['String']['output'];
  contentType: Scalars['String']['output'];
  durationMs: Scalars['Int']['output'];
  endpointId: Scalars['ID']['output'];
  headerNames: Array<Scalars['String']['output']>;
  httpStatus: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  outcome: Scalars['String']['output'];
  queryKeys: Array<Scalars['String']['output']>;
  receivedAt: Scalars['DateTime']['output'];
  requestId?: Maybe<Scalars['String']['output']>;
  userAgent: Scalars['String']['output'];
};

export type WebhookEndpoint = {
  __typename?: 'WebhookEndpoint';
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  enabled: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  lastDeliveryAt?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  rateLimitCount: Scalars['Int']['output'];
  rateLimitWindowMs: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type WebhookSecretResult = {
  __typename?: 'WebhookSecretResult';
  endpoint: WebhookEndpoint;
  secretPath: Scalars['String']['output'];
};

export type Zigbee2MqttBinding = {
  __typename?: 'Zigbee2MqttBinding';
  cluster: Scalars['String']['output'];
  targetEndpoint?: Maybe<Scalars['Int']['output']>;
  targetGroupId?: Maybe<Scalars['Int']['output']>;
  targetIeeeAddress?: Maybe<Scalars['String']['output']>;
  targetType: Scalars['String']['output'];
};

export type Zigbee2MqttBridgeInfo = {
  __typename?: 'Zigbee2MqttBridgeInfo';
  adapterType?: Maybe<Scalars['String']['output']>;
  channel?: Maybe<Scalars['Int']['output']>;
  extendedPanId?: Maybe<Scalars['String']['output']>;
  firmwareVersion?: Maybe<Scalars['String']['output']>;
  panId?: Maybe<Scalars['Int']['output']>;
  zigbee2MqttCommit?: Maybe<Scalars['String']['output']>;
  zigbee2MqttVersion?: Maybe<Scalars['String']['output']>;
  zigbeeHerdsmanConvertersVersion?: Maybe<Scalars['String']['output']>;
  zigbeeHerdsmanVersion?: Maybe<Scalars['String']['output']>;
};

export type Zigbee2MqttConfig = {
  __typename?: 'Zigbee2MqttConfig';
  /** Devices currently sharing Zigbee's continuous output lane. */
  activeContinuousDeviceIds: Array<Scalars['ID']['output']>;
  broker: Scalars['String']['output'];
  continuousCommandsPerSecond: Scalars['Int']['output'];
  enabled: Scalars['Boolean']['output'];
  frontendUrl?: Maybe<Scalars['String']['output']>;
  interactiveCommandsPerSecond: Scalars['Int']['output'];
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
  continuousCommandsPerSecond?: Scalars['Int']['input'];
  enabled: Scalars['Boolean']['input'];
  frontendUrl?: InputMaybe<Scalars['String']['input']>;
  interactiveCommandsPerSecond?: Scalars['Int']['input'];
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

export type Zigbee2MqttDeviceDefinition = {
  __typename?: 'Zigbee2MqttDeviceDefinition';
  description?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  model?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  supportsOta?: Maybe<Scalars['Boolean']['output']>;
  vendor?: Maybe<Scalars['String']['output']>;
};

export type Zigbee2MqttDeviceDocumentation = {
  __typename?: 'Zigbee2MqttDeviceDocumentation';
  batteryType?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  exposes: Array<Scalars['String']['output']>;
  lastCheckedAt: Scalars['DateTime']['output'];
  model?: Maybe<Scalars['String']['output']>;
  sourceUrl: Scalars['String']['output'];
  vendor?: Maybe<Scalars['String']['output']>;
};

export type Zigbee2MqttDeviceMetadata = {
  __typename?: 'Zigbee2MqttDeviceMetadata';
  addressVendor?: Maybe<Scalars['String']['output']>;
  bridgeInfo?: Maybe<Zigbee2MqttBridgeInfo>;
  dateCode?: Maybe<Scalars['String']['output']>;
  definition?: Maybe<Zigbee2MqttDeviceDefinition>;
  definitionUrl?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentation?: Maybe<Zigbee2MqttDeviceDocumentation>;
  endpoints: Array<Zigbee2MqttEndpoint>;
  groups: Array<Zigbee2MqttGroupReference>;
  ieeeAddress?: Maybe<Scalars['String']['output']>;
  imageCandidate: Scalars['Boolean']['output'];
  imageVersion?: Maybe<Scalars['String']['output']>;
  interviewCompleted?: Maybe<Scalars['Boolean']['output']>;
  interviewState?: Maybe<Scalars['String']['output']>;
  interviewing?: Maybe<Scalars['Boolean']['output']>;
  manufacturer?: Maybe<Scalars['String']['output']>;
  modelId?: Maybe<Scalars['String']['output']>;
  networkAddress?: Maybe<Scalars['Int']['output']>;
  networkType?: Maybe<Scalars['String']['output']>;
  ota: Zigbee2MqttOtaStatus;
  powerSource?: Maybe<Scalars['String']['output']>;
  softwareBuildId?: Maybe<Scalars['String']['output']>;
  supported?: Maybe<Scalars['Boolean']['output']>;
};

export type Zigbee2MqttEndpoint = {
  __typename?: 'Zigbee2MqttEndpoint';
  bindings: Array<Zigbee2MqttBinding>;
  deviceId?: Maybe<Scalars['Int']['output']>;
  id: Scalars['Int']['output'];
  inputClusters: Array<Scalars['String']['output']>;
  outputClusters: Array<Scalars['String']['output']>;
  profileId?: Maybe<Scalars['Int']['output']>;
  reportings: Array<Zigbee2MqttReporting>;
};

export type Zigbee2MqttGroupReference = {
  __typename?: 'Zigbee2MqttGroupReference';
  endpoint: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  providerGroupId: Scalars['String']['output'];
};

export type Zigbee2MqttOtaStatus = {
  __typename?: 'Zigbee2MqttOtaStatus';
  installedVersion?: Maybe<Scalars['String']['output']>;
  latestVersion?: Maybe<Scalars['String']['output']>;
  progress?: Maybe<Scalars['Float']['output']>;
  state?: Maybe<Scalars['String']['output']>;
};

export type Zigbee2MqttReporting = {
  __typename?: 'Zigbee2MqttReporting';
  attribute: Scalars['String']['output'];
  cluster: Scalars['String']['output'];
  maximumReportInterval?: Maybe<Scalars['Int']['output']>;
  minimumReportInterval?: Maybe<Scalars['Int']['output']>;
  reportableChange?: Maybe<Scalars['Float']['output']>;
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


export type E2EAutomationsCreateGroupMutation = { __typename?: 'Mutation', createGroup: { __typename?: 'Group', id: string, name?: string | null } };

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

export type E2EZigbeeDeviceMetadataQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EZigbeeDeviceMetadataQuery = { __typename?: 'Query', device?: { __typename?: 'Device', zigbee2Mqtt?: { __typename?: 'Zigbee2MqttDeviceMetadata', imageCandidate: boolean, imageVersion?: string | null, ieeeAddress?: string | null, networkAddress?: number | null, supported?: boolean | null, softwareBuildId?: string | null, definitionUrl?: string | null, definition?: { __typename?: 'Zigbee2MqttDeviceDefinition', model?: string | null, vendor?: string | null, description?: string | null, supportsOta?: boolean | null } | null, ota: { __typename?: 'Zigbee2MqttOtaStatus', state?: string | null, installedVersion?: string | null, latestVersion?: string | null, progress?: number | null }, endpoints: Array<{ __typename?: 'Zigbee2MqttEndpoint', id: number, profileId?: number | null, deviceId?: number | null, inputClusters: Array<string>, outputClusters: Array<string>, bindings: Array<{ __typename?: 'Zigbee2MqttBinding', cluster: string, targetType: string, targetIeeeAddress?: string | null, targetEndpoint?: number | null, targetGroupId?: number | null }>, reportings: Array<{ __typename?: 'Zigbee2MqttReporting', cluster: string, attribute: string, minimumReportInterval?: number | null, maximumReportInterval?: number | null, reportableChange?: number | null }> }>, groups: Array<{ __typename?: 'Zigbee2MqttGroupReference', id: string, providerGroupId: string, name: string, endpoint: number }>, bridgeInfo?: { __typename?: 'Zigbee2MqttBridgeInfo', adapterType?: string | null, firmwareVersion?: string | null, channel?: number | null, panId?: number | null, extendedPanId?: string | null, zigbee2MqttVersion?: string | null, zigbee2MqttCommit?: string | null, zigbeeHerdsmanVersion?: string | null, zigbeeHerdsmanConvertersVersion?: string | null } | null } | null } | null };

export type E2ESetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type E2ESetDeviceStateMutation = { __typename?: 'Mutation', setTargetState: boolean };

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


export type E2ECreateGroupMutation = { __typename?: 'Mutation', createGroup: { __typename?: 'Group', id: string, name?: string | null, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name?: string | null }> } };

export type E2EAddGroupMemberMutationVariables = Exact<{
  input: AddGroupMemberInput;
}>;


export type E2EAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'Group', id: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string, device?: { __typename?: 'Device', id: string, name?: string | null } | null }> } };

export type E2EGroupQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EGroupQuery = { __typename?: 'Query', group?: { __typename?: 'Group', id: string, name?: string | null, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name?: string | null }> } | null };

export type E2EDeleteGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EDeleteGroupMutation = { __typename?: 'Mutation', deleteGroup: boolean };

export type E2EGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name?: string | null, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name?: string | null }> }> };

export type E2EUpdateGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateGroupInput;
}>;


export type E2EUpdateGroupMutation = { __typename?: 'Mutation', updateGroup: { __typename?: 'Group', id: string, name?: string | null } };

export type E2ERemoveGroupMemberMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2ERemoveGroupMemberMutation = { __typename?: 'Mutation', removeGroupMember: { __typename?: 'Group', id: string, members: Array<{ __typename?: 'GroupMember', id: string }> } };

export type E2EGroupsDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EGroupsDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name?: string | null }> };

export type BrowserGuestCreateMutationVariables = Exact<{
  input: CreateGuestInput;
}>;


export type BrowserGuestCreateMutation = { __typename?: 'Mutation', createGuest: { __typename?: 'Guest', id: string } };

export type BrowserGuestDeleteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type BrowserGuestDeleteMutation = { __typename?: 'Mutation', deleteGuest: boolean };

export type E2ECreateGuestMutationVariables = Exact<{
  input: CreateGuestInput;
}>;


export type E2ECreateGuestMutation = { __typename?: 'Mutation', createGuest: { __typename?: 'Guest', id: string, name: string, expiresAt: any, createdAt: any } };

export type E2EExtendGuestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EExtendGuestMutation = { __typename?: 'Mutation', extendGuest: { __typename?: 'Guest', id: string, expiresAt: any } };

export type E2EDeleteGuestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EDeleteGuestMutation = { __typename?: 'Mutation', deleteGuest: boolean };

export type BrowserSceneFixturesQueryVariables = Exact<{ [key: string]: never; }>;


export type BrowserSceneFixturesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, friendlyName: string, type: string }>, vibePresets: Array<{ __typename?: 'VibePreset', id: string }> };

export type BrowserSceneCreateStructureMutationVariables = Exact<{
  room: CreateRoomInput;
  group: CreateGroupInput;
}>;


export type BrowserSceneCreateStructureMutation = { __typename?: 'Mutation', room: { __typename?: 'Room', id: string }, group: { __typename?: 'Group', id: string } };

export type BrowserSceneAddRoomMemberMutationVariables = Exact<{
  input: AddRoomMemberInput;
}>;


export type BrowserSceneAddRoomMemberMutation = { __typename?: 'Mutation', addRoomMember: { __typename?: 'Room', id: string } };

export type BrowserSceneAddGroupMemberMutationVariables = Exact<{
  input: AddGroupMemberInput;
}>;


export type BrowserSceneAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'Group', id: string } };

export type BrowserSceneDeleteFixturesMutationVariables = Exact<{
  roomId: Scalars['ID']['input'];
  groupId: Scalars['ID']['input'];
}>;


export type BrowserSceneDeleteFixturesMutation = { __typename?: 'Mutation', deleteRoom: boolean, deleteGroup: boolean };

export type BrowserSceneDeleteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type BrowserSceneDeleteMutation = { __typename?: 'Mutation', deleteScene: boolean };

export type E2EScenesDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EScenesDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name?: string | null, type: string }> };

export type E2ECreateSceneMutationVariables = Exact<{
  input: CreateSceneInput;
}>;


export type E2ECreateSceneMutation = { __typename?: 'Mutation', createScene: { __typename?: 'Scene', id: string, name: string, targets: Array<{ __typename?: 'SceneTargetEntry', targetType: SceneTargetType, targetId: string }>, lighting: { __typename?: 'SceneLighting', overrides: Array<{ __typename?: 'SceneLightOverride', deviceId: string, kind: SceneLightOverrideKind, state?: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null } | null }> } } };

export type E2EApplySceneMutationVariables = Exact<{
  sceneId: Scalars['ID']['input'];
}>;


export type E2EApplySceneMutation = { __typename?: 'Mutation', applyScene: { __typename?: 'Scene', id: string, name: string } };

export type E2ESceneQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2ESceneQuery = { __typename?: 'Query', scene?: { __typename?: 'Scene', id: string, name: string, targets: Array<{ __typename?: 'SceneTargetEntry', targetType: SceneTargetType, targetId: string }>, lighting: { __typename?: 'SceneLighting', overrides: Array<{ __typename?: 'SceneLightOverride', deviceId: string, kind: SceneLightOverrideKind, state?: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null } | null }> } } | null };

export type E2EDeleteSceneMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EDeleteSceneMutation = { __typename?: 'Mutation', deleteScene: boolean };

export type E2EScenesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EScenesQuery = { __typename?: 'Query', scenes: Array<{ __typename?: 'Scene', id: string, name: string, targets: Array<{ __typename?: 'SceneTargetEntry', targetType: SceneTargetType, targetId: string }>, lighting: { __typename?: 'SceneLighting', overrides: Array<{ __typename?: 'SceneLightOverride', deviceId: string, kind: SceneLightOverrideKind, state?: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null } | null }> } }> };

export type E2EUpdateSceneMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateSceneInput;
}>;


export type E2EUpdateSceneMutation = { __typename?: 'Mutation', updateScene: { __typename?: 'Scene', id: string, name: string, targets: Array<{ __typename?: 'SceneTargetEntry', targetType: SceneTargetType, targetId: string }>, lighting: { __typename?: 'SceneLighting', overrides: Array<{ __typename?: 'SceneLightOverride', deviceId: string, kind: SceneLightOverrideKind, state?: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null } | null }> } } };

export type E2EScenesCreateGroupMutationVariables = Exact<{
  input: CreateGroupInput;
}>;


export type E2EScenesCreateGroupMutation = { __typename?: 'Mutation', createGroup: { __typename?: 'Group', id: string, name?: string | null } };

export type E2EScenesAddGroupMemberMutationVariables = Exact<{
  input: AddGroupMemberInput;
}>;


export type E2EScenesAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'Group', id: string } };

export type E2EScenesDeleteGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EScenesDeleteGroupMutation = { __typename?: 'Mutation', deleteGroup: boolean };

export type BrowserSearchCreateFixturesMutationVariables = Exact<{
  room: CreateRoomInput;
  group: CreateGroupInput;
  scene: CreateSceneInput;
  automation: CreateAutomationInput;
  effect: CreateEffectInput;
  alarm: RaiseAlarmInput;
}>;


export type BrowserSearchCreateFixturesMutation = { __typename?: 'Mutation', room: { __typename?: 'Room', id: string }, group: { __typename?: 'Group', id: string }, scene: { __typename?: 'Scene', id: string }, automation: { __typename?: 'AutomationGraph', id: string }, effect: { __typename?: 'Effect', id: string }, alarm: { __typename?: 'Alarm', id: string } };

export type BrowserSearchDeleteFixturesMutationVariables = Exact<{
  roomId: Scalars['ID']['input'];
  groupId: Scalars['ID']['input'];
  sceneId: Scalars['ID']['input'];
  automationId: Scalars['ID']['input'];
  effectId: Scalars['ID']['input'];
  alarmId: Scalars['ID']['input'];
}>;


export type BrowserSearchDeleteFixturesMutation = { __typename?: 'Mutation', deleteRoom: boolean, deleteGroup: boolean, deleteScene: boolean, deleteAutomation: boolean, deleteEffect: boolean, deleteAlarm: boolean };

export type BrowserSearchMaintenanceTasksQueryVariables = Exact<{ [key: string]: never; }>;


export type BrowserSearchMaintenanceTasksQuery = { __typename?: 'Query', maintenanceTasks: Array<{ __typename?: 'MaintenanceTask', kind: MaintenanceKind }> };

export type BrowserSearchDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type BrowserSearchDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, friendlyName: string }> };

export type BrowserSearchCleanUpDeletedDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
}>;


export type BrowserSearchCleanUpDeletedDeviceMutation = { __typename?: 'Mutation', restoreDevice: { __typename?: 'Device', id: string }, updateDevice: { __typename?: 'Device', id: string } };

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


export type E2ECreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'User', id: string, username: string, name: string, avatarPath?: string | null, theme?: Theme | null, hapticsEnabled?: boolean | null } };

export type E2EUpdateCurrentUserMutationVariables = Exact<{
  input: UpdateCurrentUserInput;
}>;


export type E2EUpdateCurrentUserMutation = { __typename?: 'Mutation', updateCurrentUser: { __typename?: 'User', id: string, name: string, theme?: Theme | null, hapticsEnabled?: boolean | null } };

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


export type E2EMeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, username: string, name: string, theme?: Theme | null, hapticsEnabled?: boolean | null, avatarPath?: string | null } | null };

export type E2EWebSocketRecoveryDeviceStateQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EWebSocketRecoveryDeviceStateQuery = { __typename?: 'Query', device?: { __typename?: 'Device', state?: { __typename?: 'DeviceState', brightness?: number | null } | null } | null };

export type E2EWebSocketRecoveryLogsQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EWebSocketRecoveryLogsQuery = { __typename?: 'Query', logs: Array<{ __typename?: 'LogEntry', message: string, attrs: string }> };

export type E2EZigbeeMetadataReadyQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EZigbeeMetadataReadyQuery = { __typename?: 'Query', device?: { __typename?: 'Device', zigbee2Mqtt?: { __typename?: 'Zigbee2MqttDeviceMetadata', ieeeAddress?: string | null } | null } | null };

export type E2EMaintenanceTasksQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EMaintenanceTasksQuery = { __typename?: 'Query', maintenanceTasks: Array<{ __typename?: 'MaintenanceTask', id: string, kind: MaintenanceKind }> };

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


export type DashboardApplianceCardSetDeviceStateMutation = { __typename?: 'Mutation', setTargetState: boolean };

export type DashboardLightCardSetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type DashboardLightCardSetDeviceStateMutation = { __typename?: 'Mutation', setTargetState: boolean };

export type DashboardIntegrationsQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardIntegrationsQuery = { __typename?: 'Query', integrations: Array<{ __typename?: 'Integration', provider: string, configured: boolean }> };

export type DeviceActionMenuSimulateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  action: Scalars['String']['input'];
}>;


export type DeviceActionMenuSimulateMutation = { __typename?: 'Mutation', simulateDeviceAction: boolean };

export type DeviceCardSetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type DeviceCardSetDeviceStateMutation = { __typename?: 'Mutation', setTargetState: boolean };

export type DeviceTableSetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type DeviceTableSetDeviceStateMutation = { __typename?: 'Mutation', setTargetState: boolean };

export type UpdateDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
}>;


export type UpdateDeviceMutation = { __typename?: 'Mutation', updateDevice: { __typename?: 'Device', id: string, name?: string | null, icon?: string | null, disabled: boolean, friendlyName: string, seen: boolean, roles: { __typename?: 'DeviceRoles', controlledLoad?: ControlledLoadRole | null, contact?: ContactRole | null } } };

export type MarkDevicesSeenMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type MarkDevicesSeenMutation = { __typename?: 'Mutation', markDevicesSeen: number };

export type DevicesPageDeleteDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DevicesPageDeleteDeviceMutation = { __typename?: 'Mutation', deleteDevice: { __typename?: 'Device', id: string, disabled: boolean, deleted: boolean } };

export type DevicesPageRestoreDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DevicesPageRestoreDeviceMutation = { __typename?: 'Mutation', restoreDevice: { __typename?: 'Device', id: string, disabled: boolean, deleted: boolean } };

export type DevicesPageBatchDeleteDevicesMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type DevicesPageBatchDeleteDevicesMutation = { __typename?: 'Mutation', batchDeleteDevices: number };

export type DevicesPageBatchRestoreDevicesMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type DevicesPageBatchRestoreDevicesMutation = { __typename?: 'Mutation', batchRestoreDevices: number };

export type NativeEffectOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type NativeEffectOptionsQuery = { __typename?: 'Query', nativeEffectOptions: Array<{ __typename?: 'NativeEffectOption', name: string, displayName: string, confirmedDeviceCount: number, untestedDeviceCount: number, unsupportedDeviceCount: number, source: string }> };

export type NativeEffectEditorSupportChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NativeEffectEditorSupportChangedSubscription = { __typename?: 'Subscription', nativeEffectSupportChanged: any };

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


export type EffectRunTargetDrawerRunNativeEffectMutation = { __typename?: 'Mutation', runNativeEffect: { __typename?: 'NativeEffectRunResult', runId: string, devices: Array<{ __typename?: 'NativeEffectDeviceRunResult', deviceId: string, status: NativeEffectRunStatus }> } };

export type EffectRunTargetDrawerNativeSupportQueryVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type EffectRunTargetDrawerNativeSupportQuery = { __typename?: 'Query', nativeEffectSupport: Array<{ __typename?: 'NativeEffectDeviceSupport', deviceId: string, status: NativeEffectSupportStatus }> };

export type EffectRunTargetDrawerNativeSupportChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type EffectRunTargetDrawerNativeSupportChangedSubscription = { __typename?: 'Subscription', nativeEffectSupportChanged: any };

export type EffectTimelineEditorNativeOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type EffectTimelineEditorNativeOptionsQuery = { __typename?: 'Query', nativeEffectOptions: Array<{ __typename?: 'NativeEffectOption', name: string, displayName: string, confirmedDeviceCount: number, untestedDeviceCount: number, unsupportedDeviceCount: number }> };

export type EffectTimelineNativeSupportChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type EffectTimelineNativeSupportChangedSubscription = { __typename?: 'Subscription', nativeEffectSupportChanged: any };

export type EffectsPageNativeOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type EffectsPageNativeOptionsQuery = { __typename?: 'Query', nativeEffectOptions: Array<{ __typename?: 'NativeEffectOption', name: string, displayName: string, source: string, confirmedDeviceCount: number, untestedDeviceCount: number, unsupportedDeviceCount: number }> };

export type EffectsPageNativeSupportChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type EffectsPageNativeSupportChangedSubscription = { __typename?: 'Subscription', nativeEffectSupportChanged: any };

export type GuestSessionCurrentQueryVariables = Exact<{ [key: string]: never; }>;


export type GuestSessionCurrentQuery = { __typename?: 'Query', currentGuest?: { __typename?: 'Guest', id: string, expiresAt: any } | null };

export type GuestSessionChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type GuestSessionChangedSubscription = { __typename?: 'Subscription', guestChanged: { __typename?: 'GuestChangeEvent', kind: GuestChangeKind, guest?: { __typename?: 'Guest', id: string, expiresAt: any } | null } };

export type RoomsPageSetDeviceStateMutationVariables = Exact<{
  targetId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type RoomsPageSetDeviceStateMutation = { __typename?: 'Mutation', setTargetState: boolean };

export type SceneCreateVibePreviewQueryVariables = Exact<{
  input: PreviewVibeInput;
}>;


export type SceneCreateVibePreviewQuery = { __typename?: 'Query', previewVibe: { __typename?: 'VibePreviewResult', domain: VibeFieldDomain, seed: string, brightness: number, movement: number, cycleSeconds: number, minimumLightness: number, maximumLightness: number, preview: { __typename?: 'ScenePreview', width: number, height: number, pixels: Array<{ __typename?: 'PreviewPixel', r: number, g: number, b: number }>, swatches: Array<{ __typename?: 'PreviewSwatch', x: number, y: number, color: { __typename?: 'PreviewPixel', r: number, g: number, b: number } }> } } };

export type SceneOutputRateQueryVariables = Exact<{ [key: string]: never; }>;


export type SceneOutputRateQuery = { __typename?: 'Query', zigbee2MqttConfig?: { __typename?: 'Zigbee2MqttConfig', continuousCommandsPerSecond: number, activeContinuousDeviceIds: Array<string> } | null };

export type StateHistoryQueryVariables = Exact<{
  filter: StateHistoryFilter;
}>;


export type StateHistoryQuery = { __typename?: 'Query', stateHistory: Array<{ __typename?: 'StateSeries', deviceId: string, field: string, valueType: StateSeriesValueType, points: Array<{ __typename?: 'StateSeriesPoint', at: any, numberValue?: number | null, booleanValue?: boolean | null, textValue?: string | null }> }> };

export type AggregatedStateHistoryQueryVariables = Exact<{
  filter: AggregatedStateHistoryFilter;
}>;


export type AggregatedStateHistoryQuery = { __typename?: 'Query', aggregatedStateHistory: Array<{ __typename?: 'AggregatedSeries', field: string, points: Array<{ __typename?: 'NumericSeriesPoint', at: any, value: number }> }> };

export type GuidedVibeChoicesQueryVariables = Exact<{
  input: GuidedVibeRoundInput;
}>;


export type GuidedVibeChoicesQuery = { __typename?: 'Query', guidedVibeRound: { __typename?: 'GuidedVibeRound', round: number, canFinish: boolean, complete: boolean, options: Array<{ __typename?: 'GuidedVibeOption', id: string, labelId: string, preview: { __typename?: 'ScenePreview', width: number, height: number, pixels: Array<{ __typename?: 'PreviewPixel', r: number, g: number, b: number }>, swatches: Array<{ __typename?: 'PreviewSwatch', x: number, y: number, color: { __typename?: 'PreviewPixel', r: number, g: number, b: number } }> } }> } };

export type SceneEditorVibePreviewQueryVariables = Exact<{
  input: PreviewVibeInput;
}>;


export type SceneEditorVibePreviewQuery = { __typename?: 'Query', previewVibe: { __typename?: 'VibePreviewResult', domain: VibeFieldDomain, seed: string, brightness: number, movement: number, cycleSeconds: number, preview: { __typename?: 'ScenePreview', width: number, height: number, pixels: Array<{ __typename?: 'PreviewPixel', r: number, g: number, b: number }>, swatches: Array<{ __typename?: 'PreviewSwatch', x: number, y: number, color: { __typename?: 'PreviewPixel', r: number, g: number, b: number } }> } } };

export type AutomationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AutomationQuery = { __typename?: 'Query', automation?: { __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, compilable: boolean, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string, positionX: number, positionY: number, runtimeState: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }> } | null };

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

export type GroupCommandsSetTargetStateMutationVariables = Exact<{
  target: CommandTargetInput;
  state: DeviceStateInput;
}>;


export type GroupCommandsSetTargetStateMutation = { __typename?: 'Mutation', setTargetState: boolean };

export type ActiveAlarmsQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveAlarmsQuery = { __typename?: 'Query', alarms: Array<{ __typename?: 'Alarm', id: string, latestRowId: string, severity: AlarmSeverity, kind: AlarmKind, message?: string | null, messageCode?: string | null, messageArguments: string, source: string, count: number, firstRaisedAt: any, lastRaisedAt: any }> };

export type AlarmEventsSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type AlarmEventsSubscription = { __typename?: 'Subscription', alarmEvent: { __typename?: 'AlarmEvent', kind: AlarmEventKind, clearedAlarmId?: string | null, alarm?: { __typename?: 'Alarm', id: string, latestRowId: string, severity: AlarmSeverity, kind: AlarmKind, message?: string | null, messageCode?: string | null, messageArguments: string, source: string, count: number, firstRaisedAt: any, lastRaisedAt: any } | null } };

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


export type DevicesInitQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name?: string | null, icon?: string | null, displayColor?: string | null, displayBrightness?: number | null, source: string, type: string, available: boolean, disabled: boolean, deleted: boolean, friendlyName: string, seen: boolean, lastSeen?: any | null, roles: { __typename?: 'DeviceRoles', controlledLoad?: ControlledLoadRole | null, contact?: ContactRole | null }, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, label?: string | null, description?: string | null, category: CapabilityCategory, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, reportsValue: boolean, canSet: boolean, canGet: boolean }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, occupancy?: boolean | null, contact?: boolean | null, orientation?: string | null, devicePosture?: string | null, linkQuality?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null, configuration: Array<{ __typename?: 'DeviceConfigurationEntry', capability: string, booleanValue?: boolean | null, numberValue?: number | null, stringValue?: string | null }> }> };

export type DeviceStoreStateChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceStoreStateChangedSubscription = { __typename?: 'Subscription', deviceStateChanged: { __typename?: 'DeviceStateEvent', deviceId: string, state: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, occupancy?: boolean | null, contact?: boolean | null, orientation?: string | null, devicePosture?: string | null, linkQuality?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } } };

export type DeviceStoreConfigurationChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceStoreConfigurationChangedSubscription = { __typename?: 'Subscription', deviceConfigurationChanged: { __typename?: 'DeviceConfigurationEvent', deviceId: string, values: Array<{ __typename?: 'DeviceConfigurationEntry', capability: string, booleanValue?: boolean | null, numberValue?: number | null, stringValue?: string | null }> } };

export type DeviceAvailabilityChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceAvailabilityChangedSubscription = { __typename?: 'Subscription', deviceAvailabilityChanged: { __typename?: 'DeviceAvailabilityEvent', deviceId: string, available: boolean } };

export type DeviceAddedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceAddedSubscription = { __typename?: 'Subscription', deviceAdded: { __typename?: 'Device', id: string, name?: string | null, friendlyName: string, seen: boolean, disabled: boolean, deleted: boolean, source: string, type: string, available: boolean, lastSeen?: any | null, roles: { __typename?: 'DeviceRoles', controlledLoad?: ControlledLoadRole | null, contact?: ContactRole | null }, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, label?: string | null, description?: string | null, category: CapabilityCategory, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, reportsValue: boolean, canSet: boolean, canGet: boolean }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, occupancy?: boolean | null, contact?: boolean | null, orientation?: string | null, devicePosture?: string | null, linkQuality?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null, configuration: Array<{ __typename?: 'DeviceConfigurationEntry', capability: string, booleanValue?: boolean | null, numberValue?: number | null, stringValue?: string | null }> } };

export type DeviceRemovedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceRemovedSubscription = { __typename?: 'Subscription', deviceRemoved: string };

export type DeviceStoreUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceStoreUpdatedSubscription = { __typename?: 'Subscription', deviceUpdated: { __typename?: 'Device', id: string, name?: string | null, icon?: string | null, displayColor?: string | null, displayBrightness?: number | null, source: string, type: string, available: boolean, disabled: boolean, deleted: boolean, friendlyName: string, seen: boolean, lastSeen?: any | null, roles: { __typename?: 'DeviceRoles', controlledLoad?: ControlledLoadRole | null, contact?: ContactRole | null }, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, label?: string | null, description?: string | null, category: CapabilityCategory, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, reportsValue: boolean, canSet: boolean, canGet: boolean }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, occupancy?: boolean | null, contact?: boolean | null, orientation?: string | null, devicePosture?: string | null, linkQuality?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null, configuration: Array<{ __typename?: 'DeviceConfigurationEntry', capability: string, booleanValue?: boolean | null, numberValue?: number | null, stringValue?: string | null }> } };

export type EffectFieldsFragment = { __typename?: 'Effect', id: string, name: string, source: string, icon?: string | null, kind: EffectKind, nativeName?: string | null, loop: boolean, durationMs: number, requiredCapabilities: Array<string>, tracks: Array<{ __typename?: 'EffectTrack', id: string, clips: Array<{ __typename?: 'EffectClip', id: string }> }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null };

export type EffectsStoreQueryVariables = Exact<{ [key: string]: never; }>;


export type EffectsStoreQuery = { __typename?: 'Query', effects: Array<{ __typename?: 'Effect', id: string, name: string, source: string, icon?: string | null, kind: EffectKind, nativeName?: string | null, loop: boolean, durationMs: number, requiredCapabilities: Array<string>, tracks: Array<{ __typename?: 'EffectTrack', id: string, clips: Array<{ __typename?: 'EffectClip', id: string }> }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type EffectsStoreCreateMutationVariables = Exact<{
  input: CreateEffectInput;
}>;


export type EffectsStoreCreateMutation = { __typename?: 'Mutation', createEffect: { __typename?: 'Effect', id: string, name: string, source: string, icon?: string | null, kind: EffectKind, nativeName?: string | null, loop: boolean, durationMs: number, requiredCapabilities: Array<string>, tracks: Array<{ __typename?: 'EffectTrack', id: string, clips: Array<{ __typename?: 'EffectClip', id: string }> }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type EffectsStoreUpdateMutationVariables = Exact<{
  input: UpdateEffectInput;
}>;


export type EffectsStoreUpdateMutation = { __typename?: 'Mutation', updateEffect: { __typename?: 'Effect', id: string, name: string, source: string, icon?: string | null, kind: EffectKind, nativeName?: string | null, loop: boolean, durationMs: number, requiredCapabilities: Array<string>, tracks: Array<{ __typename?: 'EffectTrack', id: string, clips: Array<{ __typename?: 'EffectClip', id: string }> }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type EffectsStoreDeleteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type EffectsStoreDeleteMutation = { __typename?: 'Mutation', deleteEffect: boolean };

export type EffectsStoreBatchDeleteMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type EffectsStoreBatchDeleteMutation = { __typename?: 'Mutation', batchDeleteEffects: number };

export type FloorplanFieldsFragment = { __typename?: 'Floorplan', id: string, name: string, vertices: Array<{ __typename?: 'FloorplanVertex', id: string, x: number, y: number }>, walls: Array<{ __typename?: 'FloorplanWall', id: string, vertexA: string, vertexB: string, thickness: number, curveX?: number | null, curveY?: number | null }>, openings: Array<{ __typename?: 'FloorplanOpening', id: string, wallId: string, t: number, width: number, kind: FloorplanOpeningKind }>, doorBindings: Array<{ __typename?: 'FloorplanDoorBinding', openingId: string, deviceId: string, hingeSide: FloorplanDoorHingeSide, swingSide: FloorplanDoorSwingSide }>, rooms: Array<{ __typename?: 'FloorplanRoom', id: string, name?: string | null, roomId?: string | null, vertexIds: Array<string> }>, placements: Array<{ __typename?: 'FloorplanPlacement', memberType: string, memberId: string, x: number, y: number }>, furniture: Array<{ __typename?: 'FloorplanFurniture', id: string, kind: string, x: number, y: number, width: number, height: number, rotation: number, occluder: boolean }> };

export type FloorplanStoreQueryVariables = Exact<{ [key: string]: never; }>;


export type FloorplanStoreQuery = { __typename?: 'Query', floorplan?: { __typename?: 'Floorplan', id: string, name: string, vertices: Array<{ __typename?: 'FloorplanVertex', id: string, x: number, y: number }>, walls: Array<{ __typename?: 'FloorplanWall', id: string, vertexA: string, vertexB: string, thickness: number, curveX?: number | null, curveY?: number | null }>, openings: Array<{ __typename?: 'FloorplanOpening', id: string, wallId: string, t: number, width: number, kind: FloorplanOpeningKind }>, doorBindings: Array<{ __typename?: 'FloorplanDoorBinding', openingId: string, deviceId: string, hingeSide: FloorplanDoorHingeSide, swingSide: FloorplanDoorSwingSide }>, rooms: Array<{ __typename?: 'FloorplanRoom', id: string, name?: string | null, roomId?: string | null, vertexIds: Array<string> }>, placements: Array<{ __typename?: 'FloorplanPlacement', memberType: string, memberId: string, x: number, y: number }>, furniture: Array<{ __typename?: 'FloorplanFurniture', id: string, kind: string, x: number, y: number, width: number, height: number, rotation: number, occluder: boolean }> } | null };

export type FloorplanStoreUpdateMutationVariables = Exact<{
  input: UpdateFloorplanInput;
}>;


export type FloorplanStoreUpdateMutation = { __typename?: 'Mutation', updateFloorplan: { __typename?: 'Floorplan', id: string, name: string, vertices: Array<{ __typename?: 'FloorplanVertex', id: string, x: number, y: number }>, walls: Array<{ __typename?: 'FloorplanWall', id: string, vertexA: string, vertexB: string, thickness: number, curveX?: number | null, curveY?: number | null }>, openings: Array<{ __typename?: 'FloorplanOpening', id: string, wallId: string, t: number, width: number, kind: FloorplanOpeningKind }>, doorBindings: Array<{ __typename?: 'FloorplanDoorBinding', openingId: string, deviceId: string, hingeSide: FloorplanDoorHingeSide, swingSide: FloorplanDoorSwingSide }>, rooms: Array<{ __typename?: 'FloorplanRoom', id: string, name?: string | null, roomId?: string | null, vertexIds: Array<string> }>, placements: Array<{ __typename?: 'FloorplanPlacement', memberType: string, memberId: string, x: number, y: number }>, furniture: Array<{ __typename?: 'FloorplanFurniture', id: string, kind: string, x: number, y: number, width: number, height: number, rotation: number, occluder: boolean }> } };

export type GroupFieldsFragment = { __typename?: 'Group', id: string, name?: string | null, friendlyName: string, source: string, removed: boolean, icon?: string | null, tags: Array<GroupTag>, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null };

export type GroupsStoreQueryVariables = Exact<{ [key: string]: never; }>;


export type GroupsStoreQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name?: string | null, friendlyName: string, source: string, removed: boolean, icon?: string | null, tags: Array<GroupTag>, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type GroupsStoreChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type GroupsStoreChangedSubscription = { __typename?: 'Subscription', groupsChanged: Array<string> };

export type GroupsStoreCreateMutationVariables = Exact<{
  input: CreateGroupInput;
}>;


export type GroupsStoreCreateMutation = { __typename?: 'Mutation', createGroup: { __typename?: 'Group', id: string, name?: string | null, friendlyName: string, source: string, removed: boolean, icon?: string | null, tags: Array<GroupTag>, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type GroupsStoreUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateGroupInput;
}>;


export type GroupsStoreUpdateMutation = { __typename?: 'Mutation', updateGroup: { __typename?: 'Group', id: string, name?: string | null, friendlyName: string, source: string, removed: boolean, icon?: string | null, tags: Array<GroupTag>, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

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


export type GroupsStoreAddMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'Group', id: string, name?: string | null, friendlyName: string, source: string, removed: boolean, icon?: string | null, tags: Array<GroupTag>, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type GroupsStoreRemoveMemberMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GroupsStoreRemoveMemberMutation = { __typename?: 'Mutation', removeGroupMember: { __typename?: 'Group', id: string, name?: string | null, friendlyName: string, source: string, removed: boolean, icon?: string | null, tags: Array<GroupTag>, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type LocalizedNamesBootstrapQueryVariables = Exact<{ [key: string]: never; }>;


export type LocalizedNamesBootstrapQuery = { __typename?: 'Query', localizedNameSets: Array<{ __typename?: 'LocalizedNameSet', entityType: string, entityId: string, sourceLanguage: Language, translations: Array<{ __typename?: 'LocalizedName', language: Language, value: string }> }>, settings: Array<{ __typename?: 'Setting', key: string, value: string }> };

export type DashboardLocalizedNamesBootstrapQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardLocalizedNamesBootstrapQuery = { __typename?: 'Query', dashboardLocalization: { __typename?: 'DashboardLocalization', defaultContentLanguage: Language, translateStandardRoomNames: boolean, localizedNameSets: Array<{ __typename?: 'LocalizedNameSet', entityType: string, entityId: string, sourceLanguage: Language, translations: Array<{ __typename?: 'LocalizedName', language: Language, value: string }> }> } };

export type UpdateLocalizedNameSetMutationVariables = Exact<{
  input: LocalizedNameSetInput;
}>;


export type UpdateLocalizedNameSetMutation = { __typename?: 'Mutation', updateLocalizedNameSet: { __typename?: 'LocalizedNameSet', entityType: string, entityId: string, sourceLanguage: Language, translations: Array<{ __typename?: 'LocalizedName', language: Language, value: string }> } };

export type MaintenanceTasksQueryVariables = Exact<{ [key: string]: never; }>;


export type MaintenanceTasksQuery = { __typename?: 'Query', maintenanceTasks: Array<{ __typename?: 'MaintenanceTask', id: string, kind: MaintenanceKind, currentValue?: string | null, targetValue?: string | null, value?: number | null, context?: string | null, actionUrl?: string | null, device?: { __typename?: 'Device', id: string, name?: string | null, friendlyName: string, icon?: string | null, type: string, available: boolean, disabled: boolean, deleted: boolean, roles: { __typename?: 'DeviceRoles', contact?: ContactRole | null } } | null }> };

export type CompleteMaintenanceTasksMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type CompleteMaintenanceTasksMutation = { __typename?: 'Mutation', completeMaintenanceTasks: Array<string> };

export type MaintenanceChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type MaintenanceChangedSubscription = { __typename?: 'Subscription', maintenanceChanged: any };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, username: string, name: string, avatarPath?: string | null, theme?: Theme | null, timeFormat?: TimeFormat | null, temperatureUnit?: TemperatureUnit | null, hapticsEnabled?: boolean | null, language?: Language | null, createdAt?: any | null, mustChangePassword?: boolean | null } | null };

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

export type SceneFieldsFragment = { __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null }>, targets: Array<{ __typename?: 'SceneTargetEntry', id: string, targetType: SceneTargetType, targetId: string, name: string, target?: { __typename?: 'Device', id: string, friendlyName: string, type: string, deviceName?: string | null } | { __typename?: 'Group', id: string, friendlyName: string, icon?: string | null, removed: boolean, groupName?: string | null } | { __typename?: 'Room', id: string, name: string, icon?: string | null } | null, expression: Array<{ __typename?: 'TargetClause', connector?: TargetClauseConnector | null, subject: TargetClauseSubject, op: TargetClauseOperator, values: Array<string> }> }>, lighting: { __typename?: 'SceneLighting', dynamicSource?: { __typename?: 'DynamicSceneSource', domain: VibeFieldDomain, sourceKind: VibeSourceKind, presetId?: string | null, seed: string, brightness: number, movement: number, cycleSeconds: number } | null, overrides: Array<{ __typename?: 'SceneLightOverride', deviceId: string, kind: SceneLightOverrideKind, effectId?: string | null, nativeEffectName?: string | null, state?: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> }, supportingStates: Array<{ __typename?: 'SceneSupportingState', deviceId: string, state: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } }>, preview: { __typename?: 'ScenePreview', width: number, height: number, pixels: Array<{ __typename?: 'PreviewPixel', r: number, g: number, b: number }>, swatches: Array<{ __typename?: 'PreviewSwatch', x: number, y: number, color: { __typename?: 'PreviewPixel', r: number, g: number, b: number } }> }, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null };

export type ScenesStoreQueryVariables = Exact<{ [key: string]: never; }>;


export type ScenesStoreQuery = { __typename?: 'Query', scenes: Array<{ __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null }>, targets: Array<{ __typename?: 'SceneTargetEntry', id: string, targetType: SceneTargetType, targetId: string, name: string, target?: { __typename?: 'Device', id: string, friendlyName: string, type: string, deviceName?: string | null } | { __typename?: 'Group', id: string, friendlyName: string, icon?: string | null, removed: boolean, groupName?: string | null } | { __typename?: 'Room', id: string, name: string, icon?: string | null } | null, expression: Array<{ __typename?: 'TargetClause', connector?: TargetClauseConnector | null, subject: TargetClauseSubject, op: TargetClauseOperator, values: Array<string> }> }>, lighting: { __typename?: 'SceneLighting', dynamicSource?: { __typename?: 'DynamicSceneSource', domain: VibeFieldDomain, sourceKind: VibeSourceKind, presetId?: string | null, seed: string, brightness: number, movement: number, cycleSeconds: number } | null, overrides: Array<{ __typename?: 'SceneLightOverride', deviceId: string, kind: SceneLightOverrideKind, effectId?: string | null, nativeEffectName?: string | null, state?: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> }, supportingStates: Array<{ __typename?: 'SceneSupportingState', deviceId: string, state: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } }>, preview: { __typename?: 'ScenePreview', width: number, height: number, pixels: Array<{ __typename?: 'PreviewPixel', r: number, g: number, b: number }>, swatches: Array<{ __typename?: 'PreviewSwatch', x: number, y: number, color: { __typename?: 'PreviewPixel', r: number, g: number, b: number } }> }, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type ScenesStoreCreateMutationVariables = Exact<{
  input: CreateSceneInput;
}>;


export type ScenesStoreCreateMutation = { __typename?: 'Mutation', createScene: { __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null }>, targets: Array<{ __typename?: 'SceneTargetEntry', id: string, targetType: SceneTargetType, targetId: string, name: string, target?: { __typename?: 'Device', id: string, friendlyName: string, type: string, deviceName?: string | null } | { __typename?: 'Group', id: string, friendlyName: string, icon?: string | null, removed: boolean, groupName?: string | null } | { __typename?: 'Room', id: string, name: string, icon?: string | null } | null, expression: Array<{ __typename?: 'TargetClause', connector?: TargetClauseConnector | null, subject: TargetClauseSubject, op: TargetClauseOperator, values: Array<string> }> }>, lighting: { __typename?: 'SceneLighting', dynamicSource?: { __typename?: 'DynamicSceneSource', domain: VibeFieldDomain, sourceKind: VibeSourceKind, presetId?: string | null, seed: string, brightness: number, movement: number, cycleSeconds: number } | null, overrides: Array<{ __typename?: 'SceneLightOverride', deviceId: string, kind: SceneLightOverrideKind, effectId?: string | null, nativeEffectName?: string | null, state?: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> }, supportingStates: Array<{ __typename?: 'SceneSupportingState', deviceId: string, state: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } }>, preview: { __typename?: 'ScenePreview', width: number, height: number, pixels: Array<{ __typename?: 'PreviewPixel', r: number, g: number, b: number }>, swatches: Array<{ __typename?: 'PreviewSwatch', x: number, y: number, color: { __typename?: 'PreviewPixel', r: number, g: number, b: number } }> }, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type ScenesStoreUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateSceneInput;
}>;


export type ScenesStoreUpdateMutation = { __typename?: 'Mutation', updateScene: { __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null }>, targets: Array<{ __typename?: 'SceneTargetEntry', id: string, targetType: SceneTargetType, targetId: string, name: string, target?: { __typename?: 'Device', id: string, friendlyName: string, type: string, deviceName?: string | null } | { __typename?: 'Group', id: string, friendlyName: string, icon?: string | null, removed: boolean, groupName?: string | null } | { __typename?: 'Room', id: string, name: string, icon?: string | null } | null, expression: Array<{ __typename?: 'TargetClause', connector?: TargetClauseConnector | null, subject: TargetClauseSubject, op: TargetClauseOperator, values: Array<string> }> }>, lighting: { __typename?: 'SceneLighting', dynamicSource?: { __typename?: 'DynamicSceneSource', domain: VibeFieldDomain, sourceKind: VibeSourceKind, presetId?: string | null, seed: string, brightness: number, movement: number, cycleSeconds: number } | null, overrides: Array<{ __typename?: 'SceneLightOverride', deviceId: string, kind: SceneLightOverrideKind, effectId?: string | null, nativeEffectName?: string | null, state?: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> }, supportingStates: Array<{ __typename?: 'SceneSupportingState', deviceId: string, state: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } }>, preview: { __typename?: 'ScenePreview', width: number, height: number, pixels: Array<{ __typename?: 'PreviewPixel', r: number, g: number, b: number }>, swatches: Array<{ __typename?: 'PreviewSwatch', x: number, y: number, color: { __typename?: 'PreviewPixel', r: number, g: number, b: number } }> }, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

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


export type ScenesStoreApplyMutation = { __typename?: 'Mutation', applyScene: { __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null }>, targets: Array<{ __typename?: 'SceneTargetEntry', id: string, targetType: SceneTargetType, targetId: string, name: string, target?: { __typename?: 'Device', id: string, friendlyName: string, type: string, deviceName?: string | null } | { __typename?: 'Group', id: string, friendlyName: string, icon?: string | null, removed: boolean, groupName?: string | null } | { __typename?: 'Room', id: string, name: string, icon?: string | null } | null, expression: Array<{ __typename?: 'TargetClause', connector?: TargetClauseConnector | null, subject: TargetClauseSubject, op: TargetClauseOperator, values: Array<string> }> }>, lighting: { __typename?: 'SceneLighting', dynamicSource?: { __typename?: 'DynamicSceneSource', domain: VibeFieldDomain, sourceKind: VibeSourceKind, presetId?: string | null, seed: string, brightness: number, movement: number, cycleSeconds: number } | null, overrides: Array<{ __typename?: 'SceneLightOverride', deviceId: string, kind: SceneLightOverrideKind, effectId?: string | null, nativeEffectName?: string | null, state?: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> }, supportingStates: Array<{ __typename?: 'SceneSupportingState', deviceId: string, state: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } }>, preview: { __typename?: 'ScenePreview', width: number, height: number, pixels: Array<{ __typename?: 'PreviewPixel', r: number, g: number, b: number }>, swatches: Array<{ __typename?: 'PreviewSwatch', x: number, y: number, color: { __typename?: 'PreviewPixel', r: number, g: number, b: number } }> }, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type ScenesStoreStopMutationVariables = Exact<{
  sceneId: Scalars['ID']['input'];
}>;


export type ScenesStoreStopMutation = { __typename?: 'Mutation', deactivateScene: { __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null }>, targets: Array<{ __typename?: 'SceneTargetEntry', id: string, targetType: SceneTargetType, targetId: string, name: string, target?: { __typename?: 'Device', id: string, friendlyName: string, type: string, deviceName?: string | null } | { __typename?: 'Group', id: string, friendlyName: string, icon?: string | null, removed: boolean, groupName?: string | null } | { __typename?: 'Room', id: string, name: string, icon?: string | null } | null, expression: Array<{ __typename?: 'TargetClause', connector?: TargetClauseConnector | null, subject: TargetClauseSubject, op: TargetClauseOperator, values: Array<string> }> }>, lighting: { __typename?: 'SceneLighting', dynamicSource?: { __typename?: 'DynamicSceneSource', domain: VibeFieldDomain, sourceKind: VibeSourceKind, presetId?: string | null, seed: string, brightness: number, movement: number, cycleSeconds: number } | null, overrides: Array<{ __typename?: 'SceneLightOverride', deviceId: string, kind: SceneLightOverrideKind, effectId?: string | null, nativeEffectName?: string | null, state?: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> }, supportingStates: Array<{ __typename?: 'SceneSupportingState', deviceId: string, state: { __typename?: 'DesiredSceneState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, targetTemperature?: number | null, hvacMode?: string | null, fanMode?: string | null, swing?: string | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } }>, preview: { __typename?: 'ScenePreview', width: number, height: number, pixels: Array<{ __typename?: 'PreviewPixel', r: number, g: number, b: number }>, swatches: Array<{ __typename?: 'PreviewSwatch', x: number, y: number, color: { __typename?: 'PreviewPixel', r: number, g: number, b: number } }> }, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type ScenesStoreActiveChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type ScenesStoreActiveChangedSubscription = { __typename?: 'Subscription', sceneActiveChanged: { __typename?: 'SceneActiveEvent', sceneId: string, activatedAt?: any | null } };

export type VibeCatalogQueryVariables = Exact<{ [key: string]: never; }>;


export type VibeCatalogQuery = { __typename?: 'Query', vibePresets: Array<{ __typename?: 'VibePreset', id: string, category: string, domain: VibeFieldDomain, seed: string, brightness: number, movement: number, cycleSeconds: number, preview: { __typename?: 'ScenePreview', width: number, height: number, pixels: Array<{ __typename?: 'PreviewPixel', r: number, g: number, b: number }>, swatches: Array<{ __typename?: 'PreviewSwatch', x: number, y: number, color: { __typename?: 'PreviewPixel', r: number, g: number, b: number } }> } }> };

export type WebhookEndpointFieldsFragment = { __typename?: 'WebhookEndpoint', id: string, name: string, enabled: boolean, rateLimitCount: number, rateLimitWindowMs: number, createdAt: any, updatedAt: any, lastDeliveryAt?: any | null, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null };

export type WebhookEndpointsStoreQueryVariables = Exact<{ [key: string]: never; }>;


export type WebhookEndpointsStoreQuery = { __typename?: 'Query', webhookEndpoints: Array<{ __typename?: 'WebhookEndpoint', id: string, name: string, enabled: boolean, rateLimitCount: number, rateLimitWindowMs: number, createdAt: any, updatedAt: any, lastDeliveryAt?: any | null, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type WebhookEndpointsStoreCreateMutationVariables = Exact<{
  input: CreateWebhookEndpointInput;
}>;


export type WebhookEndpointsStoreCreateMutation = { __typename?: 'Mutation', createWebhookEndpoint: { __typename?: 'WebhookSecretResult', secretPath: string, endpoint: { __typename?: 'WebhookEndpoint', id: string, name: string, enabled: boolean, rateLimitCount: number, rateLimitWindowMs: number, createdAt: any, updatedAt: any, lastDeliveryAt?: any | null, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } } };

export type WebhookEndpointsStoreUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateWebhookEndpointInput;
}>;


export type WebhookEndpointsStoreUpdateMutation = { __typename?: 'Mutation', updateWebhookEndpoint: { __typename?: 'WebhookEndpoint', id: string, name: string, enabled: boolean, rateLimitCount: number, rateLimitWindowMs: number, createdAt: any, updatedAt: any, lastDeliveryAt?: any | null, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type WebhookEndpointsStoreRotateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type WebhookEndpointsStoreRotateMutation = { __typename?: 'Mutation', rotateWebhookEndpointSecret: { __typename?: 'WebhookSecretResult', secretPath: string, endpoint: { __typename?: 'WebhookEndpoint', id: string, name: string, enabled: boolean, rateLimitCount: number, rateLimitWindowMs: number, createdAt: any, updatedAt: any, lastDeliveryAt?: any | null, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } } };

export type WebhookEndpointsStoreDeleteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type WebhookEndpointsStoreDeleteMutation = { __typename?: 'Mutation', deleteWebhookEndpoint: boolean };

export type WebhookEndpointsStoreBatchDeleteMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type WebhookEndpointsStoreBatchDeleteMutation = { __typename?: 'Mutation', batchDeleteWebhookEndpoints: number };

export type WebhookEndpointsStoreDeliveryRecordedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type WebhookEndpointsStoreDeliveryRecordedSubscription = { __typename?: 'Subscription', webhookDeliveryRecorded: { __typename?: 'WebhookDelivery', id: string, endpointId: string, receivedAt: any } };

export type LayoutCurrentGuestQueryVariables = Exact<{ [key: string]: never; }>;


export type LayoutCurrentGuestQuery = { __typename?: 'Query', currentGuest?: { __typename?: 'Guest', id: string } | null };

export type ActivityQueryVariables = Exact<{
  filter?: InputMaybe<ActivityFilter>;
}>;


export type ActivityQuery = { __typename?: 'Query', activity: Array<{ __typename?: 'ActivityEvent', id: string, type: string, timestamp: any, payload: string, source: { __typename?: 'ActivitySource', kind: string, id?: string | null, name?: string | null, type?: string | null, roomId?: string | null, roomName?: string | null } }> };

export type ActivityStreamSubscriptionVariables = Exact<{
  advanced?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type ActivityStreamSubscription = { __typename?: 'Subscription', activityStream: { __typename?: 'ActivityEvent', id: string, type: string, timestamp: any, payload: string, source: { __typename?: 'ActivitySource', kind: string, id?: string | null, name?: string | null, type?: string | null, roomId?: string | null, roomName?: string | null } } };

export type AutomationEditUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAutomationInput;
}>;


export type AutomationEditUpdateMutation = { __typename?: 'Mutation', updateAutomation: { __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, compilable: boolean, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string, positionX: number, positionY: number, runtimeState: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }> } };

export type AutomationEditFireTriggerMutationVariables = Exact<{
  automationId: Scalars['ID']['input'];
  nodeId: Scalars['ID']['input'];
}>;


export type AutomationEditFireTriggerMutation = { __typename?: 'Mutation', fireAutomationTrigger: boolean };

export type AutomationEditEffectsQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationEditEffectsQuery = { __typename?: 'Query', effects: Array<{ __typename?: 'Effect', id: string, name: string }>, nativeEffectOptions: Array<{ __typename?: 'NativeEffectOption', name: string, displayName: string }> };

export type AutomationEditGroupReferenceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AutomationEditGroupReferenceQuery = { __typename?: 'Query', group?: { __typename?: 'Group', id: string, name?: string | null, friendlyName: string, source: string, removed: boolean, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }> } | null };

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


export type SetDeviceStateMutation = { __typename?: 'Mutation', setTargetState: boolean };

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

export type DeviceDetailDeleteDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeviceDetailDeleteDeviceMutation = { __typename?: 'Mutation', deleteDevice: { __typename?: 'Device', id: string, disabled: boolean, deleted: boolean } };

export type DeviceDetailRestoreDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeviceDetailRestoreDeviceMutation = { __typename?: 'Mutation', restoreDevice: { __typename?: 'Device', id: string, disabled: boolean, deleted: boolean } };

export type DeviceZigbeeDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeviceZigbeeDetailQuery = { __typename?: 'Query', zigbee2MqttConfig?: { __typename?: 'Zigbee2MqttConfig', frontendUrl?: string | null } | null, device?: { __typename?: 'Device', id: string, source: string, zigbee2Mqtt?: { __typename?: 'Zigbee2MqttDeviceMetadata', imageCandidate: boolean, imageVersion?: string | null, networkType?: string | null, ieeeAddress?: string | null, addressVendor?: string | null, networkAddress?: number | null, supported?: boolean | null, interviewState?: string | null, interviewCompleted?: boolean | null, interviewing?: boolean | null, description?: string | null, manufacturer?: string | null, modelId?: string | null, powerSource?: string | null, softwareBuildId?: string | null, dateCode?: string | null, definitionUrl?: string | null, definition?: { __typename?: 'Zigbee2MqttDeviceDefinition', model?: string | null, vendor?: string | null, description?: string | null, source?: string | null, icon?: string | null, supportsOta?: boolean | null } | null, ota: { __typename?: 'Zigbee2MqttOtaStatus', state?: string | null, installedVersion?: string | null, latestVersion?: string | null, progress?: number | null }, endpoints: Array<{ __typename?: 'Zigbee2MqttEndpoint', id: number, profileId?: number | null, deviceId?: number | null, inputClusters: Array<string>, outputClusters: Array<string>, bindings: Array<{ __typename?: 'Zigbee2MqttBinding', cluster: string, targetType: string, targetIeeeAddress?: string | null, targetEndpoint?: number | null, targetGroupId?: number | null }>, reportings: Array<{ __typename?: 'Zigbee2MqttReporting', cluster: string, attribute: string, minimumReportInterval?: number | null, maximumReportInterval?: number | null, reportableChange?: number | null }> }>, groups: Array<{ __typename?: 'Zigbee2MqttGroupReference', id: string, providerGroupId: string, name: string, endpoint: number }>, bridgeInfo?: { __typename?: 'Zigbee2MqttBridgeInfo', adapterType?: string | null, firmwareVersion?: string | null, channel?: number | null, panId?: number | null, extendedPanId?: string | null, zigbee2MqttVersion?: string | null, zigbee2MqttCommit?: string | null, zigbeeHerdsmanVersion?: string | null, zigbeeHerdsmanConvertersVersion?: string | null } | null } | null } | null };

export type DeviceZigbeeDocumentationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeviceZigbeeDocumentationQuery = { __typename?: 'Query', device?: { __typename?: 'Device', zigbee2Mqtt?: { __typename?: 'Zigbee2MqttDeviceMetadata', documentation?: { __typename?: 'Zigbee2MqttDeviceDocumentation', sourceUrl: string, lastCheckedAt: any, model?: string | null, vendor?: string | null, description?: string | null, exposes: Array<string>, batteryType?: string | null } | null } | null } | null };

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


export type TestTuyaConnectionMutation = { __typename?: 'Mutation', testTuyaConnection: { __typename?: 'ConnectionTestResult', success: boolean, code: ConnectionTestCode, diagnostic?: string | null } };

export type SyncTuyaDevicesMutationVariables = Exact<{ [key: string]: never; }>;


export type SyncTuyaDevicesMutation = { __typename?: 'Mutation', syncTuyaDevices: Array<{ __typename?: 'Device', id: string }> };

export type Zigbee2MqttConfigPageQueryVariables = Exact<{ [key: string]: never; }>;


export type Zigbee2MqttConfigPageQuery = { __typename?: 'Query', zigbee2MqttConfig?: { __typename?: 'Zigbee2MqttConfig', broker: string, frontendUrl?: string | null, username: string, password: string, useWss: boolean, enabled: boolean, scanScheduleEnabled: boolean, scanHour?: number | null, scanMinute?: number | null, scanStartedAt?: any | null, interactiveCommandsPerSecond: number, continuousCommandsPerSecond: number } | null };

export type UpdateZigbee2MqttConfigMutationVariables = Exact<{
  input: Zigbee2MqttConfigInput;
}>;


export type UpdateZigbee2MqttConfigMutation = { __typename?: 'Mutation', updateZigbee2MqttConfig: { __typename?: 'Zigbee2MqttConfig', broker: string, frontendUrl?: string | null, username: string, password: string, useWss: boolean, enabled: boolean, scanScheduleEnabled: boolean, scanHour?: number | null, scanMinute?: number | null, scanStartedAt?: any | null, interactiveCommandsPerSecond: number, continuousCommandsPerSecond: number } };

export type TestZigbee2MqttConnectionMutationVariables = Exact<{
  input: Zigbee2MqttConfigInput;
}>;


export type TestZigbee2MqttConnectionMutation = { __typename?: 'Mutation', testZigbee2MqttConnection: { __typename?: 'ConnectionTestResult', success: boolean, code: ConnectionTestCode, diagnostic?: string | null } };

export type ScanZigbee2MqttNetworkMutationVariables = Exact<{ [key: string]: never; }>;


export type ScanZigbee2MqttNetworkMutation = { __typename?: 'Mutation', scanZigbee2MqttNetwork: boolean };

export type Zigbee2MqttScanStateQueryVariables = Exact<{ [key: string]: never; }>;


export type Zigbee2MqttScanStateQuery = { __typename?: 'Query', zigbee2MqttConfig?: { __typename?: 'Zigbee2MqttConfig', scanStartedAt?: any | null } | null, networkTopologies: Array<{ __typename?: 'NetworkTopology', provider: string, scannedAt: any }> };

export type Zigbee2MqttScanUpdatesSubscriptionVariables = Exact<{
  provider?: InputMaybe<Scalars['String']['input']>;
}>;


export type Zigbee2MqttScanUpdatesSubscription = { __typename?: 'Subscription', networkTopologyUpdated: { __typename?: 'NetworkTopologyEvent', provider: string, scannedAt: any, nodeCount: number, linkCount: number } };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', token: string, user: { __typename?: 'User', id: string, username: string, name: string, avatarPath?: string | null, theme?: Theme | null, timeFormat?: TimeFormat | null, temperatureUnit?: TemperatureUnit | null, hapticsEnabled?: boolean | null, language?: Language | null, createdAt?: any | null, mustChangePassword?: boolean | null } } };

export type GuestLoginMutationVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type GuestLoginMutation = { __typename?: 'Mutation', guestLogin: { __typename?: 'GuestAuthPayload', token: string, guest: { __typename?: 'Guest', id: string, name: string, expiresAt: any } } };

export type LogsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type LogsQuery = { __typename?: 'Query', logs: Array<{ __typename?: 'LogEntry', timestamp: any, level: string, message: string, attrs: string }> };

export type LogStreamSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type LogStreamSubscription = { __typename?: 'Subscription', logStream: { __typename?: 'LogEntry', timestamp: any, level: string, message: string, attrs: string } };

export type ProfileUpdateCurrentUserMutationVariables = Exact<{
  input: UpdateCurrentUserInput;
}>;


export type ProfileUpdateCurrentUserMutation = { __typename?: 'Mutation', updateCurrentUser: { __typename?: 'User', id: string, username: string, name: string, avatarPath?: string | null, theme?: Theme | null, timeFormat?: TimeFormat | null, temperatureUnit?: TemperatureUnit | null, hapticsEnabled?: boolean | null, language?: Language | null, createdAt?: any | null, mustChangePassword?: boolean | null } };

export type ProfileChangePasswordMutationVariables = Exact<{
  input: ChangePasswordInput;
}>;


export type ProfileChangePasswordMutation = { __typename?: 'Mutation', changePassword: boolean };

export type ProfileForceLogoutAllMutationVariables = Exact<{ [key: string]: never; }>;


export type ProfileForceLogoutAllMutation = { __typename?: 'Mutation', forceLogoutAllSessions: boolean };

export type SceneEditorEffectsQueryVariables = Exact<{ [key: string]: never; }>;


export type SceneEditorEffectsQuery = { __typename?: 'Query', effects: Array<{ __typename?: 'Effect', id: string, name: string, icon?: string | null, kind: EffectKind, nativeName?: string | null, loop: boolean, requiredCapabilities: Array<string> }> };

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

export type AccountsListQueryVariables = Exact<{ [key: string]: never; }>;


export type AccountsListQuery = { __typename?: 'Query', users: Array<{ __typename?: 'User', id: string, username: string, name: string, avatarPath?: string | null }>, guests: Array<{ __typename?: 'Guest', id: string, name: string, expiresAt: any, createdAt: any }> };

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

export type GuestsCreateMutationVariables = Exact<{
  input: CreateGuestInput;
}>;


export type GuestsCreateMutation = { __typename?: 'Mutation', createGuest: { __typename?: 'Guest', id: string, name: string, expiresAt: any, createdAt: any } };

export type GuestsExtendMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  durationMinutes: Scalars['Int']['input'];
}>;


export type GuestsExtendMutation = { __typename?: 'Mutation', extendGuest: { __typename?: 'Guest', id: string, name: string, expiresAt: any, createdAt: any } };

export type GuestsDeleteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GuestsDeleteMutation = { __typename?: 'Mutation', deleteGuest: boolean };

export type GuestsBatchDeleteMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type GuestsBatchDeleteMutation = { __typename?: 'Mutation', batchDeleteGuests: number };

export type WebhookDetailDeliveriesQueryVariables = Exact<{
  endpointId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type WebhookDetailDeliveriesQuery = { __typename?: 'Query', webhookDeliveries: Array<{ __typename?: 'WebhookDelivery', id: string, endpointId: string, receivedAt: any, outcome: string, httpStatus: number, clientIp: string, userAgent: string, contentType: string, bodySize: number, body?: string | null, durationMs: number, requestId?: string | null, queryKeys: Array<string>, headerNames: Array<string> }> };

export type WebhookDetailDeliveryRecordedSubscriptionVariables = Exact<{
  endpointId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type WebhookDetailDeliveryRecordedSubscription = { __typename?: 'Subscription', webhookDeliveryRecorded: { __typename?: 'WebhookDelivery', id: string, endpointId: string, receivedAt: any, outcome: string, httpStatus: number, clientIp: string, userAgent: string, contentType: string, bodySize: number, body?: string | null, durationMs: number, requestId?: string | null, queryKeys: Array<string>, headerNames: Array<string> } };

export const AutomationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationGraph"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastFiredAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationFieldsFragment, unknown>;
export const EffectFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"nativeName"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}},{"kind":"Field","name":{"kind":"Name","value":"tracks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"clips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<EffectFieldsFragment, unknown>;
export const FloorplanFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FloorplanFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Floorplan"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"vertices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"walls"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"vertexA"}},{"kind":"Field","name":{"kind":"Name","value":"vertexB"}},{"kind":"Field","name":{"kind":"Name","value":"thickness"}},{"kind":"Field","name":{"kind":"Name","value":"curveX"}},{"kind":"Field","name":{"kind":"Name","value":"curveY"}}]}},{"kind":"Field","name":{"kind":"Name","value":"openings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wallId"}},{"kind":"Field","name":{"kind":"Name","value":"t"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"doorBindings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"openingId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"hingeSide"}},{"kind":"Field","name":{"kind":"Name","value":"swingSide"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"vertexIds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"placements"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"furniture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"rotation"}},{"kind":"Field","name":{"kind":"Name","value":"occluder"}}]}}]}}]} as unknown as DocumentNode<FloorplanFieldsFragment, unknown>;
export const GroupFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"removed"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GroupFieldsFragment, unknown>;
export const RoomFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoomFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RoomFieldsFragment, unknown>;
export const SceneFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SceneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scene"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"targets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"target"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"deviceName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"groupName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"removed"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"expression"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connector"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"op"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"lighting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dynamicSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"sourceKind"}},{"kind":"Field","name":{"kind":"Name","value":"presetId"}},{"kind":"Field","name":{"kind":"Name","value":"seed"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"movement"}},{"kind":"Field","name":{"kind":"Name","value":"cycleSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"overrides"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}}]}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"nativeEffectName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingStates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"preview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"pixels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}},{"kind":"Field","name":{"kind":"Name","value":"swatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]} as unknown as DocumentNode<SceneFieldsFragment, unknown>;
export const WebhookEndpointFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WebhookEndpointFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WebhookEndpoint"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"rateLimitCount"}},{"kind":"Field","name":{"kind":"Name","value":"rateLimitWindowMs"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastDeliveryAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<WebhookEndpointFieldsFragment, unknown>;
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
export const E2EZigbeeDeviceMetadataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EZigbeeDeviceMetadata"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"device"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"zigbee2Mqtt"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageCandidate"}},{"kind":"Field","name":{"kind":"Name","value":"imageVersion"}},{"kind":"Field","name":{"kind":"Name","value":"ieeeAddress"}},{"kind":"Field","name":{"kind":"Name","value":"networkAddress"}},{"kind":"Field","name":{"kind":"Name","value":"supported"}},{"kind":"Field","name":{"kind":"Name","value":"softwareBuildId"}},{"kind":"Field","name":{"kind":"Name","value":"definitionUrl"}},{"kind":"Field","name":{"kind":"Name","value":"definition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"vendor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"supportsOta"}}]}},{"kind":"Field","name":{"kind":"Name","value":"ota"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"installedVersion"}},{"kind":"Field","name":{"kind":"Name","value":"latestVersion"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}}]}},{"kind":"Field","name":{"kind":"Name","value":"endpoints"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"profileId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"inputClusters"}},{"kind":"Field","name":{"kind":"Name","value":"outputClusters"}},{"kind":"Field","name":{"kind":"Name","value":"bindings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cluster"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetIeeeAddress"}},{"kind":"Field","name":{"kind":"Name","value":"targetEndpoint"}},{"kind":"Field","name":{"kind":"Name","value":"targetGroupId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reportings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cluster"}},{"kind":"Field","name":{"kind":"Name","value":"attribute"}},{"kind":"Field","name":{"kind":"Name","value":"minimumReportInterval"}},{"kind":"Field","name":{"kind":"Name","value":"maximumReportInterval"}},{"kind":"Field","name":{"kind":"Name","value":"reportableChange"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"providerGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"endpoint"}}]}},{"kind":"Field","name":{"kind":"Name","value":"bridgeInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adapterType"}},{"kind":"Field","name":{"kind":"Name","value":"firmwareVersion"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"panId"}},{"kind":"Field","name":{"kind":"Name","value":"extendedPanId"}},{"kind":"Field","name":{"kind":"Name","value":"zigbee2MqttVersion"}},{"kind":"Field","name":{"kind":"Name","value":"zigbee2MqttCommit"}},{"kind":"Field","name":{"kind":"Name","value":"zigbeeHerdsmanVersion"}},{"kind":"Field","name":{"kind":"Name","value":"zigbeeHerdsmanConvertersVersion"}}]}}]}}]}}]}}]} as unknown as DocumentNode<E2EZigbeeDeviceMetadataQuery, E2EZigbeeDeviceMetadataQueryVariables>;
export const E2ESetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ESetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setTargetState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"EnumValue","value":"DEVICE"}},{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}]}]}}]} as unknown as DocumentNode<E2ESetDeviceStateMutation, E2ESetDeviceStateMutationVariables>;
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
export const BrowserGuestCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BrowserGuestCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGuestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGuest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<BrowserGuestCreateMutation, BrowserGuestCreateMutationVariables>;
export const BrowserGuestDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BrowserGuestDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGuest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<BrowserGuestDeleteMutation, BrowserGuestDeleteMutationVariables>;
export const E2ECreateGuestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ECreateGuest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGuestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGuest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<E2ECreateGuestMutation, E2ECreateGuestMutationVariables>;
export const E2EExtendGuestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EExtendGuest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"extendGuest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"durationMinutes"},"value":{"kind":"IntValue","value":"60"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<E2EExtendGuestMutation, E2EExtendGuestMutationVariables>;
export const E2EDeleteGuestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EDeleteGuest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGuest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EDeleteGuestMutation, E2EDeleteGuestMutationVariables>;
export const BrowserSceneFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BrowserSceneFixtures"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"vibePresets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<BrowserSceneFixturesQuery, BrowserSceneFixturesQueryVariables>;
export const BrowserSceneCreateStructureDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BrowserSceneCreateStructure"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"room"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRoomInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"group"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"room"},"name":{"kind":"Name","value":"createRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"room"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"group"},"name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"group"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<BrowserSceneCreateStructureMutation, BrowserSceneCreateStructureMutationVariables>;
export const BrowserSceneAddRoomMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BrowserSceneAddRoomMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddRoomMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRoomMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<BrowserSceneAddRoomMemberMutation, BrowserSceneAddRoomMemberMutationVariables>;
export const BrowserSceneAddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BrowserSceneAddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<BrowserSceneAddGroupMemberMutation, BrowserSceneAddGroupMemberMutationVariables>;
export const BrowserSceneDeleteFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BrowserSceneDeleteFixtures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}}]}]}}]} as unknown as DocumentNode<BrowserSceneDeleteFixturesMutation, BrowserSceneDeleteFixturesMutationVariables>;
export const BrowserSceneDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BrowserSceneDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<BrowserSceneDeleteMutation, BrowserSceneDeleteMutationVariables>;
export const E2EScenesDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EScenesDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<E2EScenesDevicesQuery, E2EScenesDevicesQueryVariables>;
export const E2ECreateSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ECreateScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"targets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lighting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"overrides"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<E2ECreateSceneMutation, E2ECreateSceneMutationVariables>;
export const E2EApplySceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EApplyScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"applyScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sceneId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<E2EApplySceneMutation, E2EApplySceneMutationVariables>;
export const E2ESceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"targets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lighting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"overrides"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<E2ESceneQuery, E2ESceneQueryVariables>;
export const E2EDeleteSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EDeleteScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EDeleteSceneMutation, E2EDeleteSceneMutationVariables>;
export const E2EScenesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EScenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"targets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lighting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"overrides"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<E2EScenesQuery, E2EScenesQueryVariables>;
export const E2EUpdateSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EUpdateScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"targets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lighting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"overrides"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<E2EUpdateSceneMutation, E2EUpdateSceneMutationVariables>;
export const E2EScenesCreateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EScenesCreateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<E2EScenesCreateGroupMutation, E2EScenesCreateGroupMutationVariables>;
export const E2EScenesAddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EScenesAddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<E2EScenesAddGroupMemberMutation, E2EScenesAddGroupMemberMutationVariables>;
export const E2EScenesDeleteGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EScenesDeleteGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EScenesDeleteGroupMutation, E2EScenesDeleteGroupMutationVariables>;
export const BrowserSearchCreateFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BrowserSearchCreateFixtures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"room"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRoomInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"group"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"scene"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSceneInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automation"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAutomationInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"effect"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEffectInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"alarm"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RaiseAlarmInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"room"},"name":{"kind":"Name","value":"createRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"room"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"group"},"name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"group"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"scene"},"name":{"kind":"Name","value":"createScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"scene"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"automation"},"name":{"kind":"Name","value":"createAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automation"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"effect"},"name":{"kind":"Name","value":"createEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"effect"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"alarm"},"name":{"kind":"Name","value":"raiseAlarm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"alarm"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<BrowserSearchCreateFixturesMutation, BrowserSearchCreateFixturesMutationVariables>;
export const BrowserSearchDeleteFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BrowserSearchDeleteFixtures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"alarmId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"deleteScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"deleteAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"deleteEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"deleteAlarm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"alarmId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"alarmId"}}}]}]}}]} as unknown as DocumentNode<BrowserSearchDeleteFixturesMutation, BrowserSearchDeleteFixturesMutationVariables>;
export const BrowserSearchMaintenanceTasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BrowserSearchMaintenanceTasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"maintenanceTasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]} as unknown as DocumentNode<BrowserSearchMaintenanceTasksQuery, BrowserSearchMaintenanceTasksQueryVariables>;
export const BrowserSearchDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BrowserSearchDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}}]}}]}}]} as unknown as DocumentNode<BrowserSearchDevicesQuery, BrowserSearchDevicesQueryVariables>;
export const BrowserSearchCleanUpDeletedDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BrowserSearchCleanUpDeletedDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"restoreDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updateDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<BrowserSearchCleanUpDeletedDeviceMutation, BrowserSearchCleanUpDeletedDeviceMutationVariables>;
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
export const E2ECreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ECreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"hapticsEnabled"}}]}}]}}]} as unknown as DocumentNode<E2ECreateUserMutation, E2ECreateUserMutationVariables>;
export const E2EUpdateCurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EUpdateCurrentUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCurrentUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCurrentUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"hapticsEnabled"}}]}}]}}]} as unknown as DocumentNode<E2EUpdateCurrentUserMutation, E2EUpdateCurrentUserMutationVariables>;
export const E2EDeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EDeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EDeleteUserMutation, E2EDeleteUserMutationVariables>;
export const E2EResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"p"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetUserPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"p"}}}]}]}}]} as unknown as DocumentNode<E2EResetPasswordMutation, E2EResetPasswordMutationVariables>;
export const E2EMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EMe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"hapticsEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}}]}}]}}]} as unknown as DocumentNode<E2EMeQuery, E2EMeQueryVariables>;
export const E2EWebSocketRecoveryDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EWebSocketRecoveryDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"device"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"brightness"}}]}}]}}]}}]} as unknown as DocumentNode<E2EWebSocketRecoveryDeviceStateQuery, E2EWebSocketRecoveryDeviceStateQueryVariables>;
export const E2EWebSocketRecoveryLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EWebSocketRecoveryLogs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1000"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"attrs"}}]}}]}}]} as unknown as DocumentNode<E2EWebSocketRecoveryLogsQuery, E2EWebSocketRecoveryLogsQueryVariables>;
export const E2EZigbeeMetadataReadyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EZigbeeMetadataReady"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"device"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"zigbee2Mqtt"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ieeeAddress"}}]}}]}}]}}]} as unknown as DocumentNode<E2EZigbeeMetadataReadyQuery, E2EZigbeeMetadataReadyQueryVariables>;
export const E2EMaintenanceTasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EMaintenanceTasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"maintenanceTasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]} as unknown as DocumentNode<E2EMaintenanceTasksQuery, E2EMaintenanceTasksQueryVariables>;
export const DeleteAlarmDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAlarm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"alarmId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAlarm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"alarmId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"alarmId"}}}]}]}}]} as unknown as DocumentNode<DeleteAlarmMutation, DeleteAlarmMutationVariables>;
export const BatchDeleteAlarmsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BatchDeleteAlarms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"alarmIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteAlarms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"alarmIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"alarmIds"}}}]}]}}]} as unknown as DocumentNode<BatchDeleteAlarmsMutation, BatchDeleteAlarmsMutationVariables>;
export const DashboardApplianceCardSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DashboardApplianceCardSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setTargetState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"EnumValue","value":"DEVICE"}},{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}]}]}}]} as unknown as DocumentNode<DashboardApplianceCardSetDeviceStateMutation, DashboardApplianceCardSetDeviceStateMutationVariables>;
export const DashboardLightCardSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DashboardLightCardSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setTargetState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"EnumValue","value":"DEVICE"}},{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}]}]}}]} as unknown as DocumentNode<DashboardLightCardSetDeviceStateMutation, DashboardLightCardSetDeviceStateMutationVariables>;
export const DashboardIntegrationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardIntegrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"configured"}}]}}]}}]} as unknown as DocumentNode<DashboardIntegrationsQuery, DashboardIntegrationsQueryVariables>;
export const DeviceActionMenuSimulateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceActionMenuSimulate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"action"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulateDeviceAction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"action"},"value":{"kind":"Variable","name":{"kind":"Name","value":"action"}}}]}]}}]} as unknown as DocumentNode<DeviceActionMenuSimulateMutation, DeviceActionMenuSimulateMutationVariables>;
export const DeviceCardSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceCardSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setTargetState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"EnumValue","value":"DEVICE"}},{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}]}]}}]} as unknown as DocumentNode<DeviceCardSetDeviceStateMutation, DeviceCardSetDeviceStateMutationVariables>;
export const DeviceTableSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceTableSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setTargetState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"EnumValue","value":"DEVICE"}},{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}]}]}}]} as unknown as DocumentNode<DeviceTableSetDeviceStateMutation, DeviceTableSetDeviceStateMutationVariables>;
export const UpdateDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"controlledLoad"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}}]}}]}}]} as unknown as DocumentNode<UpdateDeviceMutation, UpdateDeviceMutationVariables>;
export const MarkDevicesSeenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkDevicesSeen"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markDevicesSeen"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<MarkDevicesSeenMutation, MarkDevicesSeenMutationVariables>;
export const DevicesPageDeleteDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DevicesPageDeleteDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}}]}}]}}]} as unknown as DocumentNode<DevicesPageDeleteDeviceMutation, DevicesPageDeleteDeviceMutationVariables>;
export const DevicesPageRestoreDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DevicesPageRestoreDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"restoreDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}}]}}]}}]} as unknown as DocumentNode<DevicesPageRestoreDeviceMutation, DevicesPageRestoreDeviceMutationVariables>;
export const DevicesPageBatchDeleteDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DevicesPageBatchDeleteDevices"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteDevices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<DevicesPageBatchDeleteDevicesMutation, DevicesPageBatchDeleteDevicesMutationVariables>;
export const DevicesPageBatchRestoreDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DevicesPageBatchRestoreDevices"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchRestoreDevices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<DevicesPageBatchRestoreDevicesMutation, DevicesPageBatchRestoreDevicesMutationVariables>;
export const NativeEffectOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NativeEffectOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nativeEffectOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"confirmedDeviceCount"}},{"kind":"Field","name":{"kind":"Name","value":"untestedDeviceCount"}},{"kind":"Field","name":{"kind":"Name","value":"unsupportedDeviceCount"}},{"kind":"Field","name":{"kind":"Name","value":"source"}}]}}]}}]} as unknown as DocumentNode<NativeEffectOptionsQuery, NativeEffectOptionsQueryVariables>;
export const NativeEffectEditorSupportChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"NativeEffectEditorSupportChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nativeEffectSupportChanged"}}]}}]} as unknown as DocumentNode<NativeEffectEditorSupportChangedSubscription, NativeEffectEditorSupportChangedSubscriptionVariables>;
export const EffectRunTargetDrawerRunEffectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EffectRunTargetDrawerRunEffect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"effectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"targetType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetType"}}},{"kind":"Argument","name":{"kind":"Name","value":"targetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<EffectRunTargetDrawerRunEffectMutation, EffectRunTargetDrawerRunEffectMutationVariables>;
export const EffectRunTargetDrawerRunNativeEffectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EffectRunTargetDrawerRunNativeEffect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nativeName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runNativeEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"nativeName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nativeName"}}},{"kind":"Argument","name":{"kind":"Name","value":"targetType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetType"}}},{"kind":"Argument","name":{"kind":"Name","value":"targetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runId"}},{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<EffectRunTargetDrawerRunNativeEffectMutation, EffectRunTargetDrawerRunNativeEffectMutationVariables>;
export const EffectRunTargetDrawerNativeSupportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EffectRunTargetDrawerNativeSupport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nativeEffectSupport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<EffectRunTargetDrawerNativeSupportQuery, EffectRunTargetDrawerNativeSupportQueryVariables>;
export const EffectRunTargetDrawerNativeSupportChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"EffectRunTargetDrawerNativeSupportChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nativeEffectSupportChanged"}}]}}]} as unknown as DocumentNode<EffectRunTargetDrawerNativeSupportChangedSubscription, EffectRunTargetDrawerNativeSupportChangedSubscriptionVariables>;
export const EffectTimelineEditorNativeOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EffectTimelineEditorNativeOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nativeEffectOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"confirmedDeviceCount"}},{"kind":"Field","name":{"kind":"Name","value":"untestedDeviceCount"}},{"kind":"Field","name":{"kind":"Name","value":"unsupportedDeviceCount"}}]}}]}}]} as unknown as DocumentNode<EffectTimelineEditorNativeOptionsQuery, EffectTimelineEditorNativeOptionsQueryVariables>;
export const EffectTimelineNativeSupportChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"EffectTimelineNativeSupportChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nativeEffectSupportChanged"}}]}}]} as unknown as DocumentNode<EffectTimelineNativeSupportChangedSubscription, EffectTimelineNativeSupportChangedSubscriptionVariables>;
export const EffectsPageNativeOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EffectsPageNativeOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nativeEffectOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"confirmedDeviceCount"}},{"kind":"Field","name":{"kind":"Name","value":"untestedDeviceCount"}},{"kind":"Field","name":{"kind":"Name","value":"unsupportedDeviceCount"}}]}}]}}]} as unknown as DocumentNode<EffectsPageNativeOptionsQuery, EffectsPageNativeOptionsQueryVariables>;
export const EffectsPageNativeSupportChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"EffectsPageNativeSupportChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nativeEffectSupportChanged"}}]}}]} as unknown as DocumentNode<EffectsPageNativeSupportChangedSubscription, EffectsPageNativeSupportChangedSubscriptionVariables>;
export const GuestSessionCurrentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GuestSessionCurrent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentGuest"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<GuestSessionCurrentQuery, GuestSessionCurrentQueryVariables>;
export const GuestSessionChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"GuestSessionChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guestChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"guest"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]}}]} as unknown as DocumentNode<GuestSessionChangedSubscription, GuestSessionChangedSubscriptionVariables>;
export const RoomsPageSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsPageSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setTargetState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"EnumValue","value":"ROOM"}},{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}]}]}}]} as unknown as DocumentNode<RoomsPageSetDeviceStateMutation, RoomsPageSetDeviceStateMutationVariables>;
export const SceneCreateVibePreviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SceneCreateVibePreview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PreviewVibeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewVibe"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"preview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"pixels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}},{"kind":"Field","name":{"kind":"Name","value":"swatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"seed"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"movement"}},{"kind":"Field","name":{"kind":"Name","value":"cycleSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"minimumLightness"}},{"kind":"Field","name":{"kind":"Name","value":"maximumLightness"}}]}}]}}]} as unknown as DocumentNode<SceneCreateVibePreviewQuery, SceneCreateVibePreviewQueryVariables>;
export const SceneOutputRateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SceneOutputRate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"zigbee2MqttConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"continuousCommandsPerSecond"}},{"kind":"Field","name":{"kind":"Name","value":"activeContinuousDeviceIds"}}]}}]}}]} as unknown as DocumentNode<SceneOutputRateQuery, SceneOutputRateQueryVariables>;
export const StateHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StateHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StateHistoryFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stateHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"valueType"}},{"kind":"Field","name":{"kind":"Name","value":"points"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"at"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"textValue"}}]}}]}}]}}]} as unknown as DocumentNode<StateHistoryQuery, StateHistoryQueryVariables>;
export const AggregatedStateHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AggregatedStateHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AggregatedStateHistoryFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aggregatedStateHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"points"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"at"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]} as unknown as DocumentNode<AggregatedStateHistoryQuery, AggregatedStateHistoryQueryVariables>;
export const GuidedVibeChoicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GuidedVibeChoices"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GuidedVibeRoundInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guidedVibeRound"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"round"}},{"kind":"Field","name":{"kind":"Name","value":"canFinish"}},{"kind":"Field","name":{"kind":"Name","value":"complete"}},{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"labelId"}},{"kind":"Field","name":{"kind":"Name","value":"preview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"pixels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}},{"kind":"Field","name":{"kind":"Name","value":"swatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GuidedVibeChoicesQuery, GuidedVibeChoicesQueryVariables>;
export const SceneEditorVibePreviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SceneEditorVibePreview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PreviewVibeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewVibe"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"preview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"pixels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}},{"kind":"Field","name":{"kind":"Name","value":"swatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"seed"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"movement"}},{"kind":"Field","name":{"kind":"Name","value":"cycleSeconds"}}]}}]}}]} as unknown as DocumentNode<SceneEditorVibePreviewQuery, SceneEditorVibePreviewQueryVariables>;
export const AutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Automation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"compilable"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"positionX"}},{"kind":"Field","name":{"kind":"Name","value":"positionY"}},{"kind":"Field","name":{"kind":"Name","value":"runtimeState"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationQuery, AutomationQueryVariables>;
export const EffectEditDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EffectEdit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"effect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"nativeName"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}},{"kind":"Field","name":{"kind":"Name","value":"tracks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"clips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startMs"}},{"kind":"Field","name":{"kind":"Name","value":"transitionMinMs"}},{"kind":"Field","name":{"kind":"Name","value":"transitionMaxMs"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}}]}}]}}]}}]} as unknown as DocumentNode<EffectEditQuery, EffectEditQueryVariables>;
export const MapPageSetDisplayColorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MapPageSetDisplayColor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayColor"}},{"kind":"Field","name":{"kind":"Name","value":"displayBrightness"}}]}}]}}]} as unknown as DocumentNode<MapPageSetDisplayColorMutation, MapPageSetDisplayColorMutationVariables>;
export const MapNetworkTopologiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MapNetworkTopologies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkTopologies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"scannedAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"links"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"target"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"quality"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]} as unknown as DocumentNode<MapNetworkTopologiesQuery, MapNetworkTopologiesQueryVariables>;
export const MapPageTopologyUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"MapPageTopologyUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkTopologyUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"scannedAt"}}]}}]}}]} as unknown as DocumentNode<MapPageTopologyUpdatedSubscription, MapPageTopologyUpdatedSubscriptionVariables>;
export const MapPageDeviceTxDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"MapPageDeviceTx"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}}]}}]}}]} as unknown as DocumentNode<MapPageDeviceTxSubscription, MapPageDeviceTxSubscriptionVariables>;
export const MapPageActionTxDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"MapPageActionTx"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceActionFired"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}}]}}]}}]} as unknown as DocumentNode<MapPageActionTxSubscription, MapPageActionTxSubscriptionVariables>;
export const SetupStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"setupStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setupStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasInitialUser"}}]}}]}}]} as unknown as DocumentNode<SetupStatusQuery, SetupStatusQueryVariables>;
export const GroupCommandsSetTargetStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupCommandsSetTargetState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"target"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CommandTargetInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setTargetState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"Variable","name":{"kind":"Name","value":"target"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}]}]}}]} as unknown as DocumentNode<GroupCommandsSetTargetStateMutation, GroupCommandsSetTargetStateMutationVariables>;
export const ActiveAlarmsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActiveAlarms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alarms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"latestRowId"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"messageCode"}},{"kind":"Field","name":{"kind":"Name","value":"messageArguments"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"firstRaisedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRaisedAt"}}]}}]}}]} as unknown as DocumentNode<ActiveAlarmsQuery, ActiveAlarmsQueryVariables>;
export const AlarmEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AlarmEvents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alarmEvent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"clearedAlarmId"}},{"kind":"Field","name":{"kind":"Name","value":"alarm"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"latestRowId"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"messageCode"}},{"kind":"Field","name":{"kind":"Name","value":"messageArguments"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"firstRaisedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRaisedAt"}}]}}]}}]}}]} as unknown as DocumentNode<AlarmEventsSubscription, AlarmEventsSubscriptionVariables>;
export const AutomationsStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationsStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationGraph"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastFiredAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationsStoreQuery, AutomationsStoreQueryVariables>;
export const AutomationsStoreCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationsStoreCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationGraph"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastFiredAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationsStoreCreateMutation, AutomationsStoreCreateMutationVariables>;
export const AutomationsStoreUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationsStoreUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationGraph"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastFiredAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationsStoreUpdateMutation, AutomationsStoreUpdateMutationVariables>;
export const AutomationsStoreToggleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationsStoreToggle"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AutomationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AutomationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AutomationGraph"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastFiredAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationsStoreToggleMutation, AutomationsStoreToggleMutationVariables>;
export const AutomationsStoreDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationsStoreDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<AutomationsStoreDeleteMutation, AutomationsStoreDeleteMutationVariables>;
export const AutomationsStoreBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationsStoreBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteAutomations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<AutomationsStoreBatchDeleteMutation, AutomationsStoreBatchDeleteMutationVariables>;
export const DevicesInitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DevicesInit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"displayColor"}},{"kind":"Field","name":{"kind":"Name","value":"displayBrightness"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"controlledLoad"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"reportsValue"}},{"kind":"Field","name":{"kind":"Name","value":"canSet"}},{"kind":"Field","name":{"kind":"Name","value":"canGet"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"occupancy"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}},{"kind":"Field","name":{"kind":"Name","value":"orientation"}},{"kind":"Field","name":{"kind":"Name","value":"devicePosture"}},{"kind":"Field","name":{"kind":"Name","value":"linkQuality"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"capability"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"stringValue"}}]}}]}}]}}]} as unknown as DocumentNode<DevicesInitQuery, DevicesInitQueryVariables>;
export const DeviceStoreStateChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceStoreStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"occupancy"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}},{"kind":"Field","name":{"kind":"Name","value":"orientation"}},{"kind":"Field","name":{"kind":"Name","value":"devicePosture"}},{"kind":"Field","name":{"kind":"Name","value":"linkQuality"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceStoreStateChangedSubscription, DeviceStoreStateChangedSubscriptionVariables>;
export const DeviceStoreConfigurationChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceStoreConfigurationChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceConfigurationChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"values"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"capability"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"stringValue"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceStoreConfigurationChangedSubscription, DeviceStoreConfigurationChangedSubscriptionVariables>;
export const DeviceAvailabilityChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceAvailabilityChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceAvailabilityChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}}]}}]} as unknown as DocumentNode<DeviceAvailabilityChangedSubscription, DeviceAvailabilityChangedSubscriptionVariables>;
export const DeviceAddedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"controlledLoad"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"reportsValue"}},{"kind":"Field","name":{"kind":"Name","value":"canSet"}},{"kind":"Field","name":{"kind":"Name","value":"canGet"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"occupancy"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}},{"kind":"Field","name":{"kind":"Name","value":"orientation"}},{"kind":"Field","name":{"kind":"Name","value":"devicePosture"}},{"kind":"Field","name":{"kind":"Name","value":"linkQuality"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"capability"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"stringValue"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceAddedSubscription, DeviceAddedSubscriptionVariables>;
export const DeviceRemovedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceRemoved"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceRemoved"}}]}}]} as unknown as DocumentNode<DeviceRemovedSubscription, DeviceRemovedSubscriptionVariables>;
export const DeviceStoreUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceStoreUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"displayColor"}},{"kind":"Field","name":{"kind":"Name","value":"displayBrightness"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"controlledLoad"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"reportsValue"}},{"kind":"Field","name":{"kind":"Name","value":"canSet"}},{"kind":"Field","name":{"kind":"Name","value":"canGet"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"occupancy"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}},{"kind":"Field","name":{"kind":"Name","value":"orientation"}},{"kind":"Field","name":{"kind":"Name","value":"devicePosture"}},{"kind":"Field","name":{"kind":"Name","value":"linkQuality"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"capability"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"stringValue"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceStoreUpdatedSubscription, DeviceStoreUpdatedSubscriptionVariables>;
export const EffectsStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EffectsStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"effects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"nativeName"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}},{"kind":"Field","name":{"kind":"Name","value":"tracks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"clips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<EffectsStoreQuery, EffectsStoreQueryVariables>;
export const EffectsStoreCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EffectsStoreCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEffectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"nativeName"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}},{"kind":"Field","name":{"kind":"Name","value":"tracks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"clips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<EffectsStoreCreateMutation, EffectsStoreCreateMutationVariables>;
export const EffectsStoreUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EffectsStoreUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEffectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"nativeName"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}},{"kind":"Field","name":{"kind":"Name","value":"tracks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"clips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<EffectsStoreUpdateMutation, EffectsStoreUpdateMutationVariables>;
export const EffectsStoreDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EffectsStoreDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<EffectsStoreDeleteMutation, EffectsStoreDeleteMutationVariables>;
export const EffectsStoreBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EffectsStoreBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteEffects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<EffectsStoreBatchDeleteMutation, EffectsStoreBatchDeleteMutationVariables>;
export const FloorplanStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FloorplanStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"floorplan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FloorplanFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FloorplanFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Floorplan"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"vertices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"walls"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"vertexA"}},{"kind":"Field","name":{"kind":"Name","value":"vertexB"}},{"kind":"Field","name":{"kind":"Name","value":"thickness"}},{"kind":"Field","name":{"kind":"Name","value":"curveX"}},{"kind":"Field","name":{"kind":"Name","value":"curveY"}}]}},{"kind":"Field","name":{"kind":"Name","value":"openings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wallId"}},{"kind":"Field","name":{"kind":"Name","value":"t"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"doorBindings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"openingId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"hingeSide"}},{"kind":"Field","name":{"kind":"Name","value":"swingSide"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"vertexIds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"placements"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"furniture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"rotation"}},{"kind":"Field","name":{"kind":"Name","value":"occluder"}}]}}]}}]} as unknown as DocumentNode<FloorplanStoreQuery, FloorplanStoreQueryVariables>;
export const FloorplanStoreUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FloorplanStoreUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateFloorplanInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFloorplan"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FloorplanFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FloorplanFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Floorplan"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"vertices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"walls"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"vertexA"}},{"kind":"Field","name":{"kind":"Name","value":"vertexB"}},{"kind":"Field","name":{"kind":"Name","value":"thickness"}},{"kind":"Field","name":{"kind":"Name","value":"curveX"}},{"kind":"Field","name":{"kind":"Name","value":"curveY"}}]}},{"kind":"Field","name":{"kind":"Name","value":"openings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wallId"}},{"kind":"Field","name":{"kind":"Name","value":"t"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"doorBindings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"openingId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"hingeSide"}},{"kind":"Field","name":{"kind":"Name","value":"swingSide"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"vertexIds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"placements"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"furniture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"rotation"}},{"kind":"Field","name":{"kind":"Name","value":"occluder"}}]}}]}}]} as unknown as DocumentNode<FloorplanStoreUpdateMutation, FloorplanStoreUpdateMutationVariables>;
export const GroupsStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GroupsStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"removed"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GroupsStoreQuery, GroupsStoreQueryVariables>;
export const GroupsStoreChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"GroupsStoreChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groupsChanged"}}]}}]} as unknown as DocumentNode<GroupsStoreChangedSubscription, GroupsStoreChangedSubscriptionVariables>;
export const GroupsStoreCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupsStoreCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"removed"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GroupsStoreCreateMutation, GroupsStoreCreateMutationVariables>;
export const GroupsStoreUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupsStoreUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"removed"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GroupsStoreUpdateMutation, GroupsStoreUpdateMutationVariables>;
export const GroupsStoreDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupsStoreDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<GroupsStoreDeleteMutation, GroupsStoreDeleteMutationVariables>;
export const GroupsStoreBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupsStoreBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteGroups"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<GroupsStoreBatchDeleteMutation, GroupsStoreBatchDeleteMutationVariables>;
export const GroupsStoreAddMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupsStoreAddMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"removed"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GroupsStoreAddMemberMutation, GroupsStoreAddMemberMutationVariables>;
export const GroupsStoreRemoveMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupsStoreRemoveMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"removed"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GroupsStoreRemoveMemberMutation, GroupsStoreRemoveMemberMutationVariables>;
export const LocalizedNamesBootstrapDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LocalizedNamesBootstrap"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"localizedNameSets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"sourceLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]} as unknown as DocumentNode<LocalizedNamesBootstrapQuery, LocalizedNamesBootstrapQueryVariables>;
export const DashboardLocalizedNamesBootstrapDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardLocalizedNamesBootstrap"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dashboardLocalization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"localizedNameSets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"sourceLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"defaultContentLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"translateStandardRoomNames"}}]}}]}}]} as unknown as DocumentNode<DashboardLocalizedNamesBootstrapQuery, DashboardLocalizedNamesBootstrapQueryVariables>;
export const UpdateLocalizedNameSetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateLocalizedNameSet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LocalizedNameSetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateLocalizedNameSet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"sourceLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"translations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateLocalizedNameSetMutation, UpdateLocalizedNameSetMutationVariables>;
export const MaintenanceTasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MaintenanceTasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"maintenanceTasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"currentValue"}},{"kind":"Field","name":{"kind":"Name","value":"targetValue"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"context"}},{"kind":"Field","name":{"kind":"Name","value":"actionUrl"}},{"kind":"Field","name":{"kind":"Name","value":"device"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contact"}}]}}]}}]}}]}}]} as unknown as DocumentNode<MaintenanceTasksQuery, MaintenanceTasksQueryVariables>;
export const CompleteMaintenanceTasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteMaintenanceTasks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completeMaintenanceTasks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<CompleteMaintenanceTasksMutation, CompleteMaintenanceTasksMutationVariables>;
export const MaintenanceChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"MaintenanceChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"maintenanceChanged"}}]}}]} as unknown as DocumentNode<MaintenanceChangedSubscription, MaintenanceChangedSubscriptionVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"timeFormat"}},{"kind":"Field","name":{"kind":"Name","value":"temperatureUnit"}},{"kind":"Field","name":{"kind":"Name","value":"hapticsEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"mustChangePassword"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const RoomsStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RoomsStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoomFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoomFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RoomsStoreQuery, RoomsStoreQueryVariables>;
export const RoomsStoreCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsStoreCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRoomInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoomFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoomFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RoomsStoreCreateMutation, RoomsStoreCreateMutationVariables>;
export const RoomsStoreUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsStoreUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRoomInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoomFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoomFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RoomsStoreUpdateMutation, RoomsStoreUpdateMutationVariables>;
export const RoomsStoreDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsStoreDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RoomsStoreDeleteMutation, RoomsStoreDeleteMutationVariables>;
export const RoomsStoreBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsStoreBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteRooms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<RoomsStoreBatchDeleteMutation, RoomsStoreBatchDeleteMutationVariables>;
export const RoomsStoreAddMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsStoreAddMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddRoomMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRoomMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoomFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoomFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RoomsStoreAddMemberMutation, RoomsStoreAddMemberMutationVariables>;
export const RoomsStoreRemoveMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RoomsStoreRemoveMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeRoomMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoomFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoomFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RoomsStoreRemoveMemberMutation, RoomsStoreRemoveMemberMutationVariables>;
export const ScenesStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ScenesStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SceneFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SceneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scene"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"targets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"target"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"deviceName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"groupName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"removed"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"expression"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connector"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"op"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"lighting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dynamicSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"sourceKind"}},{"kind":"Field","name":{"kind":"Name","value":"presetId"}},{"kind":"Field","name":{"kind":"Name","value":"seed"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"movement"}},{"kind":"Field","name":{"kind":"Name","value":"cycleSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"overrides"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}}]}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"nativeEffectName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingStates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"preview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"pixels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}},{"kind":"Field","name":{"kind":"Name","value":"swatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]} as unknown as DocumentNode<ScenesStoreQuery, ScenesStoreQueryVariables>;
export const ScenesStoreCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScenesStoreCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SceneFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SceneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scene"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"targets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"target"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"deviceName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"groupName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"removed"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"expression"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connector"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"op"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"lighting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dynamicSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"sourceKind"}},{"kind":"Field","name":{"kind":"Name","value":"presetId"}},{"kind":"Field","name":{"kind":"Name","value":"seed"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"movement"}},{"kind":"Field","name":{"kind":"Name","value":"cycleSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"overrides"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}}]}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"nativeEffectName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingStates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"preview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"pixels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}},{"kind":"Field","name":{"kind":"Name","value":"swatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]} as unknown as DocumentNode<ScenesStoreCreateMutation, ScenesStoreCreateMutationVariables>;
export const ScenesStoreUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScenesStoreUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SceneFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SceneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scene"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"targets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"target"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"deviceName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"groupName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"removed"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"expression"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connector"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"op"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"lighting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dynamicSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"sourceKind"}},{"kind":"Field","name":{"kind":"Name","value":"presetId"}},{"kind":"Field","name":{"kind":"Name","value":"seed"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"movement"}},{"kind":"Field","name":{"kind":"Name","value":"cycleSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"overrides"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}}]}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"nativeEffectName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingStates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"preview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"pixels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}},{"kind":"Field","name":{"kind":"Name","value":"swatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]} as unknown as DocumentNode<ScenesStoreUpdateMutation, ScenesStoreUpdateMutationVariables>;
export const ScenesStoreDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScenesStoreDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ScenesStoreDeleteMutation, ScenesStoreDeleteMutationVariables>;
export const ScenesStoreBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScenesStoreBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteScenes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<ScenesStoreBatchDeleteMutation, ScenesStoreBatchDeleteMutationVariables>;
export const ScenesStoreApplyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScenesStoreApply"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"applyScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sceneId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SceneFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SceneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scene"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"targets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"target"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"deviceName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"groupName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"removed"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"expression"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connector"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"op"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"lighting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dynamicSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"sourceKind"}},{"kind":"Field","name":{"kind":"Name","value":"presetId"}},{"kind":"Field","name":{"kind":"Name","value":"seed"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"movement"}},{"kind":"Field","name":{"kind":"Name","value":"cycleSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"overrides"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}}]}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"nativeEffectName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingStates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"preview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"pixels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}},{"kind":"Field","name":{"kind":"Name","value":"swatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]} as unknown as DocumentNode<ScenesStoreApplyMutation, ScenesStoreApplyMutationVariables>;
export const ScenesStoreStopDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScenesStoreStop"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sceneId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SceneFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SceneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scene"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"targets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"target"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"deviceName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"groupName"},"name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"removed"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"expression"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connector"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"op"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"lighting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dynamicSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"sourceKind"}},{"kind":"Field","name":{"kind":"Name","value":"presetId"}},{"kind":"Field","name":{"kind":"Name","value":"seed"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"movement"}},{"kind":"Field","name":{"kind":"Name","value":"cycleSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"overrides"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}}]}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"nativeEffectName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportingStates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"targetTemperature"}},{"kind":"Field","name":{"kind":"Name","value":"hvacMode"}},{"kind":"Field","name":{"kind":"Name","value":"fanMode"}},{"kind":"Field","name":{"kind":"Name","value":"swing"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"preview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"pixels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}},{"kind":"Field","name":{"kind":"Name","value":"swatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]} as unknown as DocumentNode<ScenesStoreStopMutation, ScenesStoreStopMutationVariables>;
export const ScenesStoreActiveChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ScenesStoreActiveChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sceneActiveChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sceneId"}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]}}]} as unknown as DocumentNode<ScenesStoreActiveChangedSubscription, ScenesStoreActiveChangedSubscriptionVariables>;
export const VibeCatalogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"VibeCatalog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vibePresets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"seed"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"movement"}},{"kind":"Field","name":{"kind":"Name","value":"cycleSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"preview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"pixels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}},{"kind":"Field","name":{"kind":"Name","value":"swatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<VibeCatalogQuery, VibeCatalogQueryVariables>;
export const WebhookEndpointsStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebhookEndpointsStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"webhookEndpoints"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WebhookEndpointFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WebhookEndpointFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WebhookEndpoint"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"rateLimitCount"}},{"kind":"Field","name":{"kind":"Name","value":"rateLimitWindowMs"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastDeliveryAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<WebhookEndpointsStoreQuery, WebhookEndpointsStoreQueryVariables>;
export const WebhookEndpointsStoreCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebhookEndpointsStoreCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateWebhookEndpointInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createWebhookEndpoint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"endpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WebhookEndpointFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"secretPath"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WebhookEndpointFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WebhookEndpoint"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"rateLimitCount"}},{"kind":"Field","name":{"kind":"Name","value":"rateLimitWindowMs"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastDeliveryAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<WebhookEndpointsStoreCreateMutation, WebhookEndpointsStoreCreateMutationVariables>;
export const WebhookEndpointsStoreUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebhookEndpointsStoreUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateWebhookEndpointInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateWebhookEndpoint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WebhookEndpointFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WebhookEndpointFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WebhookEndpoint"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"rateLimitCount"}},{"kind":"Field","name":{"kind":"Name","value":"rateLimitWindowMs"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastDeliveryAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<WebhookEndpointsStoreUpdateMutation, WebhookEndpointsStoreUpdateMutationVariables>;
export const WebhookEndpointsStoreRotateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebhookEndpointsStoreRotate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rotateWebhookEndpointSecret"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"endpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WebhookEndpointFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"secretPath"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WebhookEndpointFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WebhookEndpoint"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"rateLimitCount"}},{"kind":"Field","name":{"kind":"Name","value":"rateLimitWindowMs"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastDeliveryAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<WebhookEndpointsStoreRotateMutation, WebhookEndpointsStoreRotateMutationVariables>;
export const WebhookEndpointsStoreDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebhookEndpointsStoreDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteWebhookEndpoint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<WebhookEndpointsStoreDeleteMutation, WebhookEndpointsStoreDeleteMutationVariables>;
export const WebhookEndpointsStoreBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebhookEndpointsStoreBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteWebhookEndpoints"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<WebhookEndpointsStoreBatchDeleteMutation, WebhookEndpointsStoreBatchDeleteMutationVariables>;
export const WebhookEndpointsStoreDeliveryRecordedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"WebhookEndpointsStoreDeliveryRecorded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"webhookDeliveryRecorded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"endpointId"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}}]}}]}}]} as unknown as DocumentNode<WebhookEndpointsStoreDeliveryRecordedSubscription, WebhookEndpointsStoreDeliveryRecordedSubscriptionVariables>;
export const LayoutCurrentGuestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LayoutCurrentGuest"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentGuest"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<LayoutCurrentGuestQuery, LayoutCurrentGuestQueryVariables>;
export const ActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Activity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"roomName"}}]}}]}}]}}]} as unknown as DocumentNode<ActivityQuery, ActivityQueryVariables>;
export const ActivityStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ActivityStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"advanced"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activityStream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"advanced"},"value":{"kind":"Variable","name":{"kind":"Name","value":"advanced"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"roomName"}}]}}]}}]}}]} as unknown as DocumentNode<ActivityStreamSubscription, ActivityStreamSubscriptionVariables>;
export const AutomationEditUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationEditUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"compilable"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"positionX"}},{"kind":"Field","name":{"kind":"Name","value":"positionY"}},{"kind":"Field","name":{"kind":"Name","value":"runtimeState"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationEditUpdateMutation, AutomationEditUpdateMutationVariables>;
export const AutomationEditFireTriggerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationEditFireTrigger"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nodeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fireAutomationTrigger"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"automationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"nodeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nodeId"}}}]}]}}]} as unknown as DocumentNode<AutomationEditFireTriggerMutation, AutomationEditFireTriggerMutationVariables>;
export const AutomationEditEffectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationEditEffects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"effects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nativeEffectOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}}]} as unknown as DocumentNode<AutomationEditEffectsQuery, AutomationEditEffectsQueryVariables>;
export const AutomationEditGroupReferenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationEditGroupReference"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"group"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"removed"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationEditGroupReferenceQuery, AutomationEditGroupReferenceQueryVariables>;
export const AutomationEditNodeActivatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AutomationEditNodeActivated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationNodeActivated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"automationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationId"}},{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<AutomationEditNodeActivatedSubscription, AutomationEditNodeActivatedSubscriptionVariables>;
export const CompleteFirstPasswordChangeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"completeFirstPasswordChange"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completeFirstPasswordChange"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}}]}]}}]} as unknown as DocumentNode<CompleteFirstPasswordChangeMutation, CompleteFirstPasswordChangeMutationVariables>;
export const SetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setTargetState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"EnumValue","value":"DEVICE"}},{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}]}]}}]} as unknown as DocumentNode<SetDeviceStateMutation, SetDeviceStateMutationVariables>;
export const DeviceDetailSetConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailSetConfiguration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"settings"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceConfigurationEntryInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceConfiguration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"settings"},"value":{"kind":"Variable","name":{"kind":"Name","value":"settings"}}}]}]}}]} as unknown as DocumentNode<DeviceDetailSetConfigurationMutation, DeviceDetailSetConfigurationMutationVariables>;
export const DeviceDetailUpdateDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailUpdateDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"controlledLoad"}},{"kind":"Field","name":{"kind":"Name","value":"contact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"friendlyName"}},{"kind":"Field","name":{"kind":"Name","value":"seen"}}]}}]}}]} as unknown as DocumentNode<DeviceDetailUpdateDeviceMutation, DeviceDetailUpdateDeviceMutationVariables>;
export const DeviceDetailDeleteDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailDeleteDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}}]}}]}}]} as unknown as DocumentNode<DeviceDetailDeleteDeviceMutation, DeviceDetailDeleteDeviceMutationVariables>;
export const DeviceDetailRestoreDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailRestoreDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"restoreDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}}]}}]}}]} as unknown as DocumentNode<DeviceDetailRestoreDeviceMutation, DeviceDetailRestoreDeviceMutationVariables>;
export const DeviceZigbeeDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeviceZigbeeDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"zigbee2MqttConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"frontendUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"device"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"zigbee2Mqtt"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageCandidate"}},{"kind":"Field","name":{"kind":"Name","value":"imageVersion"}},{"kind":"Field","name":{"kind":"Name","value":"networkType"}},{"kind":"Field","name":{"kind":"Name","value":"ieeeAddress"}},{"kind":"Field","name":{"kind":"Name","value":"addressVendor"}},{"kind":"Field","name":{"kind":"Name","value":"networkAddress"}},{"kind":"Field","name":{"kind":"Name","value":"supported"}},{"kind":"Field","name":{"kind":"Name","value":"interviewState"}},{"kind":"Field","name":{"kind":"Name","value":"interviewCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"interviewing"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"powerSource"}},{"kind":"Field","name":{"kind":"Name","value":"softwareBuildId"}},{"kind":"Field","name":{"kind":"Name","value":"dateCode"}},{"kind":"Field","name":{"kind":"Name","value":"definitionUrl"}},{"kind":"Field","name":{"kind":"Name","value":"definition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"vendor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"supportsOta"}}]}},{"kind":"Field","name":{"kind":"Name","value":"ota"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"installedVersion"}},{"kind":"Field","name":{"kind":"Name","value":"latestVersion"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}}]}},{"kind":"Field","name":{"kind":"Name","value":"endpoints"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"profileId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"inputClusters"}},{"kind":"Field","name":{"kind":"Name","value":"outputClusters"}},{"kind":"Field","name":{"kind":"Name","value":"bindings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cluster"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetIeeeAddress"}},{"kind":"Field","name":{"kind":"Name","value":"targetEndpoint"}},{"kind":"Field","name":{"kind":"Name","value":"targetGroupId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reportings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cluster"}},{"kind":"Field","name":{"kind":"Name","value":"attribute"}},{"kind":"Field","name":{"kind":"Name","value":"minimumReportInterval"}},{"kind":"Field","name":{"kind":"Name","value":"maximumReportInterval"}},{"kind":"Field","name":{"kind":"Name","value":"reportableChange"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"providerGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"endpoint"}}]}},{"kind":"Field","name":{"kind":"Name","value":"bridgeInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adapterType"}},{"kind":"Field","name":{"kind":"Name","value":"firmwareVersion"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"panId"}},{"kind":"Field","name":{"kind":"Name","value":"extendedPanId"}},{"kind":"Field","name":{"kind":"Name","value":"zigbee2MqttVersion"}},{"kind":"Field","name":{"kind":"Name","value":"zigbee2MqttCommit"}},{"kind":"Field","name":{"kind":"Name","value":"zigbeeHerdsmanVersion"}},{"kind":"Field","name":{"kind":"Name","value":"zigbeeHerdsmanConvertersVersion"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DeviceZigbeeDetailQuery, DeviceZigbeeDetailQueryVariables>;
export const DeviceZigbeeDocumentationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeviceZigbeeDocumentation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"device"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"zigbee2Mqtt"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sourceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastCheckedAt"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"vendor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"exposes"}},{"kind":"Field","name":{"kind":"Name","value":"batteryType"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DeviceZigbeeDocumentationQuery, DeviceZigbeeDocumentationQueryVariables>;
export const EffectEditUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EffectEditUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEffectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}},{"kind":"Field","name":{"kind":"Name","value":"tracks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"clips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startMs"}},{"kind":"Field","name":{"kind":"Name","value":"transitionMinMs"}},{"kind":"Field","name":{"kind":"Name","value":"transitionMaxMs"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}}]}}]}}]}}]} as unknown as DocumentNode<EffectEditUpdateMutation, EffectEditUpdateMutationVariables>;
export const IntegrationsPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"IntegrationsPage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"configured"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}},{"kind":"Field","name":{"kind":"Name","value":"deviceCount"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<IntegrationsPageQuery, IntegrationsPageQueryVariables>;
export const DeleteIntegrationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteIntegration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"provider"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteIntegration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"provider"},"value":{"kind":"Variable","name":{"kind":"Name","value":"provider"}}}]}]}}]} as unknown as DocumentNode<DeleteIntegrationMutation, DeleteIntegrationMutationVariables>;
export const TuyaConfigPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TuyaConfigPage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tuyaConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessId"}},{"kind":"Field","name":{"kind":"Name","value":"accessSecret"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<TuyaConfigPageQuery, TuyaConfigPageQueryVariables>;
export const UpdateTuyaConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTuyaConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TuyaConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTuyaConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessId"}},{"kind":"Field","name":{"kind":"Name","value":"accessSecret"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<UpdateTuyaConfigMutation, UpdateTuyaConfigMutationVariables>;
export const TestTuyaConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestTuyaConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TuyaConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testTuyaConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"diagnostic"}}]}}]}}]} as unknown as DocumentNode<TestTuyaConnectionMutation, TestTuyaConnectionMutationVariables>;
export const SyncTuyaDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SyncTuyaDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncTuyaDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SyncTuyaDevicesMutation, SyncTuyaDevicesMutationVariables>;
export const Zigbee2MqttConfigPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Zigbee2MqttConfigPage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"zigbee2MqttConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"broker"}},{"kind":"Field","name":{"kind":"Name","value":"frontendUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"password"}},{"kind":"Field","name":{"kind":"Name","value":"useWss"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"scanScheduleEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"scanHour"}},{"kind":"Field","name":{"kind":"Name","value":"scanMinute"}},{"kind":"Field","name":{"kind":"Name","value":"scanStartedAt"}},{"kind":"Field","name":{"kind":"Name","value":"interactiveCommandsPerSecond"}},{"kind":"Field","name":{"kind":"Name","value":"continuousCommandsPerSecond"}}]}}]}}]} as unknown as DocumentNode<Zigbee2MqttConfigPageQuery, Zigbee2MqttConfigPageQueryVariables>;
export const UpdateZigbee2MqttConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateZigbee2MqttConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Zigbee2MqttConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateZigbee2MqttConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"broker"}},{"kind":"Field","name":{"kind":"Name","value":"frontendUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"password"}},{"kind":"Field","name":{"kind":"Name","value":"useWss"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"scanScheduleEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"scanHour"}},{"kind":"Field","name":{"kind":"Name","value":"scanMinute"}},{"kind":"Field","name":{"kind":"Name","value":"scanStartedAt"}},{"kind":"Field","name":{"kind":"Name","value":"interactiveCommandsPerSecond"}},{"kind":"Field","name":{"kind":"Name","value":"continuousCommandsPerSecond"}}]}}]}}]} as unknown as DocumentNode<UpdateZigbee2MqttConfigMutation, UpdateZigbee2MqttConfigMutationVariables>;
export const TestZigbee2MqttConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestZigbee2MqttConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Zigbee2MqttConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testZigbee2MqttConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"diagnostic"}}]}}]}}]} as unknown as DocumentNode<TestZigbee2MqttConnectionMutation, TestZigbee2MqttConnectionMutationVariables>;
export const ScanZigbee2MqttNetworkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScanZigbee2MqttNetwork"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scanZigbee2MqttNetwork"}}]}}]} as unknown as DocumentNode<ScanZigbee2MqttNetworkMutation, ScanZigbee2MqttNetworkMutationVariables>;
export const Zigbee2MqttScanStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Zigbee2MqttScanState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"zigbee2MqttConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scanStartedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"networkTopologies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"scannedAt"}}]}}]}}]} as unknown as DocumentNode<Zigbee2MqttScanStateQuery, Zigbee2MqttScanStateQueryVariables>;
export const Zigbee2MqttScanUpdatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"Zigbee2MqttScanUpdates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"provider"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkTopologyUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"provider"},"value":{"kind":"Variable","name":{"kind":"Name","value":"provider"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"scannedAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodeCount"}},{"kind":"Field","name":{"kind":"Name","value":"linkCount"}}]}}]}}]} as unknown as DocumentNode<Zigbee2MqttScanUpdatesSubscription, Zigbee2MqttScanUpdatesSubscriptionVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"timeFormat"}},{"kind":"Field","name":{"kind":"Name","value":"temperatureUnit"}},{"kind":"Field","name":{"kind":"Name","value":"hapticsEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"mustChangePassword"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const GuestLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GuestLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guestLogin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"guest"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]}}]} as unknown as DocumentNode<GuestLoginMutation, GuestLoginMutationVariables>;
export const LogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Logs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"attrs"}}]}}]}}]} as unknown as DocumentNode<LogsQuery, LogsQueryVariables>;
export const LogStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"LogStream"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logStream"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"attrs"}}]}}]}}]} as unknown as DocumentNode<LogStreamSubscription, LogStreamSubscriptionVariables>;
export const ProfileUpdateCurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProfileUpdateCurrentUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCurrentUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCurrentUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"timeFormat"}},{"kind":"Field","name":{"kind":"Name","value":"temperatureUnit"}},{"kind":"Field","name":{"kind":"Name","value":"hapticsEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"mustChangePassword"}}]}}]}}]} as unknown as DocumentNode<ProfileUpdateCurrentUserMutation, ProfileUpdateCurrentUserMutationVariables>;
export const ProfileChangePasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProfileChangePassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangePasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changePassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ProfileChangePasswordMutation, ProfileChangePasswordMutationVariables>;
export const ProfileForceLogoutAllDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProfileForceLogoutAll"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"forceLogoutAllSessions"}}]}}]} as unknown as DocumentNode<ProfileForceLogoutAllMutation, ProfileForceLogoutAllMutationVariables>;
export const SceneEditorEffectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SceneEditorEffects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"effects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"nativeName"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCapabilities"}}]}}]}}]} as unknown as DocumentNode<SceneEditorEffectsQuery, SceneEditorEffectsQueryVariables>;
export const SettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]} as unknown as DocumentNode<SettingsQuery, SettingsQueryVariables>;
export const UpdateSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]} as unknown as DocumentNode<UpdateSettingMutation, UpdateSettingMutationVariables>;
export const CreateInitialUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createInitialUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateInitialUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createInitialUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateInitialUserMutation, CreateInitialUserMutationVariables>;
export const AccountsListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AccountsList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}}]}},{"kind":"Field","name":{"kind":"Name","value":"guests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<AccountsListQuery, AccountsListQueryVariables>;
export const UsersCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UsersCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}}]}}]}}]} as unknown as DocumentNode<UsersCreateMutation, UsersCreateMutationVariables>;
export const UsersDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UsersDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<UsersDeleteMutation, UsersDeleteMutationVariables>;
export const UsersBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UsersBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<UsersBatchDeleteMutation, UsersBatchDeleteMutationVariables>;
export const UsersResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UsersResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetUserPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}}]}]}}]} as unknown as DocumentNode<UsersResetPasswordMutation, UsersResetPasswordMutationVariables>;
export const GuestsCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GuestsCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGuestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGuest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<GuestsCreateMutation, GuestsCreateMutationVariables>;
export const GuestsExtendDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GuestsExtend"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"durationMinutes"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"extendGuest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"durationMinutes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"durationMinutes"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<GuestsExtendMutation, GuestsExtendMutationVariables>;
export const GuestsDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GuestsDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGuest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<GuestsDeleteMutation, GuestsDeleteMutationVariables>;
export const GuestsBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GuestsBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteGuests"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<GuestsBatchDeleteMutation, GuestsBatchDeleteMutationVariables>;
export const WebhookDetailDeliveriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebhookDetailDeliveries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endpointId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"webhookDeliveries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"endpointId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endpointId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"endpointId"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"httpStatus"}},{"kind":"Field","name":{"kind":"Name","value":"clientIp"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"bodySize"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"queryKeys"}},{"kind":"Field","name":{"kind":"Name","value":"headerNames"}}]}}]}}]} as unknown as DocumentNode<WebhookDetailDeliveriesQuery, WebhookDetailDeliveriesQueryVariables>;
export const WebhookDetailDeliveryRecordedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"WebhookDetailDeliveryRecorded"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endpointId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"webhookDeliveryRecorded"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"endpointId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endpointId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"endpointId"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"httpStatus"}},{"kind":"Field","name":{"kind":"Name","value":"clientIp"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"bodySize"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"queryKeys"}},{"kind":"Field","name":{"kind":"Name","value":"headerNames"}}]}}]}}]} as unknown as DocumentNode<WebhookDetailDeliveryRecordedSubscription, WebhookDetailDeliveryRecordedSubscriptionVariables>;