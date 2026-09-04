import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import type { EffectValidationCode } from "$lib/effect-editable";

const messages = {
  name_required: m.effect_validation_name_required,
  duration_negative: m.effect_validation_duration_negative,
  clip_start_negative: m.effect_validation_clip_start_negative,
  clip_transition_invalid: m.effect_validation_transition_invalid,
  clip_config_invalid: m.effect_validation_config_invalid,
  clip_past_loop_end: m.effect_validation_past_loop,
  clips_overlap: m.effect_validation_overlap,
  native_effect_required: m.effect_validation_native_required,
} satisfies Record<EffectValidationCode, () => string>;

export function effectValidationMessage(code: EffectValidationCode): string {
  return messages[code]({}, locale.messageOptions());
}
