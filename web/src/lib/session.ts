import { clearAllSnapshots } from "$lib/entity-cache";
import { clearAllSessionSnapshots } from "$lib/session-cache";
import { resetPrefetchedDetails } from "$lib/prefetch-detail";
import { auth } from "$lib/stores/auth.svelte";
import { alarmsStore } from "$lib/stores/alarms.svelte";
import { maintenanceStore } from "$lib/stores/maintenance.svelte";
import { deviceStore } from "$lib/stores/devices";
import { me } from "$lib/stores/me.svelte";
import { roomsStore } from "$lib/stores/rooms.svelte";
import { groupsStore } from "$lib/stores/groups.svelte";
import { scenesStore } from "$lib/stores/scenes.svelte";
import { automationsStore } from "$lib/stores/automations.svelte";
import { effectsStore } from "$lib/stores/effects.svelte";
import { floorplanStore } from "$lib/stores/floorplan.svelte";
import { webhooksStore } from "$lib/stores/webhooks.svelte";
import { localizedNamesStore } from "$lib/stores/localized-names.svelte";
import { clearDeviceImageCache } from "$lib/device-image-cache";

/**
 * Ends the session: drops every store's data and live subscriptions, wipes the
 * on-disk snapshots, and clears the token.
 *
 * Every exit from an authenticated session goes through here — the log-out
 * button, a password change, force-logout-all, and the two involuntary 401
 * paths. Stopping the stores also releases their `started` latch, so the next
 * sign-in hydrates from the server rather than showing the previous user's
 * data.
 */
export function sessionTeardown(): void {
  alarmsStore.stop();
  maintenanceStore.stop();
  deviceStore.stop();
  roomsStore.stop();
  groupsStore.stop();
  scenesStore.stop();
  automationsStore.stop();
  effectsStore.stop();
  floorplanStore.stop();
  webhooksStore.stop();

  alarmsStore.clear();
  maintenanceStore.clear();
  deviceStore.clear();
  roomsStore.clear();
  groupsStore.clear();
  scenesStore.clear();
  automationsStore.clear();
  effectsStore.clear();
  floorplanStore.clear();
  webhooksStore.clear();
  localizedNamesStore.clear();

  me.clear();
  resetPrefetchedDetails();
  clearAllSnapshots(typeof window === "undefined" ? null : window.localStorage);
  clearAllSessionSnapshots(typeof window === "undefined" ? null : window.sessionStorage);
  void clearDeviceImageCache();
  auth.clearToken();
}
