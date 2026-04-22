import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import { theme, type Theme } from "$lib/stores/theme";

const ME_QUERY = graphql(`
  query Me {
    me {
      id
      username
      name
      avatarPath
      theme
      createdAt
    }
  }
`);

export interface Me {
  id: string;
  username: string;
  name: string;
  avatarPath: string | null;
  theme: Theme;
  createdAt: string;
}

function createMe() {
  let user = $state<Me | null>(null);

  function setFromData(data: {
    id: string;
    username: string;
    name: string;
    avatarPath?: string | null;
    theme?: "LIGHT" | "DARK" | null;
    createdAt?: string | null;
  }) {
    const t: Theme = data.theme === "LIGHT" ? "light" : "dark";
    user = {
      id: data.id,
      username: data.username,
      name: data.name,
      avatarPath: data.avatarPath ?? null,
      theme: t,
      createdAt: data.createdAt ?? "",
    };
    theme.syncFromProfile(t);
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
      createdAt?: string | null;
    }) {
      setFromData(data);
    },
    clear() {
      user = null;
    },
  };
}

export const me = createMe();
