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

	// This cell sits on every row of every table, and the picker behind it is a
	// full popover: floating-ui, an id, context and outside-click handling, all
	// built eagerly for rows nobody clicks. Until the first click there is only
	// a button showing an icon, so that is all this renders.
	let picking = $state(false);
	let open = $state(false);

	function activate() {
		picking = true;
		open = true;
	}
</script>

{#snippet icon()}
	{#if value}
		<DynamicIcon icon={value} class={iconClass}>
			{#snippet fallback()}
				<Fallback class={iconClass} />
			{/snippet}
		</DynamicIcon>
	{:else}
		<Fallback class={iconClass} />
	{/if}
{/snippet}

{#if picking}
	<IconPicker {value} {onselect} bind:open>
		<IconPickerTrigger {size}>
			{@render icon()}
		</IconPickerTrigger>
	</IconPicker>
{:else}
	<IconPickerTrigger {size} onclick={activate}>
		{@render icon()}
	</IconPickerTrigger>
{/if}
