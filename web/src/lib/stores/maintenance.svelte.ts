import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import { MaintenanceKind, type ContactRole } from "$lib/gql/graphql";
import { clearSessionSnapshot, loadSessionSnapshot, saveSessionSnapshot } from "$lib/session-cache";

export interface MaintenanceDevice {
  id: string;
  name?: string | null;
  friendlyName: string;
  icon?: string | null;
  type: string;
  available: boolean;
  disabled: boolean;
  roles: { contact?: ContactRole | null };
}

export interface MaintenanceTask {
  id: string;
  kind: MaintenanceKind;
  title: string;
  detail: string;
  action: string;
  device?: MaintenanceDevice | null;
  currentValue?: string | null;
  targetValue?: string | null;
  actionUrl?: string | null;
}

const MAINTENANCE_QUERY = graphql(`
  query MaintenanceTasks {
    maintenanceTasks {
      id
      kind
      title
      detail
      action
      currentValue
      targetValue
      actionUrl
      device {
        id
        name
        friendlyName
        icon
        type
        available
        disabled
        roles {
          contact
        }
      }
    }
  }
`);

const COMPLETE_MAINTENANCE = graphql(`
  mutation CompleteMaintenanceTasks($ids: [ID!]!) {
    completeMaintenanceTasks(ids: $ids)
  }
`);

const MAINTENANCE_CHANGED = graphql(`
  subscription MaintenanceChanged {
    maintenanceChanged
  }
`);

const CACHE_VERSION = 2;

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function createMaintenanceStore() {
  const restored = loadSessionSnapshot<MaintenanceTask[]>(storage(), "maintenance", CACHE_VERSION);
  let items = $state<MaintenanceTask[]>(restored ?? []);
  let pending = $state(new Set<string>());
  let started = false;
  let generation = 0;
  let unsubscribe: (() => void) | null = null;
  let client: Client | null = null;

  function save() {
    saveSessionSnapshot(storage(), "maintenance", CACHE_VERSION, items);
  }

  async function refresh(activeGeneration = generation) {
    if (!client) return;
    const result = await client
      .query(MAINTENANCE_QUERY, {}, { requestPolicy: "network-only" })
      .toPromise();
    if (!started || activeGeneration !== generation || !result.data?.maintenanceTasks) return;
    items = result.data.maintenanceTasks as MaintenanceTask[];
    save();
  }

  async function completeMany(ids: string[]): Promise<boolean> {
    if (!client) return false;
    const selected = [...new Set(ids.filter((id) => items.some((item) => item.id === id)))];
    if (selected.length === 0) return true;
    const before = items;
    pending = new Set([...pending, ...selected]);
    items = items.filter((item) => !selected.includes(item.id));
    save();
    const result = await client.mutation(COMPLETE_MAINTENANCE, { ids: selected }).toPromise();
    pending = new Set([...pending].filter((id) => !selected.includes(id)));
    if (result.error) {
      const currentIDs = new Set(items.map((item) => item.id));
      items = [
        ...items,
        ...before.filter((item) => selected.includes(item.id) && !currentIDs.has(item.id)),
      ];
      save();
      return false;
    }
    await refresh();
    return true;
  }

  return {
    get items() {
      return items;
    },
    get byKind(): Record<MaintenanceKind, MaintenanceTask[]> {
      return items.reduce(
        (groups, item) => {
          groups[item.kind].push(item);
          return groups;
        },
        {
          [MaintenanceKind.Battery]: [],
          [MaintenanceKind.Firmware]: [],
          [MaintenanceKind.Posture]: [],
          [MaintenanceKind.Storage]: [],
        } as Record<MaintenanceKind, MaintenanceTask[]>,
      );
    },
    get actionableCount() {
      return items.length;
    },
    isPending(id: string) {
      return pending.has(id);
    },
    completeOne(id: string) {
      return completeMany([id]);
    },
    completeMany,
    async start(nextClient: Client) {
      if (started) return;
      started = true;
      client = nextClient;
      const activeGeneration = ++generation;
      void refresh(activeGeneration);
      const subscription = client.subscription(MAINTENANCE_CHANGED, {}).subscribe(() => {
        void refresh(activeGeneration);
      });
      unsubscribe = subscription.unsubscribe;
    },
    stop() {
      unsubscribe?.();
      unsubscribe = null;
      client = null;
      started = false;
      generation++;
      pending = new Set();
    },
    clear() {
      items = [];
      pending = new Set();
      clearSessionSnapshot(storage(), "maintenance");
    },
  };
}

export const maintenanceStore = createMaintenanceStore();
