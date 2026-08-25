export type HapticIntent = "selection" | "engage" | "execute";
export type HapticPointerType = "touch" | "pen";

const DURATION_MS: Record<HapticIntent, number> = {
  selection: 10,
  engage: 15,
  execute: 12,
};

const DEDUPE_MS = 75;

function pointerType(source: Event | string | null | undefined): string | null {
  if (typeof source === "string") return source;
  if (!source || !("pointerType" in source)) return null;
  const value = source.pointerType;
  return typeof value === "string" ? value : null;
}

class Haptics {
  #enabled = $state(true);
  #lastPlayedAt = Number.NEGATIVE_INFINITY;

  get enabled(): boolean {
    return this.#enabled;
  }

  get supported(): boolean {
    return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  }

  syncFromProfile(enabled: boolean): void {
    this.#enabled = enabled;
  }

  reset(): void {
    this.#enabled = true;
    this.#lastPlayedAt = Number.NEGATIVE_INFINITY;
  }

  play(intent: HapticIntent, source: Event | HapticPointerType | null | undefined): boolean {
    const sourceType = pointerType(source);
    if (sourceType !== "touch" && sourceType !== "pen") return false;
    if (!this.#enabled || !this.supported) return false;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return false;

    const now = Date.now();
    if (now - this.#lastPlayedAt < DEDUPE_MS) return false;

    try {
      if (!navigator.vibrate(DURATION_MS[intent])) return false;
      this.#lastPlayedAt = now;
      return true;
    } catch {
      return false;
    }
  }
}

export const haptics = new Haptics();
