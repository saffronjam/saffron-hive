<script lang="ts" generics="T extends string">
	import {
		CommandGroup,
		CommandItem,
	} from "$lib/components/ui/command/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { Group, DoorOpen, Clapperboard } from "@lucide/svelte";
	import { deviceIcon } from "$lib/utils";
	import type { Device } from "$lib/stores/devices";
	import EntitySelector from "$lib/components/entity-selector.svelte";

	interface PickerGroup {
		id: string;
		name: string;
		members: { id: string; memberType: string; memberId: string }[];
	}

	interface PickerRoom {
		id: string;
		name: string;
		devices: { id: string; name: string }[];
	}

	interface PickerScene {
		id: string;
		name: string;
	}

	type Selection = { type: T; id: string };

	interface Props {
		open: boolean;
		title?: string;
		description?: string;
		multiple?: boolean;
		devices?: Device[];
		groups?: PickerGroup[];
		rooms?: PickerRoom[];
		scenes?: PickerScene[];
		excludeGroupId?: string;
		onselect: (memberType: T, memberId: string) => void;
	}

	let {
		open = $bindable(false),
		title = "Add Member",
		description = "Search for devices or groups to add.",
		multiple = false,
		devices = [],
		groups = [],
		rooms = [],
		scenes = [],
		excludeGroupId,
		onselect,
	}: Props = $props();

	let selected = $state<Selection[]>([]);

	const filteredGroups = $derived(
		groups.filter((g) => g.id !== excludeGroupId)
	);

	function isSelected(type: T, id: string): boolean {
		return selected.some((s) => s.type === type && s.id === id);
	}

	function handleSelect(type: T, id: string) {
		if (!multiple) {
			onselect(type, id);
			return;
		}

		if (isSelected(type, id)) {
			selected = selected.filter((s) => !(s.type === type && s.id === id));
		} else {
			selected = [...selected, { type, id }];
		}
	}

	function handleConfirm() {
		for (const s of selected) {
			onselect(s.type, s.id);
		}
		selected = [];
		open = false;
	}

	$effect(() => {
		if (!open) {
			selected = [];
		}
	});

</script>

<EntitySelector
	bind:open
	{title}
	{description}
	placeholder="Search..."
>
	{#if devices.length > 0}
		<CommandGroup heading="Devices">
			{#each devices as device (device.id)}
				{@const Icon = deviceIcon(device.type)}
				{@const checked = isSelected("device" as T, device.id)}
				<CommandItem
					value="{device.name} {device.type}"
					onSelect={() => handleSelect("device" as T, device.id)}
					data-checked={checked}
				>
					<Icon class="size-4 text-muted-foreground" />
					<span class="flex-1 truncate">{device.name}</span>
					<HiveChip type={device.type} class="text-xs" />
				</CommandItem>
			{/each}
		</CommandGroup>
	{/if}
	{#if filteredGroups.length > 0}
		<CommandGroup heading="Groups">
			{#each filteredGroups as group (group.id)}
				{@const checked = isSelected("group" as T, group.id)}
				<CommandItem
					value={group.name}
					onSelect={() => handleSelect("group" as T, group.id)}
					data-checked={checked}
				>
					<Group class="size-4 text-muted-foreground" />
					<span class="flex-1 truncate">{group.name}</span>
					<Badge variant="outline" class="ml-auto">
						{group.members.length} member{group.members.length === 1 ? "" : "s"}
					</Badge>
				</CommandItem>
			{/each}
		</CommandGroup>
	{/if}
	{#if rooms.length > 0}
		<CommandGroup heading="Rooms">
			{#each rooms as room (room.id)}
				{@const checked = isSelected("room" as T, room.id)}
				<CommandItem
					value={room.name}
					onSelect={() => handleSelect("room" as T, room.id)}
					data-checked={checked}
				>
					<DoorOpen class="size-4 text-muted-foreground" />
					<span class="flex-1 truncate">{room.name}</span>
					<Badge variant="outline" class="ml-auto">
						{room.devices.length} device{room.devices.length === 1 ? "" : "s"}
					</Badge>
				</CommandItem>
			{/each}
		</CommandGroup>
	{/if}
	{#if scenes.length > 0}
		<CommandGroup heading="Scenes">
			{#each scenes as scene (scene.id)}
				{@const checked = isSelected("scene" as T, scene.id)}
				<CommandItem
					value={scene.name}
					onSelect={() => handleSelect("scene" as T, scene.id)}
					data-checked={checked}
				>
					<Clapperboard class="size-4 text-muted-foreground" />
					<span class="flex-1 truncate">{scene.name}</span>
				</CommandItem>
			{/each}
		</CommandGroup>
	{/if}

	{#if multiple && selected.length > 0}
		<div class="sticky bottom-0 border-t bg-popover p-2">
			<Button class="w-full" onclick={handleConfirm}>
				Add {selected.length} {selected.length === 1 ? "item" : "items"}
			</Button>
		</div>
	{/if}
</EntitySelector>
