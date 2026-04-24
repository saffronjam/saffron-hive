<script lang="ts">
	import type { Component } from "svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import IconPickerTrigger from "$lib/components/icon-picker-trigger.svelte";
	import DynamicIcon from "$lib/components/icons/dynamic-icon.svelte";

	interface Props {
		value: string | null | undefined;
		onselect: (icon: string | null) => void;
		fallback: Component;
		size?: "sm" | "md" | "lg";
		iconClass?: string;
	}

	let {
		value,
		onselect,
		fallback: Fallback,
		size = "md",
		iconClass = "size-4.5 text-muted-foreground",
	}: Props = $props();
</script>

<IconPicker {value} {onselect}>
	<IconPickerTrigger {size}>
		<DynamicIcon icon={value} class={iconClass}>
			{#snippet fallback()}
				<Fallback class={iconClass} />
			{/snippet}
		</DynamicIcon>
	</IconPickerTrigger>
</IconPicker>
