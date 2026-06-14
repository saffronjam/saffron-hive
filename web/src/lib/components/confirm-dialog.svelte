<script lang="ts">
	import type { Snippet } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		children?: Snippet;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: "destructive" | "default";
		loading?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
	}

	let {
		open = $bindable(false),
		title,
		description,
		children,
		confirmLabel = "Confirm",
		cancelLabel = "Cancel",
		variant = "destructive",
		loading = false,
		onconfirm,
		oncancel,
	}: Props = $props();
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{title}</DialogTitle>
			{#if description}
				<DialogDescription>{description}</DialogDescription>
			{/if}
		</DialogHeader>
		{@render children?.()}
		<DialogFooter>
			<Button variant="outline" onclick={oncancel}>{cancelLabel}</Button>
			<Button {variant} onclick={onconfirm} disabled={loading}>
				{loading ? "..." : confirmLabel}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
