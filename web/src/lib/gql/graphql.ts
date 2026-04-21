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

export type AddRoomDeviceInput = {
  deviceId: Scalars['ID']['input'];
  roomId: Scalars['ID']['input'];
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  token: Scalars['String']['output'];
  user: User;
};

export type AutomationEdge = {
  __typename?: 'AutomationEdge';
  fromNodeId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  toNodeId: Scalars['ID']['output'];
};

export type AutomationEdgeInput = {
  fromNodeId: Scalars['ID']['input'];
  toNodeId: Scalars['ID']['input'];
};

export type AutomationGraph = {
  __typename?: 'AutomationGraph';
  cooldownSeconds: Scalars['Int']['output'];
  createdBy?: Maybe<User>;
  edges: Array<AutomationEdge>;
  enabled: Scalars['Boolean']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  nodes: Array<AutomationNode>;
};

export type AutomationNode = {
  __typename?: 'AutomationNode';
  config: Scalars['String']['output'];
  id: Scalars['ID']['output'];
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
  cooldownSeconds: Scalars['Int']['input'];
  edges: Array<AutomationEdgeInput>;
  enabled: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  nodes: Array<AutomationNodeInput>;
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

export type DeviceAvailabilityEvent = {
  __typename?: 'DeviceAvailabilityEvent';
  available: Scalars['Boolean']['output'];
  deviceId: Scalars['ID']['output'];
};

export type DeviceState = LightState | SensorState | SwitchState;

export type DeviceStateEvent = {
  __typename?: 'DeviceStateEvent';
  deviceId: Scalars['ID']['output'];
  state: DeviceState;
};

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

export type LightState = {
  __typename?: 'LightState';
  brightness?: Maybe<Scalars['Int']['output']>;
  color?: Maybe<Color>;
  colorTemp?: Maybe<Scalars['Int']['output']>;
  on?: Maybe<Scalars['Boolean']['output']>;
  transition?: Maybe<Scalars['Float']['output']>;
};

export type LightStateInput = {
  brightness?: InputMaybe<Scalars['Int']['input']>;
  color?: InputMaybe<ColorInput>;
  colorTemp?: InputMaybe<Scalars['Int']['input']>;
  on?: InputMaybe<Scalars['Boolean']['input']>;
  transition?: InputMaybe<Scalars['Float']['input']>;
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
  addRoomDevice: Room;
  applyScene: Scene;
  createAutomation: AutomationGraph;
  createGroup: Group;
  createInitialUser: AuthPayload;
  createRoom: Room;
  createScene: Scene;
  createUser: User;
  deleteAutomation: Scalars['Boolean']['output'];
  deleteGroup: Scalars['Boolean']['output'];
  deleteRoom: Scalars['Boolean']['output'];
  deleteScene: Scalars['Boolean']['output'];
  login: AuthPayload;
  removeGroupMember: Scalars['Boolean']['output'];
  removeRoomDevice: Room;
  setDeviceState: Device;
  testMqttConnection: ConnectionTestResult;
  toggleAutomation: AutomationGraph;
  updateAutomation: AutomationGraph;
  updateDevice: Device;
  updateGroup: Group;
  updateMqttConfig: MqttConfig;
  updateRoom: Room;
  updateScene: Scene;
  updateSetting: Setting;
};


export type MutationAddGroupMemberArgs = {
  input: AddGroupMemberInput;
};


export type MutationAddRoomDeviceArgs = {
  input: AddRoomDeviceInput;
};


export type MutationApplySceneArgs = {
  sceneId: Scalars['ID']['input'];
};


export type MutationCreateAutomationArgs = {
  input: CreateAutomationInput;
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


export type MutationDeleteAutomationArgs = {
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


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationRemoveGroupMemberArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveRoomDeviceArgs = {
  deviceId: Scalars['ID']['input'];
  roomId: Scalars['ID']['input'];
};


export type MutationSetDeviceStateArgs = {
  deviceId: Scalars['ID']['input'];
  state: LightStateInput;
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


export type MutationUpdateDeviceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
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

export type Query = {
  __typename?: 'Query';
  activity: Array<ActivityEvent>;
  automation?: Maybe<AutomationGraph>;
  automations: Array<AutomationGraph>;
  device?: Maybe<Device>;
  devices: Array<Device>;
  group?: Maybe<Group>;
  groups: Array<Group>;
  logs: Array<LogEntry>;
  me?: Maybe<User>;
  mqttConfig?: Maybe<MqttConfig>;
  room?: Maybe<Room>;
  rooms: Array<Room>;
  scene?: Maybe<Scene>;
  scenes: Array<Scene>;
  sensorHistory: Array<SensorReading>;
  settings: Array<Setting>;
  setupStatus: SetupStatus;
  users: Array<User>;
};


export type QueryActivityArgs = {
  filter?: InputMaybe<ActivityFilter>;
};


export type QueryAutomationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDeviceArgs = {
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


export type QuerySensorHistoryArgs = {
  deviceId: Scalars['ID']['input'];
  from?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

export type Room = {
  __typename?: 'Room';
  createdBy?: Maybe<User>;
  devices: Array<Device>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Scene = {
  __typename?: 'Scene';
  actions: Array<SceneAction>;
  createdBy?: Maybe<User>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type SceneAction = {
  __typename?: 'SceneAction';
  id: Scalars['ID']['output'];
  payload: Scalars['String']['output'];
  target: SceneTarget;
  targetId: Scalars['ID']['output'];
  targetType: Scalars['String']['output'];
};

export type SceneActionInput = {
  payload: Scalars['String']['input'];
  targetId: Scalars['ID']['input'];
  targetType: Scalars['String']['input'];
};

export type SceneTarget = Device | Group | Room;

export type SensorReading = {
  __typename?: 'SensorReading';
  battery?: Maybe<Scalars['Int']['output']>;
  deviceId: Scalars['ID']['output'];
  humidity?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  illuminance?: Maybe<Scalars['Float']['output']>;
  pressure?: Maybe<Scalars['Float']['output']>;
  recordedAt: Scalars['DateTime']['output'];
  temperature?: Maybe<Scalars['Float']['output']>;
};

export type SensorState = {
  __typename?: 'SensorState';
  battery?: Maybe<Scalars['Int']['output']>;
  humidity?: Maybe<Scalars['Float']['output']>;
  illuminance?: Maybe<Scalars['Float']['output']>;
  pressure?: Maybe<Scalars['Float']['output']>;
  temperature?: Maybe<Scalars['Float']['output']>;
};

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

export type Subscription = {
  __typename?: 'Subscription';
  activityStream: ActivityEvent;
  automationNodeActivated: AutomationNodeActivationEvent;
  deviceAdded: Device;
  deviceAvailabilityChanged: DeviceAvailabilityEvent;
  deviceRemoved: Scalars['ID']['output'];
  deviceStateChanged: DeviceStateEvent;
  logStream: LogEntry;
};


export type SubscriptionActivityStreamArgs = {
  advanced?: InputMaybe<Scalars['Boolean']['input']>;
};


export type SubscriptionAutomationNodeActivatedArgs = {
  automationId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionDeviceStateChangedArgs = {
  deviceId?: InputMaybe<Scalars['ID']['input']>;
};

export type SwitchState = {
  __typename?: 'SwitchState';
  action?: Maybe<Scalars['String']['output']>;
};

export type UpdateAutomationInput = {
  cooldownSeconds?: InputMaybe<Scalars['Int']['input']>;
  edges?: InputMaybe<Array<AutomationEdgeInput>>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  nodes?: InputMaybe<Array<AutomationNodeInput>>;
};

export type UpdateDeviceInput = {
  name?: InputMaybe<Scalars['String']['input']>;
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
  icon?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  username: Scalars['String']['output'];
};

export type SetupStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type SetupStatusQuery = { __typename?: 'Query', setupStatus: { __typename?: 'SetupStatus', hasInitialUser: boolean, mqttConfigured: boolean } };

export type DashboardDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, source: string, type: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename: 'SwitchState', action?: string | null } | null }> };

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
  state: LightStateInput;
}>;


export type DashboardSetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string, state?: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename?: 'SensorState' } | { __typename?: 'SwitchState' } | null } };

export type DashboardDeviceStateChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DashboardDeviceStateChangedSubscription = { __typename?: 'Subscription', deviceStateChanged: { __typename?: 'DeviceStateEvent', deviceId: string, state: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename: 'SwitchState', action?: string | null } } };

export type DeviceAvailabilityChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceAvailabilityChangedSubscription = { __typename?: 'Subscription', deviceAvailabilityChanged: { __typename?: 'DeviceAvailabilityEvent', deviceId: string, available: boolean } };

export type DeviceAddedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceAddedSubscription = { __typename?: 'Subscription', deviceAdded: { __typename?: 'Device', id: string, name: string, source: string, type: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename: 'SwitchState', action?: string | null } | null } };

export type DeviceRemovedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceRemovedSubscription = { __typename?: 'Subscription', deviceRemoved: string };

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

export type AutomationsQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationsQuery = { __typename?: 'Query', automations: Array<{ __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, cooldownSeconds: number, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', id: string, fromNodeId: string, toNodeId: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type CreateAutomationMutationVariables = Exact<{
  input: CreateAutomationInput;
}>;


export type CreateAutomationMutation = { __typename?: 'Mutation', createAutomation: { __typename?: 'AutomationGraph', id: string, name: string, enabled: boolean, cooldownSeconds: number, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', id: string, fromNodeId: string, toNodeId: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type ToggleAutomationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  enabled: Scalars['Boolean']['input'];
}>;


export type ToggleAutomationMutation = { __typename?: 'Mutation', toggleAutomation: { __typename?: 'AutomationGraph', id: string, enabled: boolean } };

export type DeleteAutomationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAutomationMutation = { __typename?: 'Mutation', deleteAutomation: boolean };

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


export type AutomationQuery = { __typename?: 'Query', automation?: { __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, cooldownSeconds: number, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', id: string, fromNodeId: string, toNodeId: string }> } | null };

export type AutomationEditUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAutomationInput;
}>;


export type AutomationEditUpdateMutation = { __typename?: 'Mutation', updateAutomation: { __typename?: 'AutomationGraph', id: string, name: string, icon?: string | null, enabled: boolean, cooldownSeconds: number, nodes: Array<{ __typename?: 'AutomationNode', id: string, type: string, config: string }>, edges: Array<{ __typename?: 'AutomationEdge', id: string, fromNodeId: string, toNodeId: string }> } };

export type AutomationEditDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationEditDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null } | { __typename?: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename?: 'SwitchState', action?: string | null } | null }> };

export type AutomationEditGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationEditGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }> }> };

export type AutomationEditScenesQueryVariables = Exact<{ [key: string]: never; }>;


export type AutomationEditScenesQuery = { __typename?: 'Query', scenes: Array<{ __typename?: 'Scene', id: string, name: string }> };

export type AutomationEditNodeActivatedSubscriptionVariables = Exact<{
  automationId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type AutomationEditNodeActivatedSubscription = { __typename?: 'Subscription', automationNodeActivated: { __typename?: 'AutomationNodeActivationEvent', automationId: string, nodeId: string, active: boolean } };

export type DevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type DevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, source: string, type: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename: 'SwitchState', action?: string | null } | null }> };

export type DeviceStateChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeviceStateChangedSubscription = { __typename?: 'Subscription', deviceStateChanged: { __typename?: 'DeviceStateEvent', deviceId: string, state: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename: 'SwitchState', action?: string | null } } };

export type UpdateDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
}>;


export type UpdateDeviceMutation = { __typename?: 'Mutation', updateDevice: { __typename?: 'Device', id: string, name: string } };

export type DeviceListRoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type DeviceListRoomsQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null, devices: Array<{ __typename?: 'Device', id: string }> }> };

export type DeviceListGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type DeviceListGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'GroupMember', memberType: string, memberId: string }> }> };

export type DeviceListAddRoomDeviceMutationVariables = Exact<{
  input: AddRoomDeviceInput;
}>;


export type DeviceListAddRoomDeviceMutation = { __typename?: 'Mutation', addRoomDevice: { __typename?: 'Room', id: string } };

export type DeviceListAddGroupMemberMutationVariables = Exact<{
  input: AddGroupMemberInput;
}>;


export type DeviceListAddGroupMemberMutation = { __typename?: 'Mutation', addGroupMember: { __typename?: 'GroupMember', id: string } };

export type DeviceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeviceQuery = { __typename?: 'Query', device?: { __typename?: 'Device', id: string, name: string, source: string, type: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename: 'SwitchState', action?: string | null } | null } | null };

export type DeviceDetailGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type DeviceDetailGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }> }> };

export type DeviceDetailRoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type DeviceDetailRoomsQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', id: string, name: string, devices: Array<{ __typename?: 'Device', id: string }> }> };

export type DeviceDetailAddRoomDeviceMutationVariables = Exact<{
  input: AddRoomDeviceInput;
}>;


export type DeviceDetailAddRoomDeviceMutation = { __typename?: 'Mutation', addRoomDevice: { __typename?: 'Room', id: string } };

export type DeviceDetailRemoveRoomDeviceMutationVariables = Exact<{
  roomId: Scalars['ID']['input'];
  deviceId: Scalars['ID']['input'];
}>;


export type DeviceDetailRemoveRoomDeviceMutation = { __typename?: 'Mutation', removeRoomDevice: { __typename?: 'Room', id: string } };

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
  state: LightStateInput;
}>;


export type SetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string, state?: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename?: 'SensorState' } | { __typename?: 'SwitchState' } | null } };

export type DeviceDetailDeviceStateChangedSubscriptionVariables = Exact<{
  deviceId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type DeviceDetailDeviceStateChangedSubscription = { __typename?: 'Subscription', deviceStateChanged: { __typename?: 'DeviceStateEvent', deviceId: string, state: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename: 'SwitchState', action?: string | null } } };

export type GroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type GroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, icon?: string | null, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string, device?: { __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null } | { __typename?: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename?: 'SwitchState', action?: string | null } | null } | null, group?: { __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string, device?: { __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, state?: { __typename?: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null } | { __typename?: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename?: 'SwitchState', action?: string | null } | null } | null, group?: { __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }> } | null }> } | null, room?: { __typename?: 'Room', id: string, name: string, devices: Array<{ __typename?: 'Device', id: string, name: string }> } | null }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type GroupsPageDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type GroupsPageDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename?: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null } | { __typename?: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename?: 'SwitchState', action?: string | null } | null }> };

export type GroupsPageRoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type GroupsPageRoomsQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', id: string, name: string, devices: Array<{ __typename?: 'Device', id: string, name: string }> }> };

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

export type RoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type RoomsQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', id: string, name: string, icon?: string | null, devices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename: 'SwitchState', action?: string | null } | null }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type RoomsPageDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type RoomsPageDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean }> };

export type RoomsPageGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type RoomsPageGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', memberId: string }> }> };

export type CreateRoomMutationVariables = Exact<{
  input: CreateRoomInput;
}>;


export type CreateRoomMutation = { __typename?: 'Mutation', createRoom: { __typename?: 'Room', id: string, name: string, devices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename: 'SwitchState', action?: string | null } | null }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type UpdateRoomMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateRoomInput;
}>;


export type UpdateRoomMutation = { __typename?: 'Mutation', updateRoom: { __typename?: 'Room', id: string, name: string, icon?: string | null } };

export type DeleteRoomMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteRoomMutation = { __typename?: 'Mutation', deleteRoom: boolean };

export type AddRoomDeviceMutationVariables = Exact<{
  input: AddRoomDeviceInput;
}>;


export type AddRoomDeviceMutation = { __typename?: 'Mutation', addRoomDevice: { __typename?: 'Room', id: string, name: string, devices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean }> } };

export type RemoveRoomDeviceMutationVariables = Exact<{
  roomId: Scalars['ID']['input'];
  deviceId: Scalars['ID']['input'];
}>;


export type RemoveRoomDeviceMutation = { __typename?: 'Mutation', removeRoomDevice: { __typename?: 'Room', id: string, name: string, devices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean }> } };

export type ScenesQueryVariables = Exact<{ [key: string]: never; }>;


export type ScenesQuery = { __typename?: 'Query', scenes: Array<{ __typename?: 'Scene', id: string, name: string, icon?: string | null, actions: Array<{ __typename?: 'SceneAction', id: string, targetType: string, targetId: string, payload: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null }> };

export type CreateSceneMutationVariables = Exact<{
  input: CreateSceneInput;
}>;


export type CreateSceneMutation = { __typename?: 'Mutation', createScene: { __typename?: 'Scene', id: string, name: string, actions: Array<{ __typename?: 'SceneAction', id: string, targetType: string, targetId: string, payload: string }>, createdBy?: { __typename?: 'User', id: string, username: string, name: string } | null } };

export type DeleteSceneMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSceneMutation = { __typename?: 'Mutation', deleteScene: boolean };

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


export type SceneQuery = { __typename?: 'Query', scene?: { __typename?: 'Scene', id: string, name: string, icon?: string | null, actions: Array<{ __typename?: 'SceneAction', id: string, targetType: string, targetId: string, payload: string, target: { __typename: 'Device', id: string, name: string, type: string, available: boolean, lastSeen?: any | null, capabilities: Array<{ __typename?: 'Capability', name: string, type: string, values?: Array<string> | null, valueMin?: number | null, valueMax?: number | null, unit?: string | null, access: number }>, state?: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename: 'SwitchState', action?: string | null } | null } | { __typename: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, state?: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename: 'SwitchState', action?: string | null } | null }> } | { __typename?: 'Room' } }> } | null };

export type SceneEditDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type SceneEditDevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, state?: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename: 'SwitchState', action?: string | null } | null }> };

export type SceneEditGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type SceneEditGroupsQuery = { __typename?: 'Query', groups: Array<{ __typename?: 'Group', id: string, name: string, members: Array<{ __typename?: 'GroupMember', id: string, memberType: string, memberId: string }>, resolvedDevices: Array<{ __typename?: 'Device', id: string, name: string, type: string, source: string, available: boolean, lastSeen?: any | null, state?: { __typename: 'LightState', on?: boolean | null, brightness?: number | null, colorTemp?: number | null, transition?: number | null, color?: { __typename?: 'Color', r: number, g: number, b: number, x: number, y: number } | null } | { __typename: 'SensorState', temperature?: number | null, humidity?: number | null, battery?: number | null, pressure?: number | null, illuminance?: number | null } | { __typename: 'SwitchState', action?: string | null } | null }> }> };

export type SceneEditUpdateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateSceneInput;
}>;


export type SceneEditUpdateMutation = { __typename?: 'Mutation', updateScene: { __typename?: 'Scene', id: string, name: string, icon?: string | null, actions: Array<{ __typename?: 'SceneAction', id: string, targetType: string, targetId: string, payload: string }> } };

export type SceneEditSetDeviceStateMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
  state: LightStateInput;
}>;


export type SceneEditSetDeviceStateMutation = { __typename?: 'Mutation', setDeviceState: { __typename?: 'Device', id: string } };

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


export const SetupStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"setupStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setupStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasInitialUser"}},{"kind":"Field","name":{"kind":"Name","value":"mqttConfigured"}}]}}]}}]} as unknown as DocumentNode<SetupStatusQuery, SetupStatusQueryVariables>;
export const DashboardDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DashboardDevicesQuery, DashboardDevicesQueryVariables>;
export const DashboardScenesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardScenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DashboardScenesQuery, DashboardScenesQueryVariables>;
export const DashboardGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DashboardGroupsQuery, DashboardGroupsQueryVariables>;
export const DashboardAutomationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardAutomations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DashboardAutomationsQuery, DashboardAutomationsQueryVariables>;
export const ApplySceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApplyScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"applyScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sceneId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ApplySceneMutation, ApplySceneMutationVariables>;
export const DashboardSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DashboardSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LightStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DashboardSetDeviceStateMutation, DashboardSetDeviceStateMutationVariables>;
export const DashboardDeviceStateChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DashboardDeviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DashboardDeviceStateChangedSubscription, DashboardDeviceStateChangedSubscriptionVariables>;
export const DeviceAvailabilityChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceAvailabilityChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceAvailabilityChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}}]}}]} as unknown as DocumentNode<DeviceAvailabilityChangedSubscription, DeviceAvailabilityChangedSubscriptionVariables>;
export const DeviceAddedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DeviceAddedSubscription, DeviceAddedSubscriptionVariables>;
export const DeviceRemovedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceRemoved"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceRemoved"}}]}}]} as unknown as DocumentNode<DeviceRemovedSubscription, DeviceRemovedSubscriptionVariables>;
export const DashboardAutomationNodeActivatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DashboardAutomationNodeActivated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationNodeActivated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationId"}},{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<DashboardAutomationNodeActivatedSubscription, DashboardAutomationNodeActivatedSubscriptionVariables>;
export const ActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Activity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"roomName"}}]}}]}}]}}]} as unknown as DocumentNode<ActivityQuery, ActivityQueryVariables>;
export const ActivityStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ActivityStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"advanced"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activityStream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"advanced"},"value":{"kind":"Variable","name":{"kind":"Name","value":"advanced"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"roomName"}}]}}]}}]}}]} as unknown as DocumentNode<ActivityStreamSubscription, ActivityStreamSubscriptionVariables>;
export const ActivityRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActivityRooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ActivityRoomsQuery, ActivityRoomsQueryVariables>;
export const AutomationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Automations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"cooldownSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationsQuery, AutomationsQueryVariables>;
export const CreateAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"cooldownSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateAutomationMutation, CreateAutomationMutationVariables>;
export const ToggleAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<ToggleAutomationMutation, ToggleAutomationMutationVariables>;
export const DeleteAutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAutomation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAutomationMutation, DeleteAutomationMutationVariables>;
export const AutomationListUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationListUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationListUpdateMutation, AutomationListUpdateMutationVariables>;
export const AutomationsPageDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationsPageDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationsPageDevicesQuery, AutomationsPageDevicesQueryVariables>;
export const AutomationsPageScenesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationsPageScenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationsPageScenesQuery, AutomationsPageScenesQueryVariables>;
export const AutomationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Automation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"cooldownSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationQuery, AutomationQueryVariables>;
export const AutomationEditUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AutomationEditUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAutomationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAutomation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"cooldownSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fromNodeId"}},{"kind":"Field","name":{"kind":"Name","value":"toNodeId"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationEditUpdateMutation, AutomationEditUpdateMutationVariables>;
export const AutomationEditDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationEditDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AutomationEditDevicesQuery, AutomationEditDevicesQueryVariables>;
export const AutomationEditGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationEditGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]} as unknown as DocumentNode<AutomationEditGroupsQuery, AutomationEditGroupsQueryVariables>;
export const AutomationEditScenesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutomationEditScenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AutomationEditScenesQuery, AutomationEditScenesQueryVariables>;
export const AutomationEditNodeActivatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AutomationEditNodeActivated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationNodeActivated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"automationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"automationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationId"}},{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<AutomationEditNodeActivatedSubscription, AutomationEditNodeActivatedSubscriptionVariables>;
export const DevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DevicesQuery, DevicesQueryVariables>;
export const DeviceStateChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DeviceStateChangedSubscription, DeviceStateChangedSubscriptionVariables>;
export const UpdateDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<UpdateDeviceMutation, UpdateDeviceMutationVariables>;
export const DeviceListRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeviceListRooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceListRoomsQuery, DeviceListRoomsQueryVariables>;
export const DeviceListGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeviceListGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceListGroupsQuery, DeviceListGroupsQueryVariables>;
export const DeviceListAddRoomDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceListAddRoomDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddRoomDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRoomDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeviceListAddRoomDeviceMutation, DeviceListAddRoomDeviceMutationVariables>;
export const DeviceListAddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceListAddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeviceListAddGroupMemberMutation, DeviceListAddGroupMemberMutationVariables>;
export const DeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Device"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"device"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DeviceQuery, DeviceQueryVariables>;
export const DeviceDetailGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeviceDetailGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceDetailGroupsQuery, DeviceDetailGroupsQueryVariables>;
export const DeviceDetailRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeviceDetailRooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DeviceDetailRoomsQuery, DeviceDetailRoomsQueryVariables>;
export const DeviceDetailAddRoomDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailAddRoomDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddRoomDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRoomDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeviceDetailAddRoomDeviceMutation, DeviceDetailAddRoomDeviceMutationVariables>;
export const DeviceDetailRemoveRoomDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailRemoveRoomDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeRoomDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}},{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeviceDetailRemoveRoomDeviceMutation, DeviceDetailRemoveRoomDeviceMutationVariables>;
export const DeviceDetailAddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailAddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeviceDetailAddGroupMemberMutation, DeviceDetailAddGroupMemberMutationVariables>;
export const DeviceDetailRemoveGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeviceDetailRemoveGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeviceDetailRemoveGroupMemberMutation, DeviceDetailRemoveGroupMemberMutationVariables>;
export const SetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LightStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SetDeviceStateMutation, SetDeviceStateMutationVariables>;
export const DeviceDetailDeviceStateChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DeviceDetailDeviceStateChanged"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceStateChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DeviceDetailDeviceStateChangedSubscription, DeviceDetailDeviceStateChangedSubscriptionVariables>;
export const GroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"device"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"device"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"room"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GroupsQuery, GroupsQueryVariables>;
export const GroupsPageDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GroupsPageDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GroupsPageDevicesQuery, GroupsPageDevicesQueryVariables>;
export const GroupsPageRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GroupsPageRooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GroupsPageRoomsQuery, GroupsPageRoomsQueryVariables>;
export const CreateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateGroupMutation, CreateGroupMutationVariables>;
export const UpdateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}}]} as unknown as DocumentNode<UpdateGroupMutation, UpdateGroupMutationVariables>;
export const DeleteGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteGroupMutation, DeleteGroupMutationVariables>;
export const AddGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]} as unknown as DocumentNode<AddGroupMemberMutation, AddGroupMemberMutationVariables>;
export const RemoveGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RemoveGroupMemberMutation, RemoveGroupMemberMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const LogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Logs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"attrs"}}]}}]}}]} as unknown as DocumentNode<LogsQuery, LogsQueryVariables>;
export const LogStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"LogStream"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logStream"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"attrs"}}]}}]}}]} as unknown as DocumentNode<LogStreamSubscription, LogStreamSubscriptionVariables>;
export const RoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<RoomsQuery, RoomsQueryVariables>;
export const RoomsPageDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RoomsPageDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}}]}}]} as unknown as DocumentNode<RoomsPageDevicesQuery, RoomsPageDevicesQueryVariables>;
export const RoomsPageGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RoomsPageGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}}]}}]}}]} as unknown as DocumentNode<RoomsPageGroupsQuery, RoomsPageGroupsQueryVariables>;
export const CreateRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRoomInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateRoomMutation, CreateRoomMutationVariables>;
export const UpdateRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRoomInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}}]} as unknown as DocumentNode<UpdateRoomMutation, UpdateRoomMutationVariables>;
export const DeleteRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteRoomMutation, DeleteRoomMutationVariables>;
export const AddRoomDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddRoomDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddRoomDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRoomDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}}]}}]}}]} as unknown as DocumentNode<AddRoomDeviceMutation, AddRoomDeviceMutationVariables>;
export const RemoveRoomDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveRoomDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeRoomDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}},{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveRoomDeviceMutation, RemoveRoomDeviceMutationVariables>;
export const ScenesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ScenesQuery, ScenesQueryVariables>;
export const CreateSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateSceneMutation, CreateSceneMutationVariables>;
export const DeleteSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteSceneMutation, DeleteSceneMutationVariables>;
export const SceneListUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SceneListUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}}]} as unknown as DocumentNode<SceneListUpdateMutation, SceneListUpdateMutationVariables>;
export const ScenesPageDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ScenesPageDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ScenesPageDevicesQuery, ScenesPageDevicesQueryVariables>;
export const SceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Scene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"target"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"valueMin"}},{"kind":"Field","name":{"kind":"Name","value":"valueMax"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"access"}}]}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}}]}}]}}]} as unknown as DocumentNode<SceneQuery, SceneQueryVariables>;
export const SceneEditDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SceneEditDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SceneEditDevicesQuery, SceneEditDevicesQueryVariables>;
export const SceneEditGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SceneEditGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberType"}},{"kind":"Field","name":{"kind":"Name","value":"memberId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LightState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"on"}},{"kind":"Field","name":{"kind":"Name","value":"brightness"}},{"kind":"Field","name":{"kind":"Name","value":"colorTemp"}},{"kind":"Field","name":{"kind":"Name","value":"color"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"r"}},{"kind":"Field","name":{"kind":"Name","value":"g"}},{"kind":"Field","name":{"kind":"Name","value":"b"}},{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transition"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SensorState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"humidity"}},{"kind":"Field","name":{"kind":"Name","value":"battery"}},{"kind":"Field","name":{"kind":"Name","value":"pressure"}},{"kind":"Field","name":{"kind":"Name","value":"illuminance"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SwitchState"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"action"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<SceneEditGroupsQuery, SceneEditGroupsQueryVariables>;
export const SceneEditUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SceneEditUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}}]}}]}}]} as unknown as DocumentNode<SceneEditUpdateMutation, SceneEditUpdateMutationVariables>;
export const SceneEditSetDeviceStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SceneEditSetDeviceState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LightStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDeviceState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SceneEditSetDeviceStateMutation, SceneEditSetDeviceStateMutationVariables>;
export const MqttConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MqttConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mqttConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"broker"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"password"}},{"kind":"Field","name":{"kind":"Name","value":"useWss"}}]}}]}}]} as unknown as DocumentNode<MqttConfigQuery, MqttConfigQueryVariables>;
export const SettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]} as unknown as DocumentNode<SettingsQuery, SettingsQueryVariables>;
export const UpdateMqttConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMqttConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MqttConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMqttConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"broker"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"password"}},{"kind":"Field","name":{"kind":"Name","value":"useWss"}}]}}]}}]} as unknown as DocumentNode<UpdateMqttConfigMutation, UpdateMqttConfigMutationVariables>;
export const TestMqttConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestMqttConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MqttConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testMqttConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<TestMqttConnectionMutation, TestMqttConnectionMutationVariables>;
export const UpdateSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]} as unknown as DocumentNode<UpdateSettingMutation, UpdateSettingMutationVariables>;
export const CreateInitialUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createInitialUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateInitialUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createInitialUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateInitialUserMutation, CreateInitialUserMutationVariables>;
export const SetupUpdateMqttConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetupUpdateMqttConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MqttConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMqttConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"broker"}}]}}]}}]} as unknown as DocumentNode<SetupUpdateMqttConfigMutation, SetupUpdateMqttConfigMutationVariables>;