<script lang="ts">
	import DynamicIcon from "$lib/components/icons/dynamic-icon.svelte";
	import { deviceIcon } from "$lib/utils";

	interface Props {
		type: string;
		iconOverride?: string | null;
		class?: string;
	}

	let {
		type,
		iconOverride = null,
		class: className = "size-4",
	}: Props = $props();

	const Fallback = $derived(deviceIcon(type));
</script>

{#if iconOverride}
	<DynamicIcon icon={iconOverride} class={className}>
		{#snippet fallback()}
			<Fallback class={className} />
		{/snippet}
	</DynamicIcon>
{:else}
	<Fallback class={className} />
{/if}
