<script lang="ts" module>
	import {
		Columns2,
		DoorClosed,
		Grid2x2,
		Frame,
		Lightbulb,
		MousePointer2,
		Move,
		Pin,
		RotateCw,
		Ruler,
		Scaling,
		Thermometer,
	} from "@lucide/svelte";
	import type { OpeningKind } from "$lib/floorplan";
	import type { MeasureKind } from "$lib/components/floorplan/floorplan-editor.svelte";
	import type { MapViewId } from "$lib/map-views";

	/** What the opening tool can place, shared with the opening context menu. */
	export const openingKinds: { id: OpeningKind; icon: typeof MousePointer2; label: string }[] = [
		{ id: "door", icon: DoorClosed, label: "Door" },
		{ id: "window", icon: Grid2x2, label: "Window" },
		{ id: "opening", icon: Columns2, label: "Cased opening" },
	];

	/** What the measure tool lays down, shared with its sub-pill. */
	export const measureKinds: { id: MeasureKind; icon: typeof MousePointer2; label: string }[] = [
		{ id: "line", icon: Ruler, label: "Length" },
		{ id: "rect", icon: Frame, label: "Area" },
	];

	/** How a selected furniture piece is being transformed. */
	export type FurnitureMode = "move" | "rotate" | "scale";

	/** The furniture transform tools, in toolbar order. */
	export const furnitureModes: { id: FurnitureMode; icon: typeof MousePointer2; label: string }[] = [
		{ id: "move", icon: Move, label: "Move" },
		{ id: "rotate", icon: RotateCw, label: "Rotate" },
		{ id: "scale", icon: Scaling, label: "Resize" },
	];

	/** The live map's views, in menu order. */
	export const mapViews: { id: MapViewId; icon: typeof MousePointer2; label: string }[] = [
		{ id: "light", icon: Lightbulb, label: "Light" },
		{ id: "temperature", icon: Thermometer, label: "Temperature" },
	];
</script>

<script lang="ts">
	import {
		ClipboardPaste,
		Copy,
		DoorOpen,
		Layers,
		Magnet,
		Sofa,
		Paintbrush,
		PenLine,
		Redo2,
		Square,
		SquareDashedMousePointer,
		SquareSplitHorizontal,
		Undo2,
	} from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import type { EditorTool } from "$lib/components/floorplan/floorplan-editor.svelte";
	import { dropPointerFocus } from "$lib/pointer-focus";

	interface Props {
		editMode: boolean;
		tool: EditorTool;
		ontool: (tool: EditorTool) => void;
		openingKind: OpeningKind;
		onopeningkind: (kind: OpeningKind) => void;
		measureKind: MeasureKind;
		onmeasurekind: (kind: MeasureKind) => void;
		/** Whether measurements stay on the plan after the pointer lifts. */
		keepMeasures: boolean;
		onkeepmeasures: () => void;
		canUndo: boolean;
		canRedo: boolean;
		onundo: () => void;
		onredo: () => void;
		/** Copy is only meaningful with walls selected; paste with a buffer filled. */
		selectedWallCount: number;
		hasCopyBuffer: boolean;
		oncopy: () => void;
		onpaste: () => void;
		/** Latched stand-ins for Alt and Shift, which a touch screen cannot hold. */
		snapOff: boolean;
		onsnaptoggle: () => void;
		additive: boolean;
		onadditivetoggle: () => void;
		onlinkroom: () => void;
		onfurniture: () => void;
		/** A piece is selected, so its transform tools have something to act on. */
		furnitureSelected: boolean;
		furnitureMode: FurnitureMode;
		onfurnituremode: (mode: FurnitureMode) => void;
		brushOpen: boolean;
		/** Whether any device on the map can take what the brush paints. */
		canPaint: boolean;
		onbrushtoggle: () => void;
		view: MapViewId;
		/** The views worth offering; the picker hides below two. */
		viewOptions: MapViewId[];
		onviewchange: (view: MapViewId) => void;
	}

	let {
		editMode,
		tool,
		ontool,
		openingKind,
		onopeningkind,
		measureKind,
		onmeasurekind,
		keepMeasures,
		onkeepmeasures,
		canUndo,
		canRedo,
		onundo,
		onredo,
		selectedWallCount,
		hasCopyBuffer,
		oncopy,
		onpaste,
		snapOff,
		onsnaptoggle,
		additive,
		onadditivetoggle,
		onlinkroom,
		onfurniture,
		furnitureSelected,
		furnitureMode,
		onfurnituremode,
		brushOpen,
		canPaint,
		onbrushtoggle,
		view,
		viewOptions,
		onviewchange,
	}: Props = $props();

	const showBrush = $derived(canPaint && view === "light");
	const showViews = $derived(viewOptions.length > 1);
	// Picking a view disables the item that was clicked, which cancels the
	// menu's own close-on-select — so the menu is closed here instead.
	let viewMenuOpen = $state(false);

	const PILL =
		"absolute left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-lg bg-card/90 shadow-card px-2 py-1.5 backdrop-blur-sm transition-opacity duration-150";

	const tools: { id: EditorTool; icon: typeof MousePointer2; label: string }[] = [
		{ id: "select", icon: MousePointer2, label: "Select" },
		{ id: "wall", icon: PenLine, label: "Draw walls" },
		{ id: "rect", icon: Square, label: "Stamp a room" },
		{ id: "opening", icon: SquareSplitHorizontal, label: "Cut an opening" },
		{ id: "measure", icon: Ruler, label: "Measure" },
	];

	function press(run: () => void) {
		return (e: MouseEvent) => {
			dropPointerFocus(e);
			run();
		};
	}
</script>

<!-- Two pills, each centering itself: the swap cannot jitter the width. -->
<div class="{PILL} top-3 {editMode ? 'opacity-100 delay-150' : 'pointer-events-none opacity-0'}">
	<Tooltip>
		<TooltipTrigger>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={press(onundo)}
				disabled={!editMode || !canUndo}
				aria-label="Undo"
			>
				<Undo2 class="size-3.5" />
			</Button>
		</TooltipTrigger>
		<TooltipContent>Undo</TooltipContent>
	</Tooltip>
	<Tooltip>
		<TooltipTrigger>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={press(onredo)}
				disabled={!editMode || !canRedo}
				aria-label="Redo"
			>
				<Redo2 class="size-3.5" />
			</Button>
		</TooltipTrigger>
		<TooltipContent>Redo</TooltipContent>
	</Tooltip>
	<Tooltip>
		<TooltipTrigger>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={press(oncopy)}
				disabled={!editMode || selectedWallCount === 0}
				aria-label="Copy selected walls"
			>
				<Copy class="size-3.5" />
			</Button>
		</TooltipTrigger>
		<TooltipContent>
			{selectedWallCount === 0 ? "Select walls to copy" : "Copy selected walls"}
		</TooltipContent>
	</Tooltip>
	<Tooltip>
		<TooltipTrigger>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={press(onpaste)}
				disabled={!editMode || !hasCopyBuffer}
				aria-label="Paste copied walls"
			>
				<ClipboardPaste class="size-3.5" />
			</Button>
		</TooltipTrigger>
		<TooltipContent>{hasCopyBuffer ? "Paste copied walls" : "Nothing copied yet"}</TooltipContent>
	</Tooltip>
	<div class="mx-1 h-4 w-px bg-border"></div>
	{#each tools as t (t.id)}
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant={editMode && tool === t.id ? "secondary" : "ghost"}
					size="icon-sm"
					onclick={press(() => ontool(t.id))}
					disabled={!editMode}
					aria-label={t.label}
				>
					<t.icon class="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{t.label}</TooltipContent>
		</Tooltip>
	{/each}
	<div class="mx-1 h-4 w-px bg-border"></div>
	<!-- Latches for Alt and Shift, which a touch screen cannot hold down. -->
	<Tooltip>
		<TooltipTrigger>
			<Button
				variant={editMode && !snapOff ? "secondary" : "ghost"}
				size="icon-sm"
				onclick={press(onsnaptoggle)}
				disabled={!editMode}
				aria-label="Snap to the grid and to walls"
			>
				<Magnet class="size-3.5" />
			</Button>
		</TooltipTrigger>
		<TooltipContent>{snapOff ? "Turn snapping on" : "Turn snapping off (or hold Alt)"}</TooltipContent>
	</Tooltip>
	<Tooltip>
		<TooltipTrigger>
			<Button
				variant={editMode && additive ? "secondary" : "ghost"}
				size="icon-sm"
				onclick={press(onadditivetoggle)}
				disabled={!editMode}
				aria-label="Add to the selection"
			>
				<SquareDashedMousePointer class="size-3.5" />
			</Button>
		</TooltipTrigger>
		<TooltipContent>
			{additive ? "Stop adding to the selection" : "Add to the selection (or hold Shift)"}
		</TooltipContent>
	</Tooltip>
	<div class="mx-1 h-4 w-px bg-border"></div>
	<Tooltip>
		<TooltipTrigger>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={press(onlinkroom)}
				disabled={!editMode}
				aria-label="Link a Hive room"
			>
				<DoorOpen class="size-3.5" />
			</Button>
		</TooltipTrigger>
		<TooltipContent>Link a Hive room</TooltipContent>
	</Tooltip>
	<Tooltip>
		<TooltipTrigger>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={press(onfurniture)}
				disabled={!editMode}
				aria-label="Furniture"
			>
				<Sofa class="size-3.5" />
			</Button>
		</TooltipTrigger>
		<TooltipContent>Furniture</TooltipContent>
	</Tooltip>
</div>

<div
	class="{PILL} top-14 {editMode && furnitureSelected && tool !== 'opening'
		? 'opacity-100'
		: 'pointer-events-none opacity-0'}"
>
	{#each furnitureModes as m (m.id)}
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant={furnitureMode === m.id ? "secondary" : "ghost"}
					size="icon-sm"
					onclick={press(() => onfurnituremode(m.id))}
					disabled={!editMode || !furnitureSelected}
					aria-label={m.label}
				>
					<m.icon class="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{m.label}</TooltipContent>
		</Tooltip>
	{/each}
</div>

<div
	class="{PILL} top-14 {editMode && tool === 'measure'
		? 'opacity-100'
		: 'pointer-events-none opacity-0'}"
>
	{#each measureKinds as k (k.id)}
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant={measureKind === k.id ? "secondary" : "ghost"}
					size="icon-sm"
					onclick={press(() => onmeasurekind(k.id))}
					disabled={!editMode}
					aria-label={k.label}
				>
					<k.icon class="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{k.label}</TooltipContent>
		</Tooltip>
	{/each}
	<div class="mx-1 h-4 w-px bg-border"></div>
	<Tooltip>
		<TooltipTrigger>
			<Button
				variant={keepMeasures ? "secondary" : "ghost"}
				size="icon-sm"
				onclick={press(onkeepmeasures)}
				disabled={!editMode}
				aria-label="Keep measurements on the plan"
			>
				<Pin class="size-3.5" />
			</Button>
		</TooltipTrigger>
		<TooltipContent>
			{keepMeasures ? "Clear them as you go" : "Keep measurements on the plan"}
		</TooltipContent>
	</Tooltip>
</div>

<div
	class="{PILL} top-14 {editMode && tool === 'opening'
		? 'opacity-100'
		: 'pointer-events-none opacity-0'}"
>
	{#each openingKinds as k (k.id)}
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant={openingKind === k.id ? "secondary" : "ghost"}
					size="icon-sm"
					onclick={press(() => onopeningkind(k.id))}
					aria-label={k.label}
				>
					<k.icon class="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{k.label}</TooltipContent>
		</Tooltip>
	{/each}
</div>

{#if showBrush || showViews}
	<div class="{PILL} top-3 {editMode ? 'pointer-events-none opacity-0' : 'opacity-100 delay-150'}">
		{#if showBrush}
			<Button
				variant={brushOpen ? "secondary" : "ghost"}
				size="icon-sm"
				disabled={editMode}
				onclick={press(onbrushtoggle)}
				aria-label="Paint brush"
			>
				<Paintbrush class="size-3.5" />
			</Button>
		{/if}
		{#if showBrush && showViews}
			<div class="mx-1 h-4 w-px bg-border"></div>
		{/if}
		{#if showViews}
			<DropdownMenu bind:open={viewMenuOpen}>
				<DropdownMenuTrigger>
					<Button variant="ghost" size="icon-sm" disabled={editMode} aria-label="Map view">
						<Layers class="size-3.5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="center" class="w-44">
					{#each mapViews.filter((v) => viewOptions.includes(v.id)) as v (v.id)}
						<DropdownMenuItem
							disabled={view === v.id}
							onclick={() => {
								viewMenuOpen = false;
								onviewchange(v.id);
							}}
						>
							<v.icon class="size-3.5" />
							{v.label}
						</DropdownMenuItem>
					{/each}
				</DropdownMenuContent>
			</DropdownMenu>
		{/if}
	</div>
{/if}
