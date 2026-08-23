<script lang="ts">
	import HiveChip from "$lib/components/hive-chip.svelte";

	interface Props {
		name: string;
		deviceType: string;
		roomLabel?: string;
	}

	let { name, deviceType, roomLabel }: Props = $props();
</script>

<span class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5">
	<span class="truncate">{name}</span>
	<HiveChip type={deviceType} class="shrink-0 py-0 text-[10px]" />
	{#if roomLabel}
		<span class="col-span-2 truncate text-xs text-muted-foreground">{roomLabel}</span>
	{/if}
</span>
