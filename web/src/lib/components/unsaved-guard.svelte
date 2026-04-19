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

	interface Props {
		dirty: boolean;
	}

	let { dirty }: Props = $props();

	let showDialog = $state(false);
	let pendingUrl = $state<string | null>(null);
	let bypassing = false;

	beforeNavigate(({ to, cancel }) => {
		if (bypassing || !dirty || !to) return;
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
			<DialogTitle>Unsaved changes</DialogTitle>
			<DialogDescription>
				You have unsaved changes that will be lost if you leave this page.
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={handleStay}>Stay</Button>
			<Button variant="destructive" onclick={handleLeave}>Discard and leave</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
