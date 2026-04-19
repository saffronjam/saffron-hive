<script lang="ts">
	import { goto } from "$app/navigation";
	import { type Device } from "$lib/stores/devices";
	import { stateSummary } from "$lib/device-state";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import DeviceTypeBadge from "$lib/components/device-type-badge.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu/index.js";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import { DoorOpen, EllipsisVertical, Group as GroupIcon, Pencil, Plus } from "@lucide/svelte";


	interface MembershipChip {
		id: string;
		name: string;
	}

	interface Props {
		device: Device;
		roomChips?: MembershipChip[];
		groupChips?: MembershipChip[];
		onrename: (id: string, newName: string) => void;
		onAddTo: (device: Device) => void;
	}

	let {
		device,
		roomChips = [],
		groupChips = [],
		onrename,
		onAddTo,
	}: Props = $props();

	const summary = $derived(stateSummary(device.state));
</script>

<Card
	size="sm"
	class="transition-all hover:shadow-card-hover hover:bg-accent/50"
>
	<CardHeader>
		<div class="flex items-center justify-between">
			<InlineEditName name={device.name} onsave={(newName) => onrename(device.id, newName)} />
			<div class="flex items-center gap-2">
				<span
					class="h-2.5 w-2.5 shrink-0 rounded-full {device.available ? 'bg-green-500' : 'bg-destructive'}"
				></span>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="ghost" size="icon-sm" aria-label="Device actions">
							<EllipsisVertical class="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onclick={() => goto(`/devices/${device.id}`)}>
							<Pencil class="size-4" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onclick={() => onAddTo(device)}>
							<Plus class="size-4" />
							Add to
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<DeviceTypeBadge type={device.type} />
			<Badge variant="outline">
				{device.source.charAt(0).toUpperCase() + device.source.slice(1)}
			</Badge>
		</div>
		{#if roomChips.length > 0 || groupChips.length > 0}
			<div class="flex flex-wrap items-center gap-1">
				{#each roomChips as chip (chip.id)}
					<a href={`/rooms?edit=${chip.id}`} class="inline-flex">
						<Badge variant="outline" class="cursor-pointer gap-1 hover:bg-muted">
							<DoorOpen class="size-3" />
							{chip.name}
						</Badge>
					</a>
				{/each}
				{#each groupChips as chip (chip.id)}
					<a href={`/groups?edit=${chip.id}`} class="inline-flex">
						<Badge variant="outline" class="cursor-pointer gap-1 hover:bg-muted">
							<GroupIcon class="size-3" />
							{chip.name}
						</Badge>
					</a>
				{/each}
			</div>
		{/if}
	</CardHeader>
	<CardContent>
		<p class="text-sm text-muted-foreground">{summary}</p>
	</CardContent>
</Card>
