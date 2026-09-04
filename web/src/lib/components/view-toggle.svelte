<script lang="ts">
	import { LayoutGrid, LayoutList } from "@lucide/svelte";
	import type { ListView } from "$lib/stores/profile.svelte";
	import SegmentedControl from "$lib/components/segmented-control.svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

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
		{
			value: "card",
			label: m.shared_view_cards({}, locale.messageOptions()),
			icon: LayoutGrid,
			hideLabelOnMobile: true,
			ariaLabel: m.shared_view_cards_aria({}, locale.messageOptions()),
		},
		{
			value: "table",
			label: m.shared_view_table({}, locale.messageOptions()),
			icon: LayoutList,
			hideLabelOnMobile: true,
			ariaLabel: m.shared_view_table_aria({}, locale.messageOptions()),
		},
	]}
/>
