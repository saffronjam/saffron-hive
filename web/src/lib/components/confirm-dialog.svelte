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
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

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
		confirmLabel,
		cancelLabel,
		variant = "destructive",
		loading = false,
		onconfirm,
		oncancel,
	}: Props = $props();

	const resolvedConfirmLabel = $derived(
		confirmLabel ?? m.common_confirm({}, locale.messageOptions()),
	);
	const resolvedCancelLabel = $derived(
		cancelLabel ?? m.common_cancel({}, locale.messageOptions()),
	);
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
			<Button variant="outline" onclick={oncancel}>{resolvedCancelLabel}</Button>
			<Button {variant} onclick={onconfirm} disabled={loading}>
				{loading ? m.common_loading({}, locale.messageOptions()) : resolvedConfirmLabel}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
