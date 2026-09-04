import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import type { AutomationValidationCode } from "$lib/components/graph/trigger-expr";

const messages = {
  trigger_required: m.automation_validation_trigger_required,
  condition_required: m.automation_validation_condition_required,
  device_required: m.automation_validation_device_required,
  property_required: m.automation_validation_property_required,
  value_required: m.automation_validation_value_required,
  event_required: m.automation_validation_event_required,
  webhook_required: m.automation_validation_webhook_required,
  filter_path_required: m.automation_validation_filter_path_required,
  filter_value_type_required: m.automation_validation_filter_value_type_required,
  filter_text_operator_type: m.automation_validation_filter_text_operator_type,
  filter_number_operator_type: m.automation_validation_filter_number_operator_type,
  filter_value_required: m.automation_validation_filter_value_required,
  interval_positive: m.automation_validation_interval_positive,
  cron_required: m.automation_validation_cron_required,
  expression_required: m.automation_validation_expression_required,
  rules_required: m.automation_validation_rules_required,
  target_required: m.automation_validation_target_required,
  action_required: m.automation_validation_action_required,
  alarm_id_required: m.automation_validation_alarm_id_required,
  json_invalid: m.automation_validation_json_invalid,
  effect_required: m.automation_validation_effect_required,
  scenes_minimum: m.automation_validation_scenes_minimum,
  scene_reference_invalid: m.automation_validation_scene_reference_invalid,
  field_required: m.automation_validation_field_required,
  delta_non_zero: m.automation_validation_delta_non_zero,
  change_mode_invalid: m.automation_validation_change_mode_invalid,
  settings_required: m.automation_validation_settings_required,
  setting_invalid: m.automation_validation_setting_invalid,
  setting_value_invalid: m.automation_validation_setting_value_invalid,
} satisfies Record<AutomationValidationCode, () => string>;

export function automationValidationMessage(code: AutomationValidationCode): string {
  return messages[code]({}, locale.messageOptions());
}
