/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query E2EAutomationsDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n": typeof types.E2EAutomationsDevicesDocument,
    "\n  mutation E2ECreateAutomation($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": typeof types.E2ECreateAutomationDocument,
    "\n  query E2EAutomation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": typeof types.E2EAutomationDocument,
    "\n  query E2EAutomations {\n    automations {\n      id\n      name\n      enabled\n    }\n  }\n": typeof types.E2EAutomationsDocument,
    "\n  mutation E2EUpdateAutomation($id: ID!, $input: UpdateAutomationInput!) {\n    updateAutomation(id: $id, input: $input) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": typeof types.E2EUpdateAutomationDocument,
    "\n  mutation E2EToggleAutomation($id: ID!, $enabled: Boolean!) {\n    toggleAutomation(id: $id, enabled: $enabled) {\n      id\n      enabled\n    }\n  }\n": typeof types.E2EToggleAutomationDocument,
    "\n  mutation E2EDeleteAutomation($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n": typeof types.E2EDeleteAutomationDocument,
    "\n  mutation E2EAutomationsCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.E2EAutomationsCreateGroupDocument,
    "\n  mutation E2EAutomationsAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": typeof types.E2EAutomationsAddGroupMemberDocument,
    "\n  mutation E2EAutomationsDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": typeof types.E2EAutomationsDeleteGroupDocument,
    "\n  query E2EDevicesList {\n    devices {\n      id\n      name\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": typeof types.E2EDevicesListDocument,
    "\n  query E2EDevice($id: ID!) {\n    device(id: $id) {\n      id\n      name\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": typeof types.E2EDeviceDocument,
    "\n  mutation E2ESetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n    setDeviceState(deviceId: $deviceId, state: $state) {\n      id\n      name\n      type\n      state {\n        on\n        brightness\n        colorTemp\n      }\n    }\n  }\n": typeof types.E2ESetDeviceStateDocument,
    "\n  mutation E2EUpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n    updateDevice(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.E2EUpdateDeviceDocument,
    "\n  subscription E2EDevicesDeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n      }\n    }\n  }\n": typeof types.E2EDevicesDeviceStateChangedDocument,
    "\n  query E2EErrorsScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n    }\n  }\n": typeof types.E2EErrorsSceneDocument,
    "\n  query E2EErrorsAutomation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n    }\n  }\n": typeof types.E2EErrorsAutomationDocument,
    "\n  mutation E2EErrorsAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": typeof types.E2EErrorsAddGroupMemberDocument,
    "\n  mutation E2EErrorsDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n": typeof types.E2EErrorsDeleteSceneDocument,
    "\n  mutation E2EErrorsCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n    }\n  }\n": typeof types.E2EErrorsCreateGroupDocument,
    "\n  mutation E2EErrorsDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": typeof types.E2EErrorsDeleteGroupDocument,
    "\n  mutation E2ECreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n": typeof types.E2ECreateGroupDocument,
    "\n  mutation E2EAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n      memberType\n      memberId\n      device {\n        id\n        name\n      }\n    }\n  }\n": typeof types.E2EAddGroupMemberDocument,
    "\n  query E2EGroup($id: ID!) {\n    group(id: $id) {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n": typeof types.E2EGroupDocument,
    "\n  mutation E2EDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": typeof types.E2EDeleteGroupDocument,
    "\n  query E2EGroups {\n    groups {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n": typeof types.E2EGroupsDocument,
    "\n  mutation E2EUpdateGroup($id: ID!, $input: UpdateGroupInput!) {\n    updateGroup(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.E2EUpdateGroupDocument,
    "\n  mutation E2ERemoveGroupMember($id: ID!) {\n    removeGroupMember(id: $id)\n  }\n": typeof types.E2ERemoveGroupMemberDocument,
    "\n  query E2EGroupsDevices {\n    devices {\n      id\n      name\n    }\n  }\n": typeof types.E2EGroupsDevicesDocument,
    "\n  query E2EScenesDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n": typeof types.E2EScenesDevicesDocument,
    "\n  mutation E2ECreateScene($input: CreateSceneInput!) {\n    createScene(input: $input) {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n": typeof types.E2ECreateSceneDocument,
    "\n  mutation E2EApplyScene($sceneId: ID!) {\n    applyScene(sceneId: $sceneId) {\n      id\n      name\n    }\n  }\n": typeof types.E2EApplySceneDocument,
    "\n  query E2EScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n": typeof types.E2ESceneDocument,
    "\n  mutation E2EDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n": typeof types.E2EDeleteSceneDocument,
    "\n  query E2EScenes {\n    scenes {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n": typeof types.E2EScenesDocument,
    "\n  mutation E2EUpdateScene($id: ID!, $input: UpdateSceneInput!) {\n    updateScene(id: $id, input: $input) {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n": typeof types.E2EUpdateSceneDocument,
    "\n  mutation E2EScenesCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.E2EScenesCreateGroupDocument,
    "\n  mutation E2EScenesAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": typeof types.E2EScenesAddGroupMemberDocument,
    "\n  mutation E2EScenesDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": typeof types.E2EScenesDeleteGroupDocument,
    "\n  query E2EDevices {\n    devices {\n      id\n      name\n      source\n      type\n      available\n    }\n  }\n": typeof types.E2EDevicesDocument,
    "\n  query E2EStateHistoryDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n": typeof types.E2EStateHistoryDevicesDocument,
    "\n  query E2EStateHistory($filter: StateHistoryFilter!) {\n    stateHistory(filter: $filter) {\n      deviceId\n      field\n      points {\n        at\n        value\n      }\n    }\n  }\n": typeof types.E2EStateHistoryDocument,
    "\n  subscription E2EDeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": typeof types.E2EDeviceStateChangedDocument,
    "\n  subscription E2EDeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n": typeof types.E2EDeviceAvailabilityChangedDocument,
    "\n  subscription E2EDeviceAdded {\n    deviceAdded {\n      id\n      name\n      type\n      source\n    }\n  }\n": typeof types.E2EDeviceAddedDocument,
    "\n  subscription E2EDeviceRemoved {\n    deviceRemoved\n  }\n": typeof types.E2EDeviceRemovedDocument,
    "\n  subscription E2EAutomationNodeActivated($automationId: ID) {\n    automationNodeActivated(automationId: $automationId) {\n      automationId\n      nodeId\n      active\n    }\n  }\n": typeof types.E2EAutomationNodeActivatedDocument,
    "\n  subscription E2EDeviceStateChangedFiltered($deviceId: ID) {\n    deviceStateChanged(deviceId: $deviceId) {\n      deviceId\n      state {\n        on\n        brightness\n        temperature\n        humidity\n      }\n    }\n  }\n": typeof types.E2EDeviceStateChangedFilteredDocument,
    "\n  query E2ESubscriptionsDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n": typeof types.E2ESubscriptionsDevicesDocument,
    "\n  mutation E2ESubscriptionsCreateAutomation($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      id\n      name\n      nodes {\n        id\n        type\n      }\n    }\n  }\n": typeof types.E2ESubscriptionsCreateAutomationDocument,
    "\n  mutation E2ESubscriptionsDeleteAutomation($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n": typeof types.E2ESubscriptionsDeleteAutomationDocument,
    "\n  mutation E2ECreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n      username\n      name\n      avatarPath\n      theme\n    }\n  }\n": typeof types.E2ECreateUserDocument,
    "\n  mutation E2EUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n    updateCurrentUser(input: $input) {\n      id\n      name\n      theme\n    }\n  }\n": typeof types.E2EUpdateCurrentUserDocument,
    "\n  mutation E2EDeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n": typeof types.E2EDeleteUserDocument,
    "\n  mutation E2EResetPassword($id: ID!, $p: String!) {\n    resetUserPassword(id: $id, newPassword: $p)\n  }\n": typeof types.E2EResetPasswordDocument,
    "\n  query E2EMe {\n    me {\n      id\n      username\n      name\n      theme\n      avatarPath\n    }\n  }\n": typeof types.E2EMeDocument,
    "\n\t\tmutation DashboardLightCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.DashboardLightCardSetDeviceStateDocument,
    "\n\t\tmutation DeviceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceCardSetDeviceStateDocument,
    "\n\t\tmutation DeviceCardSimulateAction($deviceId: ID!, $action: String!) {\n\t\t\tsimulateDeviceAction(deviceId: $deviceId, action: $action)\n\t\t}\n\t": typeof types.DeviceCardSimulateActionDocument,
    "\n\t\tmutation DeviceTableSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceTableSetDeviceStateDocument,
    "\n\t\tquery NativeEffectOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t": typeof types.NativeEffectOptionsDocument,
    "\n\t\tquery EffectRunTargetDrawerData {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tsource\n\t\t\t\ttype\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { id memberType memberId }\n\t\t\t}\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { id memberType memberId }\n\t\t\t}\n\t\t}\n\t": typeof types.EffectRunTargetDrawerDataDocument,
    "\n\t\tmutation EffectRunTargetDrawerRunEffect($effectId: ID!, $targetType: String!, $targetId: ID!) {\n\t\t\trunEffect(effectId: $effectId, targetType: $targetType, targetId: $targetId) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": typeof types.EffectRunTargetDrawerRunEffectDocument,
    "\n\t\tmutation EffectRunTargetDrawerRunNativeEffect($nativeName: String!, $targetType: String!, $targetId: ID!) {\n\t\t\trunNativeEffect(nativeName: $nativeName, targetType: $targetType, targetId: $targetId) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": typeof types.EffectRunTargetDrawerRunNativeEffectDocument,
    "\n\t\tquery EffectTimelineEditorNativeOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t": typeof types.EffectTimelineEditorNativeOptionsDocument,
    "\n\t\tquery StateHistory($filter: StateHistoryFilter!) {\n\t\t\tstateHistory(filter: $filter) {\n\t\t\t\tdeviceId\n\t\t\t\tfield\n\t\t\t\tpoints {\n\t\t\t\t\tat\n\t\t\t\t\tvalue\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.StateHistoryDocument,
    "\n  mutation GroupCommandsSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n    setDeviceState(deviceId: $deviceId, state: $state) {\n      id\n      state {\n        on\n        brightness\n      }\n    }\n  }\n": typeof types.GroupCommandsSetDeviceStateDocument,
    "\n  query ActiveAlarms {\n    alarms {\n      id\n      latestRowId\n      severity\n      kind\n      message\n      source\n      count\n      firstRaisedAt\n      lastRaisedAt\n    }\n  }\n": typeof types.ActiveAlarmsDocument,
    "\n  subscription AlarmEvents {\n    alarmEvent {\n      kind\n      clearedAlarmId\n      alarm {\n        id\n        latestRowId\n        severity\n        kind\n        message\n        source\n        count\n        firstRaisedAt\n        lastRaisedAt\n      }\n    }\n  }\n": typeof types.AlarmEventsDocument,
    "\n  query DevicesInit {\n    devices {\n      id\n      name\n      icon\n      source\n      type\n      capabilities {\n        name\n        type\n        values\n        valueMin\n        valueMax\n        unit\n        access\n      }\n      available\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": typeof types.DevicesInitDocument,
    "\n  subscription DeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": typeof types.DeviceStateChangedDocument,
    "\n  subscription DeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n": typeof types.DeviceAvailabilityChangedDocument,
    "\n  subscription DeviceAdded {\n    deviceAdded {\n      id\n      name\n      source\n      type\n      capabilities {\n        name\n        type\n        values\n        valueMin\n        valueMax\n        unit\n        access\n      }\n      available\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": typeof types.DeviceAddedDocument,
    "\n  subscription DeviceRemoved {\n    deviceRemoved\n  }\n": typeof types.DeviceRemovedDocument,
    "\n  query Me {\n    me {\n      id\n      username\n      name\n      avatarPath\n      theme\n      createdAt\n    }\n  }\n": typeof types.MeDocument,
    "\n\t\tquery setupStatus {\n\t\t\tsetupStatus {\n\t\t\t\thasInitialUser\n\t\t\t\tmqttConfigured\n\t\t\t}\n\t\t}\n\t": typeof types.SetupStatusDocument,
    "\n\t\tquery DashboardRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { memberType memberId }\n\t\t\t\tresolvedDevices { id }\n\t\t\t}\n\t\t}\n\t": typeof types.DashboardRoomsDocument,
    "\n\t\tquery DashboardGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttags\n\t\t\t\tmembers { memberType memberId }\n\t\t\t\tresolvedDevices { id }\n\t\t\t}\n\t\t}\n\t": typeof types.DashboardGroupsDocument,
    "\n\t\tquery DashboardScenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms { id }\n\t\t\t\tactions { targetType targetId }\n\t\t\t}\n\t\t}\n\t": typeof types.DashboardScenesDocument,
    "\n\t\tmutation DashboardApplyScene($sceneId: ID!) {\n\t\t\tapplyScene(sceneId: $sceneId) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": typeof types.DashboardApplySceneDocument,
    "\n\t\tquery Activity($filter: ActivityFilter) {\n\t\t\tactivity(filter: $filter) {\n\t\t\t\tid\n\t\t\t\ttype\n\t\t\t\ttimestamp\n\t\t\t\tmessage\n\t\t\t\tpayload\n\t\t\t\tsource {\n\t\t\t\t\tkind\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\troomId\n\t\t\t\t\troomName\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.ActivityDocument,
    "\n\t\tsubscription ActivityStream($advanced: Boolean) {\n\t\t\tactivityStream(advanced: $advanced) {\n\t\t\t\tid\n\t\t\t\ttype\n\t\t\t\ttimestamp\n\t\t\t\tmessage\n\t\t\t\tpayload\n\t\t\t\tsource {\n\t\t\t\t\tkind\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\troomId\n\t\t\t\t\troomName\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.ActivityStreamDocument,
    "\n\t\tquery ActivityRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": typeof types.ActivityRoomsDocument,
    "\n\t\tmutation DeleteAlarm($alarmId: ID!) {\n\t\t\tdeleteAlarm(alarmId: $alarmId)\n\t\t}\n\t": typeof types.DeleteAlarmDocument,
    "\n\t\tmutation BatchDeleteAlarms($alarmIds: [ID!]!) {\n\t\t\tbatchDeleteAlarms(alarmIds: $alarmIds)\n\t\t}\n\t": typeof types.BatchDeleteAlarmsDocument,
    "\n\t\tquery Automations {\n\t\t\tautomations {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tlastFiredAt\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationsDocument,
    "\n\t\tmutation CreateAutomation($input: CreateAutomationInput!) {\n\t\t\tcreateAutomation(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tenabled\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.CreateAutomationDocument,
    "\n\t\tmutation ToggleAutomation($id: ID!, $enabled: Boolean!) {\n\t\t\ttoggleAutomation(id: $id, enabled: $enabled) {\n\t\t\t\tid\n\t\t\t\tenabled\n\t\t\t}\n\t\t}\n\t": typeof types.ToggleAutomationDocument,
    "\n\t\tmutation DeleteAutomation($id: ID!) {\n\t\t\tdeleteAutomation(id: $id)\n\t\t}\n\t": typeof types.DeleteAutomationDocument,
    "\n\t\tmutation BatchDeleteAutomations($ids: [ID!]!) {\n\t\t\tbatchDeleteAutomations(ids: $ids)\n\t\t}\n\t": typeof types.BatchDeleteAutomationsDocument,
    "\n\t\tmutation AutomationListUpdate($id: ID!, $input: UpdateAutomationInput!) {\n\t\t\tupdateAutomation(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationListUpdateDocument,
    "\n\t\tquery AutomationsPageDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationsPageDevicesDocument,
    "\n\t\tquery AutomationsPageScenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationsPageScenesDocument,
    "\n\t\tquery Automation($id: ID!) {\n\t\t\tautomation(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t\tpositionX\n\t\t\t\t\tpositionY\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationDocument,
    "\n\t\tmutation AutomationEditUpdate($id: ID!, $input: UpdateAutomationInput!) {\n\t\t\tupdateAutomation(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t\tpositionX\n\t\t\t\t\tpositionY\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationEditUpdateDocument,
    "\n\t\tmutation AutomationEditFireTrigger($automationId: ID!, $nodeId: ID!) {\n\t\t\tfireAutomationTrigger(automationId: $automationId, nodeId: $nodeId)\n\t\t}\n\t": typeof types.AutomationEditFireTriggerDocument,
    "\n\t\tquery AutomationEditDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ttype\n\t\t\t\tsource\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationEditDevicesDocument,
    "\n\t\tquery AutomationEditGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationEditGroupsDocument,
    "\n\t\tquery AutomationEditRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tresolvedDevices { id }\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationEditRoomsDocument,
    "\n\t\tquery AutomationEditScenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationEditScenesDocument,
    "\n\t\tquery AutomationEditEffects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationEditEffectsDocument,
    "\n\t\tsubscription AutomationEditNodeActivated($automationId: ID) {\n\t\t\tautomationNodeActivated(automationId: $automationId) {\n\t\t\t\tautomationId\n\t\t\t\tnodeId\n\t\t\t\tactive\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationEditNodeActivatedDocument,
    "\n\t\tmutation UpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n\t\t\tupdateDevice(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": typeof types.UpdateDeviceDocument,
    "\n\t\tquery DeviceListRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceListRoomsDocument,
    "\n\t\tquery DeviceListGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceListGroupsDocument,
    "\n\t\tmutation DeviceListAddRoomMember($input: AddRoomMemberInput!) {\n\t\t\taddRoomMember(input: $input) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceListAddRoomMemberDocument,
    "\n\t\tmutation DeviceListAddGroupMember($input: AddGroupMemberInput!) {\n\t\t\taddGroupMember(input: $input) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceListAddGroupMemberDocument,
    "\n\t\tquery Device($id: ID!) {\n\t\t\tdevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tsource\n\t\t\t\ttype\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceDocument,
    "\n\t\tquery DeviceDetailGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceDetailGroupsDocument,
    "\n\t\tquery DeviceDetailRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceDetailRoomsDocument,
    "\n\t\tmutation DeviceDetailAddRoomMember($input: AddRoomMemberInput!) {\n\t\t\taddRoomMember(input: $input) { id }\n\t\t}\n\t": typeof types.DeviceDetailAddRoomMemberDocument,
    "\n\t\tmutation DeviceDetailRemoveRoomMember($id: ID!) {\n\t\t\tremoveRoomMember(id: $id)\n\t\t}\n\t": typeof types.DeviceDetailRemoveRoomMemberDocument,
    "\n\t\tmutation DeviceDetailAddGroupMember($input: AddGroupMemberInput!) {\n\t\t\taddGroupMember(input: $input) { id }\n\t\t}\n\t": typeof types.DeviceDetailAddGroupMemberDocument,
    "\n\t\tmutation DeviceDetailRemoveGroupMember($id: ID!) {\n\t\t\tremoveGroupMember(id: $id)\n\t\t}\n\t": typeof types.DeviceDetailRemoveGroupMemberDocument,
    "\n\t\tmutation SetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": typeof types.SetDeviceStateDocument,
    "\n\t\tsubscription DeviceDetailDeviceStateChanged($deviceId: ID) {\n\t\t\tdeviceStateChanged(deviceId: $deviceId) {\n\t\t\t\tdeviceId\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceDetailDeviceStateChangedDocument,
    "\n\t\tsubscription DeviceAvailabilityChanged {\n\t\t\tdeviceAvailabilityChanged {\n\t\t\t\tdeviceId\n\t\t\t\tavailable\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceAvailabilityChangedDocument,
    "\n\t\tquery Effects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tkind\n\t\t\t\tnativeName\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t": typeof types.EffectsDocument,
    "\n\t\tmutation EffectsDeleteEffect($id: ID!) {\n\t\t\tdeleteEffect(id: $id)\n\t\t}\n\t": typeof types.EffectsDeleteEffectDocument,
    "\n\t\tmutation EffectsListUpdateEffect($input: UpdateEffectInput!) {\n\t\t\tupdateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t}\n\t\t}\n\t": typeof types.EffectsListUpdateEffectDocument,
    "\n\t\tmutation EffectsListCreateEffect($input: CreateEffectInput!) {\n\t\t\tcreateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": typeof types.EffectsListCreateEffectDocument,
    "\n\t\tquery EffectEdit($id: ID!) {\n\t\t\teffect(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tkind\n\t\t\t\tnativeName\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tindex\n\t\t\t\t\tname\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tstartMs\n\t\t\t\t\t\ttransitionMinMs\n\t\t\t\t\t\ttransitionMaxMs\n\t\t\t\t\t\tkind\n\t\t\t\t\t\tconfig\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.EffectEditDocument,
    "\n\t\tmutation EffectEditUpdate($input: UpdateEffectInput!) {\n\t\t\tupdateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tindex\n\t\t\t\t\tname\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tstartMs\n\t\t\t\t\t\ttransitionMinMs\n\t\t\t\t\t\ttransitionMaxMs\n\t\t\t\t\t\tkind\n\t\t\t\t\t\tconfig\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.EffectEditUpdateDocument,
    "\n\t\tmutation EffectEditDelete($id: ID!) {\n\t\t\tdeleteEffect(id: $id)\n\t\t}\n\t": typeof types.EffectEditDeleteDocument,
    "\n\t\tquery Groups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttags\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\tdevice {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tgroup {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\troom {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\tresolvedDevices { id name }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.GroupsDocument,
    "\n\t\tquery GroupsPageRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tresolvedDevices { id name }\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t": typeof types.GroupsPageRoomsDocument,
    "\n\t\tmutation CreateGroup($input: CreateGroupInput!) {\n\t\t\tcreateGroup(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ttags\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.CreateGroupDocument,
    "\n\t\tmutation UpdateGroup($id: ID!, $input: UpdateGroupInput!) {\n\t\t\tupdateGroup(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttags\n\t\t\t}\n\t\t}\n\t": typeof types.UpdateGroupDocument,
    "\n\t\tmutation DeleteGroup($id: ID!) {\n\t\t\tdeleteGroup(id: $id)\n\t\t}\n\t": typeof types.DeleteGroupDocument,
    "\n\t\tmutation BatchDeleteGroups($ids: [ID!]!) {\n\t\t\tbatchDeleteGroups(ids: $ids)\n\t\t}\n\t": typeof types.BatchDeleteGroupsDocument,
    "\n\t\tmutation AddGroupMember($input: AddGroupMemberInput!) {\n\t\t\taddGroupMember(input: $input) {\n\t\t\t\tid\n\t\t\t\tmemberType\n\t\t\t\tmemberId\n\t\t\t}\n\t\t}\n\t": typeof types.AddGroupMemberDocument,
    "\n\t\tmutation RemoveGroupMember($id: ID!) {\n\t\t\tremoveGroupMember(id: $id)\n\t\t}\n\t": typeof types.RemoveGroupMemberDocument,
    "\n\t\tmutation login($input: LoginInput!) {\n\t\t\tlogin(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.LoginDocument,
    "\n\t\tquery Logs($limit: Int) {\n\t\t\tlogs(limit: $limit) {\n\t\t\t\ttimestamp\n\t\t\t\tlevel\n\t\t\t\tmessage\n\t\t\t\tattrs\n\t\t\t}\n\t\t}\n\t": typeof types.LogsDocument,
    "\n\t\tsubscription LogStream {\n\t\t\tlogStream {\n\t\t\t\ttimestamp\n\t\t\t\tlevel\n\t\t\t\tmessage\n\t\t\t\tattrs\n\t\t\t}\n\t\t}\n\t": typeof types.LogStreamDocument,
    "\n\t\tmutation ProfileUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n\t\t\tupdateCurrentUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t\ttheme\n\t\t\t\tcreatedAt\n\t\t\t}\n\t\t}\n\t": typeof types.ProfileUpdateCurrentUserDocument,
    "\n\t\tmutation ProfileChangePassword($input: ChangePasswordInput!) {\n\t\t\tchangePassword(input: $input)\n\t\t}\n\t": typeof types.ProfileChangePasswordDocument,
    "\n\t\tquery Rooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tresolvedDevices { id }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tresolvedDevices { id }\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.RoomsDocument,
    "\n\t\tquery RoomsPageGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t": typeof types.RoomsPageGroupsDocument,
    "\n\t\tmutation CreateRoom($input: CreateRoomInput!) {\n\t\t\tcreateRoom(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tresolvedDevices { id }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tresolvedDevices { id }\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.CreateRoomDocument,
    "\n\t\tmutation UpdateRoom($id: ID!, $input: UpdateRoomInput!) {\n\t\t\tupdateRoom(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t}\n\t\t}\n\t": typeof types.UpdateRoomDocument,
    "\n\t\tmutation DeleteRoom($id: ID!) {\n\t\t\tdeleteRoom(id: $id)\n\t\t}\n\t": typeof types.DeleteRoomDocument,
    "\n\t\tmutation BatchDeleteRooms($ids: [ID!]!) {\n\t\t\tbatchDeleteRooms(ids: $ids)\n\t\t}\n\t": typeof types.BatchDeleteRoomsDocument,
    "\n\t\tmutation AddRoomMember($input: AddRoomMemberInput!) {\n\t\t\taddRoomMember(input: $input) {\n\t\t\t\tid\n\t\t\t\tmemberType\n\t\t\t\tmemberId\n\t\t\t}\n\t\t}\n\t": typeof types.AddRoomMemberDocument,
    "\n\t\tmutation RemoveRoomMember($id: ID!) {\n\t\t\tremoveRoomMember(id: $id)\n\t\t}\n\t": typeof types.RemoveRoomMemberDocument,
    "\n\t\tmutation RoomsPageSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.RoomsPageSetDeviceStateDocument,
    "\n\t\tquery Scenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ticon\n\t\t\t\t}\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\teffectivePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t": typeof types.ScenesDocument,
    "\n\t\tmutation CreateScene($input: CreateSceneInput!) {\n\t\t\tcreateScene(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\teffectivePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t": typeof types.CreateSceneDocument,
    "\n\t\tsubscription ScenesSceneActiveChanged {\n\t\t\tsceneActiveChanged {\n\t\t\t\tsceneId\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t": typeof types.ScenesSceneActiveChangedDocument,
    "\n\t\tmutation ApplyScene($sceneId: ID!) {\n\t\t\tapplyScene(sceneId: $sceneId) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": typeof types.ApplySceneDocument,
    "\n\t\tmutation DeleteScene($id: ID!) {\n\t\t\tdeleteScene(id: $id)\n\t\t}\n\t": typeof types.DeleteSceneDocument,
    "\n\t\tmutation BatchDeleteScenes($ids: [ID!]!) {\n\t\t\tbatchDeleteScenes(ids: $ids)\n\t\t}\n\t": typeof types.BatchDeleteScenesDocument,
    "\n\t\tmutation SceneListUpdate($id: ID!, $input: UpdateSceneInput!) {\n\t\t\tupdateScene(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t}\n\t\t}\n\t": typeof types.SceneListUpdateDocument,
    "\n\t\tquery ScenesPageDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttype\n\t\t\t\tcapabilities {\n\t\t\t\t\tname\n\t\t\t\t\taccess\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.ScenesPageDevicesDocument,
    "\n\t\tquery ScenesPageGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.ScenesPageGroupsDocument,
    "\n\t\tquery ScenesPageRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tresolvedDevices {\n\t\t\t\t\tid\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.ScenesPageRoomsDocument,
    "\n\t\tquery Scene($id: ID!) {\n\t\t\tscene(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ticon\n\t\t\t\t}\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t\ttarget {\n\t\t\t\t\t\t... on Device {\n\t\t\t\t\t\t\t__typename\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\t... on Group {\n\t\t\t\t\t\t\t__typename\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ticon\n\t\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tresolvedDevices {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\t... on Room {\n\t\t\t\t\t\t\t__typename\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ticon\n\t\t\t\t\t\t\tresolvedDevices {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t": typeof types.SceneDocument,
    "\n\t\tsubscription SceneEditSceneActiveChanged {\n\t\t\tsceneActiveChanged {\n\t\t\t\tsceneId\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t": typeof types.SceneEditSceneActiveChangedDocument,
    "\n\t\tquery SceneEditDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttype\n\t\t\t\tsource\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.SceneEditDevicesDocument,
    "\n\t\tquery SceneEditGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t\tresolvedDevices {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\tsource\n\t\t\t\t\tavailable\n\t\t\t\t\tlastSeen\n\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\tstate {\n\t\t\t\t\t\ton\n\t\t\t\t\t\tbrightness\n\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\ttransition\n\t\t\t\t\t\ttemperature\n\t\t\t\t\t\thumidity\n\t\t\t\t\t\tpressure\n\t\t\t\t\t\tilluminance\n\t\t\t\t\t\tbattery\n\t\t\t\t\t\tpower\n\t\t\t\t\t\tvoltage\n\t\t\t\t\t\tcurrent\n\t\t\t\t\t\tenergy\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.SceneEditGroupsDocument,
    "\n\t\tquery SceneEditRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\tdevice {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tgroup { id name icon }\n\t\t\t\t\t\t\troom { id name icon }\n\t\t\t\t\t\t}\n\t\t\t\t\t\tresolvedDevices {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tresolvedDevices {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\tsource\n\t\t\t\t\tavailable\n\t\t\t\t\tlastSeen\n\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\tstate {\n\t\t\t\t\t\ton\n\t\t\t\t\t\tbrightness\n\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\ttransition\n\t\t\t\t\t\ttemperature\n\t\t\t\t\t\thumidity\n\t\t\t\t\t\tpressure\n\t\t\t\t\t\tilluminance\n\t\t\t\t\t\tbattery\n\t\t\t\t\t\tpower\n\t\t\t\t\t\tvoltage\n\t\t\t\t\t\tcurrent\n\t\t\t\t\t\tenergy\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.SceneEditRoomsDocument,
    "\n\t\tmutation SceneEditUpdate($id: ID!, $input: UpdateSceneInput!) {\n\t\t\tupdateScene(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ticon\n\t\t\t\t}\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.SceneEditUpdateDocument,
    "\n\t\tmutation SceneEditSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": typeof types.SceneEditSetDeviceStateDocument,
    "\n\t\tmutation SceneEditApply($id: ID!) {\n\t\t\tapplyScene(sceneId: $id) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": typeof types.SceneEditApplyDocument,
    "\n\t\tquery SceneEditEffects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tkind\n\t\t\t\tnativeName\n\t\t\t\tloop\n\t\t\t\trequiredCapabilities\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t": typeof types.SceneEditEffectsDocument,
    "\n\t\tsubscription DeviceStateChanged {\n\t\t\tdeviceStateChanged {\n\t\t\t\tdeviceId\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceStateChangedDocument,
    "\n\t\tquery MqttConfig {\n\t\t\tmqttConfig {\n\t\t\t\tbroker\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t}\n\t\t}\n\t": typeof types.MqttConfigDocument,
    "\n\t\tquery Settings {\n\t\t\tsettings {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t": typeof types.SettingsDocument,
    "\n\t\tmutation UpdateMqttConfig($input: MqttConfigInput!) {\n\t\t\tupdateMqttConfig(input: $input) {\n\t\t\t\tbroker\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t}\n\t\t}\n\t": typeof types.UpdateMqttConfigDocument,
    "\n\t\tmutation TestMqttConnection($input: MqttConfigInput!) {\n\t\t\ttestMqttConnection(input: $input) {\n\t\t\t\tsuccess\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t": typeof types.TestMqttConnectionDocument,
    "\n\t\tmutation UpdateSetting($key: String!, $value: String!) {\n\t\t\tupdateSetting(key: $key, value: $value) {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t": typeof types.UpdateSettingDocument,
    "\n\t\tmutation createInitialUser($input: CreateInitialUserInput!) {\n\t\t\tcreateInitialUser(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.CreateInitialUserDocument,
    "\n\t\tmutation SetupUpdateMqttConfig($input: MqttConfigInput!) {\n\t\t\tupdateMqttConfig(input: $input) {\n\t\t\t\tbroker\n\t\t\t}\n\t\t}\n\t": typeof types.SetupUpdateMqttConfigDocument,
    "\n\t\tquery UsersList {\n\t\t\tusers {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t}\n\t\t}\n\t": typeof types.UsersListDocument,
    "\n\t\tmutation UsersCreate($input: CreateUserInput!) {\n\t\t\tcreateUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t}\n\t\t}\n\t": typeof types.UsersCreateDocument,
    "\n\t\tmutation UsersDelete($id: ID!) {\n\t\t\tdeleteUser(id: $id)\n\t\t}\n\t": typeof types.UsersDeleteDocument,
    "\n\t\tmutation UsersBatchDelete($ids: [ID!]!) {\n\t\t\tbatchDeleteUsers(ids: $ids)\n\t\t}\n\t": typeof types.UsersBatchDeleteDocument,
    "\n\t\tmutation UsersResetPassword($id: ID!, $newPassword: String!) {\n\t\t\tresetUserPassword(id: $id, newPassword: $newPassword)\n\t\t}\n\t": typeof types.UsersResetPasswordDocument,
};
const documents: Documents = {
    "\n  query E2EAutomationsDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n": types.E2EAutomationsDevicesDocument,
    "\n  mutation E2ECreateAutomation($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": types.E2ECreateAutomationDocument,
    "\n  query E2EAutomation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": types.E2EAutomationDocument,
    "\n  query E2EAutomations {\n    automations {\n      id\n      name\n      enabled\n    }\n  }\n": types.E2EAutomationsDocument,
    "\n  mutation E2EUpdateAutomation($id: ID!, $input: UpdateAutomationInput!) {\n    updateAutomation(id: $id, input: $input) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": types.E2EUpdateAutomationDocument,
    "\n  mutation E2EToggleAutomation($id: ID!, $enabled: Boolean!) {\n    toggleAutomation(id: $id, enabled: $enabled) {\n      id\n      enabled\n    }\n  }\n": types.E2EToggleAutomationDocument,
    "\n  mutation E2EDeleteAutomation($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n": types.E2EDeleteAutomationDocument,
    "\n  mutation E2EAutomationsCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n    }\n  }\n": types.E2EAutomationsCreateGroupDocument,
    "\n  mutation E2EAutomationsAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": types.E2EAutomationsAddGroupMemberDocument,
    "\n  mutation E2EAutomationsDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": types.E2EAutomationsDeleteGroupDocument,
    "\n  query E2EDevicesList {\n    devices {\n      id\n      name\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": types.E2EDevicesListDocument,
    "\n  query E2EDevice($id: ID!) {\n    device(id: $id) {\n      id\n      name\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": types.E2EDeviceDocument,
    "\n  mutation E2ESetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n    setDeviceState(deviceId: $deviceId, state: $state) {\n      id\n      name\n      type\n      state {\n        on\n        brightness\n        colorTemp\n      }\n    }\n  }\n": types.E2ESetDeviceStateDocument,
    "\n  mutation E2EUpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n    updateDevice(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n": types.E2EUpdateDeviceDocument,
    "\n  subscription E2EDevicesDeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n      }\n    }\n  }\n": types.E2EDevicesDeviceStateChangedDocument,
    "\n  query E2EErrorsScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n    }\n  }\n": types.E2EErrorsSceneDocument,
    "\n  query E2EErrorsAutomation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n    }\n  }\n": types.E2EErrorsAutomationDocument,
    "\n  mutation E2EErrorsAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": types.E2EErrorsAddGroupMemberDocument,
    "\n  mutation E2EErrorsDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n": types.E2EErrorsDeleteSceneDocument,
    "\n  mutation E2EErrorsCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n    }\n  }\n": types.E2EErrorsCreateGroupDocument,
    "\n  mutation E2EErrorsDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": types.E2EErrorsDeleteGroupDocument,
    "\n  mutation E2ECreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n": types.E2ECreateGroupDocument,
    "\n  mutation E2EAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n      memberType\n      memberId\n      device {\n        id\n        name\n      }\n    }\n  }\n": types.E2EAddGroupMemberDocument,
    "\n  query E2EGroup($id: ID!) {\n    group(id: $id) {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n": types.E2EGroupDocument,
    "\n  mutation E2EDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": types.E2EDeleteGroupDocument,
    "\n  query E2EGroups {\n    groups {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n": types.E2EGroupsDocument,
    "\n  mutation E2EUpdateGroup($id: ID!, $input: UpdateGroupInput!) {\n    updateGroup(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n": types.E2EUpdateGroupDocument,
    "\n  mutation E2ERemoveGroupMember($id: ID!) {\n    removeGroupMember(id: $id)\n  }\n": types.E2ERemoveGroupMemberDocument,
    "\n  query E2EGroupsDevices {\n    devices {\n      id\n      name\n    }\n  }\n": types.E2EGroupsDevicesDocument,
    "\n  query E2EScenesDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n": types.E2EScenesDevicesDocument,
    "\n  mutation E2ECreateScene($input: CreateSceneInput!) {\n    createScene(input: $input) {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n": types.E2ECreateSceneDocument,
    "\n  mutation E2EApplyScene($sceneId: ID!) {\n    applyScene(sceneId: $sceneId) {\n      id\n      name\n    }\n  }\n": types.E2EApplySceneDocument,
    "\n  query E2EScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n": types.E2ESceneDocument,
    "\n  mutation E2EDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n": types.E2EDeleteSceneDocument,
    "\n  query E2EScenes {\n    scenes {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n": types.E2EScenesDocument,
    "\n  mutation E2EUpdateScene($id: ID!, $input: UpdateSceneInput!) {\n    updateScene(id: $id, input: $input) {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n": types.E2EUpdateSceneDocument,
    "\n  mutation E2EScenesCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n    }\n  }\n": types.E2EScenesCreateGroupDocument,
    "\n  mutation E2EScenesAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": types.E2EScenesAddGroupMemberDocument,
    "\n  mutation E2EScenesDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": types.E2EScenesDeleteGroupDocument,
    "\n  query E2EDevices {\n    devices {\n      id\n      name\n      source\n      type\n      available\n    }\n  }\n": types.E2EDevicesDocument,
    "\n  query E2EStateHistoryDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n": types.E2EStateHistoryDevicesDocument,
    "\n  query E2EStateHistory($filter: StateHistoryFilter!) {\n    stateHistory(filter: $filter) {\n      deviceId\n      field\n      points {\n        at\n        value\n      }\n    }\n  }\n": types.E2EStateHistoryDocument,
    "\n  subscription E2EDeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": types.E2EDeviceStateChangedDocument,
    "\n  subscription E2EDeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n": types.E2EDeviceAvailabilityChangedDocument,
    "\n  subscription E2EDeviceAdded {\n    deviceAdded {\n      id\n      name\n      type\n      source\n    }\n  }\n": types.E2EDeviceAddedDocument,
    "\n  subscription E2EDeviceRemoved {\n    deviceRemoved\n  }\n": types.E2EDeviceRemovedDocument,
    "\n  subscription E2EAutomationNodeActivated($automationId: ID) {\n    automationNodeActivated(automationId: $automationId) {\n      automationId\n      nodeId\n      active\n    }\n  }\n": types.E2EAutomationNodeActivatedDocument,
    "\n  subscription E2EDeviceStateChangedFiltered($deviceId: ID) {\n    deviceStateChanged(deviceId: $deviceId) {\n      deviceId\n      state {\n        on\n        brightness\n        temperature\n        humidity\n      }\n    }\n  }\n": types.E2EDeviceStateChangedFilteredDocument,
    "\n  query E2ESubscriptionsDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n": types.E2ESubscriptionsDevicesDocument,
    "\n  mutation E2ESubscriptionsCreateAutomation($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      id\n      name\n      nodes {\n        id\n        type\n      }\n    }\n  }\n": types.E2ESubscriptionsCreateAutomationDocument,
    "\n  mutation E2ESubscriptionsDeleteAutomation($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n": types.E2ESubscriptionsDeleteAutomationDocument,
    "\n  mutation E2ECreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n      username\n      name\n      avatarPath\n      theme\n    }\n  }\n": types.E2ECreateUserDocument,
    "\n  mutation E2EUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n    updateCurrentUser(input: $input) {\n      id\n      name\n      theme\n    }\n  }\n": types.E2EUpdateCurrentUserDocument,
    "\n  mutation E2EDeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n": types.E2EDeleteUserDocument,
    "\n  mutation E2EResetPassword($id: ID!, $p: String!) {\n    resetUserPassword(id: $id, newPassword: $p)\n  }\n": types.E2EResetPasswordDocument,
    "\n  query E2EMe {\n    me {\n      id\n      username\n      name\n      theme\n      avatarPath\n    }\n  }\n": types.E2EMeDocument,
    "\n\t\tmutation DashboardLightCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.DashboardLightCardSetDeviceStateDocument,
    "\n\t\tmutation DeviceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.DeviceCardSetDeviceStateDocument,
    "\n\t\tmutation DeviceCardSimulateAction($deviceId: ID!, $action: String!) {\n\t\t\tsimulateDeviceAction(deviceId: $deviceId, action: $action)\n\t\t}\n\t": types.DeviceCardSimulateActionDocument,
    "\n\t\tmutation DeviceTableSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.DeviceTableSetDeviceStateDocument,
    "\n\t\tquery NativeEffectOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t": types.NativeEffectOptionsDocument,
    "\n\t\tquery EffectRunTargetDrawerData {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tsource\n\t\t\t\ttype\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { id memberType memberId }\n\t\t\t}\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { id memberType memberId }\n\t\t\t}\n\t\t}\n\t": types.EffectRunTargetDrawerDataDocument,
    "\n\t\tmutation EffectRunTargetDrawerRunEffect($effectId: ID!, $targetType: String!, $targetId: ID!) {\n\t\t\trunEffect(effectId: $effectId, targetType: $targetType, targetId: $targetId) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": types.EffectRunTargetDrawerRunEffectDocument,
    "\n\t\tmutation EffectRunTargetDrawerRunNativeEffect($nativeName: String!, $targetType: String!, $targetId: ID!) {\n\t\t\trunNativeEffect(nativeName: $nativeName, targetType: $targetType, targetId: $targetId) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": types.EffectRunTargetDrawerRunNativeEffectDocument,
    "\n\t\tquery EffectTimelineEditorNativeOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t": types.EffectTimelineEditorNativeOptionsDocument,
    "\n\t\tquery StateHistory($filter: StateHistoryFilter!) {\n\t\t\tstateHistory(filter: $filter) {\n\t\t\t\tdeviceId\n\t\t\t\tfield\n\t\t\t\tpoints {\n\t\t\t\t\tat\n\t\t\t\t\tvalue\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.StateHistoryDocument,
    "\n  mutation GroupCommandsSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n    setDeviceState(deviceId: $deviceId, state: $state) {\n      id\n      state {\n        on\n        brightness\n      }\n    }\n  }\n": types.GroupCommandsSetDeviceStateDocument,
    "\n  query ActiveAlarms {\n    alarms {\n      id\n      latestRowId\n      severity\n      kind\n      message\n      source\n      count\n      firstRaisedAt\n      lastRaisedAt\n    }\n  }\n": types.ActiveAlarmsDocument,
    "\n  subscription AlarmEvents {\n    alarmEvent {\n      kind\n      clearedAlarmId\n      alarm {\n        id\n        latestRowId\n        severity\n        kind\n        message\n        source\n        count\n        firstRaisedAt\n        lastRaisedAt\n      }\n    }\n  }\n": types.AlarmEventsDocument,
    "\n  query DevicesInit {\n    devices {\n      id\n      name\n      icon\n      source\n      type\n      capabilities {\n        name\n        type\n        values\n        valueMin\n        valueMax\n        unit\n        access\n      }\n      available\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": types.DevicesInitDocument,
    "\n  subscription DeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": types.DeviceStateChangedDocument,
    "\n  subscription DeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n": types.DeviceAvailabilityChangedDocument,
    "\n  subscription DeviceAdded {\n    deviceAdded {\n      id\n      name\n      source\n      type\n      capabilities {\n        name\n        type\n        values\n        valueMin\n        valueMax\n        unit\n        access\n      }\n      available\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": types.DeviceAddedDocument,
    "\n  subscription DeviceRemoved {\n    deviceRemoved\n  }\n": types.DeviceRemovedDocument,
    "\n  query Me {\n    me {\n      id\n      username\n      name\n      avatarPath\n      theme\n      createdAt\n    }\n  }\n": types.MeDocument,
    "\n\t\tquery setupStatus {\n\t\t\tsetupStatus {\n\t\t\t\thasInitialUser\n\t\t\t\tmqttConfigured\n\t\t\t}\n\t\t}\n\t": types.SetupStatusDocument,
    "\n\t\tquery DashboardRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { memberType memberId }\n\t\t\t\tresolvedDevices { id }\n\t\t\t}\n\t\t}\n\t": types.DashboardRoomsDocument,
    "\n\t\tquery DashboardGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttags\n\t\t\t\tmembers { memberType memberId }\n\t\t\t\tresolvedDevices { id }\n\t\t\t}\n\t\t}\n\t": types.DashboardGroupsDocument,
    "\n\t\tquery DashboardScenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms { id }\n\t\t\t\tactions { targetType targetId }\n\t\t\t}\n\t\t}\n\t": types.DashboardScenesDocument,
    "\n\t\tmutation DashboardApplyScene($sceneId: ID!) {\n\t\t\tapplyScene(sceneId: $sceneId) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": types.DashboardApplySceneDocument,
    "\n\t\tquery Activity($filter: ActivityFilter) {\n\t\t\tactivity(filter: $filter) {\n\t\t\t\tid\n\t\t\t\ttype\n\t\t\t\ttimestamp\n\t\t\t\tmessage\n\t\t\t\tpayload\n\t\t\t\tsource {\n\t\t\t\t\tkind\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\troomId\n\t\t\t\t\troomName\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.ActivityDocument,
    "\n\t\tsubscription ActivityStream($advanced: Boolean) {\n\t\t\tactivityStream(advanced: $advanced) {\n\t\t\t\tid\n\t\t\t\ttype\n\t\t\t\ttimestamp\n\t\t\t\tmessage\n\t\t\t\tpayload\n\t\t\t\tsource {\n\t\t\t\t\tkind\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\troomId\n\t\t\t\t\troomName\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.ActivityStreamDocument,
    "\n\t\tquery ActivityRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": types.ActivityRoomsDocument,
    "\n\t\tmutation DeleteAlarm($alarmId: ID!) {\n\t\t\tdeleteAlarm(alarmId: $alarmId)\n\t\t}\n\t": types.DeleteAlarmDocument,
    "\n\t\tmutation BatchDeleteAlarms($alarmIds: [ID!]!) {\n\t\t\tbatchDeleteAlarms(alarmIds: $alarmIds)\n\t\t}\n\t": types.BatchDeleteAlarmsDocument,
    "\n\t\tquery Automations {\n\t\t\tautomations {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tlastFiredAt\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.AutomationsDocument,
    "\n\t\tmutation CreateAutomation($input: CreateAutomationInput!) {\n\t\t\tcreateAutomation(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tenabled\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.CreateAutomationDocument,
    "\n\t\tmutation ToggleAutomation($id: ID!, $enabled: Boolean!) {\n\t\t\ttoggleAutomation(id: $id, enabled: $enabled) {\n\t\t\t\tid\n\t\t\t\tenabled\n\t\t\t}\n\t\t}\n\t": types.ToggleAutomationDocument,
    "\n\t\tmutation DeleteAutomation($id: ID!) {\n\t\t\tdeleteAutomation(id: $id)\n\t\t}\n\t": types.DeleteAutomationDocument,
    "\n\t\tmutation BatchDeleteAutomations($ids: [ID!]!) {\n\t\t\tbatchDeleteAutomations(ids: $ids)\n\t\t}\n\t": types.BatchDeleteAutomationsDocument,
    "\n\t\tmutation AutomationListUpdate($id: ID!, $input: UpdateAutomationInput!) {\n\t\t\tupdateAutomation(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": types.AutomationListUpdateDocument,
    "\n\t\tquery AutomationsPageDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": types.AutomationsPageDevicesDocument,
    "\n\t\tquery AutomationsPageScenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": types.AutomationsPageScenesDocument,
    "\n\t\tquery Automation($id: ID!) {\n\t\t\tautomation(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t\tpositionX\n\t\t\t\t\tpositionY\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.AutomationDocument,
    "\n\t\tmutation AutomationEditUpdate($id: ID!, $input: UpdateAutomationInput!) {\n\t\t\tupdateAutomation(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t\tpositionX\n\t\t\t\t\tpositionY\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.AutomationEditUpdateDocument,
    "\n\t\tmutation AutomationEditFireTrigger($automationId: ID!, $nodeId: ID!) {\n\t\t\tfireAutomationTrigger(automationId: $automationId, nodeId: $nodeId)\n\t\t}\n\t": types.AutomationEditFireTriggerDocument,
    "\n\t\tquery AutomationEditDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ttype\n\t\t\t\tsource\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.AutomationEditDevicesDocument,
    "\n\t\tquery AutomationEditGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.AutomationEditGroupsDocument,
    "\n\t\tquery AutomationEditRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tresolvedDevices { id }\n\t\t\t}\n\t\t}\n\t": types.AutomationEditRoomsDocument,
    "\n\t\tquery AutomationEditScenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": types.AutomationEditScenesDocument,
    "\n\t\tquery AutomationEditEffects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t}\n\t\t}\n\t": types.AutomationEditEffectsDocument,
    "\n\t\tsubscription AutomationEditNodeActivated($automationId: ID) {\n\t\t\tautomationNodeActivated(automationId: $automationId) {\n\t\t\t\tautomationId\n\t\t\t\tnodeId\n\t\t\t\tactive\n\t\t\t}\n\t\t}\n\t": types.AutomationEditNodeActivatedDocument,
    "\n\t\tmutation UpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n\t\t\tupdateDevice(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": types.UpdateDeviceDocument,
    "\n\t\tquery DeviceListRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t": types.DeviceListRoomsDocument,
    "\n\t\tquery DeviceListGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t": types.DeviceListGroupsDocument,
    "\n\t\tmutation DeviceListAddRoomMember($input: AddRoomMemberInput!) {\n\t\t\taddRoomMember(input: $input) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": types.DeviceListAddRoomMemberDocument,
    "\n\t\tmutation DeviceListAddGroupMember($input: AddGroupMemberInput!) {\n\t\t\taddGroupMember(input: $input) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": types.DeviceListAddGroupMemberDocument,
    "\n\t\tquery Device($id: ID!) {\n\t\t\tdevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tsource\n\t\t\t\ttype\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.DeviceDocument,
    "\n\t\tquery DeviceDetailGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.DeviceDetailGroupsDocument,
    "\n\t\tquery DeviceDetailRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.DeviceDetailRoomsDocument,
    "\n\t\tmutation DeviceDetailAddRoomMember($input: AddRoomMemberInput!) {\n\t\t\taddRoomMember(input: $input) { id }\n\t\t}\n\t": types.DeviceDetailAddRoomMemberDocument,
    "\n\t\tmutation DeviceDetailRemoveRoomMember($id: ID!) {\n\t\t\tremoveRoomMember(id: $id)\n\t\t}\n\t": types.DeviceDetailRemoveRoomMemberDocument,
    "\n\t\tmutation DeviceDetailAddGroupMember($input: AddGroupMemberInput!) {\n\t\t\taddGroupMember(input: $input) { id }\n\t\t}\n\t": types.DeviceDetailAddGroupMemberDocument,
    "\n\t\tmutation DeviceDetailRemoveGroupMember($id: ID!) {\n\t\t\tremoveGroupMember(id: $id)\n\t\t}\n\t": types.DeviceDetailRemoveGroupMemberDocument,
    "\n\t\tmutation SetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": types.SetDeviceStateDocument,
    "\n\t\tsubscription DeviceDetailDeviceStateChanged($deviceId: ID) {\n\t\t\tdeviceStateChanged(deviceId: $deviceId) {\n\t\t\t\tdeviceId\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.DeviceDetailDeviceStateChangedDocument,
    "\n\t\tsubscription DeviceAvailabilityChanged {\n\t\t\tdeviceAvailabilityChanged {\n\t\t\t\tdeviceId\n\t\t\t\tavailable\n\t\t\t}\n\t\t}\n\t": types.DeviceAvailabilityChangedDocument,
    "\n\t\tquery Effects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tkind\n\t\t\t\tnativeName\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t": types.EffectsDocument,
    "\n\t\tmutation EffectsDeleteEffect($id: ID!) {\n\t\t\tdeleteEffect(id: $id)\n\t\t}\n\t": types.EffectsDeleteEffectDocument,
    "\n\t\tmutation EffectsListUpdateEffect($input: UpdateEffectInput!) {\n\t\t\tupdateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t}\n\t\t}\n\t": types.EffectsListUpdateEffectDocument,
    "\n\t\tmutation EffectsListCreateEffect($input: CreateEffectInput!) {\n\t\t\tcreateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": types.EffectsListCreateEffectDocument,
    "\n\t\tquery EffectEdit($id: ID!) {\n\t\t\teffect(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tkind\n\t\t\t\tnativeName\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tindex\n\t\t\t\t\tname\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tstartMs\n\t\t\t\t\t\ttransitionMinMs\n\t\t\t\t\t\ttransitionMaxMs\n\t\t\t\t\t\tkind\n\t\t\t\t\t\tconfig\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.EffectEditDocument,
    "\n\t\tmutation EffectEditUpdate($input: UpdateEffectInput!) {\n\t\t\tupdateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tindex\n\t\t\t\t\tname\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tstartMs\n\t\t\t\t\t\ttransitionMinMs\n\t\t\t\t\t\ttransitionMaxMs\n\t\t\t\t\t\tkind\n\t\t\t\t\t\tconfig\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.EffectEditUpdateDocument,
    "\n\t\tmutation EffectEditDelete($id: ID!) {\n\t\t\tdeleteEffect(id: $id)\n\t\t}\n\t": types.EffectEditDeleteDocument,
    "\n\t\tquery Groups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttags\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\tdevice {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tgroup {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\troom {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\tresolvedDevices { id name }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.GroupsDocument,
    "\n\t\tquery GroupsPageRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tresolvedDevices { id name }\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t": types.GroupsPageRoomsDocument,
    "\n\t\tmutation CreateGroup($input: CreateGroupInput!) {\n\t\t\tcreateGroup(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ttags\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.CreateGroupDocument,
    "\n\t\tmutation UpdateGroup($id: ID!, $input: UpdateGroupInput!) {\n\t\t\tupdateGroup(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttags\n\t\t\t}\n\t\t}\n\t": types.UpdateGroupDocument,
    "\n\t\tmutation DeleteGroup($id: ID!) {\n\t\t\tdeleteGroup(id: $id)\n\t\t}\n\t": types.DeleteGroupDocument,
    "\n\t\tmutation BatchDeleteGroups($ids: [ID!]!) {\n\t\t\tbatchDeleteGroups(ids: $ids)\n\t\t}\n\t": types.BatchDeleteGroupsDocument,
    "\n\t\tmutation AddGroupMember($input: AddGroupMemberInput!) {\n\t\t\taddGroupMember(input: $input) {\n\t\t\t\tid\n\t\t\t\tmemberType\n\t\t\t\tmemberId\n\t\t\t}\n\t\t}\n\t": types.AddGroupMemberDocument,
    "\n\t\tmutation RemoveGroupMember($id: ID!) {\n\t\t\tremoveGroupMember(id: $id)\n\t\t}\n\t": types.RemoveGroupMemberDocument,
    "\n\t\tmutation login($input: LoginInput!) {\n\t\t\tlogin(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.LoginDocument,
    "\n\t\tquery Logs($limit: Int) {\n\t\t\tlogs(limit: $limit) {\n\t\t\t\ttimestamp\n\t\t\t\tlevel\n\t\t\t\tmessage\n\t\t\t\tattrs\n\t\t\t}\n\t\t}\n\t": types.LogsDocument,
    "\n\t\tsubscription LogStream {\n\t\t\tlogStream {\n\t\t\t\ttimestamp\n\t\t\t\tlevel\n\t\t\t\tmessage\n\t\t\t\tattrs\n\t\t\t}\n\t\t}\n\t": types.LogStreamDocument,
    "\n\t\tmutation ProfileUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n\t\t\tupdateCurrentUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t\ttheme\n\t\t\t\tcreatedAt\n\t\t\t}\n\t\t}\n\t": types.ProfileUpdateCurrentUserDocument,
    "\n\t\tmutation ProfileChangePassword($input: ChangePasswordInput!) {\n\t\t\tchangePassword(input: $input)\n\t\t}\n\t": types.ProfileChangePasswordDocument,
    "\n\t\tquery Rooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tresolvedDevices { id }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tresolvedDevices { id }\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.RoomsDocument,
    "\n\t\tquery RoomsPageGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t": types.RoomsPageGroupsDocument,
    "\n\t\tmutation CreateRoom($input: CreateRoomInput!) {\n\t\t\tcreateRoom(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tresolvedDevices { id }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tresolvedDevices { id }\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.CreateRoomDocument,
    "\n\t\tmutation UpdateRoom($id: ID!, $input: UpdateRoomInput!) {\n\t\t\tupdateRoom(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t}\n\t\t}\n\t": types.UpdateRoomDocument,
    "\n\t\tmutation DeleteRoom($id: ID!) {\n\t\t\tdeleteRoom(id: $id)\n\t\t}\n\t": types.DeleteRoomDocument,
    "\n\t\tmutation BatchDeleteRooms($ids: [ID!]!) {\n\t\t\tbatchDeleteRooms(ids: $ids)\n\t\t}\n\t": types.BatchDeleteRoomsDocument,
    "\n\t\tmutation AddRoomMember($input: AddRoomMemberInput!) {\n\t\t\taddRoomMember(input: $input) {\n\t\t\t\tid\n\t\t\t\tmemberType\n\t\t\t\tmemberId\n\t\t\t}\n\t\t}\n\t": types.AddRoomMemberDocument,
    "\n\t\tmutation RemoveRoomMember($id: ID!) {\n\t\t\tremoveRoomMember(id: $id)\n\t\t}\n\t": types.RemoveRoomMemberDocument,
    "\n\t\tmutation RoomsPageSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.RoomsPageSetDeviceStateDocument,
    "\n\t\tquery Scenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ticon\n\t\t\t\t}\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\teffectivePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t": types.ScenesDocument,
    "\n\t\tmutation CreateScene($input: CreateSceneInput!) {\n\t\t\tcreateScene(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\teffectivePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t": types.CreateSceneDocument,
    "\n\t\tsubscription ScenesSceneActiveChanged {\n\t\t\tsceneActiveChanged {\n\t\t\t\tsceneId\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t": types.ScenesSceneActiveChangedDocument,
    "\n\t\tmutation ApplyScene($sceneId: ID!) {\n\t\t\tapplyScene(sceneId: $sceneId) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t": types.ApplySceneDocument,
    "\n\t\tmutation DeleteScene($id: ID!) {\n\t\t\tdeleteScene(id: $id)\n\t\t}\n\t": types.DeleteSceneDocument,
    "\n\t\tmutation BatchDeleteScenes($ids: [ID!]!) {\n\t\t\tbatchDeleteScenes(ids: $ids)\n\t\t}\n\t": types.BatchDeleteScenesDocument,
    "\n\t\tmutation SceneListUpdate($id: ID!, $input: UpdateSceneInput!) {\n\t\t\tupdateScene(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t}\n\t\t}\n\t": types.SceneListUpdateDocument,
    "\n\t\tquery ScenesPageDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttype\n\t\t\t\tcapabilities {\n\t\t\t\t\tname\n\t\t\t\t\taccess\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.ScenesPageDevicesDocument,
    "\n\t\tquery ScenesPageGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.ScenesPageGroupsDocument,
    "\n\t\tquery ScenesPageRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tresolvedDevices {\n\t\t\t\t\tid\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.ScenesPageRoomsDocument,
    "\n\t\tquery Scene($id: ID!) {\n\t\t\tscene(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ticon\n\t\t\t\t}\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t\ttarget {\n\t\t\t\t\t\t... on Device {\n\t\t\t\t\t\t\t__typename\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\t... on Group {\n\t\t\t\t\t\t\t__typename\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ticon\n\t\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tresolvedDevices {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\t... on Room {\n\t\t\t\t\t\t\t__typename\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ticon\n\t\t\t\t\t\t\tresolvedDevices {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t": types.SceneDocument,
    "\n\t\tsubscription SceneEditSceneActiveChanged {\n\t\t\tsceneActiveChanged {\n\t\t\t\tsceneId\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t": types.SceneEditSceneActiveChangedDocument,
    "\n\t\tquery SceneEditDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttype\n\t\t\t\tsource\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.SceneEditDevicesDocument,
    "\n\t\tquery SceneEditGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t\tresolvedDevices {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\tsource\n\t\t\t\t\tavailable\n\t\t\t\t\tlastSeen\n\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\tstate {\n\t\t\t\t\t\ton\n\t\t\t\t\t\tbrightness\n\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\ttransition\n\t\t\t\t\t\ttemperature\n\t\t\t\t\t\thumidity\n\t\t\t\t\t\tpressure\n\t\t\t\t\t\tilluminance\n\t\t\t\t\t\tbattery\n\t\t\t\t\t\tpower\n\t\t\t\t\t\tvoltage\n\t\t\t\t\t\tcurrent\n\t\t\t\t\t\tenergy\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.SceneEditGroupsDocument,
    "\n\t\tquery SceneEditRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\tdevice {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tgroup { id name icon }\n\t\t\t\t\t\t\troom { id name icon }\n\t\t\t\t\t\t}\n\t\t\t\t\t\tresolvedDevices {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tresolvedDevices {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\tsource\n\t\t\t\t\tavailable\n\t\t\t\t\tlastSeen\n\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\tstate {\n\t\t\t\t\t\ton\n\t\t\t\t\t\tbrightness\n\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\ttransition\n\t\t\t\t\t\ttemperature\n\t\t\t\t\t\thumidity\n\t\t\t\t\t\tpressure\n\t\t\t\t\t\tilluminance\n\t\t\t\t\t\tbattery\n\t\t\t\t\t\tpower\n\t\t\t\t\t\tvoltage\n\t\t\t\t\t\tcurrent\n\t\t\t\t\t\tenergy\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.SceneEditRoomsDocument,
    "\n\t\tmutation SceneEditUpdate($id: ID!, $input: UpdateSceneInput!) {\n\t\t\tupdateScene(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ticon\n\t\t\t\t}\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.SceneEditUpdateDocument,
    "\n\t\tmutation SceneEditSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": types.SceneEditSetDeviceStateDocument,
    "\n\t\tmutation SceneEditApply($id: ID!) {\n\t\t\tapplyScene(sceneId: $id) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": types.SceneEditApplyDocument,
    "\n\t\tquery SceneEditEffects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tkind\n\t\t\t\tnativeName\n\t\t\t\tloop\n\t\t\t\trequiredCapabilities\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t": types.SceneEditEffectsDocument,
    "\n\t\tsubscription DeviceStateChanged {\n\t\t\tdeviceStateChanged {\n\t\t\t\tdeviceId\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.DeviceStateChangedDocument,
    "\n\t\tquery MqttConfig {\n\t\t\tmqttConfig {\n\t\t\t\tbroker\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t}\n\t\t}\n\t": types.MqttConfigDocument,
    "\n\t\tquery Settings {\n\t\t\tsettings {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t": types.SettingsDocument,
    "\n\t\tmutation UpdateMqttConfig($input: MqttConfigInput!) {\n\t\t\tupdateMqttConfig(input: $input) {\n\t\t\t\tbroker\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t}\n\t\t}\n\t": types.UpdateMqttConfigDocument,
    "\n\t\tmutation TestMqttConnection($input: MqttConfigInput!) {\n\t\t\ttestMqttConnection(input: $input) {\n\t\t\t\tsuccess\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t": types.TestMqttConnectionDocument,
    "\n\t\tmutation UpdateSetting($key: String!, $value: String!) {\n\t\t\tupdateSetting(key: $key, value: $value) {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t": types.UpdateSettingDocument,
    "\n\t\tmutation createInitialUser($input: CreateInitialUserInput!) {\n\t\t\tcreateInitialUser(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.CreateInitialUserDocument,
    "\n\t\tmutation SetupUpdateMqttConfig($input: MqttConfigInput!) {\n\t\t\tupdateMqttConfig(input: $input) {\n\t\t\t\tbroker\n\t\t\t}\n\t\t}\n\t": types.SetupUpdateMqttConfigDocument,
    "\n\t\tquery UsersList {\n\t\t\tusers {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t}\n\t\t}\n\t": types.UsersListDocument,
    "\n\t\tmutation UsersCreate($input: CreateUserInput!) {\n\t\t\tcreateUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t}\n\t\t}\n\t": types.UsersCreateDocument,
    "\n\t\tmutation UsersDelete($id: ID!) {\n\t\t\tdeleteUser(id: $id)\n\t\t}\n\t": types.UsersDeleteDocument,
    "\n\t\tmutation UsersBatchDelete($ids: [ID!]!) {\n\t\t\tbatchDeleteUsers(ids: $ids)\n\t\t}\n\t": types.UsersBatchDeleteDocument,
    "\n\t\tmutation UsersResetPassword($id: ID!, $newPassword: String!) {\n\t\t\tresetUserPassword(id: $id, newPassword: $newPassword)\n\t\t}\n\t": types.UsersResetPasswordDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EAutomationsDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n"): (typeof documents)["\n  query E2EAutomationsDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2ECreateAutomation($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation E2ECreateAutomation($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EAutomation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EAutomation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EAutomations {\n    automations {\n      id\n      name\n      enabled\n    }\n  }\n"): (typeof documents)["\n  query E2EAutomations {\n    automations {\n      id\n      name\n      enabled\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EUpdateAutomation($id: ID!, $input: UpdateAutomationInput!) {\n    updateAutomation(id: $id, input: $input) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation E2EUpdateAutomation($id: ID!, $input: UpdateAutomationInput!) {\n    updateAutomation(id: $id, input: $input) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EToggleAutomation($id: ID!, $enabled: Boolean!) {\n    toggleAutomation(id: $id, enabled: $enabled) {\n      id\n      enabled\n    }\n  }\n"): (typeof documents)["\n  mutation E2EToggleAutomation($id: ID!, $enabled: Boolean!) {\n    toggleAutomation(id: $id, enabled: $enabled) {\n      id\n      enabled\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EDeleteAutomation($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n"): (typeof documents)["\n  mutation E2EDeleteAutomation($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EAutomationsCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation E2EAutomationsCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EAutomationsAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation E2EAutomationsAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EAutomationsDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n"): (typeof documents)["\n  mutation E2EAutomationsDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EDevicesList {\n    devices {\n      id\n      name\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EDevicesList {\n    devices {\n      id\n      name\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EDevice($id: ID!) {\n    device(id: $id) {\n      id\n      name\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EDevice($id: ID!) {\n    device(id: $id) {\n      id\n      name\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2ESetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n    setDeviceState(deviceId: $deviceId, state: $state) {\n      id\n      name\n      type\n      state {\n        on\n        brightness\n        colorTemp\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation E2ESetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n    setDeviceState(deviceId: $deviceId, state: $state) {\n      id\n      name\n      type\n      state {\n        on\n        brightness\n        colorTemp\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EUpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n    updateDevice(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation E2EUpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n    updateDevice(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription E2EDevicesDeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription E2EDevicesDeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EErrorsScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query E2EErrorsScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EErrorsAutomation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query E2EErrorsAutomation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EErrorsAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation E2EErrorsAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EErrorsDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n"): (typeof documents)["\n  mutation E2EErrorsDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EErrorsCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation E2EErrorsCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EErrorsDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n"): (typeof documents)["\n  mutation E2EErrorsDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2ECreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation E2ECreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n      memberType\n      memberId\n      device {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation E2EAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n      memberType\n      memberId\n      device {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EGroup($id: ID!) {\n    group(id: $id) {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EGroup($id: ID!) {\n    group(id: $id) {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n"): (typeof documents)["\n  mutation E2EDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EGroups {\n    groups {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EGroups {\n    groups {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EUpdateGroup($id: ID!, $input: UpdateGroupInput!) {\n    updateGroup(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation E2EUpdateGroup($id: ID!, $input: UpdateGroupInput!) {\n    updateGroup(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2ERemoveGroupMember($id: ID!) {\n    removeGroupMember(id: $id)\n  }\n"): (typeof documents)["\n  mutation E2ERemoveGroupMember($id: ID!) {\n    removeGroupMember(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EGroupsDevices {\n    devices {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query E2EGroupsDevices {\n    devices {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EScenesDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n"): (typeof documents)["\n  query E2EScenesDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2ECreateScene($input: CreateSceneInput!) {\n    createScene(input: $input) {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation E2ECreateScene($input: CreateSceneInput!) {\n    createScene(input: $input) {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EApplyScene($sceneId: ID!) {\n    applyScene(sceneId: $sceneId) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation E2EApplyScene($sceneId: ID!) {\n    applyScene(sceneId: $sceneId) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n"): (typeof documents)["\n  mutation E2EDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EScenes {\n    scenes {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EScenes {\n    scenes {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EUpdateScene($id: ID!, $input: UpdateSceneInput!) {\n    updateScene(id: $id, input: $input) {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation E2EUpdateScene($id: ID!, $input: UpdateSceneInput!) {\n    updateScene(id: $id, input: $input) {\n      id\n      name\n      actions {\n        targetType\n        targetId\n      }\n      devicePayloads {\n        deviceId\n        payload\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EScenesCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation E2EScenesCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EScenesAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation E2EScenesAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EScenesDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n"): (typeof documents)["\n  mutation E2EScenesDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EDevices {\n    devices {\n      id\n      name\n      source\n      type\n      available\n    }\n  }\n"): (typeof documents)["\n  query E2EDevices {\n    devices {\n      id\n      name\n      source\n      type\n      available\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EStateHistoryDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n"): (typeof documents)["\n  query E2EStateHistoryDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EStateHistory($filter: StateHistoryFilter!) {\n    stateHistory(filter: $filter) {\n      deviceId\n      field\n      points {\n        at\n        value\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EStateHistory($filter: StateHistoryFilter!) {\n    stateHistory(filter: $filter) {\n      deviceId\n      field\n      points {\n        at\n        value\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription E2EDeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription E2EDeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription E2EDeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n"): (typeof documents)["\n  subscription E2EDeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription E2EDeviceAdded {\n    deviceAdded {\n      id\n      name\n      type\n      source\n    }\n  }\n"): (typeof documents)["\n  subscription E2EDeviceAdded {\n    deviceAdded {\n      id\n      name\n      type\n      source\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription E2EDeviceRemoved {\n    deviceRemoved\n  }\n"): (typeof documents)["\n  subscription E2EDeviceRemoved {\n    deviceRemoved\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription E2EAutomationNodeActivated($automationId: ID) {\n    automationNodeActivated(automationId: $automationId) {\n      automationId\n      nodeId\n      active\n    }\n  }\n"): (typeof documents)["\n  subscription E2EAutomationNodeActivated($automationId: ID) {\n    automationNodeActivated(automationId: $automationId) {\n      automationId\n      nodeId\n      active\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription E2EDeviceStateChangedFiltered($deviceId: ID) {\n    deviceStateChanged(deviceId: $deviceId) {\n      deviceId\n      state {\n        on\n        brightness\n        temperature\n        humidity\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription E2EDeviceStateChangedFiltered($deviceId: ID) {\n    deviceStateChanged(deviceId: $deviceId) {\n      deviceId\n      state {\n        on\n        brightness\n        temperature\n        humidity\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2ESubscriptionsDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n"): (typeof documents)["\n  query E2ESubscriptionsDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2ESubscriptionsCreateAutomation($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      id\n      name\n      nodes {\n        id\n        type\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation E2ESubscriptionsCreateAutomation($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      id\n      name\n      nodes {\n        id\n        type\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2ESubscriptionsDeleteAutomation($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n"): (typeof documents)["\n  mutation E2ESubscriptionsDeleteAutomation($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2ECreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n      username\n      name\n      avatarPath\n      theme\n    }\n  }\n"): (typeof documents)["\n  mutation E2ECreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n      username\n      name\n      avatarPath\n      theme\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n    updateCurrentUser(input: $input) {\n      id\n      name\n      theme\n    }\n  }\n"): (typeof documents)["\n  mutation E2EUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n    updateCurrentUser(input: $input) {\n      id\n      name\n      theme\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EDeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n"): (typeof documents)["\n  mutation E2EDeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EResetPassword($id: ID!, $p: String!) {\n    resetUserPassword(id: $id, newPassword: $p)\n  }\n"): (typeof documents)["\n  mutation E2EResetPassword($id: ID!, $p: String!) {\n    resetUserPassword(id: $id, newPassword: $p)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EMe {\n    me {\n      id\n      username\n      name\n      theme\n      avatarPath\n    }\n  }\n"): (typeof documents)["\n  query E2EMe {\n    me {\n      id\n      username\n      name\n      theme\n      avatarPath\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DashboardLightCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DashboardLightCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceCardSimulateAction($deviceId: ID!, $action: String!) {\n\t\t\tsimulateDeviceAction(deviceId: $deviceId, action: $action)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceCardSimulateAction($deviceId: ID!, $action: String!) {\n\t\t\tsimulateDeviceAction(deviceId: $deviceId, action: $action)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceTableSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceTableSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery NativeEffectOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery NativeEffectOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery EffectRunTargetDrawerData {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tsource\n\t\t\t\ttype\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { id memberType memberId }\n\t\t\t}\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { id memberType memberId }\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery EffectRunTargetDrawerData {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tsource\n\t\t\t\ttype\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { id memberType memberId }\n\t\t\t}\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { id memberType memberId }\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation EffectRunTargetDrawerRunEffect($effectId: ID!, $targetType: String!, $targetId: ID!) {\n\t\t\trunEffect(effectId: $effectId, targetType: $targetType, targetId: $targetId) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation EffectRunTargetDrawerRunEffect($effectId: ID!, $targetType: String!, $targetId: ID!) {\n\t\t\trunEffect(effectId: $effectId, targetType: $targetType, targetId: $targetId) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation EffectRunTargetDrawerRunNativeEffect($nativeName: String!, $targetType: String!, $targetId: ID!) {\n\t\t\trunNativeEffect(nativeName: $nativeName, targetType: $targetType, targetId: $targetId) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation EffectRunTargetDrawerRunNativeEffect($nativeName: String!, $targetType: String!, $targetId: ID!) {\n\t\t\trunNativeEffect(nativeName: $nativeName, targetType: $targetType, targetId: $targetId) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery EffectTimelineEditorNativeOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery EffectTimelineEditorNativeOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery StateHistory($filter: StateHistoryFilter!) {\n\t\t\tstateHistory(filter: $filter) {\n\t\t\t\tdeviceId\n\t\t\t\tfield\n\t\t\t\tpoints {\n\t\t\t\t\tat\n\t\t\t\t\tvalue\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery StateHistory($filter: StateHistoryFilter!) {\n\t\t\tstateHistory(filter: $filter) {\n\t\t\t\tdeviceId\n\t\t\t\tfield\n\t\t\t\tpoints {\n\t\t\t\t\tat\n\t\t\t\t\tvalue\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GroupCommandsSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n    setDeviceState(deviceId: $deviceId, state: $state) {\n      id\n      state {\n        on\n        brightness\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation GroupCommandsSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n    setDeviceState(deviceId: $deviceId, state: $state) {\n      id\n      state {\n        on\n        brightness\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ActiveAlarms {\n    alarms {\n      id\n      latestRowId\n      severity\n      kind\n      message\n      source\n      count\n      firstRaisedAt\n      lastRaisedAt\n    }\n  }\n"): (typeof documents)["\n  query ActiveAlarms {\n    alarms {\n      id\n      latestRowId\n      severity\n      kind\n      message\n      source\n      count\n      firstRaisedAt\n      lastRaisedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription AlarmEvents {\n    alarmEvent {\n      kind\n      clearedAlarmId\n      alarm {\n        id\n        latestRowId\n        severity\n        kind\n        message\n        source\n        count\n        firstRaisedAt\n        lastRaisedAt\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription AlarmEvents {\n    alarmEvent {\n      kind\n      clearedAlarmId\n      alarm {\n        id\n        latestRowId\n        severity\n        kind\n        message\n        source\n        count\n        firstRaisedAt\n        lastRaisedAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DevicesInit {\n    devices {\n      id\n      name\n      icon\n      source\n      type\n      capabilities {\n        name\n        type\n        values\n        valueMin\n        valueMax\n        unit\n        access\n      }\n      available\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"): (typeof documents)["\n  query DevicesInit {\n    devices {\n      id\n      name\n      icon\n      source\n      type\n      capabilities {\n        name\n        type\n        values\n        valueMin\n        valueMax\n        unit\n        access\n      }\n      available\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription DeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription DeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription DeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n"): (typeof documents)["\n  subscription DeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription DeviceAdded {\n    deviceAdded {\n      id\n      name\n      source\n      type\n      capabilities {\n        name\n        type\n        values\n        valueMin\n        valueMax\n        unit\n        access\n      }\n      available\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription DeviceAdded {\n    deviceAdded {\n      id\n      name\n      source\n      type\n      capabilities {\n        name\n        type\n        values\n        valueMin\n        valueMax\n        unit\n        access\n      }\n      available\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription DeviceRemoved {\n    deviceRemoved\n  }\n"): (typeof documents)["\n  subscription DeviceRemoved {\n    deviceRemoved\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      id\n      username\n      name\n      avatarPath\n      theme\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n      username\n      name\n      avatarPath\n      theme\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery setupStatus {\n\t\t\tsetupStatus {\n\t\t\t\thasInitialUser\n\t\t\t\tmqttConfigured\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery setupStatus {\n\t\t\tsetupStatus {\n\t\t\t\thasInitialUser\n\t\t\t\tmqttConfigured\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery DashboardRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { memberType memberId }\n\t\t\t\tresolvedDevices { id }\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery DashboardRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { memberType memberId }\n\t\t\t\tresolvedDevices { id }\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery DashboardGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttags\n\t\t\t\tmembers { memberType memberId }\n\t\t\t\tresolvedDevices { id }\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery DashboardGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttags\n\t\t\t\tmembers { memberType memberId }\n\t\t\t\tresolvedDevices { id }\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery DashboardScenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms { id }\n\t\t\t\tactions { targetType targetId }\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery DashboardScenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms { id }\n\t\t\t\tactions { targetType targetId }\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DashboardApplyScene($sceneId: ID!) {\n\t\t\tapplyScene(sceneId: $sceneId) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DashboardApplyScene($sceneId: ID!) {\n\t\t\tapplyScene(sceneId: $sceneId) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Activity($filter: ActivityFilter) {\n\t\t\tactivity(filter: $filter) {\n\t\t\t\tid\n\t\t\t\ttype\n\t\t\t\ttimestamp\n\t\t\t\tmessage\n\t\t\t\tpayload\n\t\t\t\tsource {\n\t\t\t\t\tkind\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\troomId\n\t\t\t\t\troomName\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Activity($filter: ActivityFilter) {\n\t\t\tactivity(filter: $filter) {\n\t\t\t\tid\n\t\t\t\ttype\n\t\t\t\ttimestamp\n\t\t\t\tmessage\n\t\t\t\tpayload\n\t\t\t\tsource {\n\t\t\t\t\tkind\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\troomId\n\t\t\t\t\troomName\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription ActivityStream($advanced: Boolean) {\n\t\t\tactivityStream(advanced: $advanced) {\n\t\t\t\tid\n\t\t\t\ttype\n\t\t\t\ttimestamp\n\t\t\t\tmessage\n\t\t\t\tpayload\n\t\t\t\tsource {\n\t\t\t\t\tkind\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\troomId\n\t\t\t\t\troomName\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription ActivityStream($advanced: Boolean) {\n\t\t\tactivityStream(advanced: $advanced) {\n\t\t\t\tid\n\t\t\t\ttype\n\t\t\t\ttimestamp\n\t\t\t\tmessage\n\t\t\t\tpayload\n\t\t\t\tsource {\n\t\t\t\t\tkind\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\troomId\n\t\t\t\t\troomName\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery ActivityRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery ActivityRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeleteAlarm($alarmId: ID!) {\n\t\t\tdeleteAlarm(alarmId: $alarmId)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeleteAlarm($alarmId: ID!) {\n\t\t\tdeleteAlarm(alarmId: $alarmId)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation BatchDeleteAlarms($alarmIds: [ID!]!) {\n\t\t\tbatchDeleteAlarms(alarmIds: $alarmIds)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation BatchDeleteAlarms($alarmIds: [ID!]!) {\n\t\t\tbatchDeleteAlarms(alarmIds: $alarmIds)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Automations {\n\t\t\tautomations {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tlastFiredAt\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Automations {\n\t\t\tautomations {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tlastFiredAt\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation CreateAutomation($input: CreateAutomationInput!) {\n\t\t\tcreateAutomation(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tenabled\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation CreateAutomation($input: CreateAutomationInput!) {\n\t\t\tcreateAutomation(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tenabled\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation ToggleAutomation($id: ID!, $enabled: Boolean!) {\n\t\t\ttoggleAutomation(id: $id, enabled: $enabled) {\n\t\t\t\tid\n\t\t\t\tenabled\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation ToggleAutomation($id: ID!, $enabled: Boolean!) {\n\t\t\ttoggleAutomation(id: $id, enabled: $enabled) {\n\t\t\t\tid\n\t\t\t\tenabled\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeleteAutomation($id: ID!) {\n\t\t\tdeleteAutomation(id: $id)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeleteAutomation($id: ID!) {\n\t\t\tdeleteAutomation(id: $id)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation BatchDeleteAutomations($ids: [ID!]!) {\n\t\t\tbatchDeleteAutomations(ids: $ids)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation BatchDeleteAutomations($ids: [ID!]!) {\n\t\t\tbatchDeleteAutomations(ids: $ids)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation AutomationListUpdate($id: ID!, $input: UpdateAutomationInput!) {\n\t\t\tupdateAutomation(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation AutomationListUpdate($id: ID!, $input: UpdateAutomationInput!) {\n\t\t\tupdateAutomation(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery AutomationsPageDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery AutomationsPageDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery AutomationsPageScenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery AutomationsPageScenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Automation($id: ID!) {\n\t\t\tautomation(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t\tpositionX\n\t\t\t\t\tpositionY\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Automation($id: ID!) {\n\t\t\tautomation(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t\tpositionX\n\t\t\t\t\tpositionY\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation AutomationEditUpdate($id: ID!, $input: UpdateAutomationInput!) {\n\t\t\tupdateAutomation(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t\tpositionX\n\t\t\t\t\tpositionY\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation AutomationEditUpdate($id: ID!, $input: UpdateAutomationInput!) {\n\t\t\tupdateAutomation(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t\tpositionX\n\t\t\t\t\tpositionY\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation AutomationEditFireTrigger($automationId: ID!, $nodeId: ID!) {\n\t\t\tfireAutomationTrigger(automationId: $automationId, nodeId: $nodeId)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation AutomationEditFireTrigger($automationId: ID!, $nodeId: ID!) {\n\t\t\tfireAutomationTrigger(automationId: $automationId, nodeId: $nodeId)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery AutomationEditDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ttype\n\t\t\t\tsource\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery AutomationEditDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ttype\n\t\t\t\tsource\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery AutomationEditGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery AutomationEditGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery AutomationEditRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tresolvedDevices { id }\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery AutomationEditRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tresolvedDevices { id }\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery AutomationEditScenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery AutomationEditScenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery AutomationEditEffects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery AutomationEditEffects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription AutomationEditNodeActivated($automationId: ID) {\n\t\t\tautomationNodeActivated(automationId: $automationId) {\n\t\t\t\tautomationId\n\t\t\t\tnodeId\n\t\t\t\tactive\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription AutomationEditNodeActivated($automationId: ID) {\n\t\t\tautomationNodeActivated(automationId: $automationId) {\n\t\t\t\tautomationId\n\t\t\t\tnodeId\n\t\t\t\tactive\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation UpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n\t\t\tupdateDevice(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation UpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n\t\t\tupdateDevice(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery DeviceListRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery DeviceListRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery DeviceListGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery DeviceListGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceListAddRoomMember($input: AddRoomMemberInput!) {\n\t\t\taddRoomMember(input: $input) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceListAddRoomMember($input: AddRoomMemberInput!) {\n\t\t\taddRoomMember(input: $input) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceListAddGroupMember($input: AddGroupMemberInput!) {\n\t\t\taddGroupMember(input: $input) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceListAddGroupMember($input: AddGroupMemberInput!) {\n\t\t\taddGroupMember(input: $input) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Device($id: ID!) {\n\t\t\tdevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tsource\n\t\t\t\ttype\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Device($id: ID!) {\n\t\t\tdevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tsource\n\t\t\t\ttype\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery DeviceDetailGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery DeviceDetailGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery DeviceDetailRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery DeviceDetailRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceDetailAddRoomMember($input: AddRoomMemberInput!) {\n\t\t\taddRoomMember(input: $input) { id }\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceDetailAddRoomMember($input: AddRoomMemberInput!) {\n\t\t\taddRoomMember(input: $input) { id }\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceDetailRemoveRoomMember($id: ID!) {\n\t\t\tremoveRoomMember(id: $id)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceDetailRemoveRoomMember($id: ID!) {\n\t\t\tremoveRoomMember(id: $id)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceDetailAddGroupMember($input: AddGroupMemberInput!) {\n\t\t\taddGroupMember(input: $input) { id }\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceDetailAddGroupMember($input: AddGroupMemberInput!) {\n\t\t\taddGroupMember(input: $input) { id }\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceDetailRemoveGroupMember($id: ID!) {\n\t\t\tremoveGroupMember(id: $id)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceDetailRemoveGroupMember($id: ID!) {\n\t\t\tremoveGroupMember(id: $id)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation SetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation SetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription DeviceDetailDeviceStateChanged($deviceId: ID) {\n\t\t\tdeviceStateChanged(deviceId: $deviceId) {\n\t\t\t\tdeviceId\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription DeviceDetailDeviceStateChanged($deviceId: ID) {\n\t\t\tdeviceStateChanged(deviceId: $deviceId) {\n\t\t\t\tdeviceId\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription DeviceAvailabilityChanged {\n\t\t\tdeviceAvailabilityChanged {\n\t\t\t\tdeviceId\n\t\t\t\tavailable\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription DeviceAvailabilityChanged {\n\t\t\tdeviceAvailabilityChanged {\n\t\t\t\tdeviceId\n\t\t\t\tavailable\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Effects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tkind\n\t\t\t\tnativeName\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Effects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tkind\n\t\t\t\tnativeName\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation EffectsDeleteEffect($id: ID!) {\n\t\t\tdeleteEffect(id: $id)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation EffectsDeleteEffect($id: ID!) {\n\t\t\tdeleteEffect(id: $id)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation EffectsListUpdateEffect($input: UpdateEffectInput!) {\n\t\t\tupdateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation EffectsListUpdateEffect($input: UpdateEffectInput!) {\n\t\t\tupdateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation EffectsListCreateEffect($input: CreateEffectInput!) {\n\t\t\tcreateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation EffectsListCreateEffect($input: CreateEffectInput!) {\n\t\t\tcreateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery EffectEdit($id: ID!) {\n\t\t\teffect(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tkind\n\t\t\t\tnativeName\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tindex\n\t\t\t\t\tname\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tstartMs\n\t\t\t\t\t\ttransitionMinMs\n\t\t\t\t\t\ttransitionMaxMs\n\t\t\t\t\t\tkind\n\t\t\t\t\t\tconfig\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery EffectEdit($id: ID!) {\n\t\t\teffect(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tkind\n\t\t\t\tnativeName\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tindex\n\t\t\t\t\tname\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tstartMs\n\t\t\t\t\t\ttransitionMinMs\n\t\t\t\t\t\ttransitionMaxMs\n\t\t\t\t\t\tkind\n\t\t\t\t\t\tconfig\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation EffectEditUpdate($input: UpdateEffectInput!) {\n\t\t\tupdateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tindex\n\t\t\t\t\tname\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tstartMs\n\t\t\t\t\t\ttransitionMinMs\n\t\t\t\t\t\ttransitionMaxMs\n\t\t\t\t\t\tkind\n\t\t\t\t\t\tconfig\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation EffectEditUpdate($input: UpdateEffectInput!) {\n\t\t\tupdateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tindex\n\t\t\t\t\tname\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tstartMs\n\t\t\t\t\t\ttransitionMinMs\n\t\t\t\t\t\ttransitionMaxMs\n\t\t\t\t\t\tkind\n\t\t\t\t\t\tconfig\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation EffectEditDelete($id: ID!) {\n\t\t\tdeleteEffect(id: $id)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation EffectEditDelete($id: ID!) {\n\t\t\tdeleteEffect(id: $id)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Groups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttags\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\tdevice {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tgroup {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\troom {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\tresolvedDevices { id name }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Groups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttags\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\tdevice {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tgroup {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\troom {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\tresolvedDevices { id name }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery GroupsPageRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tresolvedDevices { id name }\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery GroupsPageRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tresolvedDevices { id name }\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation CreateGroup($input: CreateGroupInput!) {\n\t\t\tcreateGroup(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ttags\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation CreateGroup($input: CreateGroupInput!) {\n\t\t\tcreateGroup(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ttags\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation UpdateGroup($id: ID!, $input: UpdateGroupInput!) {\n\t\t\tupdateGroup(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttags\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation UpdateGroup($id: ID!, $input: UpdateGroupInput!) {\n\t\t\tupdateGroup(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttags\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeleteGroup($id: ID!) {\n\t\t\tdeleteGroup(id: $id)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeleteGroup($id: ID!) {\n\t\t\tdeleteGroup(id: $id)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation BatchDeleteGroups($ids: [ID!]!) {\n\t\t\tbatchDeleteGroups(ids: $ids)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation BatchDeleteGroups($ids: [ID!]!) {\n\t\t\tbatchDeleteGroups(ids: $ids)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation AddGroupMember($input: AddGroupMemberInput!) {\n\t\t\taddGroupMember(input: $input) {\n\t\t\t\tid\n\t\t\t\tmemberType\n\t\t\t\tmemberId\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation AddGroupMember($input: AddGroupMemberInput!) {\n\t\t\taddGroupMember(input: $input) {\n\t\t\t\tid\n\t\t\t\tmemberType\n\t\t\t\tmemberId\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation RemoveGroupMember($id: ID!) {\n\t\t\tremoveGroupMember(id: $id)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation RemoveGroupMember($id: ID!) {\n\t\t\tremoveGroupMember(id: $id)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation login($input: LoginInput!) {\n\t\t\tlogin(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation login($input: LoginInput!) {\n\t\t\tlogin(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Logs($limit: Int) {\n\t\t\tlogs(limit: $limit) {\n\t\t\t\ttimestamp\n\t\t\t\tlevel\n\t\t\t\tmessage\n\t\t\t\tattrs\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Logs($limit: Int) {\n\t\t\tlogs(limit: $limit) {\n\t\t\t\ttimestamp\n\t\t\t\tlevel\n\t\t\t\tmessage\n\t\t\t\tattrs\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription LogStream {\n\t\t\tlogStream {\n\t\t\t\ttimestamp\n\t\t\t\tlevel\n\t\t\t\tmessage\n\t\t\t\tattrs\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription LogStream {\n\t\t\tlogStream {\n\t\t\t\ttimestamp\n\t\t\t\tlevel\n\t\t\t\tmessage\n\t\t\t\tattrs\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation ProfileUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n\t\t\tupdateCurrentUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t\ttheme\n\t\t\t\tcreatedAt\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation ProfileUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n\t\t\tupdateCurrentUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t\ttheme\n\t\t\t\tcreatedAt\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation ProfileChangePassword($input: ChangePasswordInput!) {\n\t\t\tchangePassword(input: $input)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation ProfileChangePassword($input: ChangePasswordInput!) {\n\t\t\tchangePassword(input: $input)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Rooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tresolvedDevices { id }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tresolvedDevices { id }\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Rooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tresolvedDevices { id }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tresolvedDevices { id }\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery RoomsPageGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery RoomsPageGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tmembers { memberType memberId }\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation CreateRoom($input: CreateRoomInput!) {\n\t\t\tcreateRoom(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tresolvedDevices { id }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tresolvedDevices { id }\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation CreateRoom($input: CreateRoomInput!) {\n\t\t\tcreateRoom(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tresolvedDevices { id }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tresolvedDevices { id }\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation UpdateRoom($id: ID!, $input: UpdateRoomInput!) {\n\t\t\tupdateRoom(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation UpdateRoom($id: ID!, $input: UpdateRoomInput!) {\n\t\t\tupdateRoom(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeleteRoom($id: ID!) {\n\t\t\tdeleteRoom(id: $id)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeleteRoom($id: ID!) {\n\t\t\tdeleteRoom(id: $id)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation BatchDeleteRooms($ids: [ID!]!) {\n\t\t\tbatchDeleteRooms(ids: $ids)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation BatchDeleteRooms($ids: [ID!]!) {\n\t\t\tbatchDeleteRooms(ids: $ids)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation AddRoomMember($input: AddRoomMemberInput!) {\n\t\t\taddRoomMember(input: $input) {\n\t\t\t\tid\n\t\t\t\tmemberType\n\t\t\t\tmemberId\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation AddRoomMember($input: AddRoomMemberInput!) {\n\t\t\taddRoomMember(input: $input) {\n\t\t\t\tid\n\t\t\t\tmemberType\n\t\t\t\tmemberId\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation RemoveRoomMember($id: ID!) {\n\t\t\tremoveRoomMember(id: $id)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation RemoveRoomMember($id: ID!) {\n\t\t\tremoveRoomMember(id: $id)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation RoomsPageSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation RoomsPageSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Scenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ticon\n\t\t\t\t}\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\teffectivePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Scenes {\n\t\t\tscenes {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ticon\n\t\t\t\t}\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\teffectivePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation CreateScene($input: CreateSceneInput!) {\n\t\t\tcreateScene(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\teffectivePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation CreateScene($input: CreateSceneInput!) {\n\t\t\tcreateScene(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\teffectivePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\tcreatedBy {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription ScenesSceneActiveChanged {\n\t\t\tsceneActiveChanged {\n\t\t\t\tsceneId\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription ScenesSceneActiveChanged {\n\t\t\tsceneActiveChanged {\n\t\t\t\tsceneId\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation ApplyScene($sceneId: ID!) {\n\t\t\tapplyScene(sceneId: $sceneId) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation ApplyScene($sceneId: ID!) {\n\t\t\tapplyScene(sceneId: $sceneId) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeleteScene($id: ID!) {\n\t\t\tdeleteScene(id: $id)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeleteScene($id: ID!) {\n\t\t\tdeleteScene(id: $id)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation BatchDeleteScenes($ids: [ID!]!) {\n\t\t\tbatchDeleteScenes(ids: $ids)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation BatchDeleteScenes($ids: [ID!]!) {\n\t\t\tbatchDeleteScenes(ids: $ids)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation SceneListUpdate($id: ID!, $input: UpdateSceneInput!) {\n\t\t\tupdateScene(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation SceneListUpdate($id: ID!, $input: UpdateSceneInput!) {\n\t\t\tupdateScene(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery ScenesPageDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttype\n\t\t\t\tcapabilities {\n\t\t\t\t\tname\n\t\t\t\t\taccess\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery ScenesPageDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttype\n\t\t\t\tcapabilities {\n\t\t\t\t\tname\n\t\t\t\t\taccess\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery ScenesPageGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery ScenesPageGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery ScenesPageRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tresolvedDevices {\n\t\t\t\t\tid\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery ScenesPageRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tresolvedDevices {\n\t\t\t\t\tid\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Scene($id: ID!) {\n\t\t\tscene(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ticon\n\t\t\t\t}\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t\ttarget {\n\t\t\t\t\t\t... on Device {\n\t\t\t\t\t\t\t__typename\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\t... on Group {\n\t\t\t\t\t\t\t__typename\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ticon\n\t\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tresolvedDevices {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\t... on Room {\n\t\t\t\t\t\t\t__typename\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ticon\n\t\t\t\t\t\t\tresolvedDevices {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Scene($id: ID!) {\n\t\t\tscene(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ticon\n\t\t\t\t}\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t\ttarget {\n\t\t\t\t\t\t... on Device {\n\t\t\t\t\t\t\t__typename\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\t... on Group {\n\t\t\t\t\t\t\t__typename\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ticon\n\t\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tresolvedDevices {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\t... on Room {\n\t\t\t\t\t\t\t__typename\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ticon\n\t\t\t\t\t\t\tresolvedDevices {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription SceneEditSceneActiveChanged {\n\t\t\tsceneActiveChanged {\n\t\t\t\tsceneId\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription SceneEditSceneActiveChanged {\n\t\t\tsceneActiveChanged {\n\t\t\t\tsceneId\n\t\t\t\tactivatedAt\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery SceneEditDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttype\n\t\t\t\tsource\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery SceneEditDevices {\n\t\t\tdevices {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\ttype\n\t\t\t\tsource\n\t\t\t\tavailable\n\t\t\t\tlastSeen\n\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery SceneEditGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t\tresolvedDevices {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\tsource\n\t\t\t\t\tavailable\n\t\t\t\t\tlastSeen\n\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\tstate {\n\t\t\t\t\t\ton\n\t\t\t\t\t\tbrightness\n\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\ttransition\n\t\t\t\t\t\ttemperature\n\t\t\t\t\t\thumidity\n\t\t\t\t\t\tpressure\n\t\t\t\t\t\tilluminance\n\t\t\t\t\t\tbattery\n\t\t\t\t\t\tpower\n\t\t\t\t\t\tvoltage\n\t\t\t\t\t\tcurrent\n\t\t\t\t\t\tenergy\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery SceneEditGroups {\n\t\t\tgroups {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t\tresolvedDevices {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\tsource\n\t\t\t\t\tavailable\n\t\t\t\t\tlastSeen\n\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\tstate {\n\t\t\t\t\t\ton\n\t\t\t\t\t\tbrightness\n\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\ttransition\n\t\t\t\t\t\ttemperature\n\t\t\t\t\t\thumidity\n\t\t\t\t\t\tpressure\n\t\t\t\t\t\tilluminance\n\t\t\t\t\t\tbattery\n\t\t\t\t\t\tpower\n\t\t\t\t\t\tvoltage\n\t\t\t\t\t\tcurrent\n\t\t\t\t\t\tenergy\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery SceneEditRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\tdevice {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tgroup { id name icon }\n\t\t\t\t\t\t\troom { id name icon }\n\t\t\t\t\t\t}\n\t\t\t\t\t\tresolvedDevices {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tresolvedDevices {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\tsource\n\t\t\t\t\tavailable\n\t\t\t\t\tlastSeen\n\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\tstate {\n\t\t\t\t\t\ton\n\t\t\t\t\t\tbrightness\n\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\ttransition\n\t\t\t\t\t\ttemperature\n\t\t\t\t\t\thumidity\n\t\t\t\t\t\tpressure\n\t\t\t\t\t\tilluminance\n\t\t\t\t\t\tbattery\n\t\t\t\t\t\tpower\n\t\t\t\t\t\tvoltage\n\t\t\t\t\t\tcurrent\n\t\t\t\t\t\tenergy\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery SceneEditRooms {\n\t\t\trooms {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t\tdevice {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ttype\n\t\t\t\t\t\tsource\n\t\t\t\t\t\tavailable\n\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tgroup {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tmembers {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tmemberType\n\t\t\t\t\t\t\tmemberId\n\t\t\t\t\t\t\tdevice {\n\t\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tgroup { id name icon }\n\t\t\t\t\t\t\troom { id name icon }\n\t\t\t\t\t\t}\n\t\t\t\t\t\tresolvedDevices {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ttype\n\t\t\t\t\t\t\tsource\n\t\t\t\t\t\t\tavailable\n\t\t\t\t\t\t\tlastSeen\n\t\t\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\t\t\tstate {\n\t\t\t\t\t\t\t\ton\n\t\t\t\t\t\t\t\tbrightness\n\t\t\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\t\t\ttransition\n\t\t\t\t\t\t\t\ttemperature\n\t\t\t\t\t\t\t\thumidity\n\t\t\t\t\t\t\t\tpressure\n\t\t\t\t\t\t\t\tilluminance\n\t\t\t\t\t\t\t\tbattery\n\t\t\t\t\t\t\t\tpower\n\t\t\t\t\t\t\t\tvoltage\n\t\t\t\t\t\t\t\tcurrent\n\t\t\t\t\t\t\t\tenergy\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tresolvedDevices {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\tsource\n\t\t\t\t\tavailable\n\t\t\t\t\tlastSeen\n\t\t\t\t\tcapabilities { name type values valueMin valueMax unit access }\n\t\t\t\t\tstate {\n\t\t\t\t\t\ton\n\t\t\t\t\t\tbrightness\n\t\t\t\t\t\tcolorTemp\n\t\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\t\ttransition\n\t\t\t\t\t\ttemperature\n\t\t\t\t\t\thumidity\n\t\t\t\t\t\tpressure\n\t\t\t\t\t\tilluminance\n\t\t\t\t\t\tbattery\n\t\t\t\t\t\tpower\n\t\t\t\t\t\tvoltage\n\t\t\t\t\t\tcurrent\n\t\t\t\t\t\tenergy\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation SceneEditUpdate($id: ID!, $input: UpdateSceneInput!) {\n\t\t\tupdateScene(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ticon\n\t\t\t\t}\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation SceneEditUpdate($id: ID!, $input: UpdateSceneInput!) {\n\t\t\tupdateScene(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\trooms {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ticon\n\t\t\t\t}\n\t\t\t\tactions {\n\t\t\t\t\ttargetType\n\t\t\t\t\ttargetId\n\t\t\t\t}\n\t\t\t\tdevicePayloads {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tpayload\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation SceneEditSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation SceneEditSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetDeviceState(deviceId: $deviceId, state: $state) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation SceneEditApply($id: ID!) {\n\t\t\tapplyScene(sceneId: $id) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation SceneEditApply($id: ID!) {\n\t\t\tapplyScene(sceneId: $id) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery SceneEditEffects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tkind\n\t\t\t\tnativeName\n\t\t\t\tloop\n\t\t\t\trequiredCapabilities\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery SceneEditEffects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tkind\n\t\t\t\tnativeName\n\t\t\t\tloop\n\t\t\t\trequiredCapabilities\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription DeviceStateChanged {\n\t\t\tdeviceStateChanged {\n\t\t\t\tdeviceId\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription DeviceStateChanged {\n\t\t\tdeviceStateChanged {\n\t\t\t\tdeviceId\n\t\t\t\tstate {\n\t\t\t\t\ton\n\t\t\t\t\tbrightness\n\t\t\t\t\tcolorTemp\n\t\t\t\t\tcolor { r g b x y }\n\t\t\t\t\ttransition\n\t\t\t\t\ttemperature\n\t\t\t\t\thumidity\n\t\t\t\t\tpressure\n\t\t\t\t\tilluminance\n\t\t\t\t\tbattery\n\t\t\t\t\tpower\n\t\t\t\t\tvoltage\n\t\t\t\t\tcurrent\n\t\t\t\t\tenergy\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery MqttConfig {\n\t\t\tmqttConfig {\n\t\t\t\tbroker\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery MqttConfig {\n\t\t\tmqttConfig {\n\t\t\t\tbroker\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Settings {\n\t\t\tsettings {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Settings {\n\t\t\tsettings {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation UpdateMqttConfig($input: MqttConfigInput!) {\n\t\t\tupdateMqttConfig(input: $input) {\n\t\t\t\tbroker\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation UpdateMqttConfig($input: MqttConfigInput!) {\n\t\t\tupdateMqttConfig(input: $input) {\n\t\t\t\tbroker\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation TestMqttConnection($input: MqttConfigInput!) {\n\t\t\ttestMqttConnection(input: $input) {\n\t\t\t\tsuccess\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation TestMqttConnection($input: MqttConfigInput!) {\n\t\t\ttestMqttConnection(input: $input) {\n\t\t\t\tsuccess\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation UpdateSetting($key: String!, $value: String!) {\n\t\t\tupdateSetting(key: $key, value: $value) {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation UpdateSetting($key: String!, $value: String!) {\n\t\t\tupdateSetting(key: $key, value: $value) {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation createInitialUser($input: CreateInitialUserInput!) {\n\t\t\tcreateInitialUser(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation createInitialUser($input: CreateInitialUserInput!) {\n\t\t\tcreateInitialUser(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation SetupUpdateMqttConfig($input: MqttConfigInput!) {\n\t\t\tupdateMqttConfig(input: $input) {\n\t\t\t\tbroker\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation SetupUpdateMqttConfig($input: MqttConfigInput!) {\n\t\t\tupdateMqttConfig(input: $input) {\n\t\t\t\tbroker\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery UsersList {\n\t\t\tusers {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery UsersList {\n\t\t\tusers {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation UsersCreate($input: CreateUserInput!) {\n\t\t\tcreateUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation UsersCreate($input: CreateUserInput!) {\n\t\t\tcreateUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation UsersDelete($id: ID!) {\n\t\t\tdeleteUser(id: $id)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation UsersDelete($id: ID!) {\n\t\t\tdeleteUser(id: $id)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation UsersBatchDelete($ids: [ID!]!) {\n\t\t\tbatchDeleteUsers(ids: $ids)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation UsersBatchDelete($ids: [ID!]!) {\n\t\t\tbatchDeleteUsers(ids: $ids)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation UsersResetPassword($id: ID!, $newPassword: String!) {\n\t\t\tresetUserPassword(id: $id, newPassword: $newPassword)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation UsersResetPassword($id: ID!, $newPassword: String!) {\n\t\t\tresetUserPassword(id: $id, newPassword: $newPassword)\n\t\t}\n\t"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;