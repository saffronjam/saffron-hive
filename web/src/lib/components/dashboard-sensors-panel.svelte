<script lang="ts">
	import { aggregateSensorReadings } from "$lib/device-tint";
	import type { Device } from "$lib/stores/devices";

	interface Props {
		devices: Device[];
	}

	let { devices }: Props = $props();

	const sensors = $derived(devices.filter((d) => d.type === "sensor"));
	const readings = $derived(aggregateSensorReadings(sensors));
</script>

{#if readings.length > 0}
	<div class="flex flex-col gap-3">
		{#each readings as r (r.label)}
			<div class="flex items-center gap-3 rounded-lg shadow-card bg-card p-4">
				<div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
					<r.icon class="size-5 text-muted-foreground" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-xs text-muted-foreground">{r.label}</p>
					<p class="text-xl font-semibold tabular-nums text-foreground">
						{r.value}<span class="ml-1 text-sm font-normal text-muted-foreground">{r.unit}</span>
					</p>
				</div>
			</div>
		{/each}
	</div>
{/if}
