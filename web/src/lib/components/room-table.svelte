<script lang="ts">
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
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import DynamicIcon from "$lib/components/icons/dynamic-icon.svelte";
	import { DoorOpen, Pencil, Trash2 } from "@lucide/svelte";
	import type { Device } from "$lib/stores/devices";

	interface RoomData {
		id: string;
		name: string;
		icon?: string | null;
		devices: Device[];
	}

	interface Props {
		rooms: RoomData[];
		onedit: (room: RoomData) => void;
		ondelete: (room: RoomData) => void;
		onrename: (room: RoomData, newName: string) => void;
		oniconchange: (room: RoomData, icon: string | null) => void;
	}

	let { rooms, onedit, ondelete, onrename, oniconchange }: Props = $props();
</script>

<div class="overflow-x-auto rounded-lg shadow-card bg-card">
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead class="w-12"></TableHead>
				<TableHead>Name</TableHead>
				<TableHead>Devices</TableHead>
				<TableHead class="w-24 text-right">Actions</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each rooms as room (room.id)}
				<TableRow>
					<TableCell>
						<IconPicker value={room.icon} onselect={(icon) => oniconchange(room, icon)}>
							<button
								type="button"
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
							>
								<DynamicIcon icon={room.icon} class="size-4.5 text-muted-foreground">
									{#snippet fallback()}
										<DoorOpen class="size-4.5 text-muted-foreground" />
									{/snippet}
								</DynamicIcon>
							</button>
						</IconPicker>
					</TableCell>
					<TableCell>
						<InlineEditName
							name={room.name}
							onsave={(newName) => onrename(room, newName)}
						/>
					</TableCell>
					<TableCell class="text-sm text-muted-foreground whitespace-nowrap">
						{room.devices.length} device{room.devices.length === 1 ? "" : "s"}
					</TableCell>
					<TableCell>
						<div class="flex items-center justify-end gap-1">
							<Tooltip>
								<TooltipTrigger>
									<Button
										variant="ghost"
										size="icon-sm"
										onclick={() => onedit(room)}
										aria-label="Edit room"
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
										onclick={() => ondelete(room)}
										aria-label="Delete room"
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
