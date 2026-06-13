<script lang="ts" module>
	import { DeviceTag } from "$lib/gql/graphql";

	export type { DeviceTag };

	export const ALL_DEVICE_TAGS: DeviceTag[] = [DeviceTag.Light];
</script>

<script lang="ts">
	import HiveChip from "$lib/components/hive-chip.svelte";

	interface Props {
		value: DeviceTag[];
		onchange: (next: DeviceTag[]) => void;
		disabled?: boolean;
	}

	let { value, onchange, disabled = false }: Props = $props();

	const selected = $derived(new Set(value));

	function toggle(tag: DeviceTag) {
		if (disabled) return;
		const next = new Set(selected);
		if (next.has(tag)) next.delete(tag);
		else next.add(tag);
		onchange(ALL_DEVICE_TAGS.filter((t) => next.has(t)));
	}
</script>

<div class="flex flex-wrap gap-2">
	{#each ALL_DEVICE_TAGS as tag (tag)}
		{@const chipType = tag.toLowerCase()}
		<HiveChip
			type={chipType}
			label={chipType.charAt(0).toUpperCase() + chipType.slice(1)}
			active={selected.has(tag)}
			onclick={() => toggle(tag)}
		/>
	{/each}
</div>
