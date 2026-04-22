<script lang="ts">
	import { LayoutGrid, LayoutList } from "@lucide/svelte";
	import type { ListView } from "$lib/stores/profile.svelte";
	import SegmentedControl from "$lib/components/segmented-control.svelte";

	interface Props {
		value: ListView;
		onchange: (v: ListView) => void;
	}

	let { value, onchange }: Props = $props();
</script>

<SegmentedControl
	{value}
	{onchange}
	options={[
		{ value: "card", label: "Cards", icon: LayoutGrid, hideLabelOnMobile: true, ariaLabel: "Card view" },
		{ value: "table", label: "Table", icon: LayoutList, hideLabelOnMobile: true, ariaLabel: "Table view" },
	]}
/>
