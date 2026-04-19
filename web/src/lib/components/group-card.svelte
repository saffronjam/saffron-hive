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
	import { Group, Pencil, Trash2, EllipsisVertical } from "@lucide/svelte";
	import type { Device } from "$lib/stores/devices";

	interface RoomData {
		id: string;
		name: string;
		devices: { id: string; name: string }[];
	}

	interface GroupMember {
		id: string;
		memberType: string;
		memberId: string;
		device: Device | null;
		group: GroupData | null;
		room: RoomData | null;
	}

	interface GroupData {
		id: string;
		name: string;
		icon?: string | null;
		members: GroupMember[];
	}

	interface Props {
		group: GroupData;
		onedit: (group: GroupData) => void;
		ondelete: (group: GroupData) => void;
		onrename: (group: GroupData, newName: string) => void;
		oniconchange: (group: GroupData, icon: string | null) => void;
	}

	let { group, onedit, ondelete, onrename, oniconchange }: Props = $props();

	const deviceCount = $derived(group.members.filter((m) => m.memberType === "device").length);
	const groupCount = $derived(group.members.filter((m) => m.memberType === "group").length);
	const roomCount = $derived(group.members.filter((m) => m.memberType === "room").length);

	function memberBreakdown(dc: number, gc: number, rc: number): string {
		const parts: string[] = [];
		if (dc > 0) parts.push(`${dc} device${dc === 1 ? "" : "s"}`);
		if (gc > 0) parts.push(`${gc} group${gc === 1 ? "" : "s"}`);
		if (rc > 0) parts.push(`${rc} room${rc === 1 ? "" : "s"}`);
		return parts.join(", ");
	}
</script>

<div class="rounded-lg shadow-card bg-card p-4">
	<div class="flex items-center justify-between">
		<div class="flex flex-1 min-w-0 items-center gap-3">
			<IconPicker value={group.icon} onselect={(icon) => oniconchange(group, icon)}>
				<button type="button" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors">
					<AnimatedIcon icon={group.icon} class="size-5 text-muted-foreground">
						{#snippet fallback()}<Group class="size-5 text-muted-foreground" />{/snippet}
					</AnimatedIcon>
				</button>
			</IconPicker>
			<div class="min-w-0 flex-1">
				<InlineEditName name={group.name} onsave={(newName) => onrename(group, newName)} />
				<p class="text-xs text-muted-foreground">
					{group.members.length} member{group.members.length === 1 ? "" : "s"}
					{#if group.members.length > 0}
						&middot; {memberBreakdown(deviceCount, groupCount, roomCount)}
					{/if}
				</p>
			</div>
		</div>

		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button variant="ghost" size="icon-sm" aria-label="Group actions">
					<EllipsisVertical class="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onclick={() => onedit(group)}>
					<Pencil class="size-4" />
					Edit
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem variant="destructive" onclick={() => ondelete(group)}>
					<Trash2 class="size-4" />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	</div>
</div>
