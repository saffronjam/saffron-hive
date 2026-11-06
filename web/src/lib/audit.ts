import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import { sentenceCase } from "$lib/utils";

/** Presents audit identifiers in sentence case while keeping their wire values intact. */
export function auditLabel(value: string): string {
  return sentenceCase(
    value
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[._-]/g, " ")
      .toLowerCase(),
  );
}

/** Omits actor subtitles that repeat the displayed name or identify a human. */
export function auditActorSourceLabel(record: { actorName: string; source: string }): string {
  const label = auditLabel(record.source);
  return record.source === "human" ||
    label.toLocaleLowerCase() === sentenceCase(record.actorName.trim()).toLocaleLowerCase()
    ? ""
    : label;
}

/** Selects the established status palette for an audit result chip. */
export function auditResultChipClass(value: string): string {
  switch (value) {
    case "succeeded":
    case "completed":
    case "confirmed":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    case "failed":
    case "denied":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
    case "partial":
    case "pending":
    case "rejected":
    case "interrupted":
    case "stale":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
    case "accepted":
    case "running":
      return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20";
    default:
      return "";
  }
}

type AuditVerb =
  | "created"
  | "updated"
  | "deleted"
  | "added"
  | "removed"
  | "restored"
  | "synced"
  | "applied"
  | "deactivated"
  | "started"
  | "stopped"
  | "ran"
  | "set"
  | "changed"
  | "requested"
  | "sent"
  | "confirmed"
  | "triggered"
  | "enabled"
  | "disabled"
  | "toggled"
  | "completed"
  | "attempted"
  | "extended"
  | "reset"
  | "rotated"
  | "ended"
  | "raised"
  | "marked"
  | "simulated"
  | "discovered"
  | "tested"
  | "superseded"
  | "summarized";
type AuditNoun =
  | "device"
  | "devices"
  | "alarm"
  | "alarms"
  | "automation"
  | "automations"
  | "scene"
  | "scenes"
  | "effect"
  | "effects"
  | "room"
  | "rooms"
  | "group"
  | "groups"
  | "user"
  | "users"
  | "guest"
  | "guests"
  | "setting"
  | "settings"
  | "integration"
  | "integrations"
  | "floorplan"
  | "floorplans"
  | "webhook"
  | "webhooks"
  | "group_member"
  | "group_members"
  | "room_member"
  | "room_members"
  | "device_state"
  | "device_settings"
  | "device_command"
  | "device_action"
  | "scene_target"
  | "scene_lighting"
  | "scene_override"
  | "automation_node"
  | "automation_edge"
  | "effect_track"
  | "effect_clip"
  | "group_tag"
  | "floorplan_vertex"
  | "floorplan_wall"
  | "floorplan_room"
  | "floorplan_placement"
  | "floorplan_opening"
  | "floorplan_furniture"
  | "floorplan_door_binding"
  | "maintenance_task"
  | "maintenance_tasks"
  | "translation"
  | "translations"
  | "profile"
  | "password"
  | "avatar"
  | "sessions"
  | "guest_access"
  | "guest_language"
  | "webhook_secret"
  | "sign_in"
  | "guest_sign_in"
  | "network_scan"
  | "seen_devices"
  | "zigbee_connection"
  | "tuya_connection"
  | "claude_connection"
  | "zigbee_settings"
  | "tuya_settings"
  | "claude_settings"
  | "claude_models"
  | "tuya_devices"
  | "lighting"
  | "operation";

/** Identifies an audited operation independently of its result. */
export interface AuditActionRecord {
  operation: string;
  action: string;
  entityType: string;
}

const verbMessages: Readonly<Record<AuditVerb, typeof m.audit_action_verb_created>> = {
  created: m.audit_action_verb_created,
  updated: m.audit_action_verb_updated,
  deleted: m.audit_action_verb_deleted,
  added: m.audit_action_verb_added,
  removed: m.audit_action_verb_removed,
  restored: m.audit_action_verb_restored,
  synced: m.audit_action_verb_synced,
  applied: m.audit_action_verb_applied,
  deactivated: m.audit_action_verb_deactivated,
  started: m.audit_action_verb_started,
  stopped: m.audit_action_verb_stopped,
  ran: m.audit_action_verb_ran,
  set: m.audit_action_verb_set,
  changed: m.audit_action_verb_changed,
  requested: m.audit_action_verb_requested,
  sent: m.audit_action_verb_sent,
  confirmed: m.audit_action_verb_confirmed,
  triggered: m.audit_action_verb_triggered,
  enabled: m.audit_action_verb_enabled,
  disabled: m.audit_action_verb_disabled,
  toggled: m.audit_action_verb_toggled,
  completed: m.audit_action_verb_completed,
  attempted: m.audit_action_verb_attempted,
  extended: m.audit_action_verb_extended,
  reset: m.audit_action_verb_reset,
  rotated: m.audit_action_verb_rotated,
  ended: m.audit_action_verb_ended,
  raised: m.audit_action_verb_raised,
  marked: m.audit_action_verb_marked,
  simulated: m.audit_action_verb_simulated,
  discovered: m.audit_action_verb_discovered,
  tested: m.audit_action_verb_tested,
  superseded: m.audit_action_verb_superseded,
  summarized: m.audit_action_verb_summarized,
};

const nounMessages: Readonly<Record<AuditNoun, typeof m.audit_action_noun_device>> = {
  device: m.audit_action_noun_device,
  devices: m.audit_action_noun_devices,
  alarm: m.audit_action_noun_alarm,
  alarms: m.audit_action_noun_alarms,
  automation: m.audit_action_noun_automation,
  automations: m.audit_action_noun_automations,
  scene: m.audit_action_noun_scene,
  scenes: m.audit_action_noun_scenes,
  effect: m.audit_action_noun_effect,
  effects: m.audit_action_noun_effects,
  room: m.audit_action_noun_room,
  rooms: m.audit_action_noun_rooms,
  group: m.audit_action_noun_group,
  groups: m.audit_action_noun_groups,
  user: m.audit_action_noun_user,
  users: m.audit_action_noun_users,
  guest: m.audit_action_noun_guest,
  guests: m.audit_action_noun_guests,
  setting: m.audit_action_noun_setting,
  settings: m.audit_action_noun_settings,
  integration: m.audit_action_noun_integration,
  integrations: m.audit_action_noun_integrations,
  floorplan: m.audit_action_noun_floorplan,
  floorplans: m.audit_action_noun_floorplans,
  webhook: m.audit_action_noun_webhook,
  webhooks: m.audit_action_noun_webhooks,
  group_member: m.audit_action_noun_group_member,
  group_members: m.audit_action_noun_group_members,
  room_member: m.audit_action_noun_room_member,
  room_members: m.audit_action_noun_room_members,
  device_state: m.audit_action_noun_device_state,
  device_settings: m.audit_action_noun_device_settings,
  device_command: m.audit_action_noun_device_command,
  device_action: m.audit_action_noun_device_action,
  scene_target: m.audit_action_noun_scene_target,
  scene_lighting: m.audit_action_noun_scene_lighting,
  scene_override: m.audit_action_noun_scene_override,
  automation_node: m.audit_action_noun_automation_node,
  automation_edge: m.audit_action_noun_automation_edge,
  effect_track: m.audit_action_noun_effect_track,
  effect_clip: m.audit_action_noun_effect_clip,
  group_tag: m.audit_action_noun_group_tag,
  floorplan_vertex: m.audit_action_noun_floorplan_vertex,
  floorplan_wall: m.audit_action_noun_floorplan_wall,
  floorplan_room: m.audit_action_noun_floorplan_room,
  floorplan_placement: m.audit_action_noun_floorplan_placement,
  floorplan_opening: m.audit_action_noun_floorplan_opening,
  floorplan_furniture: m.audit_action_noun_floorplan_furniture,
  floorplan_door_binding: m.audit_action_noun_floorplan_door_binding,
  maintenance_task: m.audit_action_noun_maintenance_task,
  maintenance_tasks: m.audit_action_noun_maintenance_tasks,
  translation: m.audit_action_noun_translation,
  translations: m.audit_action_noun_translations,
  profile: m.audit_action_noun_profile,
  password: m.audit_action_noun_password,
  avatar: m.audit_action_noun_avatar,
  sessions: m.audit_action_noun_sessions,
  guest_access: m.audit_action_noun_guest_access,
  guest_language: m.audit_action_noun_guest_language,
  webhook_secret: m.audit_action_noun_webhook_secret,
  sign_in: m.audit_action_noun_sign_in,
  guest_sign_in: m.audit_action_noun_guest_sign_in,
  network_scan: m.audit_action_noun_network_scan,
  seen_devices: m.audit_action_noun_seen_devices,
  zigbee_connection: m.audit_action_noun_zigbee_connection,
  tuya_connection: m.audit_action_noun_tuya_connection,
  claude_connection: m.audit_action_noun_claude_connection,
  zigbee_settings: m.audit_action_noun_zigbee_settings,
  tuya_settings: m.audit_action_noun_tuya_settings,
  claude_settings: m.audit_action_noun_claude_settings,
  claude_models: m.audit_action_noun_claude_models,
  tuya_devices: m.audit_action_noun_tuya_devices,
  lighting: m.audit_action_noun_lighting,
  operation: m.audit_action_noun_operation,
};

interface AuditActionDescription {
  verb: AuditVerb;
  noun: AuditNoun;
}

const operationActions: Readonly<Record<string, AuditActionDescription>> = {
  login: { verb: "requested", noun: "sign_in" },
  guestLogin: { verb: "requested", noun: "guest_sign_in" },
  createInitialUser: { verb: "created", noun: "user" },
  updateCurrentUser: { verb: "updated", noun: "profile" },
  updateCurrentGuestLanguage: { verb: "updated", noun: "guest_language" },
  extendGuest: { verb: "extended", noun: "guest_access" },
  changePassword: { verb: "changed", noun: "password" },
  completeFirstPasswordChange: { verb: "changed", noun: "password" },
  resetUserPassword: { verb: "reset", noun: "password" },
  forceLogoutAllSessions: { verb: "ended", noun: "sessions" },
  setAvatar: { verb: "changed", noun: "avatar" },
  clearAvatar: { verb: "removed", noun: "avatar" },
  syncDevice: { verb: "synced", noun: "device" },
  syncTuyaDevices: { verb: "synced", noun: "tuya_devices" },
  updateZigbee2MqttConfig: { verb: "updated", noun: "zigbee_settings" },
  updateTuyaConfig: { verb: "updated", noun: "tuya_settings" },
  updateClaudeConfig: { verb: "updated", noun: "claude_settings" },
  testZigbee2MqttConnection: { verb: "tested", noun: "zigbee_connection" },
  testTuyaConnection: { verb: "tested", noun: "tuya_connection" },
  testClaudeConnection: { verb: "tested", noun: "claude_connection" },
  discoverClaudeModels: { verb: "discovered", noun: "claude_models" },
  scanZigbee2MqttNetwork: { verb: "requested", noun: "network_scan" },
  setTargetState: { verb: "set", noun: "device_state" },
  setDeviceConfiguration: { verb: "updated", noun: "device_settings" },
  runDeviceCommand: { verb: "ran", noun: "device_command" },
  simulateDeviceAction: { verb: "simulated", noun: "device_action" },
  fireAutomationTrigger: { verb: "triggered", noun: "automation" },
  rotateWebhookEndpointSecret: { verb: "rotated", noun: "webhook_secret" },
  updateLocalizedNameSet: { verb: "updated", noun: "translations" },
  completeMaintenanceTasks: { verb: "completed", noun: "maintenance_tasks" },
  markDevicesSeen: { verb: "marked", noun: "seen_devices" },
  command: { verb: "set", noun: "device_state" },
  configuration: { verb: "updated", noun: "device_settings" },
  deviceCommand: { verb: "ran", noun: "device_command" },
  continuousRun: { verb: "started", noun: "lighting" },
  automationRun: { verb: "ran", noun: "automation" },
  sceneRun: { verb: "applied", noun: "scene" },
  effectRun: { verb: "started", noun: "effect" },
  runEffect: { verb: "started", noun: "effect" },
  runNativeEffect: { verb: "started", noun: "effect" },
};

const operationNouns: readonly { match: string; singular: AuditNoun; plural: AuditNoun }[] = [
  { match: "WebhookEndpoint", singular: "webhook", plural: "webhooks" },
  { match: "GroupMember", singular: "group_member", plural: "group_members" },
  { match: "GroupDevices", singular: "group_member", plural: "group_members" },
  { match: "RoomMember", singular: "room_member", plural: "room_members" },
  { match: "Automation", singular: "automation", plural: "automations" },
  { match: "Scene", singular: "scene", plural: "scenes" },
  { match: "Effect", singular: "effect", plural: "effects" },
  { match: "Device", singular: "device", plural: "devices" },
  { match: "Room", singular: "room", plural: "rooms" },
  { match: "Group", singular: "group", plural: "groups" },
  { match: "User", singular: "user", plural: "users" },
  { match: "Guest", singular: "guest", plural: "guests" },
  { match: "Setting", singular: "setting", plural: "settings" },
  { match: "Integration", singular: "integration", plural: "integrations" },
  { match: "Alarm", singular: "alarm", plural: "alarms" },
  { match: "Floorplan", singular: "floorplan", plural: "floorplans" },
];

const operationVerbs: Readonly<Record<string, AuditVerb>> = {
  create: "created",
  update: "updated",
  save: "updated",
  delete: "deleted",
  restore: "restored",
  add: "added",
  remove: "removed",
  apply: "applied",
  deactivate: "deactivated",
  toggle: "toggled",
  raise: "raised",
  stop: "stopped",
};

const entityNouns: Readonly<Record<string, AuditNoun>> = {
  devices: "device",
  tuya_devices: "device",
  alarms: "alarm",
  automations: "automation",
  scenes: "scene",
  effects: "effect",
  rooms: "room",
  groups: "group",
  users: "user",
  guests: "guest",
  settings: "setting",
  floorplans: "floorplan",
  webhook_endpoints: "webhook",
  group_members: "group_member",
  room_members: "room_member",
  group_tags: "group_tag",
  effect_tracks: "effect_track",
  effect_clips: "effect_clip",
  automation_nodes: "automation_node",
  automation_edges: "automation_edge",
  scene_targets: "scene_target",
  scene_dynamic_sources: "scene_lighting",
  scene_dynamic_samples: "scene_lighting",
  scene_light_overrides: "scene_override",
  scene_supporting_states: "device_state",
  floorplan_vertices: "floorplan_vertex",
  floorplan_walls: "floorplan_wall",
  floorplan_rooms: "floorplan_room",
  floorplan_placements: "floorplan_placement",
  floorplan_openings: "floorplan_opening",
  floorplan_furniture: "floorplan_furniture",
  floorplan_door_bindings: "floorplan_door_binding",
  maintenance_acknowledgements: "maintenance_task",
  localized_names: "translation",
  zigbee2mqtt_config: "zigbee_settings",
  tuya_config: "tuya_settings",
  claude_config: "claude_settings",
  device_state: "device_state",
  delivery: "device_command",
  run_target: "device_state",
  run_summary: "device_state",
};

const eventVerbs: Readonly<Record<string, AuditVerb>> = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  requested: "requested",
  started: "started",
  stopped: "stopped",
  completed: "completed",
  succeeded: "completed",
  failed: "attempted",
  denied: "attempted",
  rejected: "attempted",
  pending: "requested",
  running: "started",
  accepted: "requested",
  interrupted: "stopped",
  preempted: "stopped",
  drift: "stopped",
  stale: "stopped",
  summary: "summarized",
  superseded: "superseded",
  confirmed: "changed",
  "command.dispatched": "sent",
  "command.confirmed": "confirmed",
  "command.failed": "attempted",
  "command.rejected": "attempted",
};

function actionDescription(record: AuditActionRecord): AuditActionDescription {
  const operation = Object.hasOwn(operationActions, record.operation)
    ? operationActions[record.operation]
    : undefined;
  if (operation) return operation;
  const name = record.operation.replace(/^batch/, "");
  const prefix =
    /^(create|update|save|delete|restore|add|remove|apply|deactivate|toggle|raise|stop)(?=[A-Z])/i
      .exec(name)?.[0]
      .toLowerCase();
  const verb = prefix ? operationVerbs[prefix] : undefined;
  const target = operationNouns.find((noun) => record.operation.includes(noun.match));
  if (verb && target)
    return { verb, noun: record.operation.startsWith("batch") ? target.plural : target.singular };
  const noun = Object.hasOwn(entityNouns, record.entityType)
    ? entityNouns[record.entityType]
    : "operation";
  let eventVerb = Object.hasOwn(eventVerbs, record.action)
    ? eventVerbs[record.action]
    : "attempted";
  if (
    (noun === "group_member" || noun === "room_member") &&
    (eventVerb === "created" || eventVerb === "deleted")
  ) {
    eventVerb = eventVerb === "created" ? "added" : "removed";
  }
  return { verb: eventVerb, noun };
}

/** Describes the action with a localized past-tense verb and its object; result stays separate. */
export function auditActionLabel(record: AuditActionRecord): string {
  const { verb, noun } = actionDescription(record);
  const options = locale.messageOptions();
  return m.audit_action_phrase(
    {
      verb: verbMessages[verb]({}, options),
      noun: nounMessages[noun]({}, options),
    },
    options,
  );
}
