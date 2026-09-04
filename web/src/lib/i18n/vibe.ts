import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";

export function vibePresetLabel(id: string): string {
  const options = locale.messageOptions();
  switch (id) {
    case "sunset-glow":
      return m.vibe_preset_sunset_glow({}, options);
    case "night-sky":
      return m.vibe_preset_night_sky({}, options);
    case "forest-canopy":
      return m.vibe_preset_forest_canopy({}, options);
    case "ocean-drift":
      return m.vibe_preset_ocean_drift({}, options);
    case "ember-hearth":
      return m.vibe_preset_ember_hearth({}, options);
    case "aurora-haze":
      return m.vibe_preset_aurora_haze({}, options);
    case "candlelight":
      return m.vibe_preset_candlelight({}, options);
    case "warm-evening":
      return m.vibe_preset_warm_evening({}, options);
    case "neutral-focus":
      return m.vibe_preset_neutral_focus({}, options);
    case "cool-morning":
      return m.vibe_preset_cool_morning({}, options);
    default:
      return m.vibe_preset_unknown({ id }, options);
  }
}

export function vibeCategoryLabel(id: string): string {
  const options = locale.messageOptions();
  switch (id) {
    case "nature":
      return m.vibe_category_nature({}, options);
    case "atmosphere":
      return m.vibe_category_atmosphere({}, options);
    case "whites":
      return m.vibe_category_whites({}, options);
    default:
      return m.vibe_category_unknown({ id }, options);
  }
}

export function guidedVibeLabel(id: string): string {
  const options = locale.messageOptions();
  switch (id) {
    case "ember":
      return m.vibe_guide_ember({}, options);
    case "amber":
      return m.vibe_guide_amber({}, options);
    case "gold":
      return m.vibe_guide_gold({}, options);
    case "meadow":
      return m.vibe_guide_meadow({}, options);
    case "leaf":
      return m.vibe_guide_leaf({}, options);
    case "mint":
      return m.vibe_guide_mint({}, options);
    case "lagoon":
      return m.vibe_guide_lagoon({}, options);
    case "sky":
      return m.vibe_guide_sky({}, options);
    case "indigo":
      return m.vibe_guide_indigo({}, options);
    case "violet":
      return m.vibe_guide_violet({}, options);
    case "orchid":
      return m.vibe_guide_orchid({}, options);
    case "rose":
      return m.vibe_guide_rose({}, options);
    case "daylight":
      return m.vibe_guide_daylight({}, options);
    case "cool":
      return m.vibe_guide_cool({}, options);
    case "neutral":
      return m.vibe_guide_neutral({}, options);
    case "warm":
      return m.vibe_guide_warm({}, options);
    case "candlelight":
      return m.vibe_guide_candlelight({}, options);
    case "cooler":
      return m.vibe_guide_cooler({}, options);
    case "brighter":
      return m.vibe_guide_brighter({}, options);
    case "balanced":
      return m.vibe_guide_balanced({}, options);
    case "softer":
      return m.vibe_guide_softer({}, options);
    case "warmer":
      return m.vibe_guide_warmer({}, options);
    default:
      return m.vibe_guide_unknown({ id }, options);
  }
}
