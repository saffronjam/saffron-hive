<script lang="ts">
	import { DoorOpen, X } from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import { holdDrag } from "$lib/actions/hold-drag";
	import type { PlanRoomMeta } from "$lib/floorplan";
	import { m } from "$lib/i18n/messages";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";

	interface Props {
		rooms: PlanRoomMeta[];
		hiveRoomById: Map<string, { name: string; icon?: string | null }>;
		ondiscard: (roomMetaId: string) => void;
		ondragstart: (room: PlanRoomMeta, e: PointerEvent) => void;
		ondragmove: (e: PointerEvent) => void;
		ondragend: (e: PointerEvent) => void;
		ondragcancel: () => void;
	}

	let { rooms, hiveRoomById, ondiscard, ondragstart, ondragmove, ondragend, ondragcancel }: Props =
		$props();

	function displayName(room: PlanRoomMeta): string {
		if (room.roomId) return hiveRoomById.get(room.roomId)?.name ?? (room.name ?? m.map_room_fallback());
		return localizedNamesStore.display("floorplan_room", room.id, room.name, m.map_room_fallback());
	}

	function displayIcon(room: PlanRoomMeta): string | null {
		return room.roomId ? (hiveRoomById.get(room.roomId)?.icon ?? null) : null;
	}
</script>

<div
	class="absolute bottom-3 right-3 z-10 rounded-lg bg-card/90 shadow-card px-2 py-1.5 backdrop-blur-sm"
>
	<p class="px-1.5 py-1 text-xs font-medium text-muted-foreground">{m.map_detached_rooms()}</p>
	{#each rooms as room (room.id)}
		<div
			class="flex cursor-grab touch-pan-y items-center gap-2 rounded-md px-1.5 py-1 text-sm text-muted-foreground select-none hover:bg-accent/50"
			use:holdDrag={{
				mouseImmediate: true,
				onstart: (e) => ondragstart(room, e),
				onmove: ondragmove,
				onend: ondragend,
				oncancel: ondragcancel,
			}}
		>
			<AnimatedIcon icon={displayIcon(room)} class="size-4">
				{#snippet fallback()}<DoorOpen class="size-4" />{/snippet}
			</AnimatedIcon>
			<span class="min-w-0 flex-1 truncate">{displayName(room)}</span>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => ondiscard(room.id)}
				aria-label={m.map_discard_detached_room()}
			>
				<X class="size-3.5" />
			</Button>
		</div>
	{/each}
</div>
