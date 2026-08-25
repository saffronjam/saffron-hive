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
		tintBackground?: string | null;
		tintVisible?: boolean;
	}

	let {
		value,
		onselect,
		fallback: Fallback,
		size = "md",
		iconClass = "size-4.5 text-muted-foreground",
		tintBackground = null,
		tintVisible = false,
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
	{#if tintBackground}
		<div
			class="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out {tintVisible
				? 'opacity-100'
				: 'opacity-0'}"
			style:background={tintBackground}
			aria-hidden="true"
		></div>
	{/if}
	<span class="relative flex items-center justify-center">
		{#if value}
			<DynamicIcon icon={value} class={iconClass}>
				{#snippet fallback()}
					<Fallback class={iconClass} />
				{/snippet}
			</DynamicIcon>
		{:else}
			<Fallback class={iconClass} />
		{/if}
	</span>
{/snippet}

{#if picking}
	<IconPicker {value} {onselect} bind:open>
		<IconPickerTrigger {size} class={tintBackground ? "bg-muted/50" : undefined}>
			{@render icon()}
		</IconPickerTrigger>
	</IconPicker>
{:else}
	<IconPickerTrigger {size} onclick={activate} class={tintBackground ? "bg-muted/50" : undefined}>
		{@render icon()}
	</IconPickerTrigger>
{/if}
