import type { Client } from "@urql/svelte";
import { deviceStore } from "$lib/stores/devices";
import { groupsStore } from "$lib/stores/groups.svelte";
import { localizedNamesStore } from "$lib/stores/localized-names.svelte";
import { roomsStore } from "$lib/stores/rooms.svelte";
import { scenesStore } from "$lib/stores/scenes.svelte";

/** Loads and starts every store required by the guest dashboard. */
export async function prepareGuestDashboard(client: Client): Promise<void> {
  await Promise.all([
    localizedNamesStore.refreshDashboard(client),
    deviceStore.start(client),
    roomsStore.start(client),
    groupsStore.start(client),
    scenesStore.start(client),
  ]);
}
