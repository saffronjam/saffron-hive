<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from "$lib/components/ui/table/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import AlarmSeverityBadge from "$lib/components/alarm-severity-badge.svelte";
	import TableHeaderCheckbox from "$lib/components/table-header-checkbox.svelte";
	import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";
	import { formatRelative, formatFull } from "$lib/time-format";
	import { nowStore } from "$lib/stores/now.svelte";
	import { Trash2 } from "@lucide/svelte";
	import type { Alarm } from "$lib/stores/alarms.svelte";

	interface Props {
		alarms: Alarm[];
		orderedIds: readonly string[];
		selection: TableSelection;
		ondelete: (alarm: Alarm) => void;
	}

	let { alarms, orderedIds, selection, ondelete }: Props = $props();

	function kindLabel(k: Alarm["kind"]): string {
		return k === "AUTO" ? "Auto" : "One-shot";
	}
</script>

<div class="overflow-x-auto rounded-lg shadow-card bg-card">
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead class="w-10">
					<TableHeaderCheckbox {selection} {orderedIds} />
				</TableHead>
				<TableHead class="w-28">Severity</TableHead>
				<TableHead class="w-24">Kind</TableHead>
				<TableHead>Message</TableHead>
				<TableHead class="w-48">ID</TableHead>
				<TableHead class="w-40">Source</TableHead>
				<TableHead class="w-16 text-right">Count</TableHead>
				<TableHead class="w-32">Last raised</TableHead>
				<TableHead class="w-16 text-right">Actions</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each alarms as alarm (alarm.id)}
				<TableRow data-state={selection.isSelected(alarm.id) ? "selected" : undefined}>
					<TableCell>
						<TableRowCheckbox id={alarm.id} {selection} {orderedIds} ariaLabel="Select alarm {alarm.id}" />
					</TableCell>
					<TableCell>
						<AlarmSeverityBadge severity={alarm.severity} />
					</TableCell>
					<TableCell>
						<Badge variant="outline">{kindLabel(alarm.kind)}</Badge>
					</TableCell>
					<TableCell class="truncate max-w-md">{alarm.message}</TableCell>
					<TableCell class="font-mono text-xs text-muted-foreground truncate max-w-[12rem]">{alarm.id}</TableCell>
					<TableCell class="text-xs text-muted-foreground">{alarm.source}</TableCell>
					<TableCell class="text-right tabular-nums">{alarm.count}</TableCell>
					<TableCell class="text-xs text-muted-foreground">
						<Tooltip>
							<TooltipTrigger>
								<span>{formatRelative(new Date(alarm.lastRaisedAt), nowStore.current)}</span>
							</TooltipTrigger>
							<TooltipContent>{formatFull(new Date(alarm.lastRaisedAt))}</TooltipContent>
						</Tooltip>
					</TableCell>
					<TableCell class="text-right">
						<Button
							variant="ghost"
							size="icon"
							aria-label="Delete alarm"
							onclick={() => ondelete(alarm)}
						>
							<Trash2 class="size-4 text-destructive" />
						</Button>
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
