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
  access: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
  unit?: Maybe<Scalars['String']['output']>;
  valueMax?: Maybe<Scalars['Float']['output']>;
  valueMin?: Maybe<Scalars['Float']['output']>;
  values?: Maybe<Array<Scalars['String']['output']>>;
};

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

export type CreateAutomationInput = {
  edges: Array<AutomationEdgeInput>;
  enabled: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  nodes: Array<AutomationNodeInput>;
};

export type CreateEffectInput = {
  icon?: InputMaybe<Scalars['String']['input']>;
  kind: EffectKind;
  loop: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  nativeName?: InputMaybe<Scalars['String']['input']>;
  steps: Array<EffectStepInput>;
};

export type CreateGroupInput = {
  name: Scalars['String']['input'];
};

export type CreateInitialUserInput = {
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
  id: Scalars['ID']['output'];
  lastSeen?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
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

/**
 * Current state of a device across every capability it reports. Every field is
 * nullable — null means the device has not reported (or does not report) that
 * value. Clients typically branch on Device.type to decide which fields to
 * display, but any field may be present on any device.
 */
export type DeviceState = {
  __typename?: 'DeviceState';
  battery?: Maybe<Scalars['Int']['output']>;
  brightness?: Maybe<Scalars['Int']['output']>;
  color?: Maybe<Color>;
  colorTemp?: Maybe<Scalars['Int']['output']>;
  current?: Maybe<Scalars['Float']['output']>;
  energy?: Maybe<Scalars['Float']['output']>;
  humidity?: Maybe<Scalars['Float']['output']>;
  illuminance?: Maybe<Scalars['Float']['output']>;
  on?: Maybe<Scalars['Boolean']['output']>;
  power?: Maybe<Scalars['Float']['output']>;
  pressure?: Maybe<Scalars['Float']['output']>;
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
  on?: InputMaybe<Scalars['Boolean']['input']>;
  transition?: InputMaybe<Scalars['Float']['input']>;
};

export type Effect = {
  __typename?: 'Effect';
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  kind: EffectKind;
  loop: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  nativeName?: Maybe<Scalars['String']['output']>;
  /**
   * Capabilities every target device must support for this effect to apply
   * cleanly. Derived from the effect's step kinds for timeline effects;
   * empty for native effects (the per-device native option list owns that
   * filtering).
   */
  requiredCapabilities: Array<Scalars['String']['output']>;
  steps: Array<EffectStep>;
  updatedAt: Scalars['DateTime']['output'];
};

export enum EffectKind {
  Native = 'NATIVE',
  Timeline = 'TIMELINE'
}

/**
 * A single step inside a timeline effect. config is a JSON document whose
 * shape is determined by kind — the disk shape directly, not wrapped, e.g.
 * {"r":244,"g":42,"b":23,"transition_ms":200} for SET_COLOR_RGB.
 */
export type EffectStep = {
  __typename?: 'EffectStep';
  config: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  index: Scalars['Int']['output'];
  kind: EffectStepKind;
};

/**
 * Step boundary marker emitted by the runner. active=true on enter,
 * active=false on exit. runId identifies the in-flight run instance.
 */
export type EffectStepEvent = {
  __typename?: 'EffectStepEvent';
  active: Scalars['Boolean']['output'];
  effectId: Scalars['ID']['output'];
  runId: Scalars['ID']['output'];
  stepIndex: Scalars['Int']['output'];
};

export type EffectStepInput = {
  config: Scalars['String']['input'];
  kind: EffectStepKind;
};

export enum EffectStepKind {
  SetBrightness = 'SET_BRIGHTNESS',
  SetColorRgb = 'SET_COLOR_RGB',
  SetColorTemp = 'SET_COLOR_TEMP',
  SetOnOff = 'SET_ON_OFF',
  Wait = 'WAIT'
}

export type Group = {
  __typename?: 'Group';
  createdBy?: Maybe<User>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  members: Array<GroupMember>;
  name: Scalars['String']['output'];
  resolvedDevices: Array<Device>;
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

export type MqttConfig = {
  __typename?: 'MqttConfig';
  broker: Scalars['String']['output'];
  password: Scalars['String']['output'];
  useWss: Scalars['Boolean']['output'];
  username: Scalars['String']['output'];
};

export type MqttConfigInput = {
  broker: Scalars['String']['input'];
  password: Scalars['String']['input'];
  useWss: Scalars['Boolean']['input'];
  username: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addGroupMember: GroupMember;
  addRoomMember: RoomMember;
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
  deleteRoom: Scalars['Boolean']['output'];
  deleteScene: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  /**
   * Fires a manual trigger node immediately. The automation must be enabled and
   * the node must be a trigger with mode=manual. Bypasses the automation's
   * cooldown. Intended for debugging automations from the editor.
   */
  fireAutomationTrigger: Scalars['Boolean']['output'];
  login: AuthPayload;
  raiseAlarm: Alarm;
  removeGroupMember: Scalars['Boolean']['output'];
  removeRoomMember: Scalars['Boolean']['output'];
  resetUserPassword: Scalars['Boolean']['output'];
  /**
   * Starts effectId on the given target. Preempts any effect already
   * running on the target. Returns the resulting active-run row.
   */
  runEffect: ActiveEffect;
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
  testMqttConnection: ConnectionTestResult;
  toggleAutomation: AutomationGraph;
  updateAutomation: AutomationGraph;
  updateCurrentUser: User;
  updateDevice: Device;
  updateEffect: Effect;
  updateGroup: Group;
  updateMqttConfig: MqttConfig;
  updateRoom: Room;
  updateScene: Scene;
  updateSetting: Setting;
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


export type MutationLoginArgs = {
  input: LoginInput;
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


export type MutationTestMqttConnectionArgs = {
  input: MqttConfigInput;
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


export type MutationUpdateGroupArgs = {
  id: Scalars['ID']['input'];
  input: UpdateGroupInput;
};


export type MutationUpdateMqttConfigArgs = {
  input: MqttConfigInput;
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

export type Query = {
  __typename?: 'Query';
  activeEffects: Array<ActiveEffect>;
  activity: Array<ActivityEvent>;
  alarms: Array<Alarm>;
  automation?: Maybe<AutomationGraph>;
  automations: Array<AutomationGraph>;
  device?: Maybe<Device>;
  devices: Array<Device>;
  effect?: Maybe<Effect>;
  effects: Array<Effect>;
  group?: Maybe<Group>;
  groups: Array<Group>;
  logs: Array<LogEntry>;
  me?: Maybe<User>;
  mqttConfig?: Maybe<MqttConfig>;
  nativeEffectOptions: Array<NativeEffectOption>;
  room?: Maybe<Room>;
  rooms: Array<Room>;
  scene?: Maybe<Scene>;
  scenes: Array<Scene>;
  settings: Array<Setting>;
  setupStatus: SetupStatus;
  stateHistory: Array<StateSeries>;
  stateHistoryFields: Array<Scalars['String']['output']>;
  users: Array<User>;
};


export type QueryActivityArgs = {
  filter?: InputMaybe<ActivityFilter>;
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
};

export type SceneAction = {
  __typename?: 'SceneAction';
  target: SceneTarget;
  targetId: Scalars['ID']['output'];
  targetType: Scalars['String']['output'];
};

export type SceneActionInput = {
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
  mqttConfigured: Scalars['Boolean']['output'];
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
};

export type StateSeriesPoint = {
  __typename?: 'StateSeriesPoint';
  at: Scalars['DateTime']['output'];
  value: Scalars['Float']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  activityStream: ActivityEvent;
  alarmEvent: AlarmEvent;
  automationNodeActivated: AutomationNodeActivationEvent;
  deviceActionFired: DeviceActionEvent;
  deviceAdded: Device;
  deviceAvailabilityChanged: DeviceAvailabilityEvent;
  deviceRemoved: Scalars['ID']['output'];
  deviceStateChanged: DeviceStateEvent;
  /**
   * Step-boundary events from the effect runner. When runId is provided,
   * only events for that run are delivered; otherwise every effect run's
   * step boundaries are broadcast.
   */
  effectStepActivated: EffectStepEvent;
  logStream: LogEntry;
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


export type SubscriptionDeviceStateChangedArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionEffectStepActivatedArgs = {
  runId?: InputMaybe<Scalars['ID']['input']>;
};

export enum Theme {
  Dark = 'DARK',
  Light = 'LIGHT'
}

export type UpdateAutomationInput = {
  edges?: InputMaybe<Array<AutomationEdgeInput>>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  nodes?: InputMaybe<Array<AutomationNodeInput>>;
};

export type UpdateCurrentUserInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  theme?: InputMaybe<Theme>;
};

export type UpdateDeviceInput = {
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEffectInput = {
  icon?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  loop?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  nativeName?: InputMaybe<Scalars['String']['input']>;
  steps?: InputMaybe<Array<EffectStepInput>>;
};

export type UpdateGroupInput = {
  icon?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
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
  name: Scalars['String']['output'];
  /**
   * UI theme preference stored per user. Present on full user loads (`me`,
   * `users`). Null on attribution references (e.g. `scene.createdBy`), which
   * only populate `id`, `username`, and `name`.
   */
  theme?: Maybe<Theme>;
  username: Scalars['String']['output'];
};

export type E2EAutomationsDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EAutomationsDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, type: string }> };

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


export type E2EAutomationsAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'GroupMember', id: string } };

export type E2EAutomationsDeleteGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EAutomationsDeleteGroupMutation = { __typename?: 'Mutation', deleteGroup: boolean };

export type E2EDevicesListQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EDevicesListQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, source: string, type: string, available: boolean, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, temperature?: number | null, humidity?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null } | null }> };

export type E2EDeviceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EDeviceQuery = { __typename?: 'Query', device?: { __typename?: 'Device', id: string, name: string, source: string, type: string, available: boolean, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, temperature?: number | null, humidity?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null } | null } | null };

export type E2ESetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type E2ESetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string, name: string, type: string, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null } | null } };

export type E2EUpdateDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
}>;


export type E2EUpdateDeviceMutation = { __typename?: 'Mutation', updateDevice: { __typename?: 'Device', id: string, name: string } };

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


export type E2EErrorsAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'GroupMember', id: string } };

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


export type E2ECreateGroupMutation = { __typename?: 'Mutation', createGroup: { __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name: string }> } };

export type E2EAddGroupMemberMutationVariables = Exact<{
  input: AddGroupMemberInput;
}>;


export type E2EAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'GroupMember', id: string, memberType: string, memberId: string, device?: { __typename?: 'Device', id: string, name: string } | null } };

export type E2EGroupQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EGroupQuery = { __typename?: 'Query', group?: { __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name: string }> } | null };

export type E2EDeleteGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EDeleteGroupMutation = { __typename?: 'Mutation', deleteGroup: boolean };

export type E2EGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name: string }> }> };

export type E2EUpdateGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateGroupInput;
}>;


export type E2EUpdateGroupMutation = { __typename?: 'Mutation', updateGroup: { __typename?: 'Group', id: string, name: string } };

export type E2ERemoveGroupMemberMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2ERemoveGroupMemberMutation = { __typename?: 'Mutation', removeGroupMember: boolean };

export type E2EGroupsDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EGroupsDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string }> };

export type E2EScenesDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EScenesDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, type: string }> };

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


export type E2EScenesAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'GroupMember', id: string } };

export type E2EScenesDeleteGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type E2EScenesDeleteGroupMutation = { __typename?: 'Mutation', deleteGroup: boolean };

export type E2EDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, source: string, type: string, available: boolean }> };

export type E2EStateHistoryDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type E2EStateHistoryDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, type: string }> };

export type E2EStateHistoryQueryVariables = Exact<{
  filter: StateHistoryFilter;
}>;


export type E2EStateHistoryQuery = { __typename?: 'Query', stateHistory: Array<{ __typename?: 'StateSeries', deviceId: string, field: string, points: Array<{ __typename?: 'StateSeriesPoint', at: any, value: number }> }> };

export type E2EDeviceStateChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type E2EDeviceStateChangedSubscription = { __typename?: 'Subscription', deviceStateChanged: { __typename?: 'DeviceStateEvent', deviceId: string, state: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, temperature?: number | null, humidity?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null } } };

export type E2EDeviceAvailabilityChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type E2EDeviceAvailabilityChangedSubscription = { __typename?: 'Subscription', deviceAvailabilityChanged: { __typename?: 'DeviceAvailabilityEvent', deviceId: string, available: boolean } };

export type E2EDeviceAddedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type E2EDeviceAddedSubscription = { __typename?: 'Subscription', deviceAdded: { __typename?: 'Device', id: string, name: string, type: string, source: string } };

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


export type E2ESubscriptionsDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, type: string }> };

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


export type DeviceTableSetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null } };

export type StateHistoryQueryVariables = Exact<{
  filter: StateHistoryFilter;
}>;


export type StateHistoryQuery = { __typename?: 'Query', stateHistory: Array<{ __typename?: 'StateSeries', deviceId: string, field: string, points: Array<{ __typename?: 'StateSeriesPoint', at: any, value: number }> }> };

export type ActiveAlarmsQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveAlarmsQuery = { __typename?: 'Query', alarms: Array<{ __typename?: 'Alarm', id: string, latestRowId: string, severity: AlarmSeverity, kind: AlarmKind, message: string, source: string, count: number, firstRaisedAt: any, lastRaisedAt: any }> };

export type AlarmEventsSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type AlarmEventsSubscription = { __typename?: 'Subscription', alarmEvent: { __typename?: 'AlarmEvent', kind: AlarmEventKind, clearedAlarmId?: string | null, alarm?: { __typename?: 'Alarm', id: string, latestRowId: string, severity: AlarmSeverity, kind: AlarmKind, message: string, source: string, count: number, firstRaisedAt: any, lastRaisedAt: any } | null } };

export type DevicesInitQueryVariables = Exact<{ [key: string]: never; }>;


export type DevicesInitQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, source: string, type: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> };

export type DeviceStateChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceStateChangedSubscription = { __typename?: 'Subscription', deviceStateChanged: { __typename?: 'DeviceStateEvent', deviceId: string, state: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } } };

export type DeviceAvailabilityChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceAvailabilityChangedSubscription = { __typename?: 'Subscription', deviceAvailabilityChanged: { __typename?: 'DeviceAvailabilityEvent', deviceId: string, available: boolean } };

export type DeviceAddedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceAddedSubscription = { __typename?: 'Subscription', deviceAdded: { __typename?: 'Device', id: string, name: string, source: string, type: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null } };

export type DeviceRemovedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceRemovedSubscription = { __typename?: 'Subscription', deviceRemoved: string };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, username: string, name: string, avatarPath?: string | null, theme?: Theme | null, createdAt?: any | null } | null };

export type SetupStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type SetupStatusQuery = { __typename?: 'Query', setupStatus: { __typename?: 'SetupStatus', hasInitialUser: boolean, mqttConfigured: boolean } };

export type DashboardScenesQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardScenesQuery = { __typename?: 'Query', scenes: Array<{ __typename?: 'Scene', id: string, name: string }> };

export type DashboardGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, resolvedDevices: Array<{ __typename?: 'Device', id: string }> }> };

export type DashboardAutomationsQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardAutomationsQuery = { __typename?: 'Query', automations: Array<{ __typename?: 'AutomationGraph', id: string, name: string }> };

export type ApplySceneMutationVariables = Exact<{
  sceneId: Scalars['ID']['input'];
}>;


export type ApplySceneMutation = { __typename?: 'Mutation', applyScene: { __typename?: 'Scene', id: string, name: string } };

export type DashboardSetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type DashboardSetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null } };

export type DashboardAutomationNodeActivatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DashboardAutomationNodeActivatedSubscription = { __typename?: 'Subscription', automationNodeActivated: { __typename?: 'AutomationNodeActivationEvent', automationId: string, nodeId: string, active: boolean } };

export type ActivityQueryVariables = Exact<{
  filter?: InputMaybe<ActivityFilter>;
}>;


export type ActivityQuery = { __typename?: 'Query', activity: Array<{ __typename?: 'ActivityEvent', id: string, type: string, timestamp: any, message: string, payload: string, source: { __typename?: 'ActivitySource', kind: string, id?: string | null, name?: string | null, type?: string | null, roomId?: string | null, roomName?: string | null } }> };

export type ActivityStreamSubscriptionVariables = Exact<{
  advanced?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type ActivityStreamSubscription = { __typename?: 'Subscription', activityStream: { __typename?: 'ActivityEvent', id: string, type: string, timestamp: any, message: string, payload: string, source: { __typename?: 'ActivitySource', kind: string, id?: string | null, name?: string | null, type?: string | null, roomId?: string | null, roomName?: string | null } } };

export type ActivityRoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type ActivityRoomsQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', id: string, name: string }> };

export type DeleteAlarmMutationVariables = Exact<{
  alarmId: Scalars['ID']['input'];
}>;


export type DeleteAlarmMutation = { __typename?: 'Mutation', deleteAlarm: boolean };

export type BatchDeleteAlarmsMutationVariables = Exact<{
  alarmIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type BatchDeleteAlarmsMutation = { __typename?: 'Mutation', batchDeleteAlarms: number };

export type AutomationsQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationsQuery = { __typename?: 'Query', automations: Array<{ __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, lastFiredAt?: any | null, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type CreateAutomationMutationVariables = Exact<{
  input: CreateAutomationInput;
}>;


export type CreateAutomationMutation = { __typename?: 'Mutation', createAutomation: { __typename?: 'AutomationGraph', id: string, name: string, enabled: boolean, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type ToggleAutomationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  enabled: Scalars['Boolean']['input'];
}>;


export type ToggleAutomationMutation = { __typename?: 'Mutation', toggleAutomation: { __typename?: 'AutomationGraph', id: string, enabled: boolean } };

export type DeleteAutomationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAutomationMutation = { __typename?: 'Mutation', deleteAutomation: boolean };

export type BatchDeleteAutomationsMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type BatchDeleteAutomationsMutation = { __typename?: 'Mutation', batchDeleteAutomations: number };

export type AutomationListUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAutomationInput;
}>;


export type AutomationListUpdateMutation = { __typename?: 'Mutation', updateAutomation: { __typename?: 'AutomationGraph', id: string, name: string } };

export type AutomationsPageDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationsPageDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string }> };

export type AutomationsPageScenesQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationsPageScenesQuery = { __typename?: 'Query', scenes: Array<{ __typename?: 'Scene', id: string, name: string }> };

export type AutomationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AutomationQuery = { __typename?: 'Query', automation?: { __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string, positionX: number, positionY: number }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }> } | null };

export type AutomationEditUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAutomationInput;
}>;


export type AutomationEditUpdateMutation = { __typename?: 'Mutation', updateAutomation: { __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string, positionX: number, positionY: number }>, edges: Array<{ __typename?: 'AutomationEdge', fromNodeId: string, toNodeId: string }> } };

export type AutomationEditFireTriggerMutationVariables = Exact<{
  automationId: Scalars['ID']['input'];
  nodeId: Scalars['ID']['input'];
}>;


export type AutomationEditFireTriggerMutation = { __typename?: 'Mutation', fireAutomationTrigger: boolean };

export type AutomationEditDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationEditDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> };

export type AutomationEditGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationEditGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }> }> };

export type AutomationEditRoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationEditRoomsQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', id: string, name: string, resolvedDevices: Array<{ __typename?: 'Device', id: string }> }> };

export type AutomationEditScenesQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationEditScenesQuery = { __typename?: 'Query', scenes: Array<{ __typename?: 'Scene', id: string, name: string }> };

export type AutomationEditNodeActivatedSubscriptionVariables = Exact<{
  automationId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type AutomationEditNodeActivatedSubscription = { __typename?: 'Subscription', automationNodeActivated: { __typename?: 'AutomationNodeActivationEvent', automationId: string, nodeId: string, active: boolean } };

export type UpdateDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
}>;


export type UpdateDeviceMutation = { __typename?: 'Mutation', updateDevice: { __typename?: 'Device', id: string, name: string } };

export type DeviceListRoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type DeviceListRoomsQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'RoomMember', memberType: string, memberId: string }> }> };

export type DeviceListGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type DeviceListGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'GroupMember', memberType: string, memberId: string }> }> };

export type DeviceListAddRoomMemberMutationVariables = Exact<{
  input: AddRoomMemberInput;
}>;


export type DeviceListAddRoomMemberMutation = { __typename?: 'Mutation', addRoomMember: { __typename?: 'RoomMember', id: string } };

export type DeviceListAddGroupMemberMutationVariables = Exact<{
  input: AddGroupMemberInput;
}>;


export type DeviceListAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'GroupMember', id: string } };

export type DeviceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeviceQuery = { __typename?: 'Query', device?: { __typename?: 'Device', id: string, name: string, source: string, type: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null } | null };

export type DeviceDetailGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type DeviceDetailGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }> }> };

export type DeviceDetailRoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type DeviceDetailRoomsQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', id: string, name: string, members: Array<{ __typename?: 'RoomMember', id: string, memberType: string, memberId: string }> }> };

export type DeviceDetailAddRoomMemberMutationVariables = Exact<{
  input: AddRoomMemberInput;
}>;


export type DeviceDetailAddRoomMemberMutation = { __typename?: 'Mutation', addRoomMember: { __typename?: 'RoomMember', id: string } };

export type DeviceDetailRemoveRoomMemberMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeviceDetailRemoveRoomMemberMutation = { __typename?: 'Mutation', removeRoomMember: boolean };

export type DeviceDetailAddGroupMemberMutationVariables = Exact<{
  input: AddGroupMemberInput;
}>;


export type DeviceDetailAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'GroupMember', id: string } };

export type DeviceDetailRemoveGroupMemberMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeviceDetailRemoveGroupMemberMutation = { __typename?: 'Mutation', removeGroupMember: boolean };

export type SetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type SetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null } };

export type DeviceDetailDeviceStateChangedSubscriptionVariables = Exact<{
  deviceId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type DeviceDetailDeviceStateChangedSubscription = { __typename?: 'Subscription', deviceStateChanged: { __typename?: 'DeviceStateEvent', deviceId: string, state: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } } };

export type GroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type GroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string, device?: { __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null } | null, group?: { __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string, device?: { __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null } | null, group?: { __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }> } | null }> } | null, room?: { __typename?: 'Room', id: string, name: string, resolvedDevices: Array<{ __typename?: 'Device', id: string, name: string }> } | null }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type GroupsPageDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type GroupsPageDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> };

export type GroupsPageRoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type GroupsPageRoomsQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', id: string, name: string, resolvedDevices: Array<{ __typename?: 'Device', id: string, name: string }>, members: Array<{ __typename?: 'RoomMember', memberType: string, memberId: string }> }> };

export type CreateGroupMutationVariables = Exact<{
  input: CreateGroupInput;
}>;


export type CreateGroupMutation = { __typename?: 'Mutation', createGroup: { __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type UpdateGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateGroupInput;
}>;


export type UpdateGroupMutation = { __typename?: 'Mutation', updateGroup: { __typename?: 'Group', id: string, name: string, icon?: string | null } };

export type DeleteGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteGroupMutation = { __typename?: 'Mutation', deleteGroup: boolean };

export type BatchDeleteGroupsMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type BatchDeleteGroupsMutation = { __typename?: 'Mutation', batchDeleteGroups: number };

export type AddGroupMemberMutationVariables = Exact<{
  input: AddGroupMemberInput;
}>;


export type AddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'GroupMember', id: string, memberType: string, memberId: string } };

export type RemoveGroupMemberMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RemoveGroupMemberMutation = { __typename?: 'Mutation', removeGroupMember: boolean };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', token: string, user: { __typename?: 'User', id: string, username: string, name: string } } };

export type LogsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type LogsQuery = { __typename?: 'Query', logs: Array<{ __typename?: 'LogEntry', timestamp: any, level: string, message: string, attrs: string }> };

export type LogStreamSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type LogStreamSubscription = { __typename?: 'Subscription', logStream: { __typename?: 'LogEntry', timestamp: any, level: string, message: string, attrs: string } };

export type ProfileUpdateCurrentUserMutationVariables = Exact<{
  input: UpdateCurrentUserInput;
}>;


export type ProfileUpdateCurrentUserMutation = { __typename?: 'Mutation', updateCurrentUser: { __typename?: 'User', id: string, username: string, name: string, avatarPath?: string | null, theme?: Theme | null, createdAt?: any | null } };

export type ProfileChangePasswordMutationVariables = Exact<{
  input: ChangePasswordInput;
}>;


export type ProfileChangePasswordMutation = { __typename?: 'Mutation', changePassword: boolean };

export type RoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type RoomsQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'RoomMember', id: string, memberType: string, memberId: string, device?: { __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean } | null, group?: { __typename?: 'Group', id: string, name: string, icon?: string | null, resolvedDevices: Array<{ __typename?: 'Device', id: string }> } | null }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type RoomsPageDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type RoomsPageDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean }> };

export type RoomsPageGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type RoomsPageGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', memberType: string, memberId: string }> }> };

export type CreateRoomMutationVariables = Exact<{
  input: CreateRoomInput;
}>;


export type CreateRoomMutation = { __typename?: 'Mutation', createRoom: { __typename?: 'Room', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'RoomMember', id: string, memberType: string, memberId: string, device?: { __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean } | null, group?: { __typename?: 'Group', id: string, name: string, icon?: string | null, resolvedDevices: Array<{ __typename?: 'Device', id: string }> } | null }>, resolvedDevices: Array<{ __typename?: 'Device', id: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type UpdateRoomMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateRoomInput;
}>;


export type UpdateRoomMutation = { __typename?: 'Mutation', updateRoom: { __typename?: 'Room', id: string, name: string, icon?: string | null } };

export type DeleteRoomMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteRoomMutation = { __typename?: 'Mutation', deleteRoom: boolean };

export type BatchDeleteRoomsMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type BatchDeleteRoomsMutation = { __typename?: 'Mutation', batchDeleteRooms: number };

export type AddRoomMemberMutationVariables = Exact<{
  input: AddRoomMemberInput;
}>;


export type AddRoomMemberMutation = { __typename?: 'Mutation', addRoomMember: { __typename?: 'RoomMember', id: string, memberType: string, memberId: string } };

export type RemoveRoomMemberMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RemoveRoomMemberMutation = { __typename?: 'Mutation', removeRoomMember: boolean };

export type ScenesQueryVariables = Exact<{ [key: string]: never; }>;


export type ScenesQuery = { __typename?: 'Query', scenes: Array<{ __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, effectivePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type CreateSceneMutationVariables = Exact<{
  input: CreateSceneInput;
}>;


export type CreateSceneMutation = { __typename?: 'Mutation', createScene: { __typename?: 'Scene', id: string, name: string, activatedAt?: any | null, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, effectivePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type ScenesSceneActiveChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type ScenesSceneActiveChangedSubscription = { __typename?: 'Subscription', sceneActiveChanged: { __typename?: 'SceneActiveEvent', sceneId: string, activatedAt?: any | null } };

export type DeleteSceneMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSceneMutation = { __typename?: 'Mutation', deleteScene: boolean };

export type BatchDeleteScenesMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type BatchDeleteScenesMutation = { __typename?: 'Mutation', batchDeleteScenes: number };

export type SceneListUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateSceneInput;
}>;


export type SceneListUpdateMutation = { __typename?: 'Mutation', updateScene: { __typename?: 'Scene', id: string, name: string, icon?: string | null } };

export type ScenesPageDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type ScenesPageDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string }> };

export type SceneQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SceneQuery = { __typename?: 'Query', scene?: { __typename?: 'Scene', id: string, name: string, icon?: string | null, activatedAt?: any | null, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string, target: { __typename: 'Device', id: string, name: string, type: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null } | { __typename: 'Group', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> } | { __typename: 'Room', id: string, name: string, icon?: string | null, resolvedDevices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> } }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }> } | null };

export type SceneEditSceneActiveChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type SceneEditSceneActiveChangedSubscription = { __typename?: 'Subscription', sceneActiveChanged: { __typename?: 'SceneActiveEvent', sceneId: string, activatedAt?: any | null } };

export type SceneEditDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type SceneEditDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> };

export type SceneEditGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type SceneEditGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> }> };

export type SceneEditRoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type SceneEditRoomsQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'RoomMember', id: string, memberType: string, memberId: string, device?: { __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null } | null, group?: { __typename?: 'Group', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string, device?: { __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean } | null, group?: { __typename?: 'Group', id: string, name: string, icon?: string | null } | null, room?: { __typename?: 'Room', id: string, name: string, icon?: string | null } | null }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> } | null }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'DeviceState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, temperature?: number | null, humidity?: number | null, pressure?: number | null, illuminance?: number | null, battery?: number | null, power?: number | null, voltage?: number | null, current?: number | null, energy?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | null }> }> };

export type SceneEditUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateSceneInput;
}>;


export type SceneEditUpdateMutation = { __typename?: 'Mutation', updateScene: { __typename?: 'Scene', id: string, name: string, icon?: string | null, actions: Array<{ __typename?: 'SceneAction', targetType: string, targetId: string }>, devicePayloads: Array<{ __typename?: 'SceneDevicePayload', deviceId: string, payload: string }> } };

export type SceneEditSetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: DeviceStateInput;
}>;


export type SceneEditSetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string } };

export type SceneEditApplyMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SceneEditApplyMutation = { __typename?: 'Mutation', applyScene: { __typename?: 'Scene', id: string } };

export type MqttConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type MqttConfigQuery = { __typename?: 'Query', mqttConfig?: { __typename?: 'MqttConfig', broker: string, username: string, password: string, useWss: boolean } | null };

export type SettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type SettingsQuery = { __typename?: 'Query', settings: Array<{ __typename?: 'Setting', key: string, value: string }> };

export type UpdateMqttConfigMutationVariables = Exact<{
  input: MqttConfigInput;
}>;


export type UpdateMqttConfigMutation = { __typename?: 'Mutation', updateMqttConfig: { __typename?: 'MqttConfig', broker: string, username: string, password: string, useWss: boolean } };

export type TestMqttConnectionMutationVariables = Exact<{
  input: MqttConfigInput;
}>;


export type TestMqttConnectionMutation = { __typename?: 'Mutation', testMqttConnection: { __typename?: 'ConnectionTestResult', success: boolean, message: string } };

export type UpdateSettingMutationVariables = Exact<{
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
}>;


export type UpdateSettingMutation = { __typename?: 'Mutation', updateSetting: { __typename?: 'Setting', key: string, value: string } };

export type CreateInitialUserMutationVariables = Exact<{
  input: CreateInitialUserInput;
}>;


export type CreateInitialUserMutation = { __typename?: 'Mutation', createInitialUser: { __typename?: 'AuthPayload', token: string, user: { __typename?: 'User', id: string, username: string, name: string } } };

export type SetupUpdateMqttConfigMutationVariables = Exact<{
  input: MqttConfigInput;
}>;


export type SetupUpdateMqttConfigMutation = { __typename?: 'Mutation', updateMqttConfig: { __typename?: 'MqttConfig', broker: string } };

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


export const E2EAutomationsDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EAutomationsDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<E2EAutomationsDevicesQuery, E2EAutomationsDevicesQueryVariables>;
export const E2ECreateAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ECreateAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<E2ECreateAutomationMutation, E2ECreateAutomationMutationVariables>;
export const E2EAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<E2EAutomationQuery, E2EAutomationQueryVariables>;
export const E2EAutomationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EAutomations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<E2EAutomationsQuery, E2EAutomationsQueryVariables>;
export const E2EUpdateAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EUpdateAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<E2EUpdateAutomationMutation, E2EUpdateAutomationMutationVariables>;
export const E2EToggleAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EToggleAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<E2EToggleAutomationMutation, E2EToggleAutomationMutationVariables>;
export const E2EDeleteAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EDeleteAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EDeleteAutomationMutation, E2EDeleteAutomationMutationVariables>;
export const E2EAutomationsCreateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EAutomationsCreateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<E2EAutomationsCreateGroupMutation, E2EAutomationsCreateGroupMutationVariables>;
export const E2EAutomationsAddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EAutomationsAddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<E2EAutomationsAddGroupMemberMutation, E2EAutomationsAddGroupMemberMutationVariables>;
export const E2EAutomationsDeleteGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EAutomationsDeleteGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EAutomationsDeleteGroupMutation, E2EAutomationsDeleteGroupMutationVariables>;
export const E2EDevicesListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EDevicesList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<E2EDevicesListQuery, E2EDevicesListQueryVariables>;
export const E2EDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"device"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<E2EDeviceQuery, E2EDeviceQueryVariables>;
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
export const E2EAddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EAddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"device"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<E2EAddGroupMemberMutation, E2EAddGroupMemberMutationVariables>;
export const E2EGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"group"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<E2EGroupQuery, E2EGroupQueryVariables>;
export const E2EDeleteGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EDeleteGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EDeleteGroupMutation, E2EDeleteGroupMutationVariables>;
export const E2EGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<E2EGroupsQuery, E2EGroupsQueryVariables>;
export const E2EUpdateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EUpdateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<E2EUpdateGroupMutation, E2EUpdateGroupMutationVariables>;
export const E2ERemoveGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ERemoveGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2ERemoveGroupMemberMutation, E2ERemoveGroupMemberMutationVariables>;
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
export const E2EDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}}]}}]} as unknown as DocumentNode<E2EDevicesQuery, E2EDevicesQueryVariables>;
export const E2EStateHistoryDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EStateHistoryDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<E2EStateHistoryDevicesQuery, E2EStateHistoryDevicesQueryVariables>;
export const E2EStateHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EStateHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StateHistoryFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stateHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"points"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"at"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]} as unknown as DocumentNode<E2EStateHistoryQuery, E2EStateHistoryQueryVariables>;
export const E2EDeviceStateChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"E2EDeviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<E2EDeviceStateChangedSubscription, E2EDeviceStateChangedSubscriptionVariables>;
export const E2EDeviceAvailabilityChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"E2EDeviceAvailabilityChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceAvailabilityChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}}]}}]} as unknown as DocumentNode<E2EDeviceAvailabilityChangedSubscription, E2EDeviceAvailabilityChangedSubscriptionVariables>;
export const E2EDeviceAddedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"E2EDeviceAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}}]}}]}}]} as unknown as DocumentNode<E2EDeviceAddedSubscription, E2EDeviceAddedSubscriptionVariables>;
export const E2EDeviceRemovedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"E2EDeviceRemoved"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceRemoved"}}]}}]} as unknown as DocumentNode<E2EDeviceRemovedSubscription, E2EDeviceRemovedSubscriptionVariables>;
export const E2EAutomationNodeActivatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"E2EAutomationNodeActivated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationNodeActivated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"automationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationId"}},{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<E2EAutomationNodeActivatedSubscription, E2EAutomationNodeActivatedSubscriptionVariables>;
export const E2EDeviceStateChangedFilteredDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"E2EDeviceStateChangedFiltered"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}}]}}]}}]}}]} as unknown as DocumentNode<E2EDeviceStateChangedFilteredSubscription, E2EDeviceStateChangedFilteredSubscriptionVariables>;
export const E2ESubscriptionsDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2ESubscriptionsDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<E2ESubscriptionsDevicesQuery, E2ESubscriptionsDevicesQueryVariables>;
export const E2ESubscriptionsCreateAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ESubscriptionsCreateAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]}}]} as unknown as DocumentNode<E2ESubscriptionsCreateAutomationMutation, E2ESubscriptionsCreateAutomationMutationVariables>;
export const E2ESubscriptionsDeleteAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ESubscriptionsDeleteAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2ESubscriptionsDeleteAutomationMutation, E2ESubscriptionsDeleteAutomationMutationVariables>;
export const E2ECreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2ECreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}}]}}]}}]} as unknown as DocumentNode<E2ECreateUserMutation, E2ECreateUserMutationVariables>;
export const E2EUpdateCurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EUpdateCurrentUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCurrentUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCurrentUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}}]}}]}}]} as unknown as DocumentNode<E2EUpdateCurrentUserMutation, E2EUpdateCurrentUserMutationVariables>;
export const E2EDeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EDeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<E2EDeleteUserMutation, E2EDeleteUserMutationVariables>;
export const E2EResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"E2EResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"p"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetUserPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"p"}}}]}]}}]} as unknown as DocumentNode<E2EResetPasswordMutation, E2EResetPasswordMutationVariables>;
export const E2EMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"E2EMe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}}]}}]}}]} as unknown as DocumentNode<E2EMeQuery, E2EMeQueryVariables>;
export const DeviceCardSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceCardSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceCardSetDeviceStateMutation, DeviceCardSetDeviceStateMutationVariables>;
export const DeviceCardSimulateActionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceCardSimulateAction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"action"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulateDeviceAction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"action"},"value":{"kind":"Variable","name":{"kind":"Name","value":"action"}}}]}]}}]} as unknown as DocumentNode<DeviceCardSimulateActionMutation, DeviceCardSimulateActionMutationVariables>;
export const DeviceTableSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceTableSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DeviceTableSetDeviceStateMutation, DeviceTableSetDeviceStateMutationVariables>;
export const StateHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StateHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StateHistoryFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stateHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"points"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"at"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]} as unknown as DocumentNode<StateHistoryQuery, StateHistoryQueryVariables>;
export const ActiveAlarmsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActiveAlarms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alarms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"latestRowId"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"firstRaisedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRaisedAt"}}]}}]}}]} as unknown as DocumentNode<ActiveAlarmsQuery, ActiveAlarmsQueryVariables>;
export const AlarmEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AlarmEvents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alarmEvent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"clearedAlarmId"}},{"kind":"Field","name":{"kind":"Name","value":"alarm"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"latestRowId"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"firstRaisedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRaisedAt"}}]}}]}}]}}]} as unknown as DocumentNode<AlarmEventsSubscription, AlarmEventsSubscriptionVariables>;
export const DevicesInitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DevicesInit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<DevicesInitQuery, DevicesInitQueryVariables>;
export const DeviceStateChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceStateChangedSubscription, DeviceStateChangedSubscriptionVariables>;
export const DeviceAvailabilityChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceAvailabilityChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceAvailabilityChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}}]}}]} as unknown as DocumentNode<DeviceAvailabilityChangedSubscription, DeviceAvailabilityChangedSubscriptionVariables>;
export const DeviceAddedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceAddedSubscription, DeviceAddedSubscriptionVariables>;
export const DeviceRemovedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceRemoved"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceRemoved"}}]}}]} as unknown as DocumentNode<DeviceRemovedSubscription, DeviceRemovedSubscriptionVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const SetupStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"setupStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setupStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasInitialUser"}},{"kind":"Field","name":{"kind":"Name","value":"mqttConfigured"}}]}}]}}]} as unknown as DocumentNode<SetupStatusQuery, SetupStatusQueryVariables>;
export const DashboardScenesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardScenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DashboardScenesQuery, DashboardScenesQueryVariables>;
export const DashboardGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DashboardGroupsQuery, DashboardGroupsQueryVariables>;
export const DashboardAutomationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardAutomations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DashboardAutomationsQuery, DashboardAutomationsQueryVariables>;
export const ApplySceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApplyScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"applyScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sceneId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ApplySceneMutation, ApplySceneMutationVariables>;
export const DashboardSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DashboardSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<DashboardSetDeviceStateMutation, DashboardSetDeviceStateMutationVariables>;
export const DashboardAutomationNodeActivatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DashboardAutomationNodeActivated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationNodeActivated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationId"}},{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<DashboardAutomationNodeActivatedSubscription, DashboardAutomationNodeActivatedSubscriptionVariables>;
export const ActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Activity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"roomName"}}]}}]}}]}}]} as unknown as DocumentNode<ActivityQuery, ActivityQueryVariables>;
export const ActivityStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ActivityStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"advanced"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activityStream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"advanced"},"value":{"kind":"Variable","name":{"kind":"Name","value":"advanced"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"roomName"}}]}}]}}]}}]} as unknown as DocumentNode<ActivityStreamSubscription, ActivityStreamSubscriptionVariables>;
export const ActivityRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActivityRooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ActivityRoomsQuery, ActivityRoomsQueryVariables>;
export const DeleteAlarmDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAlarm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"alarmId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAlarm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"alarmId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"alarmId"}}}]}]}}]} as unknown as DocumentNode<DeleteAlarmMutation, DeleteAlarmMutationVariables>;
export const BatchDeleteAlarmsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BatchDeleteAlarms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"alarmIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteAlarms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"alarmIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"alarmIds"}}}]}]}}]} as unknown as DocumentNode<BatchDeleteAlarmsMutation, BatchDeleteAlarmsMutationVariables>;
export const AutomationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Automations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastFiredAt"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationsQuery, AutomationsQueryVariables>;
export const CreateAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateAutomationMutation, CreateAutomationMutationVariables>;
export const ToggleAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<ToggleAutomationMutation, ToggleAutomationMutationVariables>;
export const DeleteAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAutomationMutation, DeleteAutomationMutationVariables>;
export const BatchDeleteAutomationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BatchDeleteAutomations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteAutomations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<BatchDeleteAutomationsMutation, BatchDeleteAutomationsMutationVariables>;
export const AutomationListUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationListUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationListUpdateMutation, AutomationListUpdateMutationVariables>;
export const AutomationsPageDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationsPageDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationsPageDevicesQuery, AutomationsPageDevicesQueryVariables>;
export const AutomationsPageScenesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationsPageScenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationsPageScenesQuery, AutomationsPageScenesQueryVariables>;
export const AutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Automation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"positionX"}},{"kind":"Field","name":{"kind":"Name","value":"positionY"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationQuery, AutomationQueryVariables>;
export const AutomationEditUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationEditUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"positionX"}},{"kind":"Field","name":{"kind":"Name","value":"positionY"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationEditUpdateMutation, AutomationEditUpdateMutationVariables>;
export const AutomationEditFireTriggerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationEditFireTrigger"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nodeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fireAutomationTrigger"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"automationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"nodeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nodeId"}}}]}]}}]} as unknown as DocumentNode<AutomationEditFireTriggerMutation, AutomationEditFireTriggerMutationVariables>;
export const AutomationEditDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationEditDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationEditDevicesQuery, AutomationEditDevicesQueryVariables>;
export const AutomationEditGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationEditGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationEditGroupsQuery, AutomationEditGroupsQueryVariables>;
export const AutomationEditRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationEditRooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationEditRoomsQuery, AutomationEditRoomsQueryVariables>;
export const AutomationEditScenesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationEditScenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationEditScenesQuery, AutomationEditScenesQueryVariables>;
export const AutomationEditNodeActivatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AutomationEditNodeActivated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationNodeActivated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"automationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationId"}},{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<AutomationEditNodeActivatedSubscription, AutomationEditNodeActivatedSubscriptionVariables>;
export const UpdateDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<UpdateDeviceMutation, UpdateDeviceMutationVariables>;
export const DeviceListRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeviceListRooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceListRoomsQuery, DeviceListRoomsQueryVariables>;
export const DeviceListGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeviceListGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceListGroupsQuery, DeviceListGroupsQueryVariables>;
export const DeviceListAddRoomMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceListAddRoomMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddRoomMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRoomMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeviceListAddRoomMemberMutation, DeviceListAddRoomMemberMutationVariables>;
export const DeviceListAddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceListAddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeviceListAddGroupMemberMutation, DeviceListAddGroupMemberMutationVariables>;
export const DeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Device"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"device"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceQuery, DeviceQueryVariables>;
export const DeviceDetailGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeviceDetailGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceDetailGroupsQuery, DeviceDetailGroupsQueryVariables>;
export const DeviceDetailRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeviceDetailRooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceDetailRoomsQuery, DeviceDetailRoomsQueryVariables>;
export const DeviceDetailAddRoomMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailAddRoomMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddRoomMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRoomMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeviceDetailAddRoomMemberMutation, DeviceDetailAddRoomMemberMutationVariables>;
export const DeviceDetailRemoveRoomMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailRemoveRoomMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeRoomMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeviceDetailRemoveRoomMemberMutation, DeviceDetailRemoveRoomMemberMutationVariables>;
export const DeviceDetailAddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailAddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeviceDetailAddGroupMemberMutation, DeviceDetailAddGroupMemberMutationVariables>;
export const DeviceDetailRemoveGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailRemoveGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeviceDetailRemoveGroupMemberMutation, DeviceDetailRemoveGroupMemberMutationVariables>;
export const SetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<SetDeviceStateMutation, SetDeviceStateMutationVariables>;
export const DeviceDetailDeviceStateChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceDetailDeviceStateChanged"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceDetailDeviceStateChangedSubscription, DeviceDetailDeviceStateChangedSubscriptionVariables>;
export const GroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"device"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"device"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"room"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GroupsQuery, GroupsQueryVariables>;
export const GroupsPageDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GroupsPageDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<GroupsPageDevicesQuery, GroupsPageDevicesQueryVariables>;
export const GroupsPageRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GroupsPageRooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]} as unknown as DocumentNode<GroupsPageRoomsQuery, GroupsPageRoomsQueryVariables>;
export const CreateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateGroupMutation, CreateGroupMutationVariables>;
export const UpdateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}}]} as unknown as DocumentNode<UpdateGroupMutation, UpdateGroupMutationVariables>;
export const DeleteGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteGroupMutation, DeleteGroupMutationVariables>;
export const BatchDeleteGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BatchDeleteGroups"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteGroups"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<BatchDeleteGroupsMutation, BatchDeleteGroupsMutationVariables>;
export const AddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]} as unknown as DocumentNode<AddGroupMemberMutation, AddGroupMemberMutationVariables>;
export const RemoveGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RemoveGroupMemberMutation, RemoveGroupMemberMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const LogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Logs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"attrs"}}]}}]}}]} as unknown as DocumentNode<LogsQuery, LogsQueryVariables>;
export const LogStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"LogStream"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logStream"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"attrs"}}]}}]}}]} as unknown as DocumentNode<LogStreamSubscription, LogStreamSubscriptionVariables>;
export const ProfileUpdateCurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProfileUpdateCurrentUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCurrentUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCurrentUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ProfileUpdateCurrentUserMutation, ProfileUpdateCurrentUserMutationVariables>;
export const ProfileChangePasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProfileChangePassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangePasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changePassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ProfileChangePasswordMutation, ProfileChangePasswordMutationVariables>;
export const RoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"device"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<RoomsQuery, RoomsQueryVariables>;
export const RoomsPageDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RoomsPageDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}}]}}]} as unknown as DocumentNode<RoomsPageDevicesQuery, RoomsPageDevicesQueryVariables>;
export const RoomsPageGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RoomsPageGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]} as unknown as DocumentNode<RoomsPageGroupsQuery, RoomsPageGroupsQueryVariables>;
export const CreateRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRoomInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"device"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateRoomMutation, CreateRoomMutationVariables>;
export const UpdateRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRoomInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}}]} as unknown as DocumentNode<UpdateRoomMutation, UpdateRoomMutationVariables>;
export const DeleteRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteRoomMutation, DeleteRoomMutationVariables>;
export const BatchDeleteRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BatchDeleteRooms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteRooms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<BatchDeleteRoomsMutation, BatchDeleteRoomsMutationVariables>;
export const AddRoomMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddRoomMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddRoomMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRoomMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]} as unknown as DocumentNode<AddRoomMemberMutation, AddRoomMemberMutationVariables>;
export const RemoveRoomMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveRoomMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeRoomMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RemoveRoomMemberMutation, RemoveRoomMemberMutationVariables>;
export const ScenesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"effectivePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]}}]} as unknown as DocumentNode<ScenesQuery, ScenesQueryVariables>;
export const CreateSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"effectivePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateSceneMutation, CreateSceneMutationVariables>;
export const ScenesSceneActiveChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ScenesSceneActiveChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sceneActiveChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sceneId"}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]}}]} as unknown as DocumentNode<ScenesSceneActiveChangedSubscription, ScenesSceneActiveChangedSubscriptionVariables>;
export const DeleteSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteSceneMutation, DeleteSceneMutationVariables>;
export const BatchDeleteScenesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BatchDeleteScenes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteScenes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<BatchDeleteScenesMutation, BatchDeleteScenesMutationVariables>;
export const SceneListUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SceneListUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}}]} as unknown as DocumentNode<SceneListUpdateMutation, SceneListUpdateMutationVariables>;
export const ScenesPageDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ScenesPageDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ScenesPageDevicesQuery, ScenesPageDevicesQueryVariables>;
export const SceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Scene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"target"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Room"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]}}]} as unknown as DocumentNode<SceneQuery, SceneQueryVariables>;
export const SceneEditSceneActiveChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SceneEditSceneActiveChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sceneActiveChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sceneId"}},{"kind":"Field","name":{"kind":"Name","value":"activatedAt"}}]}}]}}]} as unknown as DocumentNode<SceneEditSceneActiveChangedSubscription, SceneEditSceneActiveChangedSubscriptionVariables>;
export const SceneEditDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SceneEditDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]} as unknown as DocumentNode<SceneEditDevicesQuery, SceneEditDevicesQueryVariables>;
export const SceneEditGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SceneEditGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SceneEditGroupsQuery, SceneEditGroupsQueryVariables>;
export const SceneEditRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SceneEditRooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"device"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"device"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"room"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"power"}},{"kind":"Field","name":{"kind":"Name","value":"voltage"}},{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"energy"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SceneEditRoomsQuery, SceneEditRoomsQueryVariables>;
export const SceneEditUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SceneEditUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"devicePayloads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}}]}}]}}]} as unknown as DocumentNode<SceneEditUpdateMutation, SceneEditUpdateMutationVariables>;
export const SceneEditSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SceneEditSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeviceStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SceneEditSetDeviceStateMutation, SceneEditSetDeviceStateMutationVariables>;
export const SceneEditApplyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SceneEditApply"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"applyScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sceneId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SceneEditApplyMutation, SceneEditApplyMutationVariables>;
export const MqttConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MqttConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mqttConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"broker"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"password"}},{"kind":"Field","name":{"kind":"Name","value":"useWss"}}]}}]}}]} as unknown as DocumentNode<MqttConfigQuery, MqttConfigQueryVariables>;
export const SettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]} as unknown as DocumentNode<SettingsQuery, SettingsQueryVariables>;
export const UpdateMqttConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMqttConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MqttConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMqttConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"broker"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"password"}},{"kind":"Field","name":{"kind":"Name","value":"useWss"}}]}}]}}]} as unknown as DocumentNode<UpdateMqttConfigMutation, UpdateMqttConfigMutationVariables>;
export const TestMqttConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestMqttConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MqttConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testMqttConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<TestMqttConnectionMutation, TestMqttConnectionMutationVariables>;
export const UpdateSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]} as unknown as DocumentNode<UpdateSettingMutation, UpdateSettingMutationVariables>;
export const CreateInitialUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createInitialUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateInitialUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createInitialUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateInitialUserMutation, CreateInitialUserMutationVariables>;
export const SetupUpdateMqttConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetupUpdateMqttConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MqttConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMqttConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"broker"}}]}}]}}]} as unknown as DocumentNode<SetupUpdateMqttConfigMutation, SetupUpdateMqttConfigMutationVariables>;
export const UsersListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UsersList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}}]}}]}}]} as unknown as DocumentNode<UsersListQuery, UsersListQueryVariables>;
export const UsersCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UsersCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarPath"}}]}}]}}]} as unknown as DocumentNode<UsersCreateMutation, UsersCreateMutationVariables>;
export const UsersDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UsersDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<UsersDeleteMutation, UsersDeleteMutationVariables>;
export const UsersBatchDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UsersBatchDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"batchDeleteUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<UsersBatchDeleteMutation, UsersBatchDeleteMutationVariables>;
export const UsersResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UsersResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetUserPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}}]}]}}]} as unknown as DocumentNode<UsersResetPasswordMutation, UsersResetPasswordMutationVariables>;