import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import { theme, type Theme } from "$lib/stores/theme";
import { haptics } from "$lib/stores/haptics.svelte";

const ME_QUERY = graphql(`
  query Me {
    me {
      id
      username
      name
      avatarPath
      theme
      timeFormat
      temperatureUnit
      hapticsEnabled
      createdAt
      mustChangePassword
    }
  }
`);

export type TimeMode = "12h" | "24h";
export type TempUnit = "celsius" | "fahrenheit";

export interface Me {
  id: string;
  username: string;
  name: string;
  avatarPath: string | null;
  theme: Theme;
  timeFormat: TimeMode;
  temperatureUnit: TempUnit;
  hapticsEnabled: boolean;
  createdAt: string;
  mustChangePassword: boolean;
}

/**
 * The avatar path survives a reload in localStorage, mirroring how the theme is
 * persisted. `me` is fetched after the first paint, and until it lands the
 * sidebar has no idea whether the user has an avatar; without this it would
 * assert "none" and flash the initials for a frame before the image arrives.
 */
const AVATAR_PATH_KEY = "hive.avatarPath";

/** Last known avatar path, or null when there is none or none is cached. */
export function cachedAvatarPath(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(AVATAR_PATH_KEY);
}

function cacheAvatarPath(path: string | null) {
  if (typeof localStorage === "undefined") return;
  if (path) localStorage.setItem(AVATAR_PATH_KEY, path);
  else localStorage.removeItem(AVATAR_PATH_KEY);
}

function createMe() {
  let user = $state<Me | null>(null);

  function setFromData(data: {
    id: string;
    username: string;
    name: string;
    avatarPath?: string | null;
    theme?: "LIGHT" | "DARK" | null;
    timeFormat?: "TWELVE_HOUR" | "TWENTY_FOUR_HOUR" | null;
    temperatureUnit?: "CELSIUS" | "FAHRENHEIT" | null;
    hapticsEnabled?: boolean | null;
    createdAt?: string | null;
    mustChangePassword?: boolean | null;
  }) {
    const t: Theme = data.theme === "LIGHT" ? "light" : "dark";
    const tf: TimeMode = data.timeFormat === "TWELVE_HOUR" ? "12h" : "24h";
    const tu: TempUnit = data.temperatureUnit === "FAHRENHEIT" ? "fahrenheit" : "celsius";
    user = {
      id: data.id,
      username: data.username,
      name: data.name,
      avatarPath: data.avatarPath ?? null,
      theme: t,
      timeFormat: tf,
      temperatureUnit: tu,
      hapticsEnabled: data.hapticsEnabled ?? true,
      createdAt: data.createdAt ?? "",
      mustChangePassword: data.mustChangePassword ?? false,
    };
    cacheAvatarPath(user.avatarPath);
    theme.syncFromProfile(t);
    haptics.syncFromProfile(user.hapticsEnabled);
  }

  return {
    get user() {
      return user;
    },
    /** Fetch `me` from the server and mirror the theme into local state. */
    async refresh(client: Client) {
      const result = await client
        .query(ME_QUERY, {}, { requestPolicy: "network-only" })
        .toPromise();
      if (result.data?.me) setFromData(result.data.me);
    },
    /** Overwrite from a mutation result (updateCurrentUser, avatar upload). */
    apply(data: {
      id: string;
      username: string;
      name: string;
      avatarPath?: string | null;
      theme?: "LIGHT" | "DARK" | null;
      timeFormat?: "TWELVE_HOUR" | "TWENTY_FOUR_HOUR" | null;
      temperatureUnit?: "CELSIUS" | "FAHRENHEIT" | null;
      hapticsEnabled?: boolean | null;
      createdAt?: string | null;
      mustChangePassword?: boolean | null;
    }) {
      setFromData(data);
    },
    clear() {
      user = null;
      cacheAvatarPath(null);
      haptics.reset();
    },
  };
}

export const me = createMe();
