<script lang="ts">
	import { alarmsStore } from "$lib/stores/alarms.svelte";
	import { maintenanceStore } from "$lib/stores/maintenance.svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	let { href }: { href: string } = $props();

	function alarmBadgeClass(): string {
		switch (alarmsStore.highestSeverity) {
			case "HIGH":
				return "bg-destructive/80 text-destructive-foreground";
			case "MEDIUM":
				return "bg-amber-500/80 text-white";
			default:
				return "bg-teal-500/80 text-white";
		}
	}
</script>

{#if href === "/alarms" && alarmsStore.activeCount > 0}
	<span
		class="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs leading-none font-medium tabular-nums {alarmBadgeClass()}"
		aria-label={m.nav_active_alarms({ count: alarmsStore.activeCount }, locale.messageOptions())}
	>
		{alarmsStore.activeCount}
	</span>
{/if}
{#if href === "/maintenance" && maintenanceStore.actionableCount > 0}
	<span
		class="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs leading-none font-medium tabular-nums text-muted-foreground"
		aria-label={m.nav_maintenance_tasks({ count: maintenanceStore.actionableCount }, locale.messageOptions())}
	>
		{maintenanceStore.actionableCount}
	</span>
{/if}
