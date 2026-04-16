<script lang="ts">
	import {
		Command,
		CommandEmpty,
		CommandGroup,
		CommandInput,
		CommandItem,
		CommandList,
	} from "$lib/components/ui/command/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Lightbulb, Thermometer, ToggleLeft, Group, Package } from "@lucide/svelte";
	import type { Device } from "$lib/stores/devices";

	interface PickerGroup {
		id: string;
		name: string;
		members: { id: string; memberType: string; memberId: string }[];
	}

	interface Props {
		devices: Device[];
		groups: PickerGroup[];
		excludeGroupId?: string;
		onselect: (memberType: "device" | "group", memberId: string) => void;
	}

	let { devices, groups, excludeGroupId, onselect }: Props = $props();

	let search = $state("");

	const filteredDevices = $derived(
		devices.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
	);

	const filteredGroups = $derived(
		groups
			.filter((g) => g.id !== excludeGroupId)
			.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
	);

	function deviceIcon(type: string): typeof Lightbulb {
		switch (type) {
			case "light":
				return Lightbulb;
			case "sensor":
				return Thermometer;
			case "switch":
				return ToggleLeft;
			default:
				return Package;
		}
	}
</script>

<Command class="rounded-lg border border-border" shouldFilter={false}>
	<CommandInput placeholder="Search devices and groups..." bind:value={search} />
	<CommandList>
		<CommandEmpty>No results found.</CommandEmpty>
		{#if filteredDevices.length > 0}
			<CommandGroup heading="Devices">
				{#each filteredDevices as device (device.id)}
					{@const Icon = deviceIcon(device.type)}
					<CommandItem
						value={`device-${device.id}`}
						onSelect={() => onselect("device", device.id)}
					>
						<Icon class="size-4 text-muted-foreground" />
						<span>{device.name}</span>
						<Badge variant="secondary" class="ml-auto">{device.type}</Badge>
					</CommandItem>
				{/each}
			</CommandGroup>
		{/if}
		{#if filteredGroups.length > 0}
			<CommandGroup heading="Groups">
				{#each filteredGroups as group (group.id)}
					<CommandItem
						value={`group-${group.id}`}
						onSelect={() => onselect("group", group.id)}
					>
						<Group class="size-4 text-muted-foreground" />
						<span>{group.name}</span>
						<Badge variant="outline" class="ml-auto">
							{group.members.length} member{group.members.length === 1 ? "" : "s"}
						</Badge>
					</CommandItem>
				{/each}
			</CommandGroup>
		{/if}
	</CommandList>
</Command>
