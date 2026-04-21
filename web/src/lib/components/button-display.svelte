<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { MousePointerClick } from "@lucide/svelte";

	interface Props {
		lastAction?: string | null;
		lastActionAt?: string | null;
		lastSeen: string;
	}

	let { lastAction = null, lastActionAt = null, lastSeen }: Props = $props();

	function formatTime(s: string | null): string {
		if (!s) return "Unknown";
		const date = new Date(s);
		if (isNaN(date.getTime())) return "Unknown";
		return date.toLocaleString();
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>Button Status</CardTitle>
	</CardHeader>
	<CardContent>
		<div class="flex items-center gap-4">
			<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
				<MousePointerClick class="size-6 text-muted-foreground" />
			</div>
			<div class="min-w-0 flex-1">
				{#if lastAction}
					<p class="text-sm text-muted-foreground">Last Action</p>
					<div class="mt-1 flex items-center gap-2">
						<Badge variant="default">{lastAction}</Badge>
					</div>
					{#if lastActionAt}
						<p class="mt-1 text-xs text-muted-foreground">at {formatTime(lastActionAt)}</p>
					{/if}
				{:else}
					<p class="text-sm text-muted-foreground">No action recorded</p>
				{/if}
				<p class="mt-2 text-xs text-muted-foreground">
					Last seen: {formatTime(lastSeen)}
				</p>
			</div>
		</div>
	</CardContent>
</Card>
