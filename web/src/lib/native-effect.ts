export interface NativeEffectCounts {
  confirmedDeviceCount: number;
}

export function nativeEffectSupportSummary(counts: NativeEffectCounts): string {
  return `${counts.confirmedDeviceCount} supported`;
}
