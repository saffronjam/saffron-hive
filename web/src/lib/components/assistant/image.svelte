<script lang="ts">
	import { authenticatedFetch } from "$lib/graphql/client";
	let { id, name }: { id: string; name: string } = $props();
	let url = $state("");
	$effect(() => {
		const controller = new AbortController();
		let objectURL = "";
		url = "";
		void authenticatedFetch(`/api/assistant/attachments/${encodeURIComponent(id)}`, {
			signal: controller.signal,
		})
			.then(async (r) => {
				if (r.ok) {
					const blob = await r.blob();
					if (!controller.signal.aborted) {
						objectURL = URL.createObjectURL(blob);
						url = objectURL;
					}
				}
			})
			.catch(() => {});
		return () => {
			controller.abort();
			if (objectURL) URL.revokeObjectURL(objectURL);
		};
	});
</script>

{#if url}<img
		src={url}
		alt={name}
		class="max-h-48 max-w-full rounded-lg object-contain"
	/>{:else}<span class="bg-muted text-muted-foreground rounded-lg p-3 text-xs">{name}</span>{/if}
