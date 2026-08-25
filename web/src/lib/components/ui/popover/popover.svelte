<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import { onMount } from "svelte";
	import { DISMISS_POPOVERS_EVENT } from "$lib/popover-guard";

	let { open = $bindable(false), ...restProps }: PopoverPrimitive.RootProps = $props();

	onMount(() => {
		function dismiss() {
			open = false;
		}

		window.addEventListener(DISMISS_POPOVERS_EVENT, dismiss);
		return () => window.removeEventListener(DISMISS_POPOVERS_EVENT, dismiss);
	});
</script>

<PopoverPrimitive.Root bind:open {...restProps} />
