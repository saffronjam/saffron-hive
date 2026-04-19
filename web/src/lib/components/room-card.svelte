<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu/index.js";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import { DoorOpen, Pencil, Trash2, EllipsisVertical } from "@lucide/svelte";
	import type { Device } from "$lib/stores/devices";

	interface RoomData {
		id: string;
		name: string;
		icon?: string | null;
		devices: Device[];
	}

	interface Props {
		room: RoomData;
		onedit: (room: RoomData) => void;
		ondelete: (room: RoomData) => void;
		onrename: (room: RoomData, newName: string) => void;
		oniconchange: (room: RoomData, icon: string | null) => void;
	}

	let { room, onedit, ondelete, onrename, oniconchange }: Props = $props();
</script>

<div class="rounded-lg shadow-card bg-card p-4">
	<div class="flex items-center justify-between">
		<div class="flex flex-1 min-w-0 items-center gap-3">
			<IconPicker value={room.icon} onselect={(icon) => oniconchange(room, icon)}>
				<button type="button" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors">
					<AnimatedIcon icon={room.icon} class="size-5 text-muted-foreground">
						{#snippet fallback()}<DoorOpen class="size-5 text-muted-foreground" />{/snippet}
					</AnimatedIcon>
				</button>
			</IconPicker>
			<div class="min-w-0 flex-1">
				<InlineEditName name={room.name} onsave={(newName) => onrename(room, newName)} />
				<p class="text-xs text-muted-foreground">
					{room.devices.length} device{room.devices.length === 1 ? "" : "s"}
				</p>
			</div>
		</div>

		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button variant="ghost" size="icon-sm" aria-label="Room actions">
					<EllipsisVertical class="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onclick={() => onedit(room)}>
					<Pencil class="size-4" />
					Edit
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem variant="destructive" onclick={() => ondelete(room)}>
					<Trash2 class="size-4" />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	</div>
</div>
