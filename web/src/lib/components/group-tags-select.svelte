<script lang="ts" module>
	export type GroupTag = "LIGHT" | "SENSOR";

	export const ALL_GROUP_TAGS: GroupTag[] = ["LIGHT", "SENSOR"];
</script>

<script lang="ts">
	import HiveChip from "$lib/components/hive-chip.svelte";

	interface Props {
		value: GroupTag[];
		onchange: (next: GroupTag[]) => void;
		disabled?: boolean;
	}

	let { value, onchange, disabled = false }: Props = $props();

	const selected = $derived(new Set(value));

	function toggle(tag: GroupTag) {
		if (disabled) return;
		const next = new Set(selected);
		if (next.has(tag)) next.delete(tag);
		else next.add(tag);
		onchange(ALL_GROUP_TAGS.filter((t) => next.has(t)));
	}
</script>

<div class="flex flex-wrap gap-2">
	{#each ALL_GROUP_TAGS as tag (tag)}
		{@const chipType = tag.toLowerCase()}
		<HiveChip
			type={chipType}
			label={chipType.charAt(0).toUpperCase() + chipType.slice(1)}
			active={selected.has(tag)}
			onclick={() => toggle(tag)}
		/>
	{/each}
</div>
