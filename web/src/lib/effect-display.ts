import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";

export function effectCapabilityLabel(capability: string): string {
  const options = locale.messageOptions();
  switch (capability) {
    case "on_off":
      return m.effect_cap_on_off({}, options);
    case "color_temp":
      return m.effect_cap_color_temp({}, options);
    case "brightness":
      return m.effect_cap_brightness({}, options);
    case "color":
      return m.effect_cap_color({}, options);
    default:
      return capability;
  }
}
