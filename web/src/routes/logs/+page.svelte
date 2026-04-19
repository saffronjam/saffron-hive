<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { createGraphQLClient } from "$lib/graphql/client";
	import { gql } from "@urql/svelte";
	import type { Client } from "@urql/svelte";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Radio } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";

	interface LogEntry {
		timestamp: string;
		level: string;
		message: string;
		attrs: string;
	}

	const LOGS_QUERY = gql`
		query Logs($limit: Int) {
			logs(limit: $limit) {
				timestamp
				level
				message
				attrs
			}
		}
	`;

	const LOG_STREAM = gql`
		subscription LogStream {
			logStream {
				timestamp
				level
				message
				attrs
			}
		}
	`;

	let client: Client;
	let entries = $state<LogEntry[]>([]);
	let search = $state("");
	let live = $state(true);
	let logContainer: HTMLDivElement | null = null;
	let unsubscribe: (() => void) | null = null;

	const filteredEntries = $derived.by(() => {
		if (!search) return entries;
		const query = search.toLowerCase();
		return entries.filter(
			(e) =>
				e.message.toLowerCase().includes(query) ||
				e.level.toLowerCase().includes(query) ||
				e.attrs.toLowerCase().includes(query)
		);
	});

	function levelVariant(
		level: string
	): "default" | "secondary" | "destructive" | "outline" {
		switch (level) {
			case "ERROR":
				return "destructive";
			case "WARN":
				return "outline";
			default:
				return "secondary";
		}
	}

	function levelClass(level: string): string {
		switch (level) {
			case "ERROR":
				return "";
			case "WARN":
				return "border-yellow-500/50 text-yellow-700 dark:text-yellow-400";
			case "DEBUG":
				return "text-muted-foreground";
			default:
				return "";
		}
	}

	function formatTimestamp(ts: string): string {
		const d = new Date(ts);
		return d.toLocaleTimeString("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			fractionalSecondDigits: 3,
		});
	}

	function formatAttrs(attrsJson: string): string {
		try {
			const obj = JSON.parse(attrsJson);
			if (!obj || Object.keys(obj).length === 0) return "";
			return Object.entries(obj)
				.map(([k, v]) => `${k}=${v}`)
				.join(" ");
		} catch {
			return "";
		}
	}

	function scrollToBottom() {
		if (logContainer) {
			logContainer.scrollTop = logContainer.scrollHeight;
		}
	}

	function startSubscription() {
		if (!client || unsubscribe) return;
		const sub = client.subscription<{ logStream: LogEntry }>(LOG_STREAM, {}).subscribe((result) => {
			if (result.data) {
				entries = [...entries, result.data.logStream];
				if (live) {
					requestAnimationFrame(scrollToBottom);
				}
			}
		});
		unsubscribe = sub.unsubscribe;
	}

	async function loadInitialLogs() {
		const result = await client
			.query<{ logs: LogEntry[] }>(LOGS_QUERY, { limit: 1000 })
			.toPromise();
		if (result.data) {
			entries = result.data.logs;
			requestAnimationFrame(scrollToBottom);
		}
	}

	function toggleLive() {
		live = !live;
		if (live) {
			requestAnimationFrame(scrollToBottom);
		}
	}

	onMount(() => {
		client = createGraphQLClient();
		pageHeader.breadcrumbs = [{ label: "Logs" }];
		loadInitialLogs().then(() => {
			startSubscription();
		});
	});

	onDestroy(() => {
		pageHeader.reset();
		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}
	});
</script>

<div class="flex flex-col gap-4 h-full">
	<div class="flex items-center gap-3">
		<Input
			type="search"
			placeholder="Search logs..."
			value={search}
			oninput={(e) => (search = e.currentTarget.value)}
			class="flex-1"
		/>
		<Button variant={live ? "default" : "outline"} size="sm" onclick={toggleLive}>
			<Radio class="size-4 mr-1.5" />
			{live ? "Live" : "Paused"}
		</Button>
	</div>

	<div
		bind:this={logContainer}
		class="flex-1 overflow-auto rounded-lg border bg-card font-mono text-xs"
	>
		<table class="w-full">
			<tbody>
				{#each filteredEntries as entry (entry.timestamp + entry.message)}
					<tr class="border-b border-border/50 hover:bg-muted/50">
						<td class="px-3 py-1.5 text-muted-foreground whitespace-nowrap align-top">
							{formatTimestamp(entry.timestamp)}
						</td>
						<td class="px-2 py-1.5 whitespace-nowrap align-top">
							<Badge variant={levelVariant(entry.level)} class="{levelClass(entry.level)} text-[10px] px-1.5 py-0">
								{entry.level}
							</Badge>
						</td>
						<td class="px-3 py-1.5 align-top">
							{entry.message}
							{#if formatAttrs(entry.attrs)}
								<span class="text-muted-foreground ml-2">
									{formatAttrs(entry.attrs)}
								</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
