<script lang="ts">
	import { goto } from "$app/navigation";
	import { type Device } from "$lib/stores/devices";
	import { stateSummary } from "$lib/device-state";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from "$lib/components/ui/table/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import DeviceTypeBadge from "$lib/components/device-type-badge.svelte";
	import DeviceQuickControls from "$lib/components/device-quick-controls.svelte";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import DynamicIcon from "$lib/components/icons/dynamic-icon.svelte";
	import TableHeaderCheckbox from "$lib/components/table-header-checkbox.svelte";
	import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";
	import { sentenceCase } from "$lib/utils";
	import { DoorOpen, Group as GroupIcon, Pencil, Plus } from "@lucide/svelte";

	interface MembershipChip {
		id: string;
		name: string;
		icon?: string | null;
	}

	interface Row {
		device: Device;
		roomChips: MembershipChip[];
		groupChips: MembershipChip[];
	}

	interface Props {
		rows: Row[];
		orderedIds: readonly string[];
		selection: TableSelection;
		onrename: (id: string, newName: string) => void;
		onAddTo: (device: Device) => void;
	}

	let { rows, orderedIds, selection, onrename, onAddTo }: Props = $props();
</script>

<div class="overflow-x-auto rounded-lg shadow-card bg-card">
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead class="w-10">
					<TableHeaderCheckbox {selection} {orderedIds} />
				</TableHead>
				<TableHead class="w-8"></TableHead>
				<TableHead class="w-24">Type</TableHead>
				<TableHead>Name</TableHead>
				<TableHead>Source</TableHead>
				<TableHead>Rooms &amp; Groups</TableHead>
				<TableHead>State</TableHead>
				<TableHead class="w-24 text-right">Actions</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each rows as { device, roomChips, groupChips } (device.id)}
				<TableRow data-state={selection.isSelected(device.id) ? "selected" : undefined}>
					<TableCell>
						<TableRowCheckbox id={device.id} {selection} {orderedIds} ariaLabel="Select {device.name}" />
					</TableCell>
					<TableCell>
						<span
							class="inline-block h-2.5 w-2.5 shrink-0 rounded-full {device.available
								? 'bg-green-500'
								: 'bg-destructive'}"
							aria-label={device.available ? "Online" : "Offline"}
						></span>
					</TableCell>
					<TableCell>
						<DeviceTypeBadge type={device.type} />
					</TableCell>
					<TableCell>
						<InlineEditName
							name={device.name}
							onsave={(newName) => onrename(device.id, newName)}
						/>
					</TableCell>
					<TableCell>
						<Badge variant="outline">{sentenceCase(device.source)}</Badge>
					</TableCell>
					<TableCell>
						{#if roomChips.length === 0 && groupChips.length === 0}
							<span class="text-muted-foreground">—</span>
						{:else}
							<div class="flex flex-wrap items-center gap-1">
								{#each roomChips as chip (chip.id)}
									<a href={`/rooms?edit=${chip.id}`} class="inline-flex">
										<Badge variant="outline" class="cursor-pointer gap-1 hover:bg-muted">
											<DynamicIcon icon={chip.icon} class="size-3">
												{#snippet fallback()}
													<DoorOpen class="size-3" />
												{/snippet}
											</DynamicIcon>
											{chip.name}
										</Badge>
									</a>
								{/each}
								{#each groupChips as chip (chip.id)}
									<a href={`/groups?edit=${chip.id}`} class="inline-flex">
										<Badge variant="outline" class="cursor-pointer gap-1 hover:bg-muted">
											<DynamicIcon icon={chip.icon} class="size-3">
												{#snippet fallback()}
													<GroupIcon class="size-3" />
												{/snippet}
											</DynamicIcon>
											{chip.name}
										</Badge>
									</a>
								{/each}
							</div>
						{/if}
					</TableCell>
					<TableCell class="text-sm text-muted-foreground">
						{stateSummary(device.state, device.type)}
					</TableCell>
					<TableCell>
						<div class="flex items-center justify-end gap-1">
							<DeviceQuickControls {device} />
							<Tooltip>
								<TooltipTrigger>
									<Button
										variant="ghost"
										size="icon-sm"
										onclick={() => onAddTo(device)}
										aria-label="Add to room or group"
									>
										<Plus class="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Add to…</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger>
									<Button
										variant="ghost"
										size="icon-sm"
										onclick={() => goto(`/devices/${device.id}`)}
										aria-label="Edit device"
									>
										<Pencil class="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Edit</TooltipContent>
							</Tooltip>
						</div>
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
