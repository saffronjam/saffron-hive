<script lang="ts">
	import { beforeNavigate, goto } from "$app/navigation";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		dirty: boolean;
		/**
		 * Whether in-app navigation should be intercepted. A page that survives
		 * navigation loses nothing by being left, so it turns this off and
		 * keeps only the reload/close prompt, where loss is real.
		 */
		blockNavigation?: boolean;
	}

	let { dirty, blockNavigation = true }: Props = $props();

	let showDialog = $state(false);
	let pendingUrl = $state<string | null>(null);
	let bypassing = false;

	beforeNavigate(({ from, to, cancel }) => {
		if (!blockNavigation || bypassing || !dirty || !to) return;
		if (
			from &&
			from.url.pathname === to.url.pathname &&
			from.url.search === to.url.search
		) return;
		cancel();
		pendingUrl = to.url.pathname + to.url.search;
		showDialog = true;
	});

	function handleLeave() {
		showDialog = false;
		const url = pendingUrl;
		pendingUrl = null;
		if (url) {
			bypassing = true;
			goto(url).finally(() => {
				bypassing = false;
			});
		}
	}

	function handleStay() {
		showDialog = false;
		pendingUrl = null;
	}

	$effect(() => {
		if (!dirty) return;
		const handler = (e: BeforeUnloadEvent) => e.preventDefault();
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	});
</script>

<Dialog bind:open={showDialog}>
	<DialogContent showCloseButton={false}>
		<DialogHeader>
			<DialogTitle>{m.shared_unsaved_title({}, locale.messageOptions())}</DialogTitle>
			<DialogDescription>
				{m.shared_unsaved_description({}, locale.messageOptions())}
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={handleStay}>
				{m.shared_unsaved_stay({}, locale.messageOptions())}
			</Button>
			<Button variant="destructive" onclick={handleLeave}>
				{m.shared_unsaved_leave({}, locale.messageOptions())}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
