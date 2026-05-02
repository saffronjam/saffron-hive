<script lang="ts" module>
	export type SensorPopoverTarget =
		| { kind: "device"; id: string }
		| { kind: "room"; id: string }
		| { kind: "group"; id: string }
		| { kind: "apartment" };
</script>

<script lang="ts">
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import StateHistoryChart from "$lib/components/state-history-chart.svelte";
	import type { StateHistorySource } from "$lib/state-history-source";
	import { Button } from "$lib/components/ui/button/index.js";
	import { ExternalLink } from "@lucide/svelte";
	import { markPopoverDismissed } from "$lib/popover-guard";
	import type { Snippet } from "svelte";

	interface Props {
		target: SensorPopoverTarget;
		fields?: string[];
		title?: string;
		align?: "start" | "center" | "end";
		triggerClass?: string;
		children: Snippet;
	}

	let {
		target,
		fields,
		title = "Last 12 hours",
		align = "start",
		triggerClass = "",
		children,
	}: Props = $props();

	let open = $state(false);
	const RANGE_MS = 12 * 60 * 60 * 1000;

	$effect(() => {
		if (!open) return;
		if (typeof window === "undefined") return;
		if (!window.matchMedia("(pointer: coarse)").matches) return;
		const swallow = (e: MouseEvent) => {
			const target = e.target as Element | null;
			if (target?.closest('[data-slot="popover-content"]')) return;
			e.stopPropagation();
			e.stopImmediatePropagation();
			e.preventDefault();
			open = false;
		};
		document.addEventListener("click", swallow, { capture: true });
		return () => document.removeEventListener("click", swallow, true);
	});

	let from = $state<Date>(new Date(Date.now() - RANGE_MS));
	let to = $state<Date>(new Date());

	$effect(() => {
		if (open) {
			const now = Date.now();
			from = new Date(now - RANGE_MS);
			to = new Date(now);
		}
	});

	const sources = $derived<StateHistorySource[]>([
		target.kind === "device"
			? { kind: "device", id: target.id }
			: target.kind === "apartment"
				? { kind: "apartment" }
				: { kind: target.kind, id: target.id, name: title },
	]);

	const viewMoreHref = $derived.by(() => {
		const params = new URLSearchParams();
		params.set("from", from.toISOString());
		params.set("to", to.toISOString());
		let token: string;
		switch (target.kind) {
			case "apartment":
				token = "apt";
				break;
			case "room":
				token = `room:${target.id}`;
				break;
			case "group":
				token = `group:${target.id}`;
				break;
			case "device":
				token = `dev:${target.id}`;
				break;
		}
		params.set("sources", token);
		return `/data-viewer?${params.toString()}`;
	});
</script>

<Popover
	bind:open
	onOpenChange={(o) => {
		if (!o) markPopoverDismissed();
	}}
>
	<PopoverTrigger class={triggerClass} onclick={(e) => e.stopPropagation()}>
		{@render children()}
	</PopoverTrigger>
	<PopoverContent class="w-[min(90vw,520px)] p-3" {align}>
		<div class="mb-2 flex items-center justify-between gap-2">
			<span class="text-sm font-medium">{title}</span>
			<Button variant="link" size="sm" class="h-auto gap-1 p-0 text-xs" href={viewMoreHref}>
				View more
				<ExternalLink class="size-3" />
			</Button>
		</div>
		<StateHistoryChart {sources} {fields} {from} {to} height="h-48" showChips={false} />
	</PopoverContent>
</Popover>
