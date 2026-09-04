export interface NativeEffectCounts {
  confirmedDeviceCount: number;
}

export function nativeEffectSupportSummary(counts: NativeEffectCounts): string {
  return m.effects_supported_count({ count: counts.confirmedDeviceCount }, locale.messageOptions());
}
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
