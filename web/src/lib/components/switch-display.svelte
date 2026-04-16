<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { MousePointerClick } from "@lucide/svelte";
	import type { SwitchState } from "$lib/stores/devices";

	interface Props {
		state: SwitchState;
		lastSeen: string;
	}

	let { state, lastSeen }: Props = $props();

	const formattedTime = $derived.by(() => {
		const date = new Date(lastSeen);
		if (isNaN(date.getTime())) return "Unknown";
		return date.toLocaleString();
	});
</script>

<Card>
	<CardHeader>
		<CardTitle>Switch Status</CardTitle>
	</CardHeader>
	<CardContent>
		<div class="flex items-center gap-4">
			<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
				<MousePointerClick class="size-6 text-muted-foreground" />
			</div>
			<div class="min-w-0 flex-1">
				{#if state.action}
					<p class="text-sm text-muted-foreground">Last Action</p>
					<div class="mt-1 flex items-center gap-2">
						<Badge variant="default">{state.action}</Badge>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">No action recorded</p>
				{/if}
				<p class="mt-2 text-xs text-muted-foreground">
					Last seen: {formattedTime}
				</p>
			</div>
		</div>
	</CardContent>
</Card>
