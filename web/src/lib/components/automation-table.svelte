<script lang="ts">
	import { goto } from "$app/navigation";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from "$lib/components/ui/table/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import DynamicIcon from "$lib/components/icons/dynamic-icon.svelte";
	import TableHeaderCheckbox from "$lib/components/table-header-checkbox.svelte";
	import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";
	import { automationNodeCounts } from "$lib/list-helpers";
	import { formatCooldown, formatFull, formatRelative } from "$lib/time-format";
	import { nowStore } from "$lib/stores/now.svelte";
	import { GitMerge, Pencil, Play, Trash2, Workflow, Zap } from "@lucide/svelte";

	interface AutomationNode {
		id: string;
		type: string;
		config: string;
	}

	interface AutomationEdge {
		id: string;
		fromNodeId: string;
		toNodeId: string;
	}

	interface AutomationData {
		id: string;
		name: string;
		icon?: string | null;
		enabled: boolean;
		cooldownSeconds: number;
		lastFiredAt?: string | null;
		nodes: AutomationNode[];
		edges: AutomationEdge[];
		createdBy?: { id: string; username: string; name: string } | null;
	}

	interface Props {
		automations: AutomationData[];
		orderedIds: readonly string[];
		selection: TableSelection;
		ontoggle: (id: string, enabled: boolean) => void;
		ondelete: (id: string) => void;
		onrename: (id: string, newName: string) => void;
		oniconchange: (id: string, icon: string | null) => void;
	}

	let { automations, orderedIds, selection, ontoggle, ondelete, onrename, oniconchange }: Props = $props();
</script>

<div class="overflow-x-auto rounded-lg shadow-card bg-card">
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead class="w-10">
					<TableHeaderCheckbox {selection} {orderedIds} />
				</TableHead>
				<TableHead class="w-12"></TableHead>
				<TableHead>Name</TableHead>
				<TableHead>Meta</TableHead>
				<TableHead>Composition</TableHead>
				<TableHead>Last triggered</TableHead>
				<TableHead>Created by</TableHead>
				<TableHead class="w-20">Enabled</TableHead>
				<TableHead class="w-24 text-right">Actions</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each automations as automation (automation.id)}
				{@const c = automationNodeCounts(automation.nodes)}
				<TableRow data-state={selection.isSelected(automation.id) ? "selected" : undefined}>
					<TableCell>
						<TableRowCheckbox id={automation.id} {selection} {orderedIds} ariaLabel="Select {automation.name}" />
					</TableCell>
					<TableCell>
						<IconPicker
							value={automation.icon}
							onselect={(icon) => oniconchange(automation.id, icon)}
						>
							<button
								type="button"
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
							>
								<DynamicIcon icon={automation.icon} class="size-4.5 text-muted-foreground">
									{#snippet fallback()}
										<Workflow class="size-4.5 text-muted-foreground" />
									{/snippet}
								</DynamicIcon>
							</button>
						</IconPicker>
					</TableCell>
					<TableCell>
						<InlineEditName
							name={automation.name}
							onsave={(newName) => onrename(automation.id, newName)}
						/>
					</TableCell>
					<TableCell class="text-xs text-muted-foreground whitespace-nowrap">
						{automation.nodes.length} node{automation.nodes.length === 1 ? "" : "s"}
						&middot;
						{formatCooldown(automation.cooldownSeconds)}
					</TableCell>
					<TableCell>
						{#if c.trigger === 0 && c.operator === 0 && c.action === 0}
							<span class="text-muted-foreground">—</span>
						{:else}
							<div class="flex flex-wrap gap-1">
								{#if c.trigger > 0}
									<Badge variant="secondary" class="gap-1 text-xs">
										<Zap class="size-3 text-blue-500" />
										{c.trigger}
									</Badge>
								{/if}
								{#if c.operator > 0}
									<Badge variant="secondary" class="gap-1 text-xs">
										<GitMerge class="size-3 text-yellow-500" />
										{c.operator}
									</Badge>
								{/if}
								{#if c.action > 0}
									<Badge variant="secondary" class="gap-1 text-xs">
										<Play class="size-3 text-green-500" />
										{c.action}
									</Badge>
								{/if}
							</div>
						{/if}
					</TableCell>
					<TableCell class="text-xs text-muted-foreground whitespace-nowrap">
						{#if automation.lastFiredAt}
							<Tooltip>
								<TooltipTrigger>
									<span>{formatRelative(new Date(automation.lastFiredAt), nowStore.current)}</span>
								</TooltipTrigger>
								<TooltipContent>{formatFull(new Date(automation.lastFiredAt))}</TooltipContent>
							</Tooltip>
						{:else}
							<span class="text-muted-foreground">—</span>
						{/if}
					</TableCell>
					<TableCell class="text-sm text-muted-foreground whitespace-nowrap">
						{automation.createdBy?.name ?? "—"}
					</TableCell>
					<TableCell>
						<Switch
							checked={automation.enabled}
							onCheckedChange={(checked) => ontoggle(automation.id, checked)}
						/>
					</TableCell>
					<TableCell>
						<div class="flex items-center justify-end gap-1">
							<Tooltip>
								<TooltipTrigger>
									<Button
										variant="ghost"
										size="icon-sm"
										onclick={() => goto(`/automations/${automation.id}`)}
										aria-label="Edit automation"
									>
										<Pencil class="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Edit</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger>
									<Button
										variant="ghost"
										size="icon-sm"
										onclick={() => ondelete(automation.id)}
										aria-label="Delete automation"
										class="text-destructive hover:text-destructive"
									>
										<Trash2 class="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Delete</TooltipContent>
							</Tooltip>
						</div>
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
