<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { dismissPopovers } from "$lib/popover-guard";

	let { open = $bindable(false), ...restProps }: DialogPrimitive.RootProps = $props();
	let wasOpen = false;

	$effect(() => {
		if (open && !wasOpen) dismissPopovers();
		wasOpen = open;
	});
</script>

<DialogPrimitive.Root bind:open {...restProps} />
