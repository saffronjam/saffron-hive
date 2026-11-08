import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import { identifierLabel } from "$lib/i18n/vocabulary";

export function cleaningConsumableLabel(name: string): string {
  const options = locale.messageOptions();
  switch (name) {
    case "main_brush":
      return m.cleaning_main_brush({}, options);
    case "side_brush":
      return m.cleaning_side_brush({}, options);
    case "filter":
      return m.cleaning_filter({}, options);
    case "sensors":
      return m.cleaning_sensors({}, options);
    default:
      return identifierLabel(name);
  }
}

export function cleaningMaintenanceAction(name: string): string {
  const options = locale.messageOptions();
  switch (name) {
    case "main_brush":
      return m.cleaning_replace_main_brush({}, options);
    case "side_brush":
      return m.cleaning_replace_side_brush({}, options);
    case "filter":
      return m.cleaning_replace_filter({}, options);
    case "sensors":
      return m.cleaning_clean_sensors({}, options);
    default:
      return identifierLabel(name);
  }
}
