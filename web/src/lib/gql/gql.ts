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
    "\n  query E2EAutomationsDevices {\n    devices {\n      id\n      name\n      friendlyName\n      type\n    }\n  }\n": typeof types.E2EAutomationsDevicesDocument,
    "\n  mutation E2ECreateAutomation($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": typeof types.E2ECreateAutomationDocument,
    "\n  query E2EAutomation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": typeof types.E2EAutomationDocument,
    "\n  query E2EAutomations {\n    automations {\n      id\n      name\n      enabled\n    }\n  }\n": typeof types.E2EAutomationsDocument,
    "\n  mutation E2EUpdateAutomation($id: ID!, $input: UpdateAutomationInput!) {\n    updateAutomation(id: $id, input: $input) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": typeof types.E2EUpdateAutomationDocument,
    "\n  mutation E2EToggleAutomation($id: ID!, $enabled: Boolean!) {\n    toggleAutomation(id: $id, enabled: $enabled) {\n      id\n      enabled\n    }\n  }\n": typeof types.E2EToggleAutomationDocument,
    "\n  mutation E2EDeleteAutomation($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n": typeof types.E2EDeleteAutomationDocument,
    "\n  mutation E2EAutomationsCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.E2EAutomationsCreateGroupDocument,
    "\n  mutation E2EAutomationsAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": typeof types.E2EAutomationsAddGroupMemberDocument,
    "\n  mutation E2EAutomationsDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": typeof types.E2EAutomationsDeleteGroupDocument,
    "\n  query E2EDevicesList {\n    devices {\n      id\n      name\n      friendlyName\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": typeof types.E2EDevicesListDocument,
    "\n  query E2EDevice($id: ID!) {\n    device(id: $id) {\n      id\n      name\n      friendlyName\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": typeof types.E2EDeviceDocument,
    "\n  query E2EZigbeeDeviceMetadata($id: ID!) {\n    device(id: $id) {\n      zigbee2Mqtt {\n        imageCandidate\n        imageVersion\n        ieeeAddress\n        networkAddress\n        supported\n        softwareBuildId\n        definitionUrl\n        definition {\n          model\n          vendor\n          description\n          supportsOta\n        }\n        ota {\n          state\n          installedVersion\n          latestVersion\n          progress\n        }\n        endpoints {\n          id\n          profileId\n          deviceId\n          inputClusters\n          outputClusters\n          bindings {\n            cluster\n            targetType\n            targetIeeeAddress\n            targetEndpoint\n            targetGroupId\n          }\n          reportings {\n            cluster\n            attribute\n            minimumReportInterval\n            maximumReportInterval\n            reportableChange\n          }\n        }\n        groups {\n          id\n          providerGroupId\n          name\n          endpoint\n        }\n        bridgeInfo {\n          adapterType\n          firmwareVersion\n          channel\n          panId\n          extendedPanId\n          zigbee2MqttVersion\n          zigbee2MqttCommit\n          zigbeeHerdsmanVersion\n          zigbeeHerdsmanConvertersVersion\n        }\n      }\n    }\n  }\n": typeof types.E2EZigbeeDeviceMetadataDocument,
    "\n  mutation E2ESetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n    setTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n  }\n": typeof types.E2ESetDeviceStateDocument,
    "\n  mutation E2EUpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n    updateDevice(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.E2EUpdateDeviceDocument,
    "\n  subscription E2EDevicesDeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n      }\n    }\n  }\n": typeof types.E2EDevicesDeviceStateChangedDocument,
    "\n  query E2EErrorsScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n    }\n  }\n": typeof types.E2EErrorsSceneDocument,
    "\n  query E2EErrorsAutomation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n    }\n  }\n": typeof types.E2EErrorsAutomationDocument,
    "\n  mutation E2EErrorsAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": typeof types.E2EErrorsAddGroupMemberDocument,
    "\n  mutation E2EErrorsDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n": typeof types.E2EErrorsDeleteSceneDocument,
    "\n  mutation E2EErrorsCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n    }\n  }\n": typeof types.E2EErrorsCreateGroupDocument,
    "\n  mutation E2EErrorsDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": typeof types.E2EErrorsDeleteGroupDocument,
    "\n  mutation E2ECreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n": typeof types.E2ECreateGroupDocument,
    "\n  mutation E2EAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n      members {\n        id\n        memberType\n        memberId\n        device {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.E2EAddGroupMemberDocument,
    "\n  query E2EGroup($id: ID!) {\n    group(id: $id) {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n": typeof types.E2EGroupDocument,
    "\n  mutation E2EDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": typeof types.E2EDeleteGroupDocument,
    "\n  query E2EGroups {\n    groups {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n": typeof types.E2EGroupsDocument,
    "\n  mutation E2EUpdateGroup($id: ID!, $input: UpdateGroupInput!) {\n    updateGroup(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.E2EUpdateGroupDocument,
    "\n  mutation E2ERemoveGroupMember($id: ID!) {\n    removeGroupMember(id: $id) {\n      id\n      members {\n        id\n      }\n    }\n  }\n": typeof types.E2ERemoveGroupMemberDocument,
    "\n  query E2EGroupsDevices {\n    devices {\n      id\n      name\n    }\n  }\n": typeof types.E2EGroupsDevicesDocument,
    "\n  query BrowserSceneFixtures {\n    devices {\n      id\n      friendlyName\n      type\n    }\n    vibePresets {\n      id\n      title\n    }\n  }\n": typeof types.BrowserSceneFixturesDocument,
    "\n  mutation BrowserSceneCreateStructure($room: CreateRoomInput!, $group: CreateGroupInput!) {\n    room: createRoom(input: $room) {\n      id\n    }\n    group: createGroup(input: $group) {\n      id\n    }\n  }\n": typeof types.BrowserSceneCreateStructureDocument,
    "\n  mutation BrowserSceneAddRoomMember($input: AddRoomMemberInput!) {\n    addRoomMember(input: $input) {\n      id\n    }\n  }\n": typeof types.BrowserSceneAddRoomMemberDocument,
    "\n  mutation BrowserSceneAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": typeof types.BrowserSceneAddGroupMemberDocument,
    "\n  mutation BrowserSceneDeleteFixtures($roomId: ID!, $groupId: ID!) {\n    deleteRoom(id: $roomId)\n    deleteGroup(id: $groupId)\n  }\n": typeof types.BrowserSceneDeleteFixturesDocument,
    "\n  mutation BrowserSceneDelete($id: ID!) {\n    deleteScene(id: $id)\n  }\n": typeof types.BrowserSceneDeleteDocument,
    "\n  query E2EScenesDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n": typeof types.E2EScenesDevicesDocument,
    "\n  mutation E2ECreateScene($input: CreateSceneInput!) {\n    createScene(input: $input) {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n": typeof types.E2ECreateSceneDocument,
    "\n  mutation E2EApplyScene($sceneId: ID!) {\n    applyScene(sceneId: $sceneId) {\n      id\n      name\n    }\n  }\n": typeof types.E2EApplySceneDocument,
    "\n  query E2EScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n": typeof types.E2ESceneDocument,
    "\n  mutation E2EDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n": typeof types.E2EDeleteSceneDocument,
    "\n  query E2EScenes {\n    scenes {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n": typeof types.E2EScenesDocument,
    "\n  mutation E2EUpdateScene($id: ID!, $input: UpdateSceneInput!) {\n    updateScene(id: $id, input: $input) {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n": typeof types.E2EUpdateSceneDocument,
    "\n  mutation E2EScenesCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.E2EScenesCreateGroupDocument,
    "\n  mutation E2EScenesAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": typeof types.E2EScenesAddGroupMemberDocument,
    "\n  mutation E2EScenesDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": typeof types.E2EScenesDeleteGroupDocument,
    "\n  mutation BrowserSearchCreateFixtures(\n    $room: CreateRoomInput!\n    $group: CreateGroupInput!\n    $scene: CreateSceneInput!\n    $automation: CreateAutomationInput!\n    $effect: CreateEffectInput!\n    $alarm: RaiseAlarmInput!\n  ) {\n    room: createRoom(input: $room) {\n      id\n    }\n    group: createGroup(input: $group) {\n      id\n    }\n    scene: createScene(input: $scene) {\n      id\n    }\n    automation: createAutomation(input: $automation) {\n      id\n    }\n    effect: createEffect(input: $effect) {\n      id\n    }\n    alarm: raiseAlarm(input: $alarm) {\n      id\n    }\n  }\n": typeof types.BrowserSearchCreateFixturesDocument,
    "\n  mutation BrowserSearchDeleteFixtures(\n    $roomId: ID!\n    $groupId: ID!\n    $sceneId: ID!\n    $automationId: ID!\n    $effectId: ID!\n    $alarmId: ID!\n  ) {\n    deleteRoom(id: $roomId)\n    deleteGroup(id: $groupId)\n    deleteScene(id: $sceneId)\n    deleteAutomation(id: $automationId)\n    deleteEffect(id: $effectId)\n    deleteAlarm(alarmId: $alarmId)\n  }\n": typeof types.BrowserSearchDeleteFixturesDocument,
    "\n  query BrowserSearchMaintenanceTasks {\n    maintenanceTasks {\n      kind\n    }\n  }\n": typeof types.BrowserSearchMaintenanceTasksDocument,
    "\n  query BrowserSearchDevices {\n    devices {\n      id\n      friendlyName\n    }\n  }\n": typeof types.BrowserSearchDevicesDocument,
    "\n  mutation BrowserSearchCleanUpDeletedDevice($id: ID!, $input: UpdateDeviceInput!) {\n    restoreDevice(id: $id) {\n      id\n    }\n    updateDevice(id: $id, input: $input) {\n      id\n    }\n  }\n": typeof types.BrowserSearchCleanUpDeletedDeviceDocument,
    "\n  query E2EDevices {\n    devices {\n      id\n      name\n      friendlyName\n      source\n      type\n      available\n    }\n  }\n": typeof types.E2EDevicesDocument,
    "\n  query E2EStateHistoryDevices {\n    devices {\n      id\n      name\n      friendlyName\n      type\n    }\n  }\n": typeof types.E2EStateHistoryDevicesDocument,
    "\n  query E2EStateHistory($filter: StateHistoryFilter!) {\n    stateHistory(filter: $filter) {\n      deviceId\n      field\n      valueType\n      points {\n        at\n        numberValue\n        booleanValue\n        textValue\n      }\n    }\n  }\n": typeof types.E2EStateHistoryDocument,
    "\n  subscription E2EDeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": typeof types.E2EDeviceStateChangedDocument,
    "\n  subscription E2EDeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n": typeof types.E2EDeviceAvailabilityChangedDocument,
    "\n  subscription E2EDeviceAdded {\n    deviceAdded {\n      id\n      friendlyName\n      type\n      source\n    }\n  }\n": typeof types.E2EDeviceAddedDocument,
    "\n  subscription E2EDeviceRemoved {\n    deviceRemoved\n  }\n": typeof types.E2EDeviceRemovedDocument,
    "\n  subscription E2EAutomationNodeActivated($automationId: ID) {\n    automationNodeActivated(automationId: $automationId) {\n      automationId\n      nodeId\n      active\n    }\n  }\n": typeof types.E2EAutomationNodeActivatedDocument,
    "\n  subscription E2EDeviceStateChangedFiltered($deviceId: ID) {\n    deviceStateChanged(deviceId: $deviceId) {\n      deviceId\n      state {\n        on\n        brightness\n        temperature\n        humidity\n      }\n    }\n  }\n": typeof types.E2EDeviceStateChangedFilteredDocument,
    "\n  query E2ESubscriptionsDevices {\n    devices {\n      id\n      name\n      friendlyName\n      type\n    }\n  }\n": typeof types.E2ESubscriptionsDevicesDocument,
    "\n  mutation E2ESubscriptionsCreateAutomation($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      id\n      name\n      nodes {\n        id\n        type\n      }\n    }\n  }\n": typeof types.E2ESubscriptionsCreateAutomationDocument,
    "\n  mutation E2ESubscriptionsDeleteAutomation($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n": typeof types.E2ESubscriptionsDeleteAutomationDocument,
    "\n  mutation E2ECreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n      username\n      name\n      avatarPath\n      theme\n      hapticsEnabled\n    }\n  }\n": typeof types.E2ECreateUserDocument,
    "\n  mutation E2EUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n    updateCurrentUser(input: $input) {\n      id\n      name\n      theme\n      hapticsEnabled\n    }\n  }\n": typeof types.E2EUpdateCurrentUserDocument,
    "\n  mutation E2EDeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n": typeof types.E2EDeleteUserDocument,
    "\n  mutation E2EResetPassword($id: ID!, $p: String!) {\n    resetUserPassword(id: $id, newPassword: $p)\n  }\n": typeof types.E2EResetPasswordDocument,
    "\n  query E2EMe {\n    me {\n      id\n      username\n      name\n      theme\n      hapticsEnabled\n      avatarPath\n    }\n  }\n": typeof types.E2EMeDocument,
    "\n  query E2EWebSocketRecoveryDeviceState($id: ID!) {\n    device(id: $id) {\n      state {\n        brightness\n      }\n    }\n  }\n": typeof types.E2EWebSocketRecoveryDeviceStateDocument,
    "\n  query E2EWebSocketRecoveryLogs {\n    logs(limit: 1000) {\n      message\n      attrs\n    }\n  }\n": typeof types.E2EWebSocketRecoveryLogsDocument,
    "\n  query E2EZigbeeMetadataReady($id: ID!) {\n    device(id: $id) {\n      zigbee2Mqtt {\n        ieeeAddress\n      }\n    }\n  }\n": typeof types.E2EZigbeeMetadataReadyDocument,
    "\n  query E2EMaintenanceTasks {\n    maintenanceTasks {\n      id\n      kind\n    }\n  }\n": typeof types.E2EMaintenanceTasksDocument,
    "\n\t\tmutation DeleteAlarm($alarmId: ID!) {\n\t\t\tdeleteAlarm(alarmId: $alarmId)\n\t\t}\n\t": typeof types.DeleteAlarmDocument,
    "\n\t\tmutation BatchDeleteAlarms($alarmIds: [ID!]!) {\n\t\t\tbatchDeleteAlarms(alarmIds: $alarmIds)\n\t\t}\n\t": typeof types.BatchDeleteAlarmsDocument,
    "\n\t\tmutation DashboardApplianceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t": typeof types.DashboardApplianceCardSetDeviceStateDocument,
    "\n\t\tmutation DashboardLightCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t": typeof types.DashboardLightCardSetDeviceStateDocument,
    "\n\t\tquery DashboardIntegrations {\n\t\t\tintegrations {\n\t\t\t\tprovider\n\t\t\t\tconfigured\n\t\t\t}\n\t\t}\n\t": typeof types.DashboardIntegrationsDocument,
    "\n\t\tmutation DeviceActionMenuSimulate($deviceId: ID!, $action: String!) {\n\t\t\tsimulateDeviceAction(deviceId: $deviceId, action: $action)\n\t\t}\n\t": typeof types.DeviceActionMenuSimulateDocument,
    "\n\t\tmutation DeviceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t": typeof types.DeviceCardSetDeviceStateDocument,
    "\n\t\tmutation DeviceTableSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t": typeof types.DeviceTableSetDeviceStateDocument,
    "\n\t\tmutation UpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n\t\t\tupdateDevice(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\troles {\n\t\t\t\t\tcontrolledLoad\n\t\t\t\t\tcontact\n\t\t\t\t}\n\t\t\t\tdisabled\n\t\t\t\tfriendlyName\n\t\t\t\tseen\n\t\t\t}\n\t\t}\n\t": typeof types.UpdateDeviceDocument,
    "\n\t\tmutation MarkDevicesSeen($ids: [ID!]!) {\n\t\t\tmarkDevicesSeen(ids: $ids)\n\t\t}\n\t": typeof types.MarkDevicesSeenDocument,
    "\n\t\tmutation DevicesPageDeleteDevice($id: ID!) {\n\t\t\tdeleteDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t": typeof types.DevicesPageDeleteDeviceDocument,
    "\n\t\tmutation DevicesPageRestoreDevice($id: ID!) {\n\t\t\trestoreDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t": typeof types.DevicesPageRestoreDeviceDocument,
    "\n\t\tmutation DevicesPageBatchDeleteDevices($ids: [ID!]!) {\n\t\t\tbatchDeleteDevices(ids: $ids)\n\t\t}\n\t": typeof types.DevicesPageBatchDeleteDevicesDocument,
    "\n\t\tmutation DevicesPageBatchRestoreDevices($ids: [ID!]!) {\n\t\t\tbatchRestoreDevices(ids: $ids)\n\t\t}\n\t": typeof types.DevicesPageBatchRestoreDevicesDocument,
    "\n\t\tquery NativeEffectOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tconfirmedDeviceCount\n\t\t\t\tuntestedDeviceCount\n\t\t\t\tunsupportedDeviceCount\n\t\t\t\tsource\n\t\t\t}\n\t\t}\n\t": typeof types.NativeEffectOptionsDocument,
    "\n\t\tsubscription NativeEffectEditorSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t": typeof types.NativeEffectEditorSupportChangedDocument,
    "\n\t\tmutation EffectRunTargetDrawerRunEffect($effectId: ID!, $targetType: String!, $targetId: ID!) {\n\t\t\trunEffect(effectId: $effectId, targetType: $targetType, targetId: $targetId) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": typeof types.EffectRunTargetDrawerRunEffectDocument,
    "\n\t\tmutation EffectRunTargetDrawerRunNativeEffect($nativeName: String!, $targetType: String!, $targetId: ID!) {\n\t\t\trunNativeEffect(nativeName: $nativeName, targetType: $targetType, targetId: $targetId) {\n\t\t\t\trunId\n\t\t\t\tdevices {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tstatus\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.EffectRunTargetDrawerRunNativeEffectDocument,
    "\n\t\tquery EffectRunTargetDrawerNativeSupport($name: String!) {\n\t\t\tnativeEffectSupport(name: $name) {\n\t\t\t\tdeviceId\n\t\t\t\tstatus\n\t\t\t}\n\t\t}\n\t": typeof types.EffectRunTargetDrawerNativeSupportDocument,
    "\n\t\tsubscription EffectRunTargetDrawerNativeSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t": typeof types.EffectRunTargetDrawerNativeSupportChangedDocument,
    "\n\t\tquery EffectTimelineEditorNativeOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tconfirmedDeviceCount\n\t\t\t\tuntestedDeviceCount\n\t\t\t\tunsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t": typeof types.EffectTimelineEditorNativeOptionsDocument,
    "\n\t\tsubscription EffectTimelineNativeSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t": typeof types.EffectTimelineNativeSupportChangedDocument,
    "\n\t\tquery EffectsPageNativeOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsource\n\t\t\t\tconfirmedDeviceCount\n\t\t\t\tuntestedDeviceCount\n\t\t\t\tunsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t": typeof types.EffectsPageNativeOptionsDocument,
    "\n\t\tsubscription EffectsPageNativeSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t": typeof types.EffectsPageNativeSupportChangedDocument,
    "\n\t\tmutation RoomsPageSetDeviceState($targetId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: ROOM, id: $targetId }, state: $state)\n\t\t}\n\t": typeof types.RoomsPageSetDeviceStateDocument,
    "\n\t\tquery SceneCreateVibePreview($input: PreviewVibeInput!) {\n\t\t\tpreviewVibe(input: $input) {\n\t\t\t\tpreview { width height pixels { r g b } swatches { x y color { r g b } } }\n\t\t\t\tdomain seed brightness movement cycleSeconds minimumLightness maximumLightness\n\t\t\t}\n\t\t}\n\t": typeof types.SceneCreateVibePreviewDocument,
    "\n\t\tquery SceneOutputRate {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tcontinuousCommandsPerSecond\n\t\t\t\tactiveContinuousDeviceIds\n\t\t\t}\n\t\t}\n\t": typeof types.SceneOutputRateDocument,
    "\n\t\tquery StateHistory($filter: StateHistoryFilter!) {\n\t\t\tstateHistory(filter: $filter) {\n\t\t\t\tdeviceId\n\t\t\t\tfield\n\t\t\t\tvalueType\n\t\t\t\tpoints {\n\t\t\t\t\tat\n\t\t\t\t\tnumberValue\n\t\t\t\t\tbooleanValue\n\t\t\t\t\ttextValue\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.StateHistoryDocument,
    "\n\t\tquery AggregatedStateHistory($filter: AggregatedStateHistoryFilter!) {\n\t\t\taggregatedStateHistory(filter: $filter) {\n\t\t\t\tfield\n\t\t\t\tpoints {\n\t\t\t\t\tat\n\t\t\t\t\tvalue\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.AggregatedStateHistoryDocument,
    "\n\t\tquery GuidedVibeChoices($input: GuidedVibeRoundInput!) {\n\t\t\tguidedVibeRound(input: $input) {\n\t\t\t\tround\n\t\t\t\tcanFinish\n\t\t\t\tcomplete\n\t\t\t\toptions {\n\t\t\t\t\tid\n\t\t\t\t\ttitle\n\t\t\t\t\tpreview {\n\t\t\t\t\t\twidth height\n\t\t\t\t\t\tpixels { r g b }\n\t\t\t\t\t\tswatches { x y color { r g b } }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.GuidedVibeChoicesDocument,
    "\n\t\tquery SceneEditorVibePreview($input: PreviewVibeInput!) {\n\t\t\tpreviewVibe(input: $input) {\n\t\t\t\tpreview { width height pixels { r g b } swatches { x y color { r g b } } }\n\t\t\t\tdomain seed brightness movement cycleSeconds\n\t\t\t}\n\t\t}\n\t": typeof types.SceneEditorVibePreviewDocument,
    "\n  query Automation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n      icon\n      enabled\n      compilable\n      nodes {\n        id\n        type\n        config\n        positionX\n        positionY\n        runtimeState\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": typeof types.AutomationDocument,
    "\n  query EffectEdit($id: ID!) {\n    effect(id: $id) {\n      id\n      name\n      icon\n      kind\n      nativeName\n      loop\n      durationMs\n      requiredCapabilities\n      tracks {\n        id\n        index\n        name\n        clips {\n          id\n          startMs\n          transitionMinMs\n          transitionMaxMs\n          kind\n          config\n        }\n      }\n    }\n  }\n": typeof types.EffectEditDocument,
    "\n  mutation MapPageSetDisplayColor($id: ID!, $input: UpdateDeviceInput!) {\n    updateDevice(id: $id, input: $input) {\n      id\n      displayColor\n      displayBrightness\n    }\n  }\n": typeof types.MapPageSetDisplayColorDocument,
    "\n  query MapNetworkTopologies {\n    networkTopologies {\n      provider\n      scannedAt\n      nodes {\n        id\n        deviceId\n        role\n      }\n      links {\n        source\n        target\n        kind\n        quality\n        stale\n      }\n    }\n  }\n": typeof types.MapNetworkTopologiesDocument,
    "\n  subscription MapPageTopologyUpdated {\n    networkTopologyUpdated {\n      provider\n      scannedAt\n    }\n  }\n": typeof types.MapPageTopologyUpdatedDocument,
    "\n  subscription MapPageDeviceTx {\n    deviceStateChanged {\n      deviceId\n    }\n  }\n": typeof types.MapPageDeviceTxDocument,
    "\n  subscription MapPageActionTx {\n    deviceActionFired {\n      deviceId\n    }\n  }\n": typeof types.MapPageActionTxDocument,
    "\n  query setupStatus {\n    setupStatus {\n      hasInitialUser\n    }\n  }\n": typeof types.SetupStatusDocument,
    "\n  mutation GroupCommandsSetTargetState($target: CommandTargetInput!, $state: DeviceStateInput!) {\n    setTargetState(target: $target, state: $state)\n  }\n": typeof types.GroupCommandsSetTargetStateDocument,
    "\n  query ActiveAlarms {\n    alarms {\n      id\n      latestRowId\n      severity\n      kind\n      message\n      source\n      count\n      firstRaisedAt\n      lastRaisedAt\n    }\n  }\n": typeof types.ActiveAlarmsDocument,
    "\n  subscription AlarmEvents {\n    alarmEvent {\n      kind\n      clearedAlarmId\n      alarm {\n        id\n        latestRowId\n        severity\n        kind\n        message\n        source\n        count\n        firstRaisedAt\n        lastRaisedAt\n      }\n    }\n  }\n": typeof types.AlarmEventsDocument,
    "\n  fragment AutomationFields on AutomationGraph {\n    id\n    name\n    icon\n    enabled\n    lastFiredAt\n    nodes {\n      id\n      type\n      config\n    }\n    edges {\n      fromNodeId\n      toNodeId\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n": typeof types.AutomationFieldsFragmentDoc,
    "\n  query AutomationsStore {\n    automations {\n      ...AutomationFields\n    }\n  }\n": typeof types.AutomationsStoreDocument,
    "\n  mutation AutomationsStoreCreate($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      ...AutomationFields\n    }\n  }\n": typeof types.AutomationsStoreCreateDocument,
    "\n  mutation AutomationsStoreUpdate($id: ID!, $input: UpdateAutomationInput!) {\n    updateAutomation(id: $id, input: $input) {\n      ...AutomationFields\n    }\n  }\n": typeof types.AutomationsStoreUpdateDocument,
    "\n  mutation AutomationsStoreToggle($id: ID!, $enabled: Boolean!) {\n    toggleAutomation(id: $id, enabled: $enabled) {\n      ...AutomationFields\n    }\n  }\n": typeof types.AutomationsStoreToggleDocument,
    "\n  mutation AutomationsStoreDelete($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n": typeof types.AutomationsStoreDeleteDocument,
    "\n  mutation AutomationsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteAutomations(ids: $ids)\n  }\n": typeof types.AutomationsStoreBatchDeleteDocument,
    "\n  query DevicesInit {\n    devices {\n      id\n      name\n      icon\n      displayColor\n      displayBrightness\n      source\n      type\n      roles {\n        controlledLoad\n        contact\n      }\n      capabilities {\n        name\n        type\n        label\n        description\n        category\n        values\n        valueMin\n        valueMax\n        unit\n        reportsValue\n        canSet\n        canGet\n      }\n      available\n      disabled\n      deleted\n      friendlyName\n      seen\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n      configuration {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n": typeof types.DevicesInitDocument,
    "\n  subscription DeviceStoreStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": typeof types.DeviceStoreStateChangedDocument,
    "\n  subscription DeviceStoreConfigurationChanged {\n    deviceConfigurationChanged {\n      deviceId\n      values {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n": typeof types.DeviceStoreConfigurationChangedDocument,
    "\n  subscription DeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n": typeof types.DeviceAvailabilityChangedDocument,
    "\n  subscription DeviceAdded {\n    deviceAdded {\n      id\n      name\n      friendlyName\n      seen\n      disabled\n      deleted\n      source\n      type\n      roles {\n        controlledLoad\n        contact\n      }\n      capabilities {\n        name\n        type\n        label\n        description\n        category\n        values\n        valueMin\n        valueMax\n        unit\n        reportsValue\n        canSet\n        canGet\n      }\n      available\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n      configuration {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n": typeof types.DeviceAddedDocument,
    "\n  subscription DeviceRemoved {\n    deviceRemoved\n  }\n": typeof types.DeviceRemovedDocument,
    "\n  subscription DeviceStoreUpdated {\n    deviceUpdated {\n      id\n      name\n      icon\n      displayColor\n      displayBrightness\n      source\n      type\n      roles {\n        controlledLoad\n        contact\n      }\n      capabilities {\n        name\n        type\n        label\n        description\n        category\n        values\n        valueMin\n        valueMax\n        unit\n        reportsValue\n        canSet\n        canGet\n      }\n      available\n      disabled\n      deleted\n      friendlyName\n      seen\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n      configuration {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n": typeof types.DeviceStoreUpdatedDocument,
    "\n  fragment EffectFields on Effect {\n    id\n    name\n    source\n    icon\n    kind\n    nativeName\n    loop\n    durationMs\n    requiredCapabilities\n    tracks {\n      id\n      clips {\n        id\n      }\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n": typeof types.EffectFieldsFragmentDoc,
    "\n  query EffectsStore {\n    effects {\n      ...EffectFields\n    }\n  }\n": typeof types.EffectsStoreDocument,
    "\n  mutation EffectsStoreCreate($input: CreateEffectInput!) {\n    createEffect(input: $input) {\n      ...EffectFields\n    }\n  }\n": typeof types.EffectsStoreCreateDocument,
    "\n  mutation EffectsStoreUpdate($input: UpdateEffectInput!) {\n    updateEffect(input: $input) {\n      ...EffectFields\n    }\n  }\n": typeof types.EffectsStoreUpdateDocument,
    "\n  mutation EffectsStoreDelete($id: ID!) {\n    deleteEffect(id: $id)\n  }\n": typeof types.EffectsStoreDeleteDocument,
    "\n  mutation EffectsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteEffects(ids: $ids)\n  }\n": typeof types.EffectsStoreBatchDeleteDocument,
    "\n  fragment FloorplanFields on Floorplan {\n    id\n    name\n    vertices {\n      id\n      x\n      y\n    }\n    walls {\n      id\n      vertexA\n      vertexB\n      thickness\n      curveX\n      curveY\n    }\n    openings {\n      id\n      wallId\n      t\n      width\n      kind\n    }\n    doorBindings {\n      openingId\n      deviceId\n      hingeSide\n      swingSide\n    }\n    rooms {\n      id\n      name\n      roomId\n      vertexIds\n    }\n    placements {\n      memberType\n      memberId\n      x\n      y\n    }\n    furniture {\n      id\n      kind\n      x\n      y\n      width\n      height\n      rotation\n      occluder\n    }\n  }\n": typeof types.FloorplanFieldsFragmentDoc,
    "\n  query FloorplanStore {\n    floorplan {\n      ...FloorplanFields\n    }\n  }\n": typeof types.FloorplanStoreDocument,
    "\n  mutation FloorplanStoreUpdate($input: UpdateFloorplanInput!) {\n    updateFloorplan(input: $input) {\n      ...FloorplanFields\n    }\n  }\n": typeof types.FloorplanStoreUpdateDocument,
    "\n  fragment GroupFields on Group {\n    id\n    name\n    friendlyName\n    source\n    removed\n    icon\n    tags\n    members {\n      id\n      memberType\n      memberId\n    }\n    resolvedDevices {\n      id\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n": typeof types.GroupFieldsFragmentDoc,
    "\n  query GroupsStore {\n    groups {\n      ...GroupFields\n    }\n  }\n": typeof types.GroupsStoreDocument,
    "\n  subscription GroupsStoreChanged {\n    groupsChanged\n  }\n": typeof types.GroupsStoreChangedDocument,
    "\n  mutation GroupsStoreCreate($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      ...GroupFields\n    }\n  }\n": typeof types.GroupsStoreCreateDocument,
    "\n  mutation GroupsStoreUpdate($id: ID!, $input: UpdateGroupInput!) {\n    updateGroup(id: $id, input: $input) {\n      ...GroupFields\n    }\n  }\n": typeof types.GroupsStoreUpdateDocument,
    "\n  mutation GroupsStoreDelete($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": typeof types.GroupsStoreDeleteDocument,
    "\n  mutation GroupsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteGroups(ids: $ids)\n  }\n": typeof types.GroupsStoreBatchDeleteDocument,
    "\n  mutation GroupsStoreAddMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      ...GroupFields\n    }\n  }\n": typeof types.GroupsStoreAddMemberDocument,
    "\n  mutation GroupsStoreRemoveMember($id: ID!) {\n    removeGroupMember(id: $id) {\n      ...GroupFields\n    }\n  }\n": typeof types.GroupsStoreRemoveMemberDocument,
    "\n  query MaintenanceTasks {\n    maintenanceTasks {\n      id\n      kind\n      title\n      detail\n      action\n      currentValue\n      targetValue\n      actionUrl\n      device {\n        id\n        name\n        friendlyName\n        icon\n        type\n        available\n        disabled\n        deleted\n        roles {\n          contact\n        }\n      }\n    }\n  }\n": typeof types.MaintenanceTasksDocument,
    "\n  mutation CompleteMaintenanceTasks($ids: [ID!]!) {\n    completeMaintenanceTasks(ids: $ids)\n  }\n": typeof types.CompleteMaintenanceTasksDocument,
    "\n  subscription MaintenanceChanged {\n    maintenanceChanged\n  }\n": typeof types.MaintenanceChangedDocument,
    "\n  query Me {\n    me {\n      id\n      username\n      name\n      avatarPath\n      theme\n      timeFormat\n      temperatureUnit\n      hapticsEnabled\n      createdAt\n      mustChangePassword\n    }\n  }\n": typeof types.MeDocument,
    "\n  fragment RoomFields on Room {\n    id\n    name\n    icon\n    members {\n      id\n      memberType\n      memberId\n    }\n    resolvedDevices {\n      id\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n": typeof types.RoomFieldsFragmentDoc,
    "\n  query RoomsStore {\n    rooms {\n      ...RoomFields\n    }\n  }\n": typeof types.RoomsStoreDocument,
    "\n  mutation RoomsStoreCreate($input: CreateRoomInput!) {\n    createRoom(input: $input) {\n      ...RoomFields\n    }\n  }\n": typeof types.RoomsStoreCreateDocument,
    "\n  mutation RoomsStoreUpdate($id: ID!, $input: UpdateRoomInput!) {\n    updateRoom(id: $id, input: $input) {\n      ...RoomFields\n    }\n  }\n": typeof types.RoomsStoreUpdateDocument,
    "\n  mutation RoomsStoreDelete($id: ID!) {\n    deleteRoom(id: $id)\n  }\n": typeof types.RoomsStoreDeleteDocument,
    "\n  mutation RoomsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteRooms(ids: $ids)\n  }\n": typeof types.RoomsStoreBatchDeleteDocument,
    "\n  mutation RoomsStoreAddMember($input: AddRoomMemberInput!) {\n    addRoomMember(input: $input) {\n      ...RoomFields\n    }\n  }\n": typeof types.RoomsStoreAddMemberDocument,
    "\n  mutation RoomsStoreRemoveMember($id: ID!) {\n    removeRoomMember(id: $id) {\n      ...RoomFields\n    }\n  }\n": typeof types.RoomsStoreRemoveMemberDocument,
    "\n  fragment SceneFields on Scene {\n    id\n    name\n    icon\n    rooms {\n      id\n      name\n      icon\n    }\n    targets {\n      targetType\n      targetId\n      name\n      target {\n        ... on Device {\n          id\n          deviceName: name\n          friendlyName\n          type\n        }\n        ... on Group {\n          id\n          groupName: name\n          friendlyName\n          icon\n          removed\n        }\n        ... on Room {\n          id\n          name\n          icon\n        }\n      }\n      expression {\n        connector\n        subject\n        op\n        values\n      }\n    }\n    lighting {\n      dynamicSource {\n        domain\n        sourceKind\n        presetId\n        presetTitle\n        seed\n        brightness\n        movement\n        cycleSeconds\n      }\n      overrides {\n        deviceId\n        kind\n        state {\n          on\n          brightness\n          colorTemp\n          color {\n            r\n            g\n            b\n            x\n            y\n          }\n          transition\n          targetTemperature\n          hvacMode\n          fanMode\n          swing\n        }\n        effectId\n        nativeEffectName\n      }\n    }\n    supportingStates {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n      }\n    }\n    preview {\n      width\n      height\n      pixels {\n        r\n        g\n        b\n      }\n      swatches {\n        x\n        y\n        color {\n          r\n          g\n          b\n        }\n      }\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n    activatedAt\n  }\n": typeof types.SceneFieldsFragmentDoc,
    "\n  query ScenesStore {\n    scenes {\n      ...SceneFields\n    }\n  }\n": typeof types.ScenesStoreDocument,
    "\n  mutation ScenesStoreCreate($input: CreateSceneInput!) {\n    createScene(input: $input) {\n      ...SceneFields\n    }\n  }\n": typeof types.ScenesStoreCreateDocument,
    "\n  mutation ScenesStoreUpdate($id: ID!, $input: UpdateSceneInput!) {\n    updateScene(id: $id, input: $input) {\n      ...SceneFields\n    }\n  }\n": typeof types.ScenesStoreUpdateDocument,
    "\n  mutation ScenesStoreDelete($id: ID!) {\n    deleteScene(id: $id)\n  }\n": typeof types.ScenesStoreDeleteDocument,
    "\n  mutation ScenesStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteScenes(ids: $ids)\n  }\n": typeof types.ScenesStoreBatchDeleteDocument,
    "\n  mutation ScenesStoreApply($sceneId: ID!) {\n    applyScene(sceneId: $sceneId) {\n      ...SceneFields\n    }\n  }\n": typeof types.ScenesStoreApplyDocument,
    "\n  mutation ScenesStoreStop($sceneId: ID!) {\n    deactivateScene(sceneId: $sceneId) {\n      ...SceneFields\n    }\n  }\n": typeof types.ScenesStoreStopDocument,
    "\n  subscription ScenesStoreActiveChanged {\n    sceneActiveChanged {\n      sceneId\n      activatedAt\n    }\n  }\n": typeof types.ScenesStoreActiveChangedDocument,
    "\n  query VibeCatalog {\n    vibePresets {\n      id\n      title\n      category\n      domain\n      seed\n      brightness\n      movement\n      cycleSeconds\n      preview {\n        width\n        height\n        pixels {\n          r\n          g\n          b\n        }\n        swatches {\n          x\n          y\n          color {\n            r\n            g\n            b\n          }\n        }\n      }\n    }\n  }\n": typeof types.VibeCatalogDocument,
    "\n  fragment WebhookEndpointFields on WebhookEndpoint {\n    id\n    name\n    enabled\n    rateLimitCount\n    rateLimitWindowMs\n    createdAt\n    updatedAt\n    lastDeliveryAt\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n": typeof types.WebhookEndpointFieldsFragmentDoc,
    "\n  query WebhookEndpointsStore {\n    webhookEndpoints {\n      ...WebhookEndpointFields\n    }\n  }\n": typeof types.WebhookEndpointsStoreDocument,
    "\n  mutation WebhookEndpointsStoreCreate($input: CreateWebhookEndpointInput!) {\n    createWebhookEndpoint(input: $input) {\n      endpoint {\n        ...WebhookEndpointFields\n      }\n      secretPath\n    }\n  }\n": typeof types.WebhookEndpointsStoreCreateDocument,
    "\n  mutation WebhookEndpointsStoreUpdate($id: ID!, $input: UpdateWebhookEndpointInput!) {\n    updateWebhookEndpoint(id: $id, input: $input) {\n      ...WebhookEndpointFields\n    }\n  }\n": typeof types.WebhookEndpointsStoreUpdateDocument,
    "\n  mutation WebhookEndpointsStoreRotate($id: ID!) {\n    rotateWebhookEndpointSecret(id: $id) {\n      endpoint {\n        ...WebhookEndpointFields\n      }\n      secretPath\n    }\n  }\n": typeof types.WebhookEndpointsStoreRotateDocument,
    "\n  mutation WebhookEndpointsStoreDelete($id: ID!) {\n    deleteWebhookEndpoint(id: $id)\n  }\n": typeof types.WebhookEndpointsStoreDeleteDocument,
    "\n  mutation WebhookEndpointsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteWebhookEndpoints(ids: $ids)\n  }\n": typeof types.WebhookEndpointsStoreBatchDeleteDocument,
    "\n  subscription WebhookEndpointsStoreDeliveryRecorded {\n    webhookDeliveryRecorded {\n      id\n      endpointId\n      receivedAt\n    }\n  }\n": typeof types.WebhookEndpointsStoreDeliveryRecordedDocument,
    "\n\t\tquery Activity($filter: ActivityFilter) {\n\t\t\tactivity(filter: $filter) {\n\t\t\t\tid\n\t\t\t\ttype\n\t\t\t\ttimestamp\n\t\t\t\tmessage\n\t\t\t\tpayload\n\t\t\t\tsource {\n\t\t\t\t\tkind\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\troomId\n\t\t\t\t\troomName\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.ActivityDocument,
    "\n\t\tsubscription ActivityStream($advanced: Boolean) {\n\t\t\tactivityStream(advanced: $advanced) {\n\t\t\t\tid\n\t\t\t\ttype\n\t\t\t\ttimestamp\n\t\t\t\tmessage\n\t\t\t\tpayload\n\t\t\t\tsource {\n\t\t\t\t\tkind\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\troomId\n\t\t\t\t\troomName\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.ActivityStreamDocument,
    "\n\t\tmutation AutomationEditUpdate($id: ID!, $input: UpdateAutomationInput!) {\n\t\t\tupdateAutomation(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tcompilable\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t\tpositionX\n\t\t\t\t\tpositionY\n\t\t\t\t\truntimeState\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationEditUpdateDocument,
    "\n\t\tmutation AutomationEditFireTrigger($automationId: ID!, $nodeId: ID!) {\n\t\t\tfireAutomationTrigger(automationId: $automationId, nodeId: $nodeId)\n\t\t}\n\t": typeof types.AutomationEditFireTriggerDocument,
    "\n\t\tquery AutomationEditEffects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationEditEffectsDocument,
    "\n\t\tquery AutomationEditGroupReference($id: ID!) {\n\t\t\tgroup(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tfriendlyName\n\t\t\t\tsource\n\t\t\t\tremoved\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationEditGroupReferenceDocument,
    "\n\t\tsubscription AutomationEditNodeActivated($automationId: ID) {\n\t\t\tautomationNodeActivated(automationId: $automationId) {\n\t\t\t\tautomationId\n\t\t\t\tnodeId\n\t\t\t\tactive\n\t\t\t}\n\t\t}\n\t": typeof types.AutomationEditNodeActivatedDocument,
    "\n\t\tmutation completeFirstPasswordChange($newPassword: String!) {\n\t\t\tcompleteFirstPasswordChange(newPassword: $newPassword)\n\t\t}\n\t": typeof types.CompleteFirstPasswordChangeDocument,
    "\n\t\tmutation SetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t": typeof types.SetDeviceStateDocument,
    "\n\t\tmutation DeviceDetailSetConfiguration(\n\t\t\t$deviceId: ID!\n\t\t\t$settings: [DeviceConfigurationEntryInput!]!\n\t\t) {\n\t\t\tsetDeviceConfiguration(deviceId: $deviceId, settings: $settings)\n\t\t}\n\t": typeof types.DeviceDetailSetConfigurationDocument,
    "\n\t\tmutation DeviceDetailUpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n\t\t\tupdateDevice(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\troles {\n\t\t\t\t\tcontrolledLoad\n\t\t\t\t\tcontact\n\t\t\t\t}\n\t\t\t\tdisabled\n\t\t\t\tfriendlyName\n\t\t\t\tseen\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceDetailUpdateDeviceDocument,
    "\n\t\tmutation DeviceDetailDeleteDevice($id: ID!) {\n\t\t\tdeleteDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceDetailDeleteDeviceDocument,
    "\n\t\tmutation DeviceDetailRestoreDevice($id: ID!) {\n\t\t\trestoreDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceDetailRestoreDeviceDocument,
    "\n\t\tquery DeviceZigbeeDetail($id: ID!) {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tfrontendUrl\n\t\t\t}\n\t\t\tdevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tsource\n\t\t\t\tzigbee2Mqtt {\n\t\t\t\t\timageCandidate\n\t\t\t\t\timageVersion\n\t\t\t\t\tnetworkType\n\t\t\t\t\tieeeAddress\n\t\t\t\t\taddressVendor\n\t\t\t\t\tnetworkAddress\n\t\t\t\t\tsupported\n\t\t\t\t\tinterviewState\n\t\t\t\t\tinterviewCompleted\n\t\t\t\t\tinterviewing\n\t\t\t\t\tdescription\n\t\t\t\t\tmanufacturer\n\t\t\t\t\tmodelId\n\t\t\t\t\tpowerSource\n\t\t\t\t\tsoftwareBuildId\n\t\t\t\t\tdateCode\n\t\t\t\t\tdefinitionUrl\n\t\t\t\t\tdefinition {\n\t\t\t\t\t\tmodel\n\t\t\t\t\t\tvendor\n\t\t\t\t\t\tdescription\n\t\t\t\t\t\tsource\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tsupportsOta\n\t\t\t\t\t}\n\t\t\t\t\tota {\n\t\t\t\t\t\tstate\n\t\t\t\t\t\tinstalledVersion\n\t\t\t\t\t\tlatestVersion\n\t\t\t\t\t\tprogress\n\t\t\t\t\t}\n\t\t\t\t\tendpoints {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tprofileId\n\t\t\t\t\t\tdeviceId\n\t\t\t\t\t\tinputClusters\n\t\t\t\t\t\toutputClusters\n\t\t\t\t\t\tbindings {\n\t\t\t\t\t\t\tcluster\n\t\t\t\t\t\t\ttargetType\n\t\t\t\t\t\t\ttargetIeeeAddress\n\t\t\t\t\t\t\ttargetEndpoint\n\t\t\t\t\t\t\ttargetGroupId\n\t\t\t\t\t\t}\n\t\t\t\t\t\treportings {\n\t\t\t\t\t\t\tcluster\n\t\t\t\t\t\t\tattribute\n\t\t\t\t\t\t\tminimumReportInterval\n\t\t\t\t\t\t\tmaximumReportInterval\n\t\t\t\t\t\t\treportableChange\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tgroups {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tproviderGroupId\n\t\t\t\t\t\tname\n\t\t\t\t\t\tendpoint\n\t\t\t\t\t}\n\t\t\t\t\tbridgeInfo {\n\t\t\t\t\t\tadapterType\n\t\t\t\t\t\tfirmwareVersion\n\t\t\t\t\t\tchannel\n\t\t\t\t\t\tpanId\n\t\t\t\t\t\textendedPanId\n\t\t\t\t\t\tzigbee2MqttVersion\n\t\t\t\t\t\tzigbee2MqttCommit\n\t\t\t\t\t\tzigbeeHerdsmanVersion\n\t\t\t\t\t\tzigbeeHerdsmanConvertersVersion\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceZigbeeDetailDocument,
    "\n\t\tquery DeviceZigbeeDocumentation($id: ID!) {\n\t\t\tdevice(id: $id) {\n\t\t\t\tzigbee2Mqtt {\n\t\t\t\t\tdocumentation {\n\t\t\t\t\t\tsourceUrl\n\t\t\t\t\t\tlastCheckedAt\n\t\t\t\t\t\tmodel\n\t\t\t\t\t\tvendor\n\t\t\t\t\t\tdescription\n\t\t\t\t\t\texposes\n\t\t\t\t\t\tbatteryType\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.DeviceZigbeeDocumentationDocument,
    "\n\t\tmutation EffectEditUpdate($input: UpdateEffectInput!) {\n\t\t\tupdateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tindex\n\t\t\t\t\tname\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tstartMs\n\t\t\t\t\t\ttransitionMinMs\n\t\t\t\t\t\ttransitionMaxMs\n\t\t\t\t\t\tkind\n\t\t\t\t\t\tconfig\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.EffectEditUpdateDocument,
    "\n\t\tquery IntegrationsPage {\n\t\t\tintegrations {\n\t\t\t\tprovider\n\t\t\t\tname\n\t\t\t\tconfigured\n\t\t\t\tenabled\n\t\t\t\tconnected\n\t\t\t\tdeviceCount\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t": typeof types.IntegrationsPageDocument,
    "\n\t\tmutation DeleteIntegration($provider: String!) {\n\t\t\tdeleteIntegration(provider: $provider)\n\t\t}\n\t": typeof types.DeleteIntegrationDocument,
    "\n\t\tquery TuyaConfigPage {\n\t\t\ttuyaConfig {\n\t\t\t\taccessId\n\t\t\t\taccessSecret\n\t\t\t\tregion\n\t\t\t\tenabled\n\t\t\t}\n\t\t}\n\t": typeof types.TuyaConfigPageDocument,
    "\n\t\tmutation UpdateTuyaConfig($input: TuyaConfigInput!) {\n\t\t\tupdateTuyaConfig(input: $input) {\n\t\t\t\taccessId\n\t\t\t\taccessSecret\n\t\t\t\tregion\n\t\t\t\tenabled\n\t\t\t}\n\t\t}\n\t": typeof types.UpdateTuyaConfigDocument,
    "\n\t\tmutation TestTuyaConnection($input: TuyaConfigInput!) {\n\t\t\ttestTuyaConnection(input: $input) {\n\t\t\t\tsuccess\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t": typeof types.TestTuyaConnectionDocument,
    "\n\t\tmutation SyncTuyaDevices {\n\t\t\tsyncTuyaDevices {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": typeof types.SyncTuyaDevicesDocument,
    "\n\t\tquery Zigbee2MqttConfigPage {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tbroker\n\t\t\t\tfrontendUrl\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t\tenabled\n\t\t\t\tscanScheduleEnabled\n\t\t\t\tscanHour\n\t\t\t\tscanMinute\n\t\t\t\tscanStartedAt\n\t\t\t\tinteractiveCommandsPerSecond\n\t\t\t\tcontinuousCommandsPerSecond\n\t\t\t}\n\t\t}\n\t": typeof types.Zigbee2MqttConfigPageDocument,
    "\n\t\tmutation UpdateZigbee2MqttConfig($input: Zigbee2MqttConfigInput!) {\n\t\t\tupdateZigbee2MqttConfig(input: $input) {\n\t\t\t\tbroker\n\t\t\t\tfrontendUrl\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t\tenabled\n\t\t\t\tscanScheduleEnabled\n\t\t\t\tscanHour\n\t\t\t\tscanMinute\n\t\t\t\tscanStartedAt\n\t\t\t\tinteractiveCommandsPerSecond\n\t\t\t\tcontinuousCommandsPerSecond\n\t\t\t}\n\t\t}\n\t": typeof types.UpdateZigbee2MqttConfigDocument,
    "\n\t\tmutation TestZigbee2MqttConnection($input: Zigbee2MqttConfigInput!) {\n\t\t\ttestZigbee2MqttConnection(input: $input) {\n\t\t\t\tsuccess\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t": typeof types.TestZigbee2MqttConnectionDocument,
    "\n\t\tmutation ScanZigbee2MqttNetwork {\n\t\t\tscanZigbee2MqttNetwork\n\t\t}\n\t": typeof types.ScanZigbee2MqttNetworkDocument,
    "\n\t\tquery Zigbee2MqttScanState {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tscanStartedAt\n\t\t\t}\n\t\t\tnetworkTopologies {\n\t\t\t\tprovider\n\t\t\t\tscannedAt\n\t\t\t}\n\t\t}\n\t": typeof types.Zigbee2MqttScanStateDocument,
    "\n\t\tsubscription Zigbee2MqttScanUpdates($provider: String) {\n\t\t\tnetworkTopologyUpdated(provider: $provider) {\n\t\t\t\tprovider\n\t\t\t\tscannedAt\n\t\t\t\tnodeCount\n\t\t\t\tlinkCount\n\t\t\t}\n\t\t}\n\t": typeof types.Zigbee2MqttScanUpdatesDocument,
    "\n\t\tmutation login($input: LoginInput!) {\n\t\t\tlogin(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t\tavatarPath\n\t\t\t\t\ttheme\n\t\t\t\t\ttimeFormat\n\t\t\t\t\ttemperatureUnit\n\t\t\t\t\thapticsEnabled\n\t\t\t\t\tcreatedAt\n\t\t\t\t\tmustChangePassword\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.LoginDocument,
    "\n\t\tquery Logs($limit: Int) {\n\t\t\tlogs(limit: $limit) {\n\t\t\t\ttimestamp\n\t\t\t\tlevel\n\t\t\t\tmessage\n\t\t\t\tattrs\n\t\t\t}\n\t\t}\n\t": typeof types.LogsDocument,
    "\n\t\tsubscription LogStream {\n\t\t\tlogStream {\n\t\t\t\ttimestamp\n\t\t\t\tlevel\n\t\t\t\tmessage\n\t\t\t\tattrs\n\t\t\t}\n\t\t}\n\t": typeof types.LogStreamDocument,
    "\n\t\tmutation ProfileUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n\t\t\tupdateCurrentUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t\ttheme\n\t\t\t\ttimeFormat\n\t\t\t\ttemperatureUnit\n\t\t\t\thapticsEnabled\n\t\t\t\tcreatedAt\n\t\t\t\tmustChangePassword\n\t\t\t}\n\t\t}\n\t": typeof types.ProfileUpdateCurrentUserDocument,
    "\n\t\tmutation ProfileChangePassword($input: ChangePasswordInput!) {\n\t\t\tchangePassword(input: $input)\n\t\t}\n\t": typeof types.ProfileChangePasswordDocument,
    "\n\t\tmutation ProfileForceLogoutAll {\n\t\t\tforceLogoutAllSessions\n\t\t}\n\t": typeof types.ProfileForceLogoutAllDocument,
    "\n\t\tquery SceneEditorEffects {\n\t\t\teffects { id name icon kind nativeName loop requiredCapabilities }\n\t\t}\n\t": typeof types.SceneEditorEffectsDocument,
    "\n\t\tquery Settings {\n\t\t\tsettings {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t": typeof types.SettingsDocument,
    "\n\t\tmutation UpdateSetting($key: String!, $value: String!) {\n\t\t\tupdateSetting(key: $key, value: $value) {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t": typeof types.UpdateSettingDocument,
    "\n\t\tmutation createInitialUser($input: CreateInitialUserInput!) {\n\t\t\tcreateInitialUser(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": typeof types.CreateInitialUserDocument,
    "\n\t\tquery UsersList {\n\t\t\tusers {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t}\n\t\t}\n\t": typeof types.UsersListDocument,
    "\n\t\tmutation UsersCreate($input: CreateUserInput!) {\n\t\t\tcreateUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t}\n\t\t}\n\t": typeof types.UsersCreateDocument,
    "\n\t\tmutation UsersDelete($id: ID!) {\n\t\t\tdeleteUser(id: $id)\n\t\t}\n\t": typeof types.UsersDeleteDocument,
    "\n\t\tmutation UsersBatchDelete($ids: [ID!]!) {\n\t\t\tbatchDeleteUsers(ids: $ids)\n\t\t}\n\t": typeof types.UsersBatchDeleteDocument,
    "\n\t\tmutation UsersResetPassword($id: ID!, $newPassword: String!) {\n\t\t\tresetUserPassword(id: $id, newPassword: $newPassword)\n\t\t}\n\t": typeof types.UsersResetPasswordDocument,
    "\n\t\tquery WebhookDetailDeliveries($endpointId: ID!, $limit: Int) {\n\t\t\twebhookDeliveries(endpointId: $endpointId, limit: $limit) {\n\t\t\t\tid\n\t\t\t\tendpointId\n\t\t\t\treceivedAt\n\t\t\t\toutcome\n\t\t\t\thttpStatus\n\t\t\t\tclientIp\n\t\t\t\tuserAgent\n\t\t\t\tcontentType\n\t\t\t\tbodySize\n\t\t\t\tbody\n\t\t\t\tdurationMs\n\t\t\t\trequestId\n\t\t\t\tqueryKeys\n\t\t\t\theaderNames\n\t\t\t}\n\t\t}\n\t": typeof types.WebhookDetailDeliveriesDocument,
    "\n\t\tsubscription WebhookDetailDeliveryRecorded($endpointId: ID) {\n\t\t\twebhookDeliveryRecorded(endpointId: $endpointId) {\n\t\t\t\tid\n\t\t\t\tendpointId\n\t\t\t\treceivedAt\n\t\t\t\toutcome\n\t\t\t\thttpStatus\n\t\t\t\tclientIp\n\t\t\t\tuserAgent\n\t\t\t\tcontentType\n\t\t\t\tbodySize\n\t\t\t\tbody\n\t\t\t\tdurationMs\n\t\t\t\trequestId\n\t\t\t\tqueryKeys\n\t\t\t\theaderNames\n\t\t\t}\n\t\t}\n\t": typeof types.WebhookDetailDeliveryRecordedDocument,
};
const documents: Documents = {
    "\n  query E2EAutomationsDevices {\n    devices {\n      id\n      name\n      friendlyName\n      type\n    }\n  }\n": types.E2EAutomationsDevicesDocument,
    "\n  mutation E2ECreateAutomation($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": types.E2ECreateAutomationDocument,
    "\n  query E2EAutomation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": types.E2EAutomationDocument,
    "\n  query E2EAutomations {\n    automations {\n      id\n      name\n      enabled\n    }\n  }\n": types.E2EAutomationsDocument,
    "\n  mutation E2EUpdateAutomation($id: ID!, $input: UpdateAutomationInput!) {\n    updateAutomation(id: $id, input: $input) {\n      id\n      name\n      enabled\n      nodes {\n        id\n        type\n        config\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": types.E2EUpdateAutomationDocument,
    "\n  mutation E2EToggleAutomation($id: ID!, $enabled: Boolean!) {\n    toggleAutomation(id: $id, enabled: $enabled) {\n      id\n      enabled\n    }\n  }\n": types.E2EToggleAutomationDocument,
    "\n  mutation E2EDeleteAutomation($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n": types.E2EDeleteAutomationDocument,
    "\n  mutation E2EAutomationsCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n    }\n  }\n": types.E2EAutomationsCreateGroupDocument,
    "\n  mutation E2EAutomationsAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": types.E2EAutomationsAddGroupMemberDocument,
    "\n  mutation E2EAutomationsDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": types.E2EAutomationsDeleteGroupDocument,
    "\n  query E2EDevicesList {\n    devices {\n      id\n      name\n      friendlyName\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": types.E2EDevicesListDocument,
    "\n  query E2EDevice($id: ID!) {\n    device(id: $id) {\n      id\n      name\n      friendlyName\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": types.E2EDeviceDocument,
    "\n  query E2EZigbeeDeviceMetadata($id: ID!) {\n    device(id: $id) {\n      zigbee2Mqtt {\n        imageCandidate\n        imageVersion\n        ieeeAddress\n        networkAddress\n        supported\n        softwareBuildId\n        definitionUrl\n        definition {\n          model\n          vendor\n          description\n          supportsOta\n        }\n        ota {\n          state\n          installedVersion\n          latestVersion\n          progress\n        }\n        endpoints {\n          id\n          profileId\n          deviceId\n          inputClusters\n          outputClusters\n          bindings {\n            cluster\n            targetType\n            targetIeeeAddress\n            targetEndpoint\n            targetGroupId\n          }\n          reportings {\n            cluster\n            attribute\n            minimumReportInterval\n            maximumReportInterval\n            reportableChange\n          }\n        }\n        groups {\n          id\n          providerGroupId\n          name\n          endpoint\n        }\n        bridgeInfo {\n          adapterType\n          firmwareVersion\n          channel\n          panId\n          extendedPanId\n          zigbee2MqttVersion\n          zigbee2MqttCommit\n          zigbeeHerdsmanVersion\n          zigbeeHerdsmanConvertersVersion\n        }\n      }\n    }\n  }\n": types.E2EZigbeeDeviceMetadataDocument,
    "\n  mutation E2ESetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n    setTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n  }\n": types.E2ESetDeviceStateDocument,
    "\n  mutation E2EUpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n    updateDevice(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n": types.E2EUpdateDeviceDocument,
    "\n  subscription E2EDevicesDeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n      }\n    }\n  }\n": types.E2EDevicesDeviceStateChangedDocument,
    "\n  query E2EErrorsScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n    }\n  }\n": types.E2EErrorsSceneDocument,
    "\n  query E2EErrorsAutomation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n    }\n  }\n": types.E2EErrorsAutomationDocument,
    "\n  mutation E2EErrorsAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": types.E2EErrorsAddGroupMemberDocument,
    "\n  mutation E2EErrorsDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n": types.E2EErrorsDeleteSceneDocument,
    "\n  mutation E2EErrorsCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n    }\n  }\n": types.E2EErrorsCreateGroupDocument,
    "\n  mutation E2EErrorsDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": types.E2EErrorsDeleteGroupDocument,
    "\n  mutation E2ECreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n": types.E2ECreateGroupDocument,
    "\n  mutation E2EAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n      members {\n        id\n        memberType\n        memberId\n        device {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.E2EAddGroupMemberDocument,
    "\n  query E2EGroup($id: ID!) {\n    group(id: $id) {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n": types.E2EGroupDocument,
    "\n  mutation E2EDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": types.E2EDeleteGroupDocument,
    "\n  query E2EGroups {\n    groups {\n      id\n      name\n      members {\n        id\n        memberType\n        memberId\n      }\n      resolvedDevices {\n        id\n        name\n      }\n    }\n  }\n": types.E2EGroupsDocument,
    "\n  mutation E2EUpdateGroup($id: ID!, $input: UpdateGroupInput!) {\n    updateGroup(id: $id, input: $input) {\n      id\n      name\n    }\n  }\n": types.E2EUpdateGroupDocument,
    "\n  mutation E2ERemoveGroupMember($id: ID!) {\n    removeGroupMember(id: $id) {\n      id\n      members {\n        id\n      }\n    }\n  }\n": types.E2ERemoveGroupMemberDocument,
    "\n  query E2EGroupsDevices {\n    devices {\n      id\n      name\n    }\n  }\n": types.E2EGroupsDevicesDocument,
    "\n  query BrowserSceneFixtures {\n    devices {\n      id\n      friendlyName\n      type\n    }\n    vibePresets {\n      id\n      title\n    }\n  }\n": types.BrowserSceneFixturesDocument,
    "\n  mutation BrowserSceneCreateStructure($room: CreateRoomInput!, $group: CreateGroupInput!) {\n    room: createRoom(input: $room) {\n      id\n    }\n    group: createGroup(input: $group) {\n      id\n    }\n  }\n": types.BrowserSceneCreateStructureDocument,
    "\n  mutation BrowserSceneAddRoomMember($input: AddRoomMemberInput!) {\n    addRoomMember(input: $input) {\n      id\n    }\n  }\n": types.BrowserSceneAddRoomMemberDocument,
    "\n  mutation BrowserSceneAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": types.BrowserSceneAddGroupMemberDocument,
    "\n  mutation BrowserSceneDeleteFixtures($roomId: ID!, $groupId: ID!) {\n    deleteRoom(id: $roomId)\n    deleteGroup(id: $groupId)\n  }\n": types.BrowserSceneDeleteFixturesDocument,
    "\n  mutation BrowserSceneDelete($id: ID!) {\n    deleteScene(id: $id)\n  }\n": types.BrowserSceneDeleteDocument,
    "\n  query E2EScenesDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n": types.E2EScenesDevicesDocument,
    "\n  mutation E2ECreateScene($input: CreateSceneInput!) {\n    createScene(input: $input) {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n": types.E2ECreateSceneDocument,
    "\n  mutation E2EApplyScene($sceneId: ID!) {\n    applyScene(sceneId: $sceneId) {\n      id\n      name\n    }\n  }\n": types.E2EApplySceneDocument,
    "\n  query E2EScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n": types.E2ESceneDocument,
    "\n  mutation E2EDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n": types.E2EDeleteSceneDocument,
    "\n  query E2EScenes {\n    scenes {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n": types.E2EScenesDocument,
    "\n  mutation E2EUpdateScene($id: ID!, $input: UpdateSceneInput!) {\n    updateScene(id: $id, input: $input) {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n": types.E2EUpdateSceneDocument,
    "\n  mutation E2EScenesCreateGroup($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      id\n      name\n    }\n  }\n": types.E2EScenesCreateGroupDocument,
    "\n  mutation E2EScenesAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n": types.E2EScenesAddGroupMemberDocument,
    "\n  mutation E2EScenesDeleteGroup($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": types.E2EScenesDeleteGroupDocument,
    "\n  mutation BrowserSearchCreateFixtures(\n    $room: CreateRoomInput!\n    $group: CreateGroupInput!\n    $scene: CreateSceneInput!\n    $automation: CreateAutomationInput!\n    $effect: CreateEffectInput!\n    $alarm: RaiseAlarmInput!\n  ) {\n    room: createRoom(input: $room) {\n      id\n    }\n    group: createGroup(input: $group) {\n      id\n    }\n    scene: createScene(input: $scene) {\n      id\n    }\n    automation: createAutomation(input: $automation) {\n      id\n    }\n    effect: createEffect(input: $effect) {\n      id\n    }\n    alarm: raiseAlarm(input: $alarm) {\n      id\n    }\n  }\n": types.BrowserSearchCreateFixturesDocument,
    "\n  mutation BrowserSearchDeleteFixtures(\n    $roomId: ID!\n    $groupId: ID!\n    $sceneId: ID!\n    $automationId: ID!\n    $effectId: ID!\n    $alarmId: ID!\n  ) {\n    deleteRoom(id: $roomId)\n    deleteGroup(id: $groupId)\n    deleteScene(id: $sceneId)\n    deleteAutomation(id: $automationId)\n    deleteEffect(id: $effectId)\n    deleteAlarm(alarmId: $alarmId)\n  }\n": types.BrowserSearchDeleteFixturesDocument,
    "\n  query BrowserSearchMaintenanceTasks {\n    maintenanceTasks {\n      kind\n    }\n  }\n": types.BrowserSearchMaintenanceTasksDocument,
    "\n  query BrowserSearchDevices {\n    devices {\n      id\n      friendlyName\n    }\n  }\n": types.BrowserSearchDevicesDocument,
    "\n  mutation BrowserSearchCleanUpDeletedDevice($id: ID!, $input: UpdateDeviceInput!) {\n    restoreDevice(id: $id) {\n      id\n    }\n    updateDevice(id: $id, input: $input) {\n      id\n    }\n  }\n": types.BrowserSearchCleanUpDeletedDeviceDocument,
    "\n  query E2EDevices {\n    devices {\n      id\n      name\n      friendlyName\n      source\n      type\n      available\n    }\n  }\n": types.E2EDevicesDocument,
    "\n  query E2EStateHistoryDevices {\n    devices {\n      id\n      name\n      friendlyName\n      type\n    }\n  }\n": types.E2EStateHistoryDevicesDocument,
    "\n  query E2EStateHistory($filter: StateHistoryFilter!) {\n    stateHistory(filter: $filter) {\n      deviceId\n      field\n      valueType\n      points {\n        at\n        numberValue\n        booleanValue\n        textValue\n      }\n    }\n  }\n": types.E2EStateHistoryDocument,
    "\n  subscription E2EDeviceStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": types.E2EDeviceStateChangedDocument,
    "\n  subscription E2EDeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n": types.E2EDeviceAvailabilityChangedDocument,
    "\n  subscription E2EDeviceAdded {\n    deviceAdded {\n      id\n      friendlyName\n      type\n      source\n    }\n  }\n": types.E2EDeviceAddedDocument,
    "\n  subscription E2EDeviceRemoved {\n    deviceRemoved\n  }\n": types.E2EDeviceRemovedDocument,
    "\n  subscription E2EAutomationNodeActivated($automationId: ID) {\n    automationNodeActivated(automationId: $automationId) {\n      automationId\n      nodeId\n      active\n    }\n  }\n": types.E2EAutomationNodeActivatedDocument,
    "\n  subscription E2EDeviceStateChangedFiltered($deviceId: ID) {\n    deviceStateChanged(deviceId: $deviceId) {\n      deviceId\n      state {\n        on\n        brightness\n        temperature\n        humidity\n      }\n    }\n  }\n": types.E2EDeviceStateChangedFilteredDocument,
    "\n  query E2ESubscriptionsDevices {\n    devices {\n      id\n      name\n      friendlyName\n      type\n    }\n  }\n": types.E2ESubscriptionsDevicesDocument,
    "\n  mutation E2ESubscriptionsCreateAutomation($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      id\n      name\n      nodes {\n        id\n        type\n      }\n    }\n  }\n": types.E2ESubscriptionsCreateAutomationDocument,
    "\n  mutation E2ESubscriptionsDeleteAutomation($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n": types.E2ESubscriptionsDeleteAutomationDocument,
    "\n  mutation E2ECreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n      username\n      name\n      avatarPath\n      theme\n      hapticsEnabled\n    }\n  }\n": types.E2ECreateUserDocument,
    "\n  mutation E2EUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n    updateCurrentUser(input: $input) {\n      id\n      name\n      theme\n      hapticsEnabled\n    }\n  }\n": types.E2EUpdateCurrentUserDocument,
    "\n  mutation E2EDeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n": types.E2EDeleteUserDocument,
    "\n  mutation E2EResetPassword($id: ID!, $p: String!) {\n    resetUserPassword(id: $id, newPassword: $p)\n  }\n": types.E2EResetPasswordDocument,
    "\n  query E2EMe {\n    me {\n      id\n      username\n      name\n      theme\n      hapticsEnabled\n      avatarPath\n    }\n  }\n": types.E2EMeDocument,
    "\n  query E2EWebSocketRecoveryDeviceState($id: ID!) {\n    device(id: $id) {\n      state {\n        brightness\n      }\n    }\n  }\n": types.E2EWebSocketRecoveryDeviceStateDocument,
    "\n  query E2EWebSocketRecoveryLogs {\n    logs(limit: 1000) {\n      message\n      attrs\n    }\n  }\n": types.E2EWebSocketRecoveryLogsDocument,
    "\n  query E2EZigbeeMetadataReady($id: ID!) {\n    device(id: $id) {\n      zigbee2Mqtt {\n        ieeeAddress\n      }\n    }\n  }\n": types.E2EZigbeeMetadataReadyDocument,
    "\n  query E2EMaintenanceTasks {\n    maintenanceTasks {\n      id\n      kind\n    }\n  }\n": types.E2EMaintenanceTasksDocument,
    "\n\t\tmutation DeleteAlarm($alarmId: ID!) {\n\t\t\tdeleteAlarm(alarmId: $alarmId)\n\t\t}\n\t": types.DeleteAlarmDocument,
    "\n\t\tmutation BatchDeleteAlarms($alarmIds: [ID!]!) {\n\t\t\tbatchDeleteAlarms(alarmIds: $alarmIds)\n\t\t}\n\t": types.BatchDeleteAlarmsDocument,
    "\n\t\tmutation DashboardApplianceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t": types.DashboardApplianceCardSetDeviceStateDocument,
    "\n\t\tmutation DashboardLightCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t": types.DashboardLightCardSetDeviceStateDocument,
    "\n\t\tquery DashboardIntegrations {\n\t\t\tintegrations {\n\t\t\t\tprovider\n\t\t\t\tconfigured\n\t\t\t}\n\t\t}\n\t": types.DashboardIntegrationsDocument,
    "\n\t\tmutation DeviceActionMenuSimulate($deviceId: ID!, $action: String!) {\n\t\t\tsimulateDeviceAction(deviceId: $deviceId, action: $action)\n\t\t}\n\t": types.DeviceActionMenuSimulateDocument,
    "\n\t\tmutation DeviceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t": types.DeviceCardSetDeviceStateDocument,
    "\n\t\tmutation DeviceTableSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t": types.DeviceTableSetDeviceStateDocument,
    "\n\t\tmutation UpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n\t\t\tupdateDevice(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\troles {\n\t\t\t\t\tcontrolledLoad\n\t\t\t\t\tcontact\n\t\t\t\t}\n\t\t\t\tdisabled\n\t\t\t\tfriendlyName\n\t\t\t\tseen\n\t\t\t}\n\t\t}\n\t": types.UpdateDeviceDocument,
    "\n\t\tmutation MarkDevicesSeen($ids: [ID!]!) {\n\t\t\tmarkDevicesSeen(ids: $ids)\n\t\t}\n\t": types.MarkDevicesSeenDocument,
    "\n\t\tmutation DevicesPageDeleteDevice($id: ID!) {\n\t\t\tdeleteDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t": types.DevicesPageDeleteDeviceDocument,
    "\n\t\tmutation DevicesPageRestoreDevice($id: ID!) {\n\t\t\trestoreDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t": types.DevicesPageRestoreDeviceDocument,
    "\n\t\tmutation DevicesPageBatchDeleteDevices($ids: [ID!]!) {\n\t\t\tbatchDeleteDevices(ids: $ids)\n\t\t}\n\t": types.DevicesPageBatchDeleteDevicesDocument,
    "\n\t\tmutation DevicesPageBatchRestoreDevices($ids: [ID!]!) {\n\t\t\tbatchRestoreDevices(ids: $ids)\n\t\t}\n\t": types.DevicesPageBatchRestoreDevicesDocument,
    "\n\t\tquery NativeEffectOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tconfirmedDeviceCount\n\t\t\t\tuntestedDeviceCount\n\t\t\t\tunsupportedDeviceCount\n\t\t\t\tsource\n\t\t\t}\n\t\t}\n\t": types.NativeEffectOptionsDocument,
    "\n\t\tsubscription NativeEffectEditorSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t": types.NativeEffectEditorSupportChangedDocument,
    "\n\t\tmutation EffectRunTargetDrawerRunEffect($effectId: ID!, $targetType: String!, $targetId: ID!) {\n\t\t\trunEffect(effectId: $effectId, targetType: $targetType, targetId: $targetId) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": types.EffectRunTargetDrawerRunEffectDocument,
    "\n\t\tmutation EffectRunTargetDrawerRunNativeEffect($nativeName: String!, $targetType: String!, $targetId: ID!) {\n\t\t\trunNativeEffect(nativeName: $nativeName, targetType: $targetType, targetId: $targetId) {\n\t\t\t\trunId\n\t\t\t\tdevices {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tstatus\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.EffectRunTargetDrawerRunNativeEffectDocument,
    "\n\t\tquery EffectRunTargetDrawerNativeSupport($name: String!) {\n\t\t\tnativeEffectSupport(name: $name) {\n\t\t\t\tdeviceId\n\t\t\t\tstatus\n\t\t\t}\n\t\t}\n\t": types.EffectRunTargetDrawerNativeSupportDocument,
    "\n\t\tsubscription EffectRunTargetDrawerNativeSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t": types.EffectRunTargetDrawerNativeSupportChangedDocument,
    "\n\t\tquery EffectTimelineEditorNativeOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tconfirmedDeviceCount\n\t\t\t\tuntestedDeviceCount\n\t\t\t\tunsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t": types.EffectTimelineEditorNativeOptionsDocument,
    "\n\t\tsubscription EffectTimelineNativeSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t": types.EffectTimelineNativeSupportChangedDocument,
    "\n\t\tquery EffectsPageNativeOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsource\n\t\t\t\tconfirmedDeviceCount\n\t\t\t\tuntestedDeviceCount\n\t\t\t\tunsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t": types.EffectsPageNativeOptionsDocument,
    "\n\t\tsubscription EffectsPageNativeSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t": types.EffectsPageNativeSupportChangedDocument,
    "\n\t\tmutation RoomsPageSetDeviceState($targetId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: ROOM, id: $targetId }, state: $state)\n\t\t}\n\t": types.RoomsPageSetDeviceStateDocument,
    "\n\t\tquery SceneCreateVibePreview($input: PreviewVibeInput!) {\n\t\t\tpreviewVibe(input: $input) {\n\t\t\t\tpreview { width height pixels { r g b } swatches { x y color { r g b } } }\n\t\t\t\tdomain seed brightness movement cycleSeconds minimumLightness maximumLightness\n\t\t\t}\n\t\t}\n\t": types.SceneCreateVibePreviewDocument,
    "\n\t\tquery SceneOutputRate {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tcontinuousCommandsPerSecond\n\t\t\t\tactiveContinuousDeviceIds\n\t\t\t}\n\t\t}\n\t": types.SceneOutputRateDocument,
    "\n\t\tquery StateHistory($filter: StateHistoryFilter!) {\n\t\t\tstateHistory(filter: $filter) {\n\t\t\t\tdeviceId\n\t\t\t\tfield\n\t\t\t\tvalueType\n\t\t\t\tpoints {\n\t\t\t\t\tat\n\t\t\t\t\tnumberValue\n\t\t\t\t\tbooleanValue\n\t\t\t\t\ttextValue\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.StateHistoryDocument,
    "\n\t\tquery AggregatedStateHistory($filter: AggregatedStateHistoryFilter!) {\n\t\t\taggregatedStateHistory(filter: $filter) {\n\t\t\t\tfield\n\t\t\t\tpoints {\n\t\t\t\t\tat\n\t\t\t\t\tvalue\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.AggregatedStateHistoryDocument,
    "\n\t\tquery GuidedVibeChoices($input: GuidedVibeRoundInput!) {\n\t\t\tguidedVibeRound(input: $input) {\n\t\t\t\tround\n\t\t\t\tcanFinish\n\t\t\t\tcomplete\n\t\t\t\toptions {\n\t\t\t\t\tid\n\t\t\t\t\ttitle\n\t\t\t\t\tpreview {\n\t\t\t\t\t\twidth height\n\t\t\t\t\t\tpixels { r g b }\n\t\t\t\t\t\tswatches { x y color { r g b } }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.GuidedVibeChoicesDocument,
    "\n\t\tquery SceneEditorVibePreview($input: PreviewVibeInput!) {\n\t\t\tpreviewVibe(input: $input) {\n\t\t\t\tpreview { width height pixels { r g b } swatches { x y color { r g b } } }\n\t\t\t\tdomain seed brightness movement cycleSeconds\n\t\t\t}\n\t\t}\n\t": types.SceneEditorVibePreviewDocument,
    "\n  query Automation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n      icon\n      enabled\n      compilable\n      nodes {\n        id\n        type\n        config\n        positionX\n        positionY\n        runtimeState\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n": types.AutomationDocument,
    "\n  query EffectEdit($id: ID!) {\n    effect(id: $id) {\n      id\n      name\n      icon\n      kind\n      nativeName\n      loop\n      durationMs\n      requiredCapabilities\n      tracks {\n        id\n        index\n        name\n        clips {\n          id\n          startMs\n          transitionMinMs\n          transitionMaxMs\n          kind\n          config\n        }\n      }\n    }\n  }\n": types.EffectEditDocument,
    "\n  mutation MapPageSetDisplayColor($id: ID!, $input: UpdateDeviceInput!) {\n    updateDevice(id: $id, input: $input) {\n      id\n      displayColor\n      displayBrightness\n    }\n  }\n": types.MapPageSetDisplayColorDocument,
    "\n  query MapNetworkTopologies {\n    networkTopologies {\n      provider\n      scannedAt\n      nodes {\n        id\n        deviceId\n        role\n      }\n      links {\n        source\n        target\n        kind\n        quality\n        stale\n      }\n    }\n  }\n": types.MapNetworkTopologiesDocument,
    "\n  subscription MapPageTopologyUpdated {\n    networkTopologyUpdated {\n      provider\n      scannedAt\n    }\n  }\n": types.MapPageTopologyUpdatedDocument,
    "\n  subscription MapPageDeviceTx {\n    deviceStateChanged {\n      deviceId\n    }\n  }\n": types.MapPageDeviceTxDocument,
    "\n  subscription MapPageActionTx {\n    deviceActionFired {\n      deviceId\n    }\n  }\n": types.MapPageActionTxDocument,
    "\n  query setupStatus {\n    setupStatus {\n      hasInitialUser\n    }\n  }\n": types.SetupStatusDocument,
    "\n  mutation GroupCommandsSetTargetState($target: CommandTargetInput!, $state: DeviceStateInput!) {\n    setTargetState(target: $target, state: $state)\n  }\n": types.GroupCommandsSetTargetStateDocument,
    "\n  query ActiveAlarms {\n    alarms {\n      id\n      latestRowId\n      severity\n      kind\n      message\n      source\n      count\n      firstRaisedAt\n      lastRaisedAt\n    }\n  }\n": types.ActiveAlarmsDocument,
    "\n  subscription AlarmEvents {\n    alarmEvent {\n      kind\n      clearedAlarmId\n      alarm {\n        id\n        latestRowId\n        severity\n        kind\n        message\n        source\n        count\n        firstRaisedAt\n        lastRaisedAt\n      }\n    }\n  }\n": types.AlarmEventsDocument,
    "\n  fragment AutomationFields on AutomationGraph {\n    id\n    name\n    icon\n    enabled\n    lastFiredAt\n    nodes {\n      id\n      type\n      config\n    }\n    edges {\n      fromNodeId\n      toNodeId\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n": types.AutomationFieldsFragmentDoc,
    "\n  query AutomationsStore {\n    automations {\n      ...AutomationFields\n    }\n  }\n": types.AutomationsStoreDocument,
    "\n  mutation AutomationsStoreCreate($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      ...AutomationFields\n    }\n  }\n": types.AutomationsStoreCreateDocument,
    "\n  mutation AutomationsStoreUpdate($id: ID!, $input: UpdateAutomationInput!) {\n    updateAutomation(id: $id, input: $input) {\n      ...AutomationFields\n    }\n  }\n": types.AutomationsStoreUpdateDocument,
    "\n  mutation AutomationsStoreToggle($id: ID!, $enabled: Boolean!) {\n    toggleAutomation(id: $id, enabled: $enabled) {\n      ...AutomationFields\n    }\n  }\n": types.AutomationsStoreToggleDocument,
    "\n  mutation AutomationsStoreDelete($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n": types.AutomationsStoreDeleteDocument,
    "\n  mutation AutomationsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteAutomations(ids: $ids)\n  }\n": types.AutomationsStoreBatchDeleteDocument,
    "\n  query DevicesInit {\n    devices {\n      id\n      name\n      icon\n      displayColor\n      displayBrightness\n      source\n      type\n      roles {\n        controlledLoad\n        contact\n      }\n      capabilities {\n        name\n        type\n        label\n        description\n        category\n        values\n        valueMin\n        valueMax\n        unit\n        reportsValue\n        canSet\n        canGet\n      }\n      available\n      disabled\n      deleted\n      friendlyName\n      seen\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n      configuration {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n": types.DevicesInitDocument,
    "\n  subscription DeviceStoreStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n": types.DeviceStoreStateChangedDocument,
    "\n  subscription DeviceStoreConfigurationChanged {\n    deviceConfigurationChanged {\n      deviceId\n      values {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n": types.DeviceStoreConfigurationChangedDocument,
    "\n  subscription DeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n": types.DeviceAvailabilityChangedDocument,
    "\n  subscription DeviceAdded {\n    deviceAdded {\n      id\n      name\n      friendlyName\n      seen\n      disabled\n      deleted\n      source\n      type\n      roles {\n        controlledLoad\n        contact\n      }\n      capabilities {\n        name\n        type\n        label\n        description\n        category\n        values\n        valueMin\n        valueMax\n        unit\n        reportsValue\n        canSet\n        canGet\n      }\n      available\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n      configuration {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n": types.DeviceAddedDocument,
    "\n  subscription DeviceRemoved {\n    deviceRemoved\n  }\n": types.DeviceRemovedDocument,
    "\n  subscription DeviceStoreUpdated {\n    deviceUpdated {\n      id\n      name\n      icon\n      displayColor\n      displayBrightness\n      source\n      type\n      roles {\n        controlledLoad\n        contact\n      }\n      capabilities {\n        name\n        type\n        label\n        description\n        category\n        values\n        valueMin\n        valueMax\n        unit\n        reportsValue\n        canSet\n        canGet\n      }\n      available\n      disabled\n      deleted\n      friendlyName\n      seen\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n      configuration {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n": types.DeviceStoreUpdatedDocument,
    "\n  fragment EffectFields on Effect {\n    id\n    name\n    source\n    icon\n    kind\n    nativeName\n    loop\n    durationMs\n    requiredCapabilities\n    tracks {\n      id\n      clips {\n        id\n      }\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n": types.EffectFieldsFragmentDoc,
    "\n  query EffectsStore {\n    effects {\n      ...EffectFields\n    }\n  }\n": types.EffectsStoreDocument,
    "\n  mutation EffectsStoreCreate($input: CreateEffectInput!) {\n    createEffect(input: $input) {\n      ...EffectFields\n    }\n  }\n": types.EffectsStoreCreateDocument,
    "\n  mutation EffectsStoreUpdate($input: UpdateEffectInput!) {\n    updateEffect(input: $input) {\n      ...EffectFields\n    }\n  }\n": types.EffectsStoreUpdateDocument,
    "\n  mutation EffectsStoreDelete($id: ID!) {\n    deleteEffect(id: $id)\n  }\n": types.EffectsStoreDeleteDocument,
    "\n  mutation EffectsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteEffects(ids: $ids)\n  }\n": types.EffectsStoreBatchDeleteDocument,
    "\n  fragment FloorplanFields on Floorplan {\n    id\n    name\n    vertices {\n      id\n      x\n      y\n    }\n    walls {\n      id\n      vertexA\n      vertexB\n      thickness\n      curveX\n      curveY\n    }\n    openings {\n      id\n      wallId\n      t\n      width\n      kind\n    }\n    doorBindings {\n      openingId\n      deviceId\n      hingeSide\n      swingSide\n    }\n    rooms {\n      id\n      name\n      roomId\n      vertexIds\n    }\n    placements {\n      memberType\n      memberId\n      x\n      y\n    }\n    furniture {\n      id\n      kind\n      x\n      y\n      width\n      height\n      rotation\n      occluder\n    }\n  }\n": types.FloorplanFieldsFragmentDoc,
    "\n  query FloorplanStore {\n    floorplan {\n      ...FloorplanFields\n    }\n  }\n": types.FloorplanStoreDocument,
    "\n  mutation FloorplanStoreUpdate($input: UpdateFloorplanInput!) {\n    updateFloorplan(input: $input) {\n      ...FloorplanFields\n    }\n  }\n": types.FloorplanStoreUpdateDocument,
    "\n  fragment GroupFields on Group {\n    id\n    name\n    friendlyName\n    source\n    removed\n    icon\n    tags\n    members {\n      id\n      memberType\n      memberId\n    }\n    resolvedDevices {\n      id\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n": types.GroupFieldsFragmentDoc,
    "\n  query GroupsStore {\n    groups {\n      ...GroupFields\n    }\n  }\n": types.GroupsStoreDocument,
    "\n  subscription GroupsStoreChanged {\n    groupsChanged\n  }\n": types.GroupsStoreChangedDocument,
    "\n  mutation GroupsStoreCreate($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      ...GroupFields\n    }\n  }\n": types.GroupsStoreCreateDocument,
    "\n  mutation GroupsStoreUpdate($id: ID!, $input: UpdateGroupInput!) {\n    updateGroup(id: $id, input: $input) {\n      ...GroupFields\n    }\n  }\n": types.GroupsStoreUpdateDocument,
    "\n  mutation GroupsStoreDelete($id: ID!) {\n    deleteGroup(id: $id)\n  }\n": types.GroupsStoreDeleteDocument,
    "\n  mutation GroupsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteGroups(ids: $ids)\n  }\n": types.GroupsStoreBatchDeleteDocument,
    "\n  mutation GroupsStoreAddMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      ...GroupFields\n    }\n  }\n": types.GroupsStoreAddMemberDocument,
    "\n  mutation GroupsStoreRemoveMember($id: ID!) {\n    removeGroupMember(id: $id) {\n      ...GroupFields\n    }\n  }\n": types.GroupsStoreRemoveMemberDocument,
    "\n  query MaintenanceTasks {\n    maintenanceTasks {\n      id\n      kind\n      title\n      detail\n      action\n      currentValue\n      targetValue\n      actionUrl\n      device {\n        id\n        name\n        friendlyName\n        icon\n        type\n        available\n        disabled\n        deleted\n        roles {\n          contact\n        }\n      }\n    }\n  }\n": types.MaintenanceTasksDocument,
    "\n  mutation CompleteMaintenanceTasks($ids: [ID!]!) {\n    completeMaintenanceTasks(ids: $ids)\n  }\n": types.CompleteMaintenanceTasksDocument,
    "\n  subscription MaintenanceChanged {\n    maintenanceChanged\n  }\n": types.MaintenanceChangedDocument,
    "\n  query Me {\n    me {\n      id\n      username\n      name\n      avatarPath\n      theme\n      timeFormat\n      temperatureUnit\n      hapticsEnabled\n      createdAt\n      mustChangePassword\n    }\n  }\n": types.MeDocument,
    "\n  fragment RoomFields on Room {\n    id\n    name\n    icon\n    members {\n      id\n      memberType\n      memberId\n    }\n    resolvedDevices {\n      id\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n": types.RoomFieldsFragmentDoc,
    "\n  query RoomsStore {\n    rooms {\n      ...RoomFields\n    }\n  }\n": types.RoomsStoreDocument,
    "\n  mutation RoomsStoreCreate($input: CreateRoomInput!) {\n    createRoom(input: $input) {\n      ...RoomFields\n    }\n  }\n": types.RoomsStoreCreateDocument,
    "\n  mutation RoomsStoreUpdate($id: ID!, $input: UpdateRoomInput!) {\n    updateRoom(id: $id, input: $input) {\n      ...RoomFields\n    }\n  }\n": types.RoomsStoreUpdateDocument,
    "\n  mutation RoomsStoreDelete($id: ID!) {\n    deleteRoom(id: $id)\n  }\n": types.RoomsStoreDeleteDocument,
    "\n  mutation RoomsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteRooms(ids: $ids)\n  }\n": types.RoomsStoreBatchDeleteDocument,
    "\n  mutation RoomsStoreAddMember($input: AddRoomMemberInput!) {\n    addRoomMember(input: $input) {\n      ...RoomFields\n    }\n  }\n": types.RoomsStoreAddMemberDocument,
    "\n  mutation RoomsStoreRemoveMember($id: ID!) {\n    removeRoomMember(id: $id) {\n      ...RoomFields\n    }\n  }\n": types.RoomsStoreRemoveMemberDocument,
    "\n  fragment SceneFields on Scene {\n    id\n    name\n    icon\n    rooms {\n      id\n      name\n      icon\n    }\n    targets {\n      targetType\n      targetId\n      name\n      target {\n        ... on Device {\n          id\n          deviceName: name\n          friendlyName\n          type\n        }\n        ... on Group {\n          id\n          groupName: name\n          friendlyName\n          icon\n          removed\n        }\n        ... on Room {\n          id\n          name\n          icon\n        }\n      }\n      expression {\n        connector\n        subject\n        op\n        values\n      }\n    }\n    lighting {\n      dynamicSource {\n        domain\n        sourceKind\n        presetId\n        presetTitle\n        seed\n        brightness\n        movement\n        cycleSeconds\n      }\n      overrides {\n        deviceId\n        kind\n        state {\n          on\n          brightness\n          colorTemp\n          color {\n            r\n            g\n            b\n            x\n            y\n          }\n          transition\n          targetTemperature\n          hvacMode\n          fanMode\n          swing\n        }\n        effectId\n        nativeEffectName\n      }\n    }\n    supportingStates {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n      }\n    }\n    preview {\n      width\n      height\n      pixels {\n        r\n        g\n        b\n      }\n      swatches {\n        x\n        y\n        color {\n          r\n          g\n          b\n        }\n      }\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n    activatedAt\n  }\n": types.SceneFieldsFragmentDoc,
    "\n  query ScenesStore {\n    scenes {\n      ...SceneFields\n    }\n  }\n": types.ScenesStoreDocument,
    "\n  mutation ScenesStoreCreate($input: CreateSceneInput!) {\n    createScene(input: $input) {\n      ...SceneFields\n    }\n  }\n": types.ScenesStoreCreateDocument,
    "\n  mutation ScenesStoreUpdate($id: ID!, $input: UpdateSceneInput!) {\n    updateScene(id: $id, input: $input) {\n      ...SceneFields\n    }\n  }\n": types.ScenesStoreUpdateDocument,
    "\n  mutation ScenesStoreDelete($id: ID!) {\n    deleteScene(id: $id)\n  }\n": types.ScenesStoreDeleteDocument,
    "\n  mutation ScenesStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteScenes(ids: $ids)\n  }\n": types.ScenesStoreBatchDeleteDocument,
    "\n  mutation ScenesStoreApply($sceneId: ID!) {\n    applyScene(sceneId: $sceneId) {\n      ...SceneFields\n    }\n  }\n": types.ScenesStoreApplyDocument,
    "\n  mutation ScenesStoreStop($sceneId: ID!) {\n    deactivateScene(sceneId: $sceneId) {\n      ...SceneFields\n    }\n  }\n": types.ScenesStoreStopDocument,
    "\n  subscription ScenesStoreActiveChanged {\n    sceneActiveChanged {\n      sceneId\n      activatedAt\n    }\n  }\n": types.ScenesStoreActiveChangedDocument,
    "\n  query VibeCatalog {\n    vibePresets {\n      id\n      title\n      category\n      domain\n      seed\n      brightness\n      movement\n      cycleSeconds\n      preview {\n        width\n        height\n        pixels {\n          r\n          g\n          b\n        }\n        swatches {\n          x\n          y\n          color {\n            r\n            g\n            b\n          }\n        }\n      }\n    }\n  }\n": types.VibeCatalogDocument,
    "\n  fragment WebhookEndpointFields on WebhookEndpoint {\n    id\n    name\n    enabled\n    rateLimitCount\n    rateLimitWindowMs\n    createdAt\n    updatedAt\n    lastDeliveryAt\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n": types.WebhookEndpointFieldsFragmentDoc,
    "\n  query WebhookEndpointsStore {\n    webhookEndpoints {\n      ...WebhookEndpointFields\n    }\n  }\n": types.WebhookEndpointsStoreDocument,
    "\n  mutation WebhookEndpointsStoreCreate($input: CreateWebhookEndpointInput!) {\n    createWebhookEndpoint(input: $input) {\n      endpoint {\n        ...WebhookEndpointFields\n      }\n      secretPath\n    }\n  }\n": types.WebhookEndpointsStoreCreateDocument,
    "\n  mutation WebhookEndpointsStoreUpdate($id: ID!, $input: UpdateWebhookEndpointInput!) {\n    updateWebhookEndpoint(id: $id, input: $input) {\n      ...WebhookEndpointFields\n    }\n  }\n": types.WebhookEndpointsStoreUpdateDocument,
    "\n  mutation WebhookEndpointsStoreRotate($id: ID!) {\n    rotateWebhookEndpointSecret(id: $id) {\n      endpoint {\n        ...WebhookEndpointFields\n      }\n      secretPath\n    }\n  }\n": types.WebhookEndpointsStoreRotateDocument,
    "\n  mutation WebhookEndpointsStoreDelete($id: ID!) {\n    deleteWebhookEndpoint(id: $id)\n  }\n": types.WebhookEndpointsStoreDeleteDocument,
    "\n  mutation WebhookEndpointsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteWebhookEndpoints(ids: $ids)\n  }\n": types.WebhookEndpointsStoreBatchDeleteDocument,
    "\n  subscription WebhookEndpointsStoreDeliveryRecorded {\n    webhookDeliveryRecorded {\n      id\n      endpointId\n      receivedAt\n    }\n  }\n": types.WebhookEndpointsStoreDeliveryRecordedDocument,
    "\n\t\tquery Activity($filter: ActivityFilter) {\n\t\t\tactivity(filter: $filter) {\n\t\t\t\tid\n\t\t\t\ttype\n\t\t\t\ttimestamp\n\t\t\t\tmessage\n\t\t\t\tpayload\n\t\t\t\tsource {\n\t\t\t\t\tkind\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\troomId\n\t\t\t\t\troomName\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.ActivityDocument,
    "\n\t\tsubscription ActivityStream($advanced: Boolean) {\n\t\t\tactivityStream(advanced: $advanced) {\n\t\t\t\tid\n\t\t\t\ttype\n\t\t\t\ttimestamp\n\t\t\t\tmessage\n\t\t\t\tpayload\n\t\t\t\tsource {\n\t\t\t\t\tkind\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\ttype\n\t\t\t\t\troomId\n\t\t\t\t\troomName\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.ActivityStreamDocument,
    "\n\t\tmutation AutomationEditUpdate($id: ID!, $input: UpdateAutomationInput!) {\n\t\t\tupdateAutomation(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tcompilable\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t\tpositionX\n\t\t\t\t\tpositionY\n\t\t\t\t\truntimeState\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.AutomationEditUpdateDocument,
    "\n\t\tmutation AutomationEditFireTrigger($automationId: ID!, $nodeId: ID!) {\n\t\t\tfireAutomationTrigger(automationId: $automationId, nodeId: $nodeId)\n\t\t}\n\t": types.AutomationEditFireTriggerDocument,
    "\n\t\tquery AutomationEditEffects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t}\n\t\t}\n\t": types.AutomationEditEffectsDocument,
    "\n\t\tquery AutomationEditGroupReference($id: ID!) {\n\t\t\tgroup(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tfriendlyName\n\t\t\t\tsource\n\t\t\t\tremoved\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.AutomationEditGroupReferenceDocument,
    "\n\t\tsubscription AutomationEditNodeActivated($automationId: ID) {\n\t\t\tautomationNodeActivated(automationId: $automationId) {\n\t\t\t\tautomationId\n\t\t\t\tnodeId\n\t\t\t\tactive\n\t\t\t}\n\t\t}\n\t": types.AutomationEditNodeActivatedDocument,
    "\n\t\tmutation completeFirstPasswordChange($newPassword: String!) {\n\t\t\tcompleteFirstPasswordChange(newPassword: $newPassword)\n\t\t}\n\t": types.CompleteFirstPasswordChangeDocument,
    "\n\t\tmutation SetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t": types.SetDeviceStateDocument,
    "\n\t\tmutation DeviceDetailSetConfiguration(\n\t\t\t$deviceId: ID!\n\t\t\t$settings: [DeviceConfigurationEntryInput!]!\n\t\t) {\n\t\t\tsetDeviceConfiguration(deviceId: $deviceId, settings: $settings)\n\t\t}\n\t": types.DeviceDetailSetConfigurationDocument,
    "\n\t\tmutation DeviceDetailUpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n\t\t\tupdateDevice(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\troles {\n\t\t\t\t\tcontrolledLoad\n\t\t\t\t\tcontact\n\t\t\t\t}\n\t\t\t\tdisabled\n\t\t\t\tfriendlyName\n\t\t\t\tseen\n\t\t\t}\n\t\t}\n\t": types.DeviceDetailUpdateDeviceDocument,
    "\n\t\tmutation DeviceDetailDeleteDevice($id: ID!) {\n\t\t\tdeleteDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t": types.DeviceDetailDeleteDeviceDocument,
    "\n\t\tmutation DeviceDetailRestoreDevice($id: ID!) {\n\t\t\trestoreDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t": types.DeviceDetailRestoreDeviceDocument,
    "\n\t\tquery DeviceZigbeeDetail($id: ID!) {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tfrontendUrl\n\t\t\t}\n\t\t\tdevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tsource\n\t\t\t\tzigbee2Mqtt {\n\t\t\t\t\timageCandidate\n\t\t\t\t\timageVersion\n\t\t\t\t\tnetworkType\n\t\t\t\t\tieeeAddress\n\t\t\t\t\taddressVendor\n\t\t\t\t\tnetworkAddress\n\t\t\t\t\tsupported\n\t\t\t\t\tinterviewState\n\t\t\t\t\tinterviewCompleted\n\t\t\t\t\tinterviewing\n\t\t\t\t\tdescription\n\t\t\t\t\tmanufacturer\n\t\t\t\t\tmodelId\n\t\t\t\t\tpowerSource\n\t\t\t\t\tsoftwareBuildId\n\t\t\t\t\tdateCode\n\t\t\t\t\tdefinitionUrl\n\t\t\t\t\tdefinition {\n\t\t\t\t\t\tmodel\n\t\t\t\t\t\tvendor\n\t\t\t\t\t\tdescription\n\t\t\t\t\t\tsource\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tsupportsOta\n\t\t\t\t\t}\n\t\t\t\t\tota {\n\t\t\t\t\t\tstate\n\t\t\t\t\t\tinstalledVersion\n\t\t\t\t\t\tlatestVersion\n\t\t\t\t\t\tprogress\n\t\t\t\t\t}\n\t\t\t\t\tendpoints {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tprofileId\n\t\t\t\t\t\tdeviceId\n\t\t\t\t\t\tinputClusters\n\t\t\t\t\t\toutputClusters\n\t\t\t\t\t\tbindings {\n\t\t\t\t\t\t\tcluster\n\t\t\t\t\t\t\ttargetType\n\t\t\t\t\t\t\ttargetIeeeAddress\n\t\t\t\t\t\t\ttargetEndpoint\n\t\t\t\t\t\t\ttargetGroupId\n\t\t\t\t\t\t}\n\t\t\t\t\t\treportings {\n\t\t\t\t\t\t\tcluster\n\t\t\t\t\t\t\tattribute\n\t\t\t\t\t\t\tminimumReportInterval\n\t\t\t\t\t\t\tmaximumReportInterval\n\t\t\t\t\t\t\treportableChange\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tgroups {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tproviderGroupId\n\t\t\t\t\t\tname\n\t\t\t\t\t\tendpoint\n\t\t\t\t\t}\n\t\t\t\t\tbridgeInfo {\n\t\t\t\t\t\tadapterType\n\t\t\t\t\t\tfirmwareVersion\n\t\t\t\t\t\tchannel\n\t\t\t\t\t\tpanId\n\t\t\t\t\t\textendedPanId\n\t\t\t\t\t\tzigbee2MqttVersion\n\t\t\t\t\t\tzigbee2MqttCommit\n\t\t\t\t\t\tzigbeeHerdsmanVersion\n\t\t\t\t\t\tzigbeeHerdsmanConvertersVersion\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.DeviceZigbeeDetailDocument,
    "\n\t\tquery DeviceZigbeeDocumentation($id: ID!) {\n\t\t\tdevice(id: $id) {\n\t\t\t\tzigbee2Mqtt {\n\t\t\t\t\tdocumentation {\n\t\t\t\t\t\tsourceUrl\n\t\t\t\t\t\tlastCheckedAt\n\t\t\t\t\t\tmodel\n\t\t\t\t\t\tvendor\n\t\t\t\t\t\tdescription\n\t\t\t\t\t\texposes\n\t\t\t\t\t\tbatteryType\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.DeviceZigbeeDocumentationDocument,
    "\n\t\tmutation EffectEditUpdate($input: UpdateEffectInput!) {\n\t\t\tupdateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tindex\n\t\t\t\t\tname\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tstartMs\n\t\t\t\t\t\ttransitionMinMs\n\t\t\t\t\t\ttransitionMaxMs\n\t\t\t\t\t\tkind\n\t\t\t\t\t\tconfig\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.EffectEditUpdateDocument,
    "\n\t\tquery IntegrationsPage {\n\t\t\tintegrations {\n\t\t\t\tprovider\n\t\t\t\tname\n\t\t\t\tconfigured\n\t\t\t\tenabled\n\t\t\t\tconnected\n\t\t\t\tdeviceCount\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t": types.IntegrationsPageDocument,
    "\n\t\tmutation DeleteIntegration($provider: String!) {\n\t\t\tdeleteIntegration(provider: $provider)\n\t\t}\n\t": types.DeleteIntegrationDocument,
    "\n\t\tquery TuyaConfigPage {\n\t\t\ttuyaConfig {\n\t\t\t\taccessId\n\t\t\t\taccessSecret\n\t\t\t\tregion\n\t\t\t\tenabled\n\t\t\t}\n\t\t}\n\t": types.TuyaConfigPageDocument,
    "\n\t\tmutation UpdateTuyaConfig($input: TuyaConfigInput!) {\n\t\t\tupdateTuyaConfig(input: $input) {\n\t\t\t\taccessId\n\t\t\t\taccessSecret\n\t\t\t\tregion\n\t\t\t\tenabled\n\t\t\t}\n\t\t}\n\t": types.UpdateTuyaConfigDocument,
    "\n\t\tmutation TestTuyaConnection($input: TuyaConfigInput!) {\n\t\t\ttestTuyaConnection(input: $input) {\n\t\t\t\tsuccess\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t": types.TestTuyaConnectionDocument,
    "\n\t\tmutation SyncTuyaDevices {\n\t\t\tsyncTuyaDevices {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t": types.SyncTuyaDevicesDocument,
    "\n\t\tquery Zigbee2MqttConfigPage {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tbroker\n\t\t\t\tfrontendUrl\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t\tenabled\n\t\t\t\tscanScheduleEnabled\n\t\t\t\tscanHour\n\t\t\t\tscanMinute\n\t\t\t\tscanStartedAt\n\t\t\t\tinteractiveCommandsPerSecond\n\t\t\t\tcontinuousCommandsPerSecond\n\t\t\t}\n\t\t}\n\t": types.Zigbee2MqttConfigPageDocument,
    "\n\t\tmutation UpdateZigbee2MqttConfig($input: Zigbee2MqttConfigInput!) {\n\t\t\tupdateZigbee2MqttConfig(input: $input) {\n\t\t\t\tbroker\n\t\t\t\tfrontendUrl\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t\tenabled\n\t\t\t\tscanScheduleEnabled\n\t\t\t\tscanHour\n\t\t\t\tscanMinute\n\t\t\t\tscanStartedAt\n\t\t\t\tinteractiveCommandsPerSecond\n\t\t\t\tcontinuousCommandsPerSecond\n\t\t\t}\n\t\t}\n\t": types.UpdateZigbee2MqttConfigDocument,
    "\n\t\tmutation TestZigbee2MqttConnection($input: Zigbee2MqttConfigInput!) {\n\t\t\ttestZigbee2MqttConnection(input: $input) {\n\t\t\t\tsuccess\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t": types.TestZigbee2MqttConnectionDocument,
    "\n\t\tmutation ScanZigbee2MqttNetwork {\n\t\t\tscanZigbee2MqttNetwork\n\t\t}\n\t": types.ScanZigbee2MqttNetworkDocument,
    "\n\t\tquery Zigbee2MqttScanState {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tscanStartedAt\n\t\t\t}\n\t\t\tnetworkTopologies {\n\t\t\t\tprovider\n\t\t\t\tscannedAt\n\t\t\t}\n\t\t}\n\t": types.Zigbee2MqttScanStateDocument,
    "\n\t\tsubscription Zigbee2MqttScanUpdates($provider: String) {\n\t\t\tnetworkTopologyUpdated(provider: $provider) {\n\t\t\t\tprovider\n\t\t\t\tscannedAt\n\t\t\t\tnodeCount\n\t\t\t\tlinkCount\n\t\t\t}\n\t\t}\n\t": types.Zigbee2MqttScanUpdatesDocument,
    "\n\t\tmutation login($input: LoginInput!) {\n\t\t\tlogin(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t\tavatarPath\n\t\t\t\t\ttheme\n\t\t\t\t\ttimeFormat\n\t\t\t\t\ttemperatureUnit\n\t\t\t\t\thapticsEnabled\n\t\t\t\t\tcreatedAt\n\t\t\t\t\tmustChangePassword\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.LoginDocument,
    "\n\t\tquery Logs($limit: Int) {\n\t\t\tlogs(limit: $limit) {\n\t\t\t\ttimestamp\n\t\t\t\tlevel\n\t\t\t\tmessage\n\t\t\t\tattrs\n\t\t\t}\n\t\t}\n\t": types.LogsDocument,
    "\n\t\tsubscription LogStream {\n\t\t\tlogStream {\n\t\t\t\ttimestamp\n\t\t\t\tlevel\n\t\t\t\tmessage\n\t\t\t\tattrs\n\t\t\t}\n\t\t}\n\t": types.LogStreamDocument,
    "\n\t\tmutation ProfileUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n\t\t\tupdateCurrentUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t\ttheme\n\t\t\t\ttimeFormat\n\t\t\t\ttemperatureUnit\n\t\t\t\thapticsEnabled\n\t\t\t\tcreatedAt\n\t\t\t\tmustChangePassword\n\t\t\t}\n\t\t}\n\t": types.ProfileUpdateCurrentUserDocument,
    "\n\t\tmutation ProfileChangePassword($input: ChangePasswordInput!) {\n\t\t\tchangePassword(input: $input)\n\t\t}\n\t": types.ProfileChangePasswordDocument,
    "\n\t\tmutation ProfileForceLogoutAll {\n\t\t\tforceLogoutAllSessions\n\t\t}\n\t": types.ProfileForceLogoutAllDocument,
    "\n\t\tquery SceneEditorEffects {\n\t\t\teffects { id name icon kind nativeName loop requiredCapabilities }\n\t\t}\n\t": types.SceneEditorEffectsDocument,
    "\n\t\tquery Settings {\n\t\t\tsettings {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t": types.SettingsDocument,
    "\n\t\tmutation UpdateSetting($key: String!, $value: String!) {\n\t\t\tupdateSetting(key: $key, value: $value) {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t": types.UpdateSettingDocument,
    "\n\t\tmutation createInitialUser($input: CreateInitialUserInput!) {\n\t\t\tcreateInitialUser(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t": types.CreateInitialUserDocument,
    "\n\t\tquery UsersList {\n\t\t\tusers {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t}\n\t\t}\n\t": types.UsersListDocument,
    "\n\t\tmutation UsersCreate($input: CreateUserInput!) {\n\t\t\tcreateUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t}\n\t\t}\n\t": types.UsersCreateDocument,
    "\n\t\tmutation UsersDelete($id: ID!) {\n\t\t\tdeleteUser(id: $id)\n\t\t}\n\t": types.UsersDeleteDocument,
    "\n\t\tmutation UsersBatchDelete($ids: [ID!]!) {\n\t\t\tbatchDeleteUsers(ids: $ids)\n\t\t}\n\t": types.UsersBatchDeleteDocument,
    "\n\t\tmutation UsersResetPassword($id: ID!, $newPassword: String!) {\n\t\t\tresetUserPassword(id: $id, newPassword: $newPassword)\n\t\t}\n\t": types.UsersResetPasswordDocument,
    "\n\t\tquery WebhookDetailDeliveries($endpointId: ID!, $limit: Int) {\n\t\t\twebhookDeliveries(endpointId: $endpointId, limit: $limit) {\n\t\t\t\tid\n\t\t\t\tendpointId\n\t\t\t\treceivedAt\n\t\t\t\toutcome\n\t\t\t\thttpStatus\n\t\t\t\tclientIp\n\t\t\t\tuserAgent\n\t\t\t\tcontentType\n\t\t\t\tbodySize\n\t\t\t\tbody\n\t\t\t\tdurationMs\n\t\t\t\trequestId\n\t\t\t\tqueryKeys\n\t\t\t\theaderNames\n\t\t\t}\n\t\t}\n\t": types.WebhookDetailDeliveriesDocument,
    "\n\t\tsubscription WebhookDetailDeliveryRecorded($endpointId: ID) {\n\t\t\twebhookDeliveryRecorded(endpointId: $endpointId) {\n\t\t\t\tid\n\t\t\t\tendpointId\n\t\t\t\treceivedAt\n\t\t\t\toutcome\n\t\t\t\thttpStatus\n\t\t\t\tclientIp\n\t\t\t\tuserAgent\n\t\t\t\tcontentType\n\t\t\t\tbodySize\n\t\t\t\tbody\n\t\t\t\tdurationMs\n\t\t\t\trequestId\n\t\t\t\tqueryKeys\n\t\t\t\theaderNames\n\t\t\t}\n\t\t}\n\t": types.WebhookDetailDeliveryRecordedDocument,
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
export function graphql(source: "\n  query E2EAutomationsDevices {\n    devices {\n      id\n      name\n      friendlyName\n      type\n    }\n  }\n"): (typeof documents)["\n  query E2EAutomationsDevices {\n    devices {\n      id\n      name\n      friendlyName\n      type\n    }\n  }\n"];
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
export function graphql(source: "\n  query E2EDevicesList {\n    devices {\n      id\n      name\n      friendlyName\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EDevicesList {\n    devices {\n      id\n      name\n      friendlyName\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EDevice($id: ID!) {\n    device(id: $id) {\n      id\n      name\n      friendlyName\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EDevice($id: ID!) {\n    device(id: $id) {\n      id\n      name\n      friendlyName\n      source\n      type\n      available\n      state {\n        on\n        brightness\n        colorTemp\n        temperature\n        humidity\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EZigbeeDeviceMetadata($id: ID!) {\n    device(id: $id) {\n      zigbee2Mqtt {\n        imageCandidate\n        imageVersion\n        ieeeAddress\n        networkAddress\n        supported\n        softwareBuildId\n        definitionUrl\n        definition {\n          model\n          vendor\n          description\n          supportsOta\n        }\n        ota {\n          state\n          installedVersion\n          latestVersion\n          progress\n        }\n        endpoints {\n          id\n          profileId\n          deviceId\n          inputClusters\n          outputClusters\n          bindings {\n            cluster\n            targetType\n            targetIeeeAddress\n            targetEndpoint\n            targetGroupId\n          }\n          reportings {\n            cluster\n            attribute\n            minimumReportInterval\n            maximumReportInterval\n            reportableChange\n          }\n        }\n        groups {\n          id\n          providerGroupId\n          name\n          endpoint\n        }\n        bridgeInfo {\n          adapterType\n          firmwareVersion\n          channel\n          panId\n          extendedPanId\n          zigbee2MqttVersion\n          zigbee2MqttCommit\n          zigbeeHerdsmanVersion\n          zigbeeHerdsmanConvertersVersion\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EZigbeeDeviceMetadata($id: ID!) {\n    device(id: $id) {\n      zigbee2Mqtt {\n        imageCandidate\n        imageVersion\n        ieeeAddress\n        networkAddress\n        supported\n        softwareBuildId\n        definitionUrl\n        definition {\n          model\n          vendor\n          description\n          supportsOta\n        }\n        ota {\n          state\n          installedVersion\n          latestVersion\n          progress\n        }\n        endpoints {\n          id\n          profileId\n          deviceId\n          inputClusters\n          outputClusters\n          bindings {\n            cluster\n            targetType\n            targetIeeeAddress\n            targetEndpoint\n            targetGroupId\n          }\n          reportings {\n            cluster\n            attribute\n            minimumReportInterval\n            maximumReportInterval\n            reportableChange\n          }\n        }\n        groups {\n          id\n          providerGroupId\n          name\n          endpoint\n        }\n        bridgeInfo {\n          adapterType\n          firmwareVersion\n          channel\n          panId\n          extendedPanId\n          zigbee2MqttVersion\n          zigbee2MqttCommit\n          zigbeeHerdsmanVersion\n          zigbeeHerdsmanConvertersVersion\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2ESetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n    setTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n  }\n"): (typeof documents)["\n  mutation E2ESetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n    setTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n  }\n"];
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
export function graphql(source: "\n  mutation E2EAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n      members {\n        id\n        memberType\n        memberId\n        device {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation E2EAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n      members {\n        id\n        memberType\n        memberId\n        device {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation E2ERemoveGroupMember($id: ID!) {\n    removeGroupMember(id: $id) {\n      id\n      members {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation E2ERemoveGroupMember($id: ID!) {\n    removeGroupMember(id: $id) {\n      id\n      members {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EGroupsDevices {\n    devices {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query E2EGroupsDevices {\n    devices {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BrowserSceneFixtures {\n    devices {\n      id\n      friendlyName\n      type\n    }\n    vibePresets {\n      id\n      title\n    }\n  }\n"): (typeof documents)["\n  query BrowserSceneFixtures {\n    devices {\n      id\n      friendlyName\n      type\n    }\n    vibePresets {\n      id\n      title\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BrowserSceneCreateStructure($room: CreateRoomInput!, $group: CreateGroupInput!) {\n    room: createRoom(input: $room) {\n      id\n    }\n    group: createGroup(input: $group) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation BrowserSceneCreateStructure($room: CreateRoomInput!, $group: CreateGroupInput!) {\n    room: createRoom(input: $room) {\n      id\n    }\n    group: createGroup(input: $group) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BrowserSceneAddRoomMember($input: AddRoomMemberInput!) {\n    addRoomMember(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation BrowserSceneAddRoomMember($input: AddRoomMemberInput!) {\n    addRoomMember(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BrowserSceneAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation BrowserSceneAddGroupMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BrowserSceneDeleteFixtures($roomId: ID!, $groupId: ID!) {\n    deleteRoom(id: $roomId)\n    deleteGroup(id: $groupId)\n  }\n"): (typeof documents)["\n  mutation BrowserSceneDeleteFixtures($roomId: ID!, $groupId: ID!) {\n    deleteRoom(id: $roomId)\n    deleteGroup(id: $groupId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BrowserSceneDelete($id: ID!) {\n    deleteScene(id: $id)\n  }\n"): (typeof documents)["\n  mutation BrowserSceneDelete($id: ID!) {\n    deleteScene(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EScenesDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n"): (typeof documents)["\n  query E2EScenesDevices {\n    devices {\n      id\n      name\n      type\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2ECreateScene($input: CreateSceneInput!) {\n    createScene(input: $input) {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation E2ECreateScene($input: CreateSceneInput!) {\n    createScene(input: $input) {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EApplyScene($sceneId: ID!) {\n    applyScene(sceneId: $sceneId) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation E2EApplyScene($sceneId: ID!) {\n    applyScene(sceneId: $sceneId) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EScene($id: ID!) {\n    scene(id: $id) {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n"): (typeof documents)["\n  mutation E2EDeleteScene($id: ID!) {\n    deleteScene(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EScenes {\n    scenes {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EScenes {\n    scenes {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EUpdateScene($id: ID!, $input: UpdateSceneInput!) {\n    updateScene(id: $id, input: $input) {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation E2EUpdateScene($id: ID!, $input: UpdateSceneInput!) {\n    updateScene(id: $id, input: $input) {\n      id\n      name\n      targets {\n        targetType\n        targetId\n      }\n      lighting {\n        overrides {\n          deviceId\n          kind\n          state {\n            on\n            brightness\n          }\n        }\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation BrowserSearchCreateFixtures(\n    $room: CreateRoomInput!\n    $group: CreateGroupInput!\n    $scene: CreateSceneInput!\n    $automation: CreateAutomationInput!\n    $effect: CreateEffectInput!\n    $alarm: RaiseAlarmInput!\n  ) {\n    room: createRoom(input: $room) {\n      id\n    }\n    group: createGroup(input: $group) {\n      id\n    }\n    scene: createScene(input: $scene) {\n      id\n    }\n    automation: createAutomation(input: $automation) {\n      id\n    }\n    effect: createEffect(input: $effect) {\n      id\n    }\n    alarm: raiseAlarm(input: $alarm) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation BrowserSearchCreateFixtures(\n    $room: CreateRoomInput!\n    $group: CreateGroupInput!\n    $scene: CreateSceneInput!\n    $automation: CreateAutomationInput!\n    $effect: CreateEffectInput!\n    $alarm: RaiseAlarmInput!\n  ) {\n    room: createRoom(input: $room) {\n      id\n    }\n    group: createGroup(input: $group) {\n      id\n    }\n    scene: createScene(input: $scene) {\n      id\n    }\n    automation: createAutomation(input: $automation) {\n      id\n    }\n    effect: createEffect(input: $effect) {\n      id\n    }\n    alarm: raiseAlarm(input: $alarm) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BrowserSearchDeleteFixtures(\n    $roomId: ID!\n    $groupId: ID!\n    $sceneId: ID!\n    $automationId: ID!\n    $effectId: ID!\n    $alarmId: ID!\n  ) {\n    deleteRoom(id: $roomId)\n    deleteGroup(id: $groupId)\n    deleteScene(id: $sceneId)\n    deleteAutomation(id: $automationId)\n    deleteEffect(id: $effectId)\n    deleteAlarm(alarmId: $alarmId)\n  }\n"): (typeof documents)["\n  mutation BrowserSearchDeleteFixtures(\n    $roomId: ID!\n    $groupId: ID!\n    $sceneId: ID!\n    $automationId: ID!\n    $effectId: ID!\n    $alarmId: ID!\n  ) {\n    deleteRoom(id: $roomId)\n    deleteGroup(id: $groupId)\n    deleteScene(id: $sceneId)\n    deleteAutomation(id: $automationId)\n    deleteEffect(id: $effectId)\n    deleteAlarm(alarmId: $alarmId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BrowserSearchMaintenanceTasks {\n    maintenanceTasks {\n      kind\n    }\n  }\n"): (typeof documents)["\n  query BrowserSearchMaintenanceTasks {\n    maintenanceTasks {\n      kind\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BrowserSearchDevices {\n    devices {\n      id\n      friendlyName\n    }\n  }\n"): (typeof documents)["\n  query BrowserSearchDevices {\n    devices {\n      id\n      friendlyName\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BrowserSearchCleanUpDeletedDevice($id: ID!, $input: UpdateDeviceInput!) {\n    restoreDevice(id: $id) {\n      id\n    }\n    updateDevice(id: $id, input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation BrowserSearchCleanUpDeletedDevice($id: ID!, $input: UpdateDeviceInput!) {\n    restoreDevice(id: $id) {\n      id\n    }\n    updateDevice(id: $id, input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EDevices {\n    devices {\n      id\n      name\n      friendlyName\n      source\n      type\n      available\n    }\n  }\n"): (typeof documents)["\n  query E2EDevices {\n    devices {\n      id\n      name\n      friendlyName\n      source\n      type\n      available\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EStateHistoryDevices {\n    devices {\n      id\n      name\n      friendlyName\n      type\n    }\n  }\n"): (typeof documents)["\n  query E2EStateHistoryDevices {\n    devices {\n      id\n      name\n      friendlyName\n      type\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EStateHistory($filter: StateHistoryFilter!) {\n    stateHistory(filter: $filter) {\n      deviceId\n      field\n      valueType\n      points {\n        at\n        numberValue\n        booleanValue\n        textValue\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EStateHistory($filter: StateHistoryFilter!) {\n    stateHistory(filter: $filter) {\n      deviceId\n      field\n      valueType\n      points {\n        at\n        numberValue\n        booleanValue\n        textValue\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  subscription E2EDeviceAdded {\n    deviceAdded {\n      id\n      friendlyName\n      type\n      source\n    }\n  }\n"): (typeof documents)["\n  subscription E2EDeviceAdded {\n    deviceAdded {\n      id\n      friendlyName\n      type\n      source\n    }\n  }\n"];
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
export function graphql(source: "\n  query E2ESubscriptionsDevices {\n    devices {\n      id\n      name\n      friendlyName\n      type\n    }\n  }\n"): (typeof documents)["\n  query E2ESubscriptionsDevices {\n    devices {\n      id\n      name\n      friendlyName\n      type\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation E2ECreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n      username\n      name\n      avatarPath\n      theme\n      hapticsEnabled\n    }\n  }\n"): (typeof documents)["\n  mutation E2ECreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n      username\n      name\n      avatarPath\n      theme\n      hapticsEnabled\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation E2EUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n    updateCurrentUser(input: $input) {\n      id\n      name\n      theme\n      hapticsEnabled\n    }\n  }\n"): (typeof documents)["\n  mutation E2EUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n    updateCurrentUser(input: $input) {\n      id\n      name\n      theme\n      hapticsEnabled\n    }\n  }\n"];
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
export function graphql(source: "\n  query E2EMe {\n    me {\n      id\n      username\n      name\n      theme\n      hapticsEnabled\n      avatarPath\n    }\n  }\n"): (typeof documents)["\n  query E2EMe {\n    me {\n      id\n      username\n      name\n      theme\n      hapticsEnabled\n      avatarPath\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EWebSocketRecoveryDeviceState($id: ID!) {\n    device(id: $id) {\n      state {\n        brightness\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EWebSocketRecoveryDeviceState($id: ID!) {\n    device(id: $id) {\n      state {\n        brightness\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EWebSocketRecoveryLogs {\n    logs(limit: 1000) {\n      message\n      attrs\n    }\n  }\n"): (typeof documents)["\n  query E2EWebSocketRecoveryLogs {\n    logs(limit: 1000) {\n      message\n      attrs\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EZigbeeMetadataReady($id: ID!) {\n    device(id: $id) {\n      zigbee2Mqtt {\n        ieeeAddress\n      }\n    }\n  }\n"): (typeof documents)["\n  query E2EZigbeeMetadataReady($id: ID!) {\n    device(id: $id) {\n      zigbee2Mqtt {\n        ieeeAddress\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query E2EMaintenanceTasks {\n    maintenanceTasks {\n      id\n      kind\n    }\n  }\n"): (typeof documents)["\n  query E2EMaintenanceTasks {\n    maintenanceTasks {\n      id\n      kind\n    }\n  }\n"];
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
export function graphql(source: "\n\t\tmutation DashboardApplianceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DashboardApplianceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DashboardLightCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DashboardLightCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery DashboardIntegrations {\n\t\t\tintegrations {\n\t\t\t\tprovider\n\t\t\t\tconfigured\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery DashboardIntegrations {\n\t\t\tintegrations {\n\t\t\t\tprovider\n\t\t\t\tconfigured\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceActionMenuSimulate($deviceId: ID!, $action: String!) {\n\t\t\tsimulateDeviceAction(deviceId: $deviceId, action: $action)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceActionMenuSimulate($deviceId: ID!, $action: String!) {\n\t\t\tsimulateDeviceAction(deviceId: $deviceId, action: $action)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceTableSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceTableSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation UpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n\t\t\tupdateDevice(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\troles {\n\t\t\t\t\tcontrolledLoad\n\t\t\t\t\tcontact\n\t\t\t\t}\n\t\t\t\tdisabled\n\t\t\t\tfriendlyName\n\t\t\t\tseen\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation UpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n\t\t\tupdateDevice(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\troles {\n\t\t\t\t\tcontrolledLoad\n\t\t\t\t\tcontact\n\t\t\t\t}\n\t\t\t\tdisabled\n\t\t\t\tfriendlyName\n\t\t\t\tseen\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation MarkDevicesSeen($ids: [ID!]!) {\n\t\t\tmarkDevicesSeen(ids: $ids)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation MarkDevicesSeen($ids: [ID!]!) {\n\t\t\tmarkDevicesSeen(ids: $ids)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DevicesPageDeleteDevice($id: ID!) {\n\t\t\tdeleteDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DevicesPageDeleteDevice($id: ID!) {\n\t\t\tdeleteDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DevicesPageRestoreDevice($id: ID!) {\n\t\t\trestoreDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DevicesPageRestoreDevice($id: ID!) {\n\t\t\trestoreDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DevicesPageBatchDeleteDevices($ids: [ID!]!) {\n\t\t\tbatchDeleteDevices(ids: $ids)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DevicesPageBatchDeleteDevices($ids: [ID!]!) {\n\t\t\tbatchDeleteDevices(ids: $ids)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DevicesPageBatchRestoreDevices($ids: [ID!]!) {\n\t\t\tbatchRestoreDevices(ids: $ids)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DevicesPageBatchRestoreDevices($ids: [ID!]!) {\n\t\t\tbatchRestoreDevices(ids: $ids)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery NativeEffectOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tconfirmedDeviceCount\n\t\t\t\tuntestedDeviceCount\n\t\t\t\tunsupportedDeviceCount\n\t\t\t\tsource\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery NativeEffectOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tconfirmedDeviceCount\n\t\t\t\tuntestedDeviceCount\n\t\t\t\tunsupportedDeviceCount\n\t\t\t\tsource\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription NativeEffectEditorSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription NativeEffectEditorSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation EffectRunTargetDrawerRunEffect($effectId: ID!, $targetType: String!, $targetId: ID!) {\n\t\t\trunEffect(effectId: $effectId, targetType: $targetType, targetId: $targetId) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation EffectRunTargetDrawerRunEffect($effectId: ID!, $targetType: String!, $targetId: ID!) {\n\t\t\trunEffect(effectId: $effectId, targetType: $targetType, targetId: $targetId) {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation EffectRunTargetDrawerRunNativeEffect($nativeName: String!, $targetType: String!, $targetId: ID!) {\n\t\t\trunNativeEffect(nativeName: $nativeName, targetType: $targetType, targetId: $targetId) {\n\t\t\t\trunId\n\t\t\t\tdevices {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tstatus\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation EffectRunTargetDrawerRunNativeEffect($nativeName: String!, $targetType: String!, $targetId: ID!) {\n\t\t\trunNativeEffect(nativeName: $nativeName, targetType: $targetType, targetId: $targetId) {\n\t\t\t\trunId\n\t\t\t\tdevices {\n\t\t\t\t\tdeviceId\n\t\t\t\t\tstatus\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery EffectRunTargetDrawerNativeSupport($name: String!) {\n\t\t\tnativeEffectSupport(name: $name) {\n\t\t\t\tdeviceId\n\t\t\t\tstatus\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery EffectRunTargetDrawerNativeSupport($name: String!) {\n\t\t\tnativeEffectSupport(name: $name) {\n\t\t\t\tdeviceId\n\t\t\t\tstatus\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription EffectRunTargetDrawerNativeSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription EffectRunTargetDrawerNativeSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery EffectTimelineEditorNativeOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tconfirmedDeviceCount\n\t\t\t\tuntestedDeviceCount\n\t\t\t\tunsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery EffectTimelineEditorNativeOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tconfirmedDeviceCount\n\t\t\t\tuntestedDeviceCount\n\t\t\t\tunsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription EffectTimelineNativeSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription EffectTimelineNativeSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery EffectsPageNativeOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsource\n\t\t\t\tconfirmedDeviceCount\n\t\t\t\tuntestedDeviceCount\n\t\t\t\tunsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery EffectsPageNativeOptions {\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t\tsource\n\t\t\t\tconfirmedDeviceCount\n\t\t\t\tuntestedDeviceCount\n\t\t\t\tunsupportedDeviceCount\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription EffectsPageNativeSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription EffectsPageNativeSupportChanged {\n\t\t\tnativeEffectSupportChanged\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation RoomsPageSetDeviceState($targetId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: ROOM, id: $targetId }, state: $state)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation RoomsPageSetDeviceState($targetId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: ROOM, id: $targetId }, state: $state)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery SceneCreateVibePreview($input: PreviewVibeInput!) {\n\t\t\tpreviewVibe(input: $input) {\n\t\t\t\tpreview { width height pixels { r g b } swatches { x y color { r g b } } }\n\t\t\t\tdomain seed brightness movement cycleSeconds minimumLightness maximumLightness\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery SceneCreateVibePreview($input: PreviewVibeInput!) {\n\t\t\tpreviewVibe(input: $input) {\n\t\t\t\tpreview { width height pixels { r g b } swatches { x y color { r g b } } }\n\t\t\t\tdomain seed brightness movement cycleSeconds minimumLightness maximumLightness\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery SceneOutputRate {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tcontinuousCommandsPerSecond\n\t\t\t\tactiveContinuousDeviceIds\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery SceneOutputRate {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tcontinuousCommandsPerSecond\n\t\t\t\tactiveContinuousDeviceIds\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery StateHistory($filter: StateHistoryFilter!) {\n\t\t\tstateHistory(filter: $filter) {\n\t\t\t\tdeviceId\n\t\t\t\tfield\n\t\t\t\tvalueType\n\t\t\t\tpoints {\n\t\t\t\t\tat\n\t\t\t\t\tnumberValue\n\t\t\t\t\tbooleanValue\n\t\t\t\t\ttextValue\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery StateHistory($filter: StateHistoryFilter!) {\n\t\t\tstateHistory(filter: $filter) {\n\t\t\t\tdeviceId\n\t\t\t\tfield\n\t\t\t\tvalueType\n\t\t\t\tpoints {\n\t\t\t\t\tat\n\t\t\t\t\tnumberValue\n\t\t\t\t\tbooleanValue\n\t\t\t\t\ttextValue\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery AggregatedStateHistory($filter: AggregatedStateHistoryFilter!) {\n\t\t\taggregatedStateHistory(filter: $filter) {\n\t\t\t\tfield\n\t\t\t\tpoints {\n\t\t\t\t\tat\n\t\t\t\t\tvalue\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery AggregatedStateHistory($filter: AggregatedStateHistoryFilter!) {\n\t\t\taggregatedStateHistory(filter: $filter) {\n\t\t\t\tfield\n\t\t\t\tpoints {\n\t\t\t\t\tat\n\t\t\t\t\tvalue\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery GuidedVibeChoices($input: GuidedVibeRoundInput!) {\n\t\t\tguidedVibeRound(input: $input) {\n\t\t\t\tround\n\t\t\t\tcanFinish\n\t\t\t\tcomplete\n\t\t\t\toptions {\n\t\t\t\t\tid\n\t\t\t\t\ttitle\n\t\t\t\t\tpreview {\n\t\t\t\t\t\twidth height\n\t\t\t\t\t\tpixels { r g b }\n\t\t\t\t\t\tswatches { x y color { r g b } }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery GuidedVibeChoices($input: GuidedVibeRoundInput!) {\n\t\t\tguidedVibeRound(input: $input) {\n\t\t\t\tround\n\t\t\t\tcanFinish\n\t\t\t\tcomplete\n\t\t\t\toptions {\n\t\t\t\t\tid\n\t\t\t\t\ttitle\n\t\t\t\t\tpreview {\n\t\t\t\t\t\twidth height\n\t\t\t\t\t\tpixels { r g b }\n\t\t\t\t\t\tswatches { x y color { r g b } }\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery SceneEditorVibePreview($input: PreviewVibeInput!) {\n\t\t\tpreviewVibe(input: $input) {\n\t\t\t\tpreview { width height pixels { r g b } swatches { x y color { r g b } } }\n\t\t\t\tdomain seed brightness movement cycleSeconds\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery SceneEditorVibePreview($input: PreviewVibeInput!) {\n\t\t\tpreviewVibe(input: $input) {\n\t\t\t\tpreview { width height pixels { r g b } swatches { x y color { r g b } } }\n\t\t\t\tdomain seed brightness movement cycleSeconds\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Automation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n      icon\n      enabled\n      compilable\n      nodes {\n        id\n        type\n        config\n        positionX\n        positionY\n        runtimeState\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n"): (typeof documents)["\n  query Automation($id: ID!) {\n    automation(id: $id) {\n      id\n      name\n      icon\n      enabled\n      compilable\n      nodes {\n        id\n        type\n        config\n        positionX\n        positionY\n        runtimeState\n      }\n      edges {\n        fromNodeId\n        toNodeId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EffectEdit($id: ID!) {\n    effect(id: $id) {\n      id\n      name\n      icon\n      kind\n      nativeName\n      loop\n      durationMs\n      requiredCapabilities\n      tracks {\n        id\n        index\n        name\n        clips {\n          id\n          startMs\n          transitionMinMs\n          transitionMaxMs\n          kind\n          config\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query EffectEdit($id: ID!) {\n    effect(id: $id) {\n      id\n      name\n      icon\n      kind\n      nativeName\n      loop\n      durationMs\n      requiredCapabilities\n      tracks {\n        id\n        index\n        name\n        clips {\n          id\n          startMs\n          transitionMinMs\n          transitionMaxMs\n          kind\n          config\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MapPageSetDisplayColor($id: ID!, $input: UpdateDeviceInput!) {\n    updateDevice(id: $id, input: $input) {\n      id\n      displayColor\n      displayBrightness\n    }\n  }\n"): (typeof documents)["\n  mutation MapPageSetDisplayColor($id: ID!, $input: UpdateDeviceInput!) {\n    updateDevice(id: $id, input: $input) {\n      id\n      displayColor\n      displayBrightness\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MapNetworkTopologies {\n    networkTopologies {\n      provider\n      scannedAt\n      nodes {\n        id\n        deviceId\n        role\n      }\n      links {\n        source\n        target\n        kind\n        quality\n        stale\n      }\n    }\n  }\n"): (typeof documents)["\n  query MapNetworkTopologies {\n    networkTopologies {\n      provider\n      scannedAt\n      nodes {\n        id\n        deviceId\n        role\n      }\n      links {\n        source\n        target\n        kind\n        quality\n        stale\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription MapPageTopologyUpdated {\n    networkTopologyUpdated {\n      provider\n      scannedAt\n    }\n  }\n"): (typeof documents)["\n  subscription MapPageTopologyUpdated {\n    networkTopologyUpdated {\n      provider\n      scannedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription MapPageDeviceTx {\n    deviceStateChanged {\n      deviceId\n    }\n  }\n"): (typeof documents)["\n  subscription MapPageDeviceTx {\n    deviceStateChanged {\n      deviceId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription MapPageActionTx {\n    deviceActionFired {\n      deviceId\n    }\n  }\n"): (typeof documents)["\n  subscription MapPageActionTx {\n    deviceActionFired {\n      deviceId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query setupStatus {\n    setupStatus {\n      hasInitialUser\n    }\n  }\n"): (typeof documents)["\n  query setupStatus {\n    setupStatus {\n      hasInitialUser\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GroupCommandsSetTargetState($target: CommandTargetInput!, $state: DeviceStateInput!) {\n    setTargetState(target: $target, state: $state)\n  }\n"): (typeof documents)["\n  mutation GroupCommandsSetTargetState($target: CommandTargetInput!, $state: DeviceStateInput!) {\n    setTargetState(target: $target, state: $state)\n  }\n"];
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
export function graphql(source: "\n  fragment AutomationFields on AutomationGraph {\n    id\n    name\n    icon\n    enabled\n    lastFiredAt\n    nodes {\n      id\n      type\n      config\n    }\n    edges {\n      fromNodeId\n      toNodeId\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment AutomationFields on AutomationGraph {\n    id\n    name\n    icon\n    enabled\n    lastFiredAt\n    nodes {\n      id\n      type\n      config\n    }\n    edges {\n      fromNodeId\n      toNodeId\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AutomationsStore {\n    automations {\n      ...AutomationFields\n    }\n  }\n"): (typeof documents)["\n  query AutomationsStore {\n    automations {\n      ...AutomationFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AutomationsStoreCreate($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      ...AutomationFields\n    }\n  }\n"): (typeof documents)["\n  mutation AutomationsStoreCreate($input: CreateAutomationInput!) {\n    createAutomation(input: $input) {\n      ...AutomationFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AutomationsStoreUpdate($id: ID!, $input: UpdateAutomationInput!) {\n    updateAutomation(id: $id, input: $input) {\n      ...AutomationFields\n    }\n  }\n"): (typeof documents)["\n  mutation AutomationsStoreUpdate($id: ID!, $input: UpdateAutomationInput!) {\n    updateAutomation(id: $id, input: $input) {\n      ...AutomationFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AutomationsStoreToggle($id: ID!, $enabled: Boolean!) {\n    toggleAutomation(id: $id, enabled: $enabled) {\n      ...AutomationFields\n    }\n  }\n"): (typeof documents)["\n  mutation AutomationsStoreToggle($id: ID!, $enabled: Boolean!) {\n    toggleAutomation(id: $id, enabled: $enabled) {\n      ...AutomationFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AutomationsStoreDelete($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n"): (typeof documents)["\n  mutation AutomationsStoreDelete($id: ID!) {\n    deleteAutomation(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AutomationsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteAutomations(ids: $ids)\n  }\n"): (typeof documents)["\n  mutation AutomationsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteAutomations(ids: $ids)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DevicesInit {\n    devices {\n      id\n      name\n      icon\n      displayColor\n      displayBrightness\n      source\n      type\n      roles {\n        controlledLoad\n        contact\n      }\n      capabilities {\n        name\n        type\n        label\n        description\n        category\n        values\n        valueMin\n        valueMax\n        unit\n        reportsValue\n        canSet\n        canGet\n      }\n      available\n      disabled\n      deleted\n      friendlyName\n      seen\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n      configuration {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n"): (typeof documents)["\n  query DevicesInit {\n    devices {\n      id\n      name\n      icon\n      displayColor\n      displayBrightness\n      source\n      type\n      roles {\n        controlledLoad\n        contact\n      }\n      capabilities {\n        name\n        type\n        label\n        description\n        category\n        values\n        valueMin\n        valueMax\n        unit\n        reportsValue\n        canSet\n        canGet\n      }\n      available\n      disabled\n      deleted\n      friendlyName\n      seen\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n      configuration {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription DeviceStoreStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription DeviceStoreStateChanged {\n    deviceStateChanged {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription DeviceStoreConfigurationChanged {\n    deviceConfigurationChanged {\n      deviceId\n      values {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription DeviceStoreConfigurationChanged {\n    deviceConfigurationChanged {\n      deviceId\n      values {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription DeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n"): (typeof documents)["\n  subscription DeviceAvailabilityChanged {\n    deviceAvailabilityChanged {\n      deviceId\n      available\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription DeviceAdded {\n    deviceAdded {\n      id\n      name\n      friendlyName\n      seen\n      disabled\n      deleted\n      source\n      type\n      roles {\n        controlledLoad\n        contact\n      }\n      capabilities {\n        name\n        type\n        label\n        description\n        category\n        values\n        valueMin\n        valueMax\n        unit\n        reportsValue\n        canSet\n        canGet\n      }\n      available\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n      configuration {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription DeviceAdded {\n    deviceAdded {\n      id\n      name\n      friendlyName\n      seen\n      disabled\n      deleted\n      source\n      type\n      roles {\n        controlledLoad\n        contact\n      }\n      capabilities {\n        name\n        type\n        label\n        description\n        category\n        values\n        valueMin\n        valueMax\n        unit\n        reportsValue\n        canSet\n        canGet\n      }\n      available\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n      configuration {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription DeviceRemoved {\n    deviceRemoved\n  }\n"): (typeof documents)["\n  subscription DeviceRemoved {\n    deviceRemoved\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription DeviceStoreUpdated {\n    deviceUpdated {\n      id\n      name\n      icon\n      displayColor\n      displayBrightness\n      source\n      type\n      roles {\n        controlledLoad\n        contact\n      }\n      capabilities {\n        name\n        type\n        label\n        description\n        category\n        values\n        valueMin\n        valueMax\n        unit\n        reportsValue\n        canSet\n        canGet\n      }\n      available\n      disabled\n      deleted\n      friendlyName\n      seen\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n      configuration {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription DeviceStoreUpdated {\n    deviceUpdated {\n      id\n      name\n      icon\n      displayColor\n      displayBrightness\n      source\n      type\n      roles {\n        controlledLoad\n        contact\n      }\n      capabilities {\n        name\n        type\n        label\n        description\n        category\n        values\n        valueMin\n        valueMax\n        unit\n        reportsValue\n        canSet\n        canGet\n      }\n      available\n      disabled\n      deleted\n      friendlyName\n      seen\n      lastSeen\n      state {\n        on\n        brightness\n        colorTemp\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        temperature\n        humidity\n        pressure\n        illuminance\n        occupancy\n        contact\n        orientation\n        devicePosture\n        linkQuality\n        battery\n        power\n        voltage\n        current\n        energy\n      }\n      configuration {\n        capability\n        booleanValue\n        numberValue\n        stringValue\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment EffectFields on Effect {\n    id\n    name\n    source\n    icon\n    kind\n    nativeName\n    loop\n    durationMs\n    requiredCapabilities\n    tracks {\n      id\n      clips {\n        id\n      }\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment EffectFields on Effect {\n    id\n    name\n    source\n    icon\n    kind\n    nativeName\n    loop\n    durationMs\n    requiredCapabilities\n    tracks {\n      id\n      clips {\n        id\n      }\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EffectsStore {\n    effects {\n      ...EffectFields\n    }\n  }\n"): (typeof documents)["\n  query EffectsStore {\n    effects {\n      ...EffectFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EffectsStoreCreate($input: CreateEffectInput!) {\n    createEffect(input: $input) {\n      ...EffectFields\n    }\n  }\n"): (typeof documents)["\n  mutation EffectsStoreCreate($input: CreateEffectInput!) {\n    createEffect(input: $input) {\n      ...EffectFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EffectsStoreUpdate($input: UpdateEffectInput!) {\n    updateEffect(input: $input) {\n      ...EffectFields\n    }\n  }\n"): (typeof documents)["\n  mutation EffectsStoreUpdate($input: UpdateEffectInput!) {\n    updateEffect(input: $input) {\n      ...EffectFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EffectsStoreDelete($id: ID!) {\n    deleteEffect(id: $id)\n  }\n"): (typeof documents)["\n  mutation EffectsStoreDelete($id: ID!) {\n    deleteEffect(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EffectsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteEffects(ids: $ids)\n  }\n"): (typeof documents)["\n  mutation EffectsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteEffects(ids: $ids)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FloorplanFields on Floorplan {\n    id\n    name\n    vertices {\n      id\n      x\n      y\n    }\n    walls {\n      id\n      vertexA\n      vertexB\n      thickness\n      curveX\n      curveY\n    }\n    openings {\n      id\n      wallId\n      t\n      width\n      kind\n    }\n    doorBindings {\n      openingId\n      deviceId\n      hingeSide\n      swingSide\n    }\n    rooms {\n      id\n      name\n      roomId\n      vertexIds\n    }\n    placements {\n      memberType\n      memberId\n      x\n      y\n    }\n    furniture {\n      id\n      kind\n      x\n      y\n      width\n      height\n      rotation\n      occluder\n    }\n  }\n"): (typeof documents)["\n  fragment FloorplanFields on Floorplan {\n    id\n    name\n    vertices {\n      id\n      x\n      y\n    }\n    walls {\n      id\n      vertexA\n      vertexB\n      thickness\n      curveX\n      curveY\n    }\n    openings {\n      id\n      wallId\n      t\n      width\n      kind\n    }\n    doorBindings {\n      openingId\n      deviceId\n      hingeSide\n      swingSide\n    }\n    rooms {\n      id\n      name\n      roomId\n      vertexIds\n    }\n    placements {\n      memberType\n      memberId\n      x\n      y\n    }\n    furniture {\n      id\n      kind\n      x\n      y\n      width\n      height\n      rotation\n      occluder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query FloorplanStore {\n    floorplan {\n      ...FloorplanFields\n    }\n  }\n"): (typeof documents)["\n  query FloorplanStore {\n    floorplan {\n      ...FloorplanFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation FloorplanStoreUpdate($input: UpdateFloorplanInput!) {\n    updateFloorplan(input: $input) {\n      ...FloorplanFields\n    }\n  }\n"): (typeof documents)["\n  mutation FloorplanStoreUpdate($input: UpdateFloorplanInput!) {\n    updateFloorplan(input: $input) {\n      ...FloorplanFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment GroupFields on Group {\n    id\n    name\n    friendlyName\n    source\n    removed\n    icon\n    tags\n    members {\n      id\n      memberType\n      memberId\n    }\n    resolvedDevices {\n      id\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment GroupFields on Group {\n    id\n    name\n    friendlyName\n    source\n    removed\n    icon\n    tags\n    members {\n      id\n      memberType\n      memberId\n    }\n    resolvedDevices {\n      id\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GroupsStore {\n    groups {\n      ...GroupFields\n    }\n  }\n"): (typeof documents)["\n  query GroupsStore {\n    groups {\n      ...GroupFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription GroupsStoreChanged {\n    groupsChanged\n  }\n"): (typeof documents)["\n  subscription GroupsStoreChanged {\n    groupsChanged\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GroupsStoreCreate($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      ...GroupFields\n    }\n  }\n"): (typeof documents)["\n  mutation GroupsStoreCreate($input: CreateGroupInput!) {\n    createGroup(input: $input) {\n      ...GroupFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GroupsStoreUpdate($id: ID!, $input: UpdateGroupInput!) {\n    updateGroup(id: $id, input: $input) {\n      ...GroupFields\n    }\n  }\n"): (typeof documents)["\n  mutation GroupsStoreUpdate($id: ID!, $input: UpdateGroupInput!) {\n    updateGroup(id: $id, input: $input) {\n      ...GroupFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GroupsStoreDelete($id: ID!) {\n    deleteGroup(id: $id)\n  }\n"): (typeof documents)["\n  mutation GroupsStoreDelete($id: ID!) {\n    deleteGroup(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GroupsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteGroups(ids: $ids)\n  }\n"): (typeof documents)["\n  mutation GroupsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteGroups(ids: $ids)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GroupsStoreAddMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      ...GroupFields\n    }\n  }\n"): (typeof documents)["\n  mutation GroupsStoreAddMember($input: AddGroupMemberInput!) {\n    addGroupMember(input: $input) {\n      ...GroupFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GroupsStoreRemoveMember($id: ID!) {\n    removeGroupMember(id: $id) {\n      ...GroupFields\n    }\n  }\n"): (typeof documents)["\n  mutation GroupsStoreRemoveMember($id: ID!) {\n    removeGroupMember(id: $id) {\n      ...GroupFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MaintenanceTasks {\n    maintenanceTasks {\n      id\n      kind\n      title\n      detail\n      action\n      currentValue\n      targetValue\n      actionUrl\n      device {\n        id\n        name\n        friendlyName\n        icon\n        type\n        available\n        disabled\n        deleted\n        roles {\n          contact\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query MaintenanceTasks {\n    maintenanceTasks {\n      id\n      kind\n      title\n      detail\n      action\n      currentValue\n      targetValue\n      actionUrl\n      device {\n        id\n        name\n        friendlyName\n        icon\n        type\n        available\n        disabled\n        deleted\n        roles {\n          contact\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompleteMaintenanceTasks($ids: [ID!]!) {\n    completeMaintenanceTasks(ids: $ids)\n  }\n"): (typeof documents)["\n  mutation CompleteMaintenanceTasks($ids: [ID!]!) {\n    completeMaintenanceTasks(ids: $ids)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription MaintenanceChanged {\n    maintenanceChanged\n  }\n"): (typeof documents)["\n  subscription MaintenanceChanged {\n    maintenanceChanged\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      id\n      username\n      name\n      avatarPath\n      theme\n      timeFormat\n      temperatureUnit\n      hapticsEnabled\n      createdAt\n      mustChangePassword\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n      username\n      name\n      avatarPath\n      theme\n      timeFormat\n      temperatureUnit\n      hapticsEnabled\n      createdAt\n      mustChangePassword\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment RoomFields on Room {\n    id\n    name\n    icon\n    members {\n      id\n      memberType\n      memberId\n    }\n    resolvedDevices {\n      id\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment RoomFields on Room {\n    id\n    name\n    icon\n    members {\n      id\n      memberType\n      memberId\n    }\n    resolvedDevices {\n      id\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RoomsStore {\n    rooms {\n      ...RoomFields\n    }\n  }\n"): (typeof documents)["\n  query RoomsStore {\n    rooms {\n      ...RoomFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RoomsStoreCreate($input: CreateRoomInput!) {\n    createRoom(input: $input) {\n      ...RoomFields\n    }\n  }\n"): (typeof documents)["\n  mutation RoomsStoreCreate($input: CreateRoomInput!) {\n    createRoom(input: $input) {\n      ...RoomFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RoomsStoreUpdate($id: ID!, $input: UpdateRoomInput!) {\n    updateRoom(id: $id, input: $input) {\n      ...RoomFields\n    }\n  }\n"): (typeof documents)["\n  mutation RoomsStoreUpdate($id: ID!, $input: UpdateRoomInput!) {\n    updateRoom(id: $id, input: $input) {\n      ...RoomFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RoomsStoreDelete($id: ID!) {\n    deleteRoom(id: $id)\n  }\n"): (typeof documents)["\n  mutation RoomsStoreDelete($id: ID!) {\n    deleteRoom(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RoomsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteRooms(ids: $ids)\n  }\n"): (typeof documents)["\n  mutation RoomsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteRooms(ids: $ids)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RoomsStoreAddMember($input: AddRoomMemberInput!) {\n    addRoomMember(input: $input) {\n      ...RoomFields\n    }\n  }\n"): (typeof documents)["\n  mutation RoomsStoreAddMember($input: AddRoomMemberInput!) {\n    addRoomMember(input: $input) {\n      ...RoomFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RoomsStoreRemoveMember($id: ID!) {\n    removeRoomMember(id: $id) {\n      ...RoomFields\n    }\n  }\n"): (typeof documents)["\n  mutation RoomsStoreRemoveMember($id: ID!) {\n    removeRoomMember(id: $id) {\n      ...RoomFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment SceneFields on Scene {\n    id\n    name\n    icon\n    rooms {\n      id\n      name\n      icon\n    }\n    targets {\n      targetType\n      targetId\n      name\n      target {\n        ... on Device {\n          id\n          deviceName: name\n          friendlyName\n          type\n        }\n        ... on Group {\n          id\n          groupName: name\n          friendlyName\n          icon\n          removed\n        }\n        ... on Room {\n          id\n          name\n          icon\n        }\n      }\n      expression {\n        connector\n        subject\n        op\n        values\n      }\n    }\n    lighting {\n      dynamicSource {\n        domain\n        sourceKind\n        presetId\n        presetTitle\n        seed\n        brightness\n        movement\n        cycleSeconds\n      }\n      overrides {\n        deviceId\n        kind\n        state {\n          on\n          brightness\n          colorTemp\n          color {\n            r\n            g\n            b\n            x\n            y\n          }\n          transition\n          targetTemperature\n          hvacMode\n          fanMode\n          swing\n        }\n        effectId\n        nativeEffectName\n      }\n    }\n    supportingStates {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n      }\n    }\n    preview {\n      width\n      height\n      pixels {\n        r\n        g\n        b\n      }\n      swatches {\n        x\n        y\n        color {\n          r\n          g\n          b\n        }\n      }\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n    activatedAt\n  }\n"): (typeof documents)["\n  fragment SceneFields on Scene {\n    id\n    name\n    icon\n    rooms {\n      id\n      name\n      icon\n    }\n    targets {\n      targetType\n      targetId\n      name\n      target {\n        ... on Device {\n          id\n          deviceName: name\n          friendlyName\n          type\n        }\n        ... on Group {\n          id\n          groupName: name\n          friendlyName\n          icon\n          removed\n        }\n        ... on Room {\n          id\n          name\n          icon\n        }\n      }\n      expression {\n        connector\n        subject\n        op\n        values\n      }\n    }\n    lighting {\n      dynamicSource {\n        domain\n        sourceKind\n        presetId\n        presetTitle\n        seed\n        brightness\n        movement\n        cycleSeconds\n      }\n      overrides {\n        deviceId\n        kind\n        state {\n          on\n          brightness\n          colorTemp\n          color {\n            r\n            g\n            b\n            x\n            y\n          }\n          transition\n          targetTemperature\n          hvacMode\n          fanMode\n          swing\n        }\n        effectId\n        nativeEffectName\n      }\n    }\n    supportingStates {\n      deviceId\n      state {\n        on\n        brightness\n        colorTemp\n        color {\n          r\n          g\n          b\n          x\n          y\n        }\n        transition\n        targetTemperature\n        hvacMode\n        fanMode\n        swing\n      }\n    }\n    preview {\n      width\n      height\n      pixels {\n        r\n        g\n        b\n      }\n      swatches {\n        x\n        y\n        color {\n          r\n          g\n          b\n        }\n      }\n    }\n    createdBy {\n      id\n      username\n      name\n    }\n    activatedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ScenesStore {\n    scenes {\n      ...SceneFields\n    }\n  }\n"): (typeof documents)["\n  query ScenesStore {\n    scenes {\n      ...SceneFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ScenesStoreCreate($input: CreateSceneInput!) {\n    createScene(input: $input) {\n      ...SceneFields\n    }\n  }\n"): (typeof documents)["\n  mutation ScenesStoreCreate($input: CreateSceneInput!) {\n    createScene(input: $input) {\n      ...SceneFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ScenesStoreUpdate($id: ID!, $input: UpdateSceneInput!) {\n    updateScene(id: $id, input: $input) {\n      ...SceneFields\n    }\n  }\n"): (typeof documents)["\n  mutation ScenesStoreUpdate($id: ID!, $input: UpdateSceneInput!) {\n    updateScene(id: $id, input: $input) {\n      ...SceneFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ScenesStoreDelete($id: ID!) {\n    deleteScene(id: $id)\n  }\n"): (typeof documents)["\n  mutation ScenesStoreDelete($id: ID!) {\n    deleteScene(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ScenesStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteScenes(ids: $ids)\n  }\n"): (typeof documents)["\n  mutation ScenesStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteScenes(ids: $ids)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ScenesStoreApply($sceneId: ID!) {\n    applyScene(sceneId: $sceneId) {\n      ...SceneFields\n    }\n  }\n"): (typeof documents)["\n  mutation ScenesStoreApply($sceneId: ID!) {\n    applyScene(sceneId: $sceneId) {\n      ...SceneFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ScenesStoreStop($sceneId: ID!) {\n    deactivateScene(sceneId: $sceneId) {\n      ...SceneFields\n    }\n  }\n"): (typeof documents)["\n  mutation ScenesStoreStop($sceneId: ID!) {\n    deactivateScene(sceneId: $sceneId) {\n      ...SceneFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription ScenesStoreActiveChanged {\n    sceneActiveChanged {\n      sceneId\n      activatedAt\n    }\n  }\n"): (typeof documents)["\n  subscription ScenesStoreActiveChanged {\n    sceneActiveChanged {\n      sceneId\n      activatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query VibeCatalog {\n    vibePresets {\n      id\n      title\n      category\n      domain\n      seed\n      brightness\n      movement\n      cycleSeconds\n      preview {\n        width\n        height\n        pixels {\n          r\n          g\n          b\n        }\n        swatches {\n          x\n          y\n          color {\n            r\n            g\n            b\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query VibeCatalog {\n    vibePresets {\n      id\n      title\n      category\n      domain\n      seed\n      brightness\n      movement\n      cycleSeconds\n      preview {\n        width\n        height\n        pixels {\n          r\n          g\n          b\n        }\n        swatches {\n          x\n          y\n          color {\n            r\n            g\n            b\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment WebhookEndpointFields on WebhookEndpoint {\n    id\n    name\n    enabled\n    rateLimitCount\n    rateLimitWindowMs\n    createdAt\n    updatedAt\n    lastDeliveryAt\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment WebhookEndpointFields on WebhookEndpoint {\n    id\n    name\n    enabled\n    rateLimitCount\n    rateLimitWindowMs\n    createdAt\n    updatedAt\n    lastDeliveryAt\n    createdBy {\n      id\n      username\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query WebhookEndpointsStore {\n    webhookEndpoints {\n      ...WebhookEndpointFields\n    }\n  }\n"): (typeof documents)["\n  query WebhookEndpointsStore {\n    webhookEndpoints {\n      ...WebhookEndpointFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation WebhookEndpointsStoreCreate($input: CreateWebhookEndpointInput!) {\n    createWebhookEndpoint(input: $input) {\n      endpoint {\n        ...WebhookEndpointFields\n      }\n      secretPath\n    }\n  }\n"): (typeof documents)["\n  mutation WebhookEndpointsStoreCreate($input: CreateWebhookEndpointInput!) {\n    createWebhookEndpoint(input: $input) {\n      endpoint {\n        ...WebhookEndpointFields\n      }\n      secretPath\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation WebhookEndpointsStoreUpdate($id: ID!, $input: UpdateWebhookEndpointInput!) {\n    updateWebhookEndpoint(id: $id, input: $input) {\n      ...WebhookEndpointFields\n    }\n  }\n"): (typeof documents)["\n  mutation WebhookEndpointsStoreUpdate($id: ID!, $input: UpdateWebhookEndpointInput!) {\n    updateWebhookEndpoint(id: $id, input: $input) {\n      ...WebhookEndpointFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation WebhookEndpointsStoreRotate($id: ID!) {\n    rotateWebhookEndpointSecret(id: $id) {\n      endpoint {\n        ...WebhookEndpointFields\n      }\n      secretPath\n    }\n  }\n"): (typeof documents)["\n  mutation WebhookEndpointsStoreRotate($id: ID!) {\n    rotateWebhookEndpointSecret(id: $id) {\n      endpoint {\n        ...WebhookEndpointFields\n      }\n      secretPath\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation WebhookEndpointsStoreDelete($id: ID!) {\n    deleteWebhookEndpoint(id: $id)\n  }\n"): (typeof documents)["\n  mutation WebhookEndpointsStoreDelete($id: ID!) {\n    deleteWebhookEndpoint(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation WebhookEndpointsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteWebhookEndpoints(ids: $ids)\n  }\n"): (typeof documents)["\n  mutation WebhookEndpointsStoreBatchDelete($ids: [ID!]!) {\n    batchDeleteWebhookEndpoints(ids: $ids)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription WebhookEndpointsStoreDeliveryRecorded {\n    webhookDeliveryRecorded {\n      id\n      endpointId\n      receivedAt\n    }\n  }\n"): (typeof documents)["\n  subscription WebhookEndpointsStoreDeliveryRecorded {\n    webhookDeliveryRecorded {\n      id\n      endpointId\n      receivedAt\n    }\n  }\n"];
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
export function graphql(source: "\n\t\tmutation AutomationEditUpdate($id: ID!, $input: UpdateAutomationInput!) {\n\t\t\tupdateAutomation(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tcompilable\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t\tpositionX\n\t\t\t\t\tpositionY\n\t\t\t\t\truntimeState\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation AutomationEditUpdate($id: ID!, $input: UpdateAutomationInput!) {\n\t\t\tupdateAutomation(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tenabled\n\t\t\t\tcompilable\n\t\t\t\tnodes {\n\t\t\t\t\tid\n\t\t\t\t\ttype\n\t\t\t\t\tconfig\n\t\t\t\t\tpositionX\n\t\t\t\t\tpositionY\n\t\t\t\t\truntimeState\n\t\t\t\t}\n\t\t\t\tedges {\n\t\t\t\t\tfromNodeId\n\t\t\t\t\ttoNodeId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation AutomationEditFireTrigger($automationId: ID!, $nodeId: ID!) {\n\t\t\tfireAutomationTrigger(automationId: $automationId, nodeId: $nodeId)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation AutomationEditFireTrigger($automationId: ID!, $nodeId: ID!) {\n\t\t\tfireAutomationTrigger(automationId: $automationId, nodeId: $nodeId)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery AutomationEditEffects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery AutomationEditEffects {\n\t\t\teffects {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t\tnativeEffectOptions {\n\t\t\t\tname\n\t\t\t\tdisplayName\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery AutomationEditGroupReference($id: ID!) {\n\t\t\tgroup(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tfriendlyName\n\t\t\t\tsource\n\t\t\t\tremoved\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery AutomationEditGroupReference($id: ID!) {\n\t\t\tgroup(id: $id) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tfriendlyName\n\t\t\t\tsource\n\t\t\t\tremoved\n\t\t\t\tmembers {\n\t\t\t\t\tid\n\t\t\t\t\tmemberType\n\t\t\t\t\tmemberId\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription AutomationEditNodeActivated($automationId: ID) {\n\t\t\tautomationNodeActivated(automationId: $automationId) {\n\t\t\t\tautomationId\n\t\t\t\tnodeId\n\t\t\t\tactive\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription AutomationEditNodeActivated($automationId: ID) {\n\t\t\tautomationNodeActivated(automationId: $automationId) {\n\t\t\t\tautomationId\n\t\t\t\tnodeId\n\t\t\t\tactive\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation completeFirstPasswordChange($newPassword: String!) {\n\t\t\tcompleteFirstPasswordChange(newPassword: $newPassword)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation completeFirstPasswordChange($newPassword: String!) {\n\t\t\tcompleteFirstPasswordChange(newPassword: $newPassword)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation SetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation SetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {\n\t\t\tsetTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceDetailSetConfiguration(\n\t\t\t$deviceId: ID!\n\t\t\t$settings: [DeviceConfigurationEntryInput!]!\n\t\t) {\n\t\t\tsetDeviceConfiguration(deviceId: $deviceId, settings: $settings)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceDetailSetConfiguration(\n\t\t\t$deviceId: ID!\n\t\t\t$settings: [DeviceConfigurationEntryInput!]!\n\t\t) {\n\t\t\tsetDeviceConfiguration(deviceId: $deviceId, settings: $settings)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceDetailUpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n\t\t\tupdateDevice(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\troles {\n\t\t\t\t\tcontrolledLoad\n\t\t\t\t\tcontact\n\t\t\t\t}\n\t\t\t\tdisabled\n\t\t\t\tfriendlyName\n\t\t\t\tseen\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceDetailUpdateDevice($id: ID!, $input: UpdateDeviceInput!) {\n\t\t\tupdateDevice(id: $id, input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\troles {\n\t\t\t\t\tcontrolledLoad\n\t\t\t\t\tcontact\n\t\t\t\t}\n\t\t\t\tdisabled\n\t\t\t\tfriendlyName\n\t\t\t\tseen\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceDetailDeleteDevice($id: ID!) {\n\t\t\tdeleteDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceDetailDeleteDevice($id: ID!) {\n\t\t\tdeleteDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeviceDetailRestoreDevice($id: ID!) {\n\t\t\trestoreDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeviceDetailRestoreDevice($id: ID!) {\n\t\t\trestoreDevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tdisabled\n\t\t\t\tdeleted\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery DeviceZigbeeDetail($id: ID!) {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tfrontendUrl\n\t\t\t}\n\t\t\tdevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tsource\n\t\t\t\tzigbee2Mqtt {\n\t\t\t\t\timageCandidate\n\t\t\t\t\timageVersion\n\t\t\t\t\tnetworkType\n\t\t\t\t\tieeeAddress\n\t\t\t\t\taddressVendor\n\t\t\t\t\tnetworkAddress\n\t\t\t\t\tsupported\n\t\t\t\t\tinterviewState\n\t\t\t\t\tinterviewCompleted\n\t\t\t\t\tinterviewing\n\t\t\t\t\tdescription\n\t\t\t\t\tmanufacturer\n\t\t\t\t\tmodelId\n\t\t\t\t\tpowerSource\n\t\t\t\t\tsoftwareBuildId\n\t\t\t\t\tdateCode\n\t\t\t\t\tdefinitionUrl\n\t\t\t\t\tdefinition {\n\t\t\t\t\t\tmodel\n\t\t\t\t\t\tvendor\n\t\t\t\t\t\tdescription\n\t\t\t\t\t\tsource\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tsupportsOta\n\t\t\t\t\t}\n\t\t\t\t\tota {\n\t\t\t\t\t\tstate\n\t\t\t\t\t\tinstalledVersion\n\t\t\t\t\t\tlatestVersion\n\t\t\t\t\t\tprogress\n\t\t\t\t\t}\n\t\t\t\t\tendpoints {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tprofileId\n\t\t\t\t\t\tdeviceId\n\t\t\t\t\t\tinputClusters\n\t\t\t\t\t\toutputClusters\n\t\t\t\t\t\tbindings {\n\t\t\t\t\t\t\tcluster\n\t\t\t\t\t\t\ttargetType\n\t\t\t\t\t\t\ttargetIeeeAddress\n\t\t\t\t\t\t\ttargetEndpoint\n\t\t\t\t\t\t\ttargetGroupId\n\t\t\t\t\t\t}\n\t\t\t\t\t\treportings {\n\t\t\t\t\t\t\tcluster\n\t\t\t\t\t\t\tattribute\n\t\t\t\t\t\t\tminimumReportInterval\n\t\t\t\t\t\t\tmaximumReportInterval\n\t\t\t\t\t\t\treportableChange\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tgroups {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tproviderGroupId\n\t\t\t\t\t\tname\n\t\t\t\t\t\tendpoint\n\t\t\t\t\t}\n\t\t\t\t\tbridgeInfo {\n\t\t\t\t\t\tadapterType\n\t\t\t\t\t\tfirmwareVersion\n\t\t\t\t\t\tchannel\n\t\t\t\t\t\tpanId\n\t\t\t\t\t\textendedPanId\n\t\t\t\t\t\tzigbee2MqttVersion\n\t\t\t\t\t\tzigbee2MqttCommit\n\t\t\t\t\t\tzigbeeHerdsmanVersion\n\t\t\t\t\t\tzigbeeHerdsmanConvertersVersion\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery DeviceZigbeeDetail($id: ID!) {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tfrontendUrl\n\t\t\t}\n\t\t\tdevice(id: $id) {\n\t\t\t\tid\n\t\t\t\tsource\n\t\t\t\tzigbee2Mqtt {\n\t\t\t\t\timageCandidate\n\t\t\t\t\timageVersion\n\t\t\t\t\tnetworkType\n\t\t\t\t\tieeeAddress\n\t\t\t\t\taddressVendor\n\t\t\t\t\tnetworkAddress\n\t\t\t\t\tsupported\n\t\t\t\t\tinterviewState\n\t\t\t\t\tinterviewCompleted\n\t\t\t\t\tinterviewing\n\t\t\t\t\tdescription\n\t\t\t\t\tmanufacturer\n\t\t\t\t\tmodelId\n\t\t\t\t\tpowerSource\n\t\t\t\t\tsoftwareBuildId\n\t\t\t\t\tdateCode\n\t\t\t\t\tdefinitionUrl\n\t\t\t\t\tdefinition {\n\t\t\t\t\t\tmodel\n\t\t\t\t\t\tvendor\n\t\t\t\t\t\tdescription\n\t\t\t\t\t\tsource\n\t\t\t\t\t\ticon\n\t\t\t\t\t\tsupportsOta\n\t\t\t\t\t}\n\t\t\t\t\tota {\n\t\t\t\t\t\tstate\n\t\t\t\t\t\tinstalledVersion\n\t\t\t\t\t\tlatestVersion\n\t\t\t\t\t\tprogress\n\t\t\t\t\t}\n\t\t\t\t\tendpoints {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tprofileId\n\t\t\t\t\t\tdeviceId\n\t\t\t\t\t\tinputClusters\n\t\t\t\t\t\toutputClusters\n\t\t\t\t\t\tbindings {\n\t\t\t\t\t\t\tcluster\n\t\t\t\t\t\t\ttargetType\n\t\t\t\t\t\t\ttargetIeeeAddress\n\t\t\t\t\t\t\ttargetEndpoint\n\t\t\t\t\t\t\ttargetGroupId\n\t\t\t\t\t\t}\n\t\t\t\t\t\treportings {\n\t\t\t\t\t\t\tcluster\n\t\t\t\t\t\t\tattribute\n\t\t\t\t\t\t\tminimumReportInterval\n\t\t\t\t\t\t\tmaximumReportInterval\n\t\t\t\t\t\t\treportableChange\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tgroups {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tproviderGroupId\n\t\t\t\t\t\tname\n\t\t\t\t\t\tendpoint\n\t\t\t\t\t}\n\t\t\t\t\tbridgeInfo {\n\t\t\t\t\t\tadapterType\n\t\t\t\t\t\tfirmwareVersion\n\t\t\t\t\t\tchannel\n\t\t\t\t\t\tpanId\n\t\t\t\t\t\textendedPanId\n\t\t\t\t\t\tzigbee2MqttVersion\n\t\t\t\t\t\tzigbee2MqttCommit\n\t\t\t\t\t\tzigbeeHerdsmanVersion\n\t\t\t\t\t\tzigbeeHerdsmanConvertersVersion\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery DeviceZigbeeDocumentation($id: ID!) {\n\t\t\tdevice(id: $id) {\n\t\t\t\tzigbee2Mqtt {\n\t\t\t\t\tdocumentation {\n\t\t\t\t\t\tsourceUrl\n\t\t\t\t\t\tlastCheckedAt\n\t\t\t\t\t\tmodel\n\t\t\t\t\t\tvendor\n\t\t\t\t\t\tdescription\n\t\t\t\t\t\texposes\n\t\t\t\t\t\tbatteryType\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery DeviceZigbeeDocumentation($id: ID!) {\n\t\t\tdevice(id: $id) {\n\t\t\t\tzigbee2Mqtt {\n\t\t\t\t\tdocumentation {\n\t\t\t\t\t\tsourceUrl\n\t\t\t\t\t\tlastCheckedAt\n\t\t\t\t\t\tmodel\n\t\t\t\t\t\tvendor\n\t\t\t\t\t\tdescription\n\t\t\t\t\t\texposes\n\t\t\t\t\t\tbatteryType\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation EffectEditUpdate($input: UpdateEffectInput!) {\n\t\t\tupdateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tindex\n\t\t\t\t\tname\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tstartMs\n\t\t\t\t\t\ttransitionMinMs\n\t\t\t\t\t\ttransitionMaxMs\n\t\t\t\t\t\tkind\n\t\t\t\t\t\tconfig\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation EffectEditUpdate($input: UpdateEffectInput!) {\n\t\t\tupdateEffect(input: $input) {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\ticon\n\t\t\t\tloop\n\t\t\t\tdurationMs\n\t\t\t\trequiredCapabilities\n\t\t\t\ttracks {\n\t\t\t\t\tid\n\t\t\t\t\tindex\n\t\t\t\t\tname\n\t\t\t\t\tclips {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tstartMs\n\t\t\t\t\t\ttransitionMinMs\n\t\t\t\t\t\ttransitionMaxMs\n\t\t\t\t\t\tkind\n\t\t\t\t\t\tconfig\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery IntegrationsPage {\n\t\t\tintegrations {\n\t\t\t\tprovider\n\t\t\t\tname\n\t\t\t\tconfigured\n\t\t\t\tenabled\n\t\t\t\tconnected\n\t\t\t\tdeviceCount\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery IntegrationsPage {\n\t\t\tintegrations {\n\t\t\t\tprovider\n\t\t\t\tname\n\t\t\t\tconfigured\n\t\t\t\tenabled\n\t\t\t\tconnected\n\t\t\t\tdeviceCount\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation DeleteIntegration($provider: String!) {\n\t\t\tdeleteIntegration(provider: $provider)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation DeleteIntegration($provider: String!) {\n\t\t\tdeleteIntegration(provider: $provider)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery TuyaConfigPage {\n\t\t\ttuyaConfig {\n\t\t\t\taccessId\n\t\t\t\taccessSecret\n\t\t\t\tregion\n\t\t\t\tenabled\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery TuyaConfigPage {\n\t\t\ttuyaConfig {\n\t\t\t\taccessId\n\t\t\t\taccessSecret\n\t\t\t\tregion\n\t\t\t\tenabled\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation UpdateTuyaConfig($input: TuyaConfigInput!) {\n\t\t\tupdateTuyaConfig(input: $input) {\n\t\t\t\taccessId\n\t\t\t\taccessSecret\n\t\t\t\tregion\n\t\t\t\tenabled\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation UpdateTuyaConfig($input: TuyaConfigInput!) {\n\t\t\tupdateTuyaConfig(input: $input) {\n\t\t\t\taccessId\n\t\t\t\taccessSecret\n\t\t\t\tregion\n\t\t\t\tenabled\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation TestTuyaConnection($input: TuyaConfigInput!) {\n\t\t\ttestTuyaConnection(input: $input) {\n\t\t\t\tsuccess\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation TestTuyaConnection($input: TuyaConfigInput!) {\n\t\t\ttestTuyaConnection(input: $input) {\n\t\t\t\tsuccess\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation SyncTuyaDevices {\n\t\t\tsyncTuyaDevices {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation SyncTuyaDevices {\n\t\t\tsyncTuyaDevices {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Zigbee2MqttConfigPage {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tbroker\n\t\t\t\tfrontendUrl\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t\tenabled\n\t\t\t\tscanScheduleEnabled\n\t\t\t\tscanHour\n\t\t\t\tscanMinute\n\t\t\t\tscanStartedAt\n\t\t\t\tinteractiveCommandsPerSecond\n\t\t\t\tcontinuousCommandsPerSecond\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Zigbee2MqttConfigPage {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tbroker\n\t\t\t\tfrontendUrl\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t\tenabled\n\t\t\t\tscanScheduleEnabled\n\t\t\t\tscanHour\n\t\t\t\tscanMinute\n\t\t\t\tscanStartedAt\n\t\t\t\tinteractiveCommandsPerSecond\n\t\t\t\tcontinuousCommandsPerSecond\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation UpdateZigbee2MqttConfig($input: Zigbee2MqttConfigInput!) {\n\t\t\tupdateZigbee2MqttConfig(input: $input) {\n\t\t\t\tbroker\n\t\t\t\tfrontendUrl\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t\tenabled\n\t\t\t\tscanScheduleEnabled\n\t\t\t\tscanHour\n\t\t\t\tscanMinute\n\t\t\t\tscanStartedAt\n\t\t\t\tinteractiveCommandsPerSecond\n\t\t\t\tcontinuousCommandsPerSecond\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation UpdateZigbee2MqttConfig($input: Zigbee2MqttConfigInput!) {\n\t\t\tupdateZigbee2MqttConfig(input: $input) {\n\t\t\t\tbroker\n\t\t\t\tfrontendUrl\n\t\t\t\tusername\n\t\t\t\tpassword\n\t\t\t\tuseWss\n\t\t\t\tenabled\n\t\t\t\tscanScheduleEnabled\n\t\t\t\tscanHour\n\t\t\t\tscanMinute\n\t\t\t\tscanStartedAt\n\t\t\t\tinteractiveCommandsPerSecond\n\t\t\t\tcontinuousCommandsPerSecond\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation TestZigbee2MqttConnection($input: Zigbee2MqttConfigInput!) {\n\t\t\ttestZigbee2MqttConnection(input: $input) {\n\t\t\t\tsuccess\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation TestZigbee2MqttConnection($input: Zigbee2MqttConfigInput!) {\n\t\t\ttestZigbee2MqttConnection(input: $input) {\n\t\t\t\tsuccess\n\t\t\t\tmessage\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation ScanZigbee2MqttNetwork {\n\t\t\tscanZigbee2MqttNetwork\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation ScanZigbee2MqttNetwork {\n\t\t\tscanZigbee2MqttNetwork\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Zigbee2MqttScanState {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tscanStartedAt\n\t\t\t}\n\t\t\tnetworkTopologies {\n\t\t\t\tprovider\n\t\t\t\tscannedAt\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Zigbee2MqttScanState {\n\t\t\tzigbee2MqttConfig {\n\t\t\t\tscanStartedAt\n\t\t\t}\n\t\t\tnetworkTopologies {\n\t\t\t\tprovider\n\t\t\t\tscannedAt\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription Zigbee2MqttScanUpdates($provider: String) {\n\t\t\tnetworkTopologyUpdated(provider: $provider) {\n\t\t\t\tprovider\n\t\t\t\tscannedAt\n\t\t\t\tnodeCount\n\t\t\t\tlinkCount\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription Zigbee2MqttScanUpdates($provider: String) {\n\t\t\tnetworkTopologyUpdated(provider: $provider) {\n\t\t\t\tprovider\n\t\t\t\tscannedAt\n\t\t\t\tnodeCount\n\t\t\t\tlinkCount\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation login($input: LoginInput!) {\n\t\t\tlogin(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t\tavatarPath\n\t\t\t\t\ttheme\n\t\t\t\t\ttimeFormat\n\t\t\t\t\ttemperatureUnit\n\t\t\t\t\thapticsEnabled\n\t\t\t\t\tcreatedAt\n\t\t\t\t\tmustChangePassword\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation login($input: LoginInput!) {\n\t\t\tlogin(input: $input) {\n\t\t\t\ttoken\n\t\t\t\tuser {\n\t\t\t\t\tid\n\t\t\t\t\tusername\n\t\t\t\t\tname\n\t\t\t\t\tavatarPath\n\t\t\t\t\ttheme\n\t\t\t\t\ttimeFormat\n\t\t\t\t\ttemperatureUnit\n\t\t\t\t\thapticsEnabled\n\t\t\t\t\tcreatedAt\n\t\t\t\t\tmustChangePassword\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t"];
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
export function graphql(source: "\n\t\tmutation ProfileUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n\t\t\tupdateCurrentUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t\ttheme\n\t\t\t\ttimeFormat\n\t\t\t\ttemperatureUnit\n\t\t\t\thapticsEnabled\n\t\t\t\tcreatedAt\n\t\t\t\tmustChangePassword\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation ProfileUpdateCurrentUser($input: UpdateCurrentUserInput!) {\n\t\t\tupdateCurrentUser(input: $input) {\n\t\t\t\tid\n\t\t\t\tusername\n\t\t\t\tname\n\t\t\t\tavatarPath\n\t\t\t\ttheme\n\t\t\t\ttimeFormat\n\t\t\t\ttemperatureUnit\n\t\t\t\thapticsEnabled\n\t\t\t\tcreatedAt\n\t\t\t\tmustChangePassword\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation ProfileChangePassword($input: ChangePasswordInput!) {\n\t\t\tchangePassword(input: $input)\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation ProfileChangePassword($input: ChangePasswordInput!) {\n\t\t\tchangePassword(input: $input)\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tmutation ProfileForceLogoutAll {\n\t\t\tforceLogoutAllSessions\n\t\t}\n\t"): (typeof documents)["\n\t\tmutation ProfileForceLogoutAll {\n\t\t\tforceLogoutAllSessions\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery SceneEditorEffects {\n\t\t\teffects { id name icon kind nativeName loop requiredCapabilities }\n\t\t}\n\t"): (typeof documents)["\n\t\tquery SceneEditorEffects {\n\t\t\teffects { id name icon kind nativeName loop requiredCapabilities }\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery Settings {\n\t\t\tsettings {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery Settings {\n\t\t\tsettings {\n\t\t\t\tkey\n\t\t\t\tvalue\n\t\t\t}\n\t\t}\n\t"];
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
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tquery WebhookDetailDeliveries($endpointId: ID!, $limit: Int) {\n\t\t\twebhookDeliveries(endpointId: $endpointId, limit: $limit) {\n\t\t\t\tid\n\t\t\t\tendpointId\n\t\t\t\treceivedAt\n\t\t\t\toutcome\n\t\t\t\thttpStatus\n\t\t\t\tclientIp\n\t\t\t\tuserAgent\n\t\t\t\tcontentType\n\t\t\t\tbodySize\n\t\t\t\tbody\n\t\t\t\tdurationMs\n\t\t\t\trequestId\n\t\t\t\tqueryKeys\n\t\t\t\theaderNames\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tquery WebhookDetailDeliveries($endpointId: ID!, $limit: Int) {\n\t\t\twebhookDeliveries(endpointId: $endpointId, limit: $limit) {\n\t\t\t\tid\n\t\t\t\tendpointId\n\t\t\t\treceivedAt\n\t\t\t\toutcome\n\t\t\t\thttpStatus\n\t\t\t\tclientIp\n\t\t\t\tuserAgent\n\t\t\t\tcontentType\n\t\t\t\tbodySize\n\t\t\t\tbody\n\t\t\t\tdurationMs\n\t\t\t\trequestId\n\t\t\t\tqueryKeys\n\t\t\t\theaderNames\n\t\t\t}\n\t\t}\n\t"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\t\tsubscription WebhookDetailDeliveryRecorded($endpointId: ID) {\n\t\t\twebhookDeliveryRecorded(endpointId: $endpointId) {\n\t\t\t\tid\n\t\t\t\tendpointId\n\t\t\t\treceivedAt\n\t\t\t\toutcome\n\t\t\t\thttpStatus\n\t\t\t\tclientIp\n\t\t\t\tuserAgent\n\t\t\t\tcontentType\n\t\t\t\tbodySize\n\t\t\t\tbody\n\t\t\t\tdurationMs\n\t\t\t\trequestId\n\t\t\t\tqueryKeys\n\t\t\t\theaderNames\n\t\t\t}\n\t\t}\n\t"): (typeof documents)["\n\t\tsubscription WebhookDetailDeliveryRecorded($endpointId: ID) {\n\t\t\twebhookDeliveryRecorded(endpointId: $endpointId) {\n\t\t\t\tid\n\t\t\t\tendpointId\n\t\t\t\treceivedAt\n\t\t\t\toutcome\n\t\t\t\thttpStatus\n\t\t\t\tclientIp\n\t\t\t\tuserAgent\n\t\t\t\tcontentType\n\t\t\t\tbodySize\n\t\t\t\tbody\n\t\t\t\tdurationMs\n\t\t\t\trequestId\n\t\t\t\tqueryKeys\n\t\t\t\theaderNames\n\t\t\t}\n\t\t}\n\t"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;