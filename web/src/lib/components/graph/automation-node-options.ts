export interface AutomationNodeOption<T extends string = string> {
  value: T;
  label: string;
  description: string;
}

export function triggerOptions(): readonly AutomationNodeOption[] {
  const options = locale.messageOptions();
  return [
    {
      value: "device_state",
      label: m.automation_trigger_device_state({}, options),
      description: m.automation_trigger_device_state_description({}, options),
    },
    {
      value: "device_event",
      label: m.automation_trigger_device_event({}, options),
      description: m.automation_trigger_device_event_description({}, options),
    },
    {
      value: "availability",
      label: m.automation_trigger_availability({}, options),
      description: m.automation_trigger_availability_description({}, options),
    },
    {
      value: "webhook",
      label: m.automation_trigger_webhook({}, options),
      description: m.automation_trigger_webhook_description({}, options),
    },
    {
      value: "schedule",
      label: m.automation_trigger_schedule({}, options),
      description: m.automation_trigger_schedule_description({}, options),
    },
    {
      value: "custom",
      label: m.automation_trigger_custom({}, options),
      description: m.automation_trigger_custom_description({}, options),
    },
  ] as const satisfies readonly AutomationNodeOption[];
}

export function conditionOptions(): readonly AutomationNodeOption[] {
  const options = locale.messageOptions();
  return [
    {
      value: "time_window",
      label: m.automation_condition_time_window({}, options),
      description: m.automation_condition_time_window_description({}, options),
    },
    {
      value: "weekday",
      label: m.automation_condition_weekday({}, options),
      description: m.automation_condition_weekday_description({}, options),
    },
    {
      value: "device_state",
      label: m.automation_condition_device_state({}, options),
      description: m.automation_condition_device_state_description({}, options),
    },
    {
      value: "custom",
      label: m.automation_condition_custom({}, options),
      description: m.automation_condition_custom_description({}, options),
    },
  ] as const satisfies readonly AutomationNodeOption[];
}

export function actionOptions(): readonly AutomationNodeOption[] {
  const options = locale.messageOptions();
  return [
    {
      value: "set_device_state",
      label: m.automation_action_set_state({}, options),
      description: m.automation_action_set_state_description({}, options),
    },
    {
      value: "configure_device",
      label: m.automation_action_configure_device({}, options),
      description: m.automation_action_configure_device_description({}, options),
    },
    {
      value: "toggle_device_state",
      label: m.automation_action_toggle_state({}, options),
      description: m.automation_action_toggle_state_description({}, options),
    },
    {
      value: "change_value",
      label: m.automation_action_change_value({}, options),
      description: m.automation_action_change_value_description({}, options),
    },
    {
      value: "activate_scene",
      label: m.automation_action_activate_scene({}, options),
      description: m.automation_action_activate_scene_description({}, options),
    },
    {
      value: "cycle_scenes",
      label: m.automation_action_cycle_scenes({}, options),
      description: m.automation_action_cycle_scenes_description({}, options),
    },
    {
      value: "run_effect",
      label: m.automation_action_run_effect({}, options),
      description: m.automation_action_run_effect_description({}, options),
    },
    {
      value: "raise_alarm",
      label: m.automation_action_raise_alarm({}, options),
      description: m.automation_action_raise_alarm_description({}, options),
    },
    {
      value: "clear_alarm",
      label: m.automation_action_clear_alarm({}, options),
      description: m.automation_action_clear_alarm_description({}, options),
    },
  ] as const satisfies readonly AutomationNodeOption[];
}
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
