import { loadProfile, saveProfile, type ProfileState } from "$lib/profile-core";

export type { ListView, ProfileState } from "$lib/profile-core";

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

class Profile {
  #state = $state<Partial<ProfileState>>(loadProfile(storage()));

  get<K extends keyof ProfileState>(key: K, fallback: ProfileState[K]): ProfileState[K] {
    return this.#state[key] ?? fallback;
  }

  set<K extends keyof ProfileState>(key: K, value: ProfileState[K]): void {
    this.#state = { ...this.#state, [key]: value };
    saveProfile(storage(), this.#state);
  }
}

/** Local-only key/value user preference store. No users yet — persists per browser. */
export const profile = new Profile();
