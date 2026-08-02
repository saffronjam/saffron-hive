<script lang="ts">
	import { AlertCircle } from "@lucide/svelte";
	import { slide } from "svelte/transition";

	interface Props {
		/** Nothing renders when this is null or empty, so callers can bind it directly. */
		message?: string | null;
		/**
		 * Wire this to the field's `aria-describedby` so a screen reader reads the
		 * message with the field rather than as a stray paragraph.
		 */
		id?: string;
	}

	let { message = null, id }: Props = $props();
</script>

{#if message}
	<p
		{id}
		class="mt-1.5 flex items-center gap-1.5 text-sm text-destructive"
		role="alert"
		transition:slide={{ duration: 150 }}
	>
		<AlertCircle class="size-4 shrink-0" aria-hidden="true" />
		{message}
	</p>
{/if}
