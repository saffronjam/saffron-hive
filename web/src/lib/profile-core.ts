export type ListView = "card" | "table";

export interface ProfileState {
  "view.devices": ListView;
  "view.automations": ListView;
  "view.groups": ListView;
  "view.rooms": ListView;
  "view.scenes": ListView;
  "activity.advanced": boolean;
}

export const PROFILE_STORAGE_KEY = "saffron-hive-profile";

/**
 * Read and validate the stored profile blob.
 * Returns an empty object for missing, non-JSON, or non-object payloads.
 * SSR-safe: when `storage` is null/undefined (no `window`), returns empty.
 */
export function loadProfile(storage: Storage | null | undefined): Partial<ProfileState> {
  if (!storage) return {};
  const raw = storage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Partial<ProfileState>;
    }
  } catch {
    // malformed JSON — treat as empty
  }
  return {};
}

/**
 * Persist the profile blob as a single JSON string.
 * No-op when `storage` is null/undefined (SSR).
 */
export function saveProfile(
  storage: Storage | null | undefined,
  state: Partial<ProfileState>,
): void {
  if (!storage) return;
  storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(state));
}
