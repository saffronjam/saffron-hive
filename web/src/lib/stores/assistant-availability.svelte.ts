import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";

const AVAILABILITY = graphql(`
  query AssistantAvailability {
    integrations {
      provider
      configured
      enabled
    }
  }
`);
let enabled = $state(false);
let generation = 0;

export const assistantAvailability = {
  get enabled() {
    return enabled;
  },
  async refresh(client: Client) {
    const current = ++generation;
    const r = await client.query(AVAILABILITY, {}, { requestPolicy: "network-only" }).toPromise();
    if (current !== generation) return;
    const claude = r.data?.integrations.find((i) => i.provider === "claude");
    enabled = !!claude?.configured && claude.enabled;
  },
  clear() {
    generation++;
    enabled = false;
  },
};
