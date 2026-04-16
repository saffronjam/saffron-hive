<script lang="ts">
	import { Workflow } from "@lucide/svelte";

	interface AutomationInfo {
		id: string;
		name: string;
	}

	interface ActivityEntry {
		automationId: string;
		nodeId: string;
		active: boolean;
		timestamp: Date;
	}

	interface Props {
		entries: ActivityEntry[];
		automations: AutomationInfo[];
	}

	let { entries, automations }: Props = $props();

	function automationName(automationId: string): string {
		const found = automations.find((a) => a.id === automationId);
		return found ? found.name : `Automation ${automationId}`;
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString(undefined, {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	}

	function formatRelative(date: Date): string {
		const now = Date.now();
		const diff = now - date.getTime();
		const seconds = Math.floor(diff / 1000);
		if (seconds < 60) return "just now";
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return formatTime(date);
	}
</script>

<div>
	<h3 class="mb-3 text-sm font-medium text-foreground">Recent Activity</h3>
	{#if entries.length === 0}
		<div class="rounded-lg border border-border bg-card px-4 py-6 text-center">
			<Workflow class="mx-auto mb-2 size-5 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">No recent automation activity.</p>
		</div>
	{:else}
		<div class="space-y-1">
			{#each entries as entry (entry.automationId + entry.nodeId + entry.timestamp.getTime())}
				<div class="flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-muted">
					<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
						<Workflow class="size-3.5 text-muted-foreground" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm text-foreground">
							{automationName(entry.automationId)}
						</p>
					</div>
					<span class="shrink-0 text-xs text-muted-foreground">
						{formatRelative(entry.timestamp)}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
