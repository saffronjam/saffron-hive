<script lang="ts" module>
	import type { Device } from "$lib/gql/graphql";

	export interface DeviceRow {
		device: Device;
		placed: boolean;
	}

	/** The group half of a panel row: what it takes to render and drag one out. */
	export interface PanelGroup {
		id: string;
		name: string;
		icon?: string | null;
	}

	export interface GroupRow {
		group: PanelGroup;
		/** How many of the room's devices the group covers. */
		deviceCount: number;
		placed: boolean;
	}
</script>

<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import { DoorOpen, Group, X } from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import HiveIcon from "$lib/components/hive-icon.svelte";
	import { holdDrag } from "$lib/actions/hold-drag";
	import { placeBesideRect } from "$lib/panel-place";
	import type { PlacementRef } from "$lib/floorplan/placement-conflicts";
	import { deviceDisplayName } from "$lib/utils";

	interface Props {
		/**
		 * Docked, the panel sits across the bottom of the viewport instead of
		 * beside the room — a phone has no room to the side of anything.
		 */
		docked: boolean;
		/** Screen rect of the selected face, the panel anchors beside it. */
		anchor: { left: number; top: number; width: number; height: number } | null;
		linkedRoom: { id: string; name: string; icon?: string | null };
		deviceRows: DeviceRow[];
		/** Groups reaching into this room, so a whole group can be placed at once. */
		groupRows: GroupRow[];
		ondevicedragstart: (device: Device, e: PointerEvent) => void;
		ongroupdragstart: (group: PanelGroup, e: PointerEvent) => void;
		ondragmove: (e: PointerEvent) => void;
		ondragend: (e: PointerEvent) => void;
		ondragcancel: () => void;
		onremoveplacement: (ref: PlacementRef) => void;
		onclose: () => void;
	}

	let {
		docked,
		anchor,
		linkedRoom,
		deviceRows,
		groupRows,
		ondevicedragstart,
		ongroupdragstart,
		ondragmove,
		ondragend,
		ondragcancel,
		onremoveplacement,
		onclose,
	}: Props = $props();

	/** Distance the panel keeps from the room it belongs to, in pixels. */
	const PANEL_GAP = 20;

	let panelWidth = $state(288);
	let panelHeight = $state(120);

	const position = $derived(
		anchor
			? placeBesideRect(new DOMRect(anchor.left, anchor.top, anchor.width, anchor.height), {
					panelWidth,
					panelHeight,
					gap: PANEL_GAP,
				})
			: null,
	);
</script>

{#snippet body()}
	<div class="flex items-center gap-2">
		<AnimatedIcon icon={linkedRoom.icon} class="size-4 text-muted-foreground">
			{#snippet fallback()}<DoorOpen class="size-4 text-muted-foreground" />{/snippet}
		</AnimatedIcon>
		<span class="min-w-0 flex-1 truncate text-sm font-medium">{linkedRoom.name}</span>
		{#if docked}
			<Button variant="ghost" size="icon-xs" onclick={onclose} aria-label="Dismiss">
				<X class="size-3.5" />
			</Button>
		{/if}
	</div>

	{#if deviceRows.some((r) => !r.placed) || groupRows.some((r) => !r.placed)}
		<p class="mt-1 text-xs text-muted-foreground">Drag a device or group onto the plan.</p>
	{/if}

	<div class="mt-3 space-y-0.5 {docked ? 'max-h-[45vh] overflow-y-auto' : ''}">
		{#if deviceRows.length === 0 && groupRows.length === 0}
			<p class="py-1 text-xs text-muted-foreground">No devices in this room.</p>
		{/if}
		{#each groupRows as row (row.group.id)}
			<div
				class="flex h-7 touch-pan-y items-center gap-2 rounded-md px-1.5 text-sm select-none {row.placed
					? 'text-muted-foreground'
					: 'cursor-grab hover:bg-accent/50'}"
				use:holdDrag={{
					disabled: row.placed,
					mouseImmediate: true,
					onstart: (e) => ongroupdragstart(row.group, e),
					onmove: ondragmove,
					onend: ondragend,
					oncancel: ondragcancel,
				}}
			>
				<AnimatedIcon icon={row.group.icon} class="size-4 shrink-0">
					{#snippet fallback()}<Group class="size-4 shrink-0" />{/snippet}
				</AnimatedIcon>
				<span class="min-w-0 flex-1 truncate">{row.group.name}</span>
				{#if row.placed}
					<span class="text-xs">Placed</span>
					<Button
						variant="ghost"
						size="icon-xs"
						onclick={() => onremoveplacement({ memberType: "group", memberId: row.group.id })}
						aria-label="Remove from map"
					>
						<X class="size-3.5" />
					</Button>
				{:else}
					<span class="text-xs text-muted-foreground">{row.deviceCount}</span>
				{/if}
			</div>
		{/each}
		{#each deviceRows as row (row.device.id)}
			<div
				class="flex touch-pan-y items-center gap-2 rounded-md px-1.5 py-1 text-sm select-none {row
					.device.disabled
					? 'opacity-60'
					: ''} {row.placed ? 'text-muted-foreground' : 'cursor-grab hover:bg-accent/50'}"
				use:holdDrag={{
					disabled: row.placed,
					mouseImmediate: true,
					onstart: (e) => ondevicedragstart(row.device, e),
					onmove: ondragmove,
					onend: ondragend,
					oncancel: ondragcancel,
				}}
			>
				<HiveIcon type={row.device.type} iconOverride={row.device.icon} class="size-4 shrink-0" />
				<span class="min-w-0 flex-1 truncate">{deviceDisplayName(row.device)}</span>
				{#if row.placed}
					<span class="text-xs">Placed</span>
					<Button
						variant="ghost"
						size="icon-xs"
						onclick={() => onremoveplacement({ memberType: "device", memberId: row.device.id })}
						aria-label="Remove from map"
					>
						<X class="size-3.5" />
					</Button>
				{/if}
			</div>
		{/each}
	</div>
{/snippet}

{#if docked}
	<div
		class="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-popover/95 px-4 pt-3 pb-24 text-popover-foreground shadow-lg backdrop-blur-sm"
		transition:fly={{ y: 24, duration: 200 }}
	>
		{@render body()}
	</div>
{:else if position}
	<div
		bind:clientWidth={panelWidth}
		bind:clientHeight={panelHeight}
		class="fixed z-50 w-72 rounded-md bg-popover p-3 shadow-md ring-1 ring-foreground/10"
		transition:fade={{ duration: 120 }}
		style="left: {position.x}px; top: {position.y}px;"
	>
		{@render body()}
	</div>
{/if}
