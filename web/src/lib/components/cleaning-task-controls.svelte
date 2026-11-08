<script lang="ts">
  import { watchErrorToast } from "$lib/error-toast.svelte";
  import { getContextClient } from "@urql/svelte";
  import { Pause, Play, House, Loader2, MapPin } from "@lucide/svelte";
  import EmptyBinIcon from "$lib/components/icons/empty-bin-icon.svelte";
  import { Button } from "$lib/components/ui/button";
  import { cleaningStore, type CleaningRobot } from "$lib/stores/cleaning.svelte";
  import { CleaningAction } from "$lib/gql/graphql";
  import { graphqlErrorMessage } from "$lib/graphql-error";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  let { robot, full = false }: { robot: CleaningRobot; full?: boolean } = $props();
  const client = getContextClient();
  const options = $derived(locale.messageOptions());
  const pending = $derived(cleaningStore.pending[robot.id]);
  const presentation = $derived({
    [CleaningAction.Pause]: { icon: Pause, label: m.cleaning_pause({}, options) },
    [CleaningAction.Resume]: { icon: Play, label: m.cleaning_resume({}, options) },
    [CleaningAction.Dock]: { icon: House, label: m.cleaning_dock({}, options) },
    [CleaningAction.Locate]: { icon: MapPin, label: m.cleaning_locate({}, options) },
    [CleaningAction.EmptyBin]: { icon: EmptyBinIcon, label: m.cleaning_empty_bin({}, options) },
  });
  const controls = $derived((robot.controls ?? []).filter(control => control.action !== CleaningAction.Stop && (full || [CleaningAction.Pause, CleaningAction.Resume, CleaningAction.Dock].includes(control.action))));
  let error = $state("");
  async function control(action: CleaningAction) {
    error = "";
    try { await cleaningStore.control(client, robot.id, action); }
    catch (e) { error = graphqlErrorMessage(e, m.cleaning_failed({}, options)); }
  }
  watchErrorToast(() => error);
</script>

<div class="flex flex-wrap items-center gap-2">
  {#each controls as item (item.action)}
    {@const view = presentation[item.action as keyof typeof presentation]}
    <Button variant={item.action === CleaningAction.Dock ? "ghost" : "outline"} size="sm"
      class="w-8 min-w-0 px-0 md:w-auto md:px-3" aria-label={view.label}
      aria-busy={pending === item.action} disabled={!!pending || !item.enabled} onclick={() => control(item.action)}>
      {#if pending === item.action}<Loader2 class="size-4 animate-spin" />{:else}<view.icon class="size-4" />{/if}
      <span class="hidden md:inline">{view.label}</span>
    </Button>
  {/each}
</div>
