import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import { uniqueFilterOptions } from "$lib/list-helpers";
import { identifierLabel } from "$lib/i18n/vocabulary";

/** Includes supported activity types and any additional types present in the feed. */
export function activityTypeOptions(eventTypes: readonly string[], advanced: boolean) {
  const options = locale.messageOptions();
  const basic: Record<string, string> = {
    "device.state_changed": m.activity_event_state_changed({}, options),
    "device.action_fired": m.activity_event_device_action({}, options),
    "device.availability_changed": m.activity_event_availability({}, options),
    "device.added": m.activity_event_device_added({}, options),
    "device.removed": m.activity_event_device_removed({}, options),
    "scene.applied": m.activity_event_scene_applied({}, options),
    "automation.triggered": m.activity_event_automation_fired({}, options),
    "webhook.received": m.activity_event_webhook_received({}, options),
  };
  const extra: Record<string, string> = {
    "command.confirmed": m.activity_event_command_confirmed({}, options),
    "command.failed": m.activity_event_command_failed({}, options),
    "command.dispatched": m.activity_event_command_sent({}, options),
    "automation.node_activated": m.activity_event_node_activated({}, options),
  };
  const labels = { ...basic, ...extra };
  return uniqueFilterOptions(
    [...Object.keys(advanced ? labels : basic), ...eventTypes],
    (type) => labels[type] ?? identifierLabel(type),
  );
}

export interface ActivityPresentationSource {
  name?: string | null;
}

export interface ActivityPresentationEvent {
  type: string;
  payload: string;
  source: ActivityPresentationSource;
}

function payloadValue(payload: string): unknown {
  try {
    return JSON.parse(payload) as unknown;
  } catch {
    return null;
  }
}

/** Formats event data at render time so cached events follow locale changes. */
export function activityMessage(event: ActivityPresentationEvent): string {
  const options = locale.messageOptions();
  const value = payloadValue(event.payload);
  const payload =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const name = event.source.name?.trim() || m.activity_generic_device({}, options);
  switch (event.type) {
    case "device.state_changed":
      return m.activity_device_state_changed({ name }, options);
    case "device.action_fired": {
      const action = typeof payload.action === "string" ? payload.action : "";
      return action
        ? m.activity_device_action({ name, action }, options)
        : m.activity_device_action_generic({ name }, options);
    }
    case "device.availability_changed":
      return value === true || payload.online === true
        ? m.activity_device_online({ name }, options)
        : m.activity_device_offline({ name }, options);
    case "device.added":
      return event.source.name
        ? m.activity_device_added({ name }, options)
        : m.activity_device_added_generic({}, options);
    case "device.removed":
      return event.source.name
        ? m.activity_device_removed({ name }, options)
        : m.activity_device_removed_generic({}, options);
    case "command.confirmed":
      return m.activity_command_confirmed({ name }, options);
    case "command.failed":
      return m.activity_command_failed({ name }, options);
    case "command.dispatched":
      return m.activity_command_sent({ name }, options);
    case "scene.applied":
      return event.source.name
        ? m.activity_scene_applied({ name }, options)
        : m.activity_scene_applied_generic({}, options);
    case "automation.triggered":
      return event.source.name
        ? m.activity_automation_fired({ name }, options)
        : m.activity_automation_fired_generic({}, options);
    case "automation.node_activated": {
      const automation = event.source.name?.trim() || m.activity_generic_automation({}, options);
      if (payload.pendingUntil) return m.activity_node_pending({ name: automation }, options);
      return payload.active === false
        ? m.activity_node_deactivated({ name: automation }, options)
        : m.activity_node_activated({ name: automation }, options);
    }
    case "webhook.received":
      return event.source.name
        ? m.activity_webhook_received({ name }, options)
        : m.activity_webhook_received_generic({}, options);
    default:
      return m.activity_unknown({}, options);
  }
}
