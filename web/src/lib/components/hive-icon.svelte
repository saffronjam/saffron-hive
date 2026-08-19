<script lang="ts">
	import DynamicIcon from "$lib/components/icons/dynamic-icon.svelte";
	import { deviceIcon } from "$lib/utils";
	import type { ContactRole } from "$lib/gql/graphql";

	interface Props {
		type: string;
		contactRole?: ContactRole | null;
		iconOverride?: string | null;
		class?: string;
	}

	let {
		type,
		contactRole = null,
		iconOverride = null,
		class: className = "size-4",
	}: Props = $props();

	const Fallback = $derived(deviceIcon(type, contactRole));
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
