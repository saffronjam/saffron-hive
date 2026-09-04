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
		Waypoints,
	} from "@lucide/svelte";
	import type { OpeningKind } from "$lib/floorplan";
	import type { MeasureKind } from "$lib/components/floorplan/floorplan-editor.svelte";
	import type { MapViewId } from "$lib/map-views";
	import { m } from "$lib/i18n/messages";

	/** What the opening tool can place, shared with the opening context menu. */
	export function openingKinds(): { id: OpeningKind; icon: typeof MousePointer2; label: string }[] {
		return [
			{ id: "door", icon: DoorClosed, label: m.map_tool_door() },
			{ id: "window", icon: Grid2x2, label: m.map_tool_window() },
			{ id: "opening", icon: Columns2, label: m.map_tool_cased_opening() },
		];
	}

	/** What the measure tool lays down, shared with its sub-pill. */
	export function measureKinds(): { id: MeasureKind; icon: typeof MousePointer2; label: string }[] {
		return [
			{ id: "line", icon: Ruler, label: m.map_tool_length() },
			{ id: "rect", icon: Frame, label: m.map_tool_area() },
		];
	}

	/** How a selected furniture piece is being transformed. */
	export type FurnitureMode = "move" | "rotate" | "scale";

	/** The furniture transform tools, in toolbar order. */
	export function furnitureModes(): { id: FurnitureMode; icon: typeof MousePointer2; label: string }[] {
		return [
			{ id: "move", icon: Move, label: m.map_tool_move() },
			{ id: "rotate", icon: RotateCw, label: m.map_tool_rotate() },
			{ id: "scale", icon: Scaling, label: m.map_tool_resize() },
		];
	}

	/** The live map's views, in menu order. */
	export function mapViews(): { id: MapViewId; icon: typeof MousePointer2; label: string }[] {
		return [
			{ id: "light", icon: Lightbulb, label: m.map_view_light() },
			{ id: "temperature", icon: Thermometer, label: m.map_view_temperature() },
			{ id: "connectivity", icon: Waypoints, label: m.map_view_connectivity() },
		];
	}
</script>

<script lang="ts">
	import {
		ClipboardPaste,
		Copy,
		Crosshair,
		DoorOpen,
		Layers,
		Magnet,
		Sofa,
		Paintbrush,
		PenLine,
		Radio,
		Redo2,
		Square,
		SquareDashedMousePointer,
		SquareSplitHorizontal,
		Undo2,
	} from "@lucide/svelte";
	import type { Component } from "svelte";
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
	import { locale } from "$lib/i18n/locale.svelte";

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
		/** Frame the whole plan in the viewport. */
		onfit: () => void;
		/** Whether the connectivity view also draws heard-neighbour links. */
		showNeighbours: boolean;
		onneighbourstoggle: () => void;
		/** One entry per mesh provider with a stored topology. */
		meshSources: {
			provider: string;
			label: string;
			icon: Component<{ class?: string }>;
			shown: boolean;
		}[];
		onsourcetoggle: (provider: string) => void;
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
		onfit,
		showNeighbours,
		onneighbourstoggle,
		meshSources,
		onsourcetoggle,
	}: Props = $props();

	const showBrush = $derived(canPaint && view === "light");
	const showViews = $derived(viewOptions.length > 1);
	// The connectivity view's own tools sit where the brush button sits: in
	// this pill, left of the divider. One mesh needs no source picker.
	const showMeshTools = $derived(view === "connectivity");
	const showMeshSources = $derived(showMeshTools && meshSources.length > 1);
	const showTools = $derived(showBrush || showMeshTools);
	// Picking a view disables the item that was clicked, which cancels the
	// menu's own close-on-select — so the menu is closed here instead.
	let viewMenuOpen = $state(false);

	// The box is width-bounded and stays put; the row inside it scrolls, so a
	// toolbar too wide for a phone stays reachable without resizing itself.
	const PILL =
		"absolute left-1/2 -translate-x-1/2 z-10 max-w-[calc(100%-1.5rem)] rounded-lg bg-card/90 shadow-card px-2 py-1.5 backdrop-blur-sm transition-opacity duration-150";
	const ROW = "no-scrollbar flex items-center gap-1 overflow-x-auto";
	const DIVIDER = "mx-1 h-4 w-px shrink-0 bg-border";

	const tools = $derived.by(() => {
		void locale.currentLanguage;
		return [
			{ id: "select", icon: MousePointer2, label: m.map_tool_select() },
			{ id: "wall", icon: PenLine, label: m.map_tool_draw_walls() },
			{ id: "rect", icon: Square, label: m.map_tool_stamp_room() },
			{ id: "opening", icon: SquareSplitHorizontal, label: m.map_tool_cut_opening() },
			{ id: "measure", icon: Ruler, label: m.map_tool_measure() },
		] satisfies { id: EditorTool; icon: typeof MousePointer2; label: string }[];
	});
	const localizedOpeningKinds = $derived.by(() => (locale.currentLanguage, openingKinds()));
	const localizedMeasureKinds = $derived.by(() => (locale.currentLanguage, measureKinds()));
	const localizedFurnitureModes = $derived.by(() => (locale.currentLanguage, furnitureModes()));
	const localizedMapViews = $derived.by(() => (locale.currentLanguage, mapViews()));

	function press(run: () => void) {
		return (e: MouseEvent) => {
			dropPointerFocus(e);
			run();
		};
	}
</script>

<!-- Two pills, each centering itself: the swap cannot jitter the width. -->
<div class="{PILL} top-3 {editMode ? 'opacity-100 delay-150' : 'pointer-events-none opacity-0'}">
	<div class={ROW}>
		<Tooltip>
			<TooltipTrigger class="shrink-0">
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={press(onundo)}
					disabled={!editMode || !canUndo}
					aria-label={m.map_undo()}
				>
					<Undo2 class="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{m.map_undo()}</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger class="shrink-0">
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={press(onredo)}
					disabled={!editMode || !canRedo}
					aria-label={m.map_redo()}
				>
					<Redo2 class="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{m.map_redo()}</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger class="shrink-0">
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={press(oncopy)}
					disabled={!editMode || selectedWallCount === 0}
					aria-label={m.map_copy_selected_walls()}
				>
					<Copy class="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{selectedWallCount === 0 ? m.map_select_walls_to_copy() : m.map_copy_selected_walls()}
			</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger class="shrink-0">
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={press(onpaste)}
					disabled={!editMode || !hasCopyBuffer}
					aria-label={m.map_paste_copied_walls()}
				>
					<ClipboardPaste class="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{hasCopyBuffer ? m.map_paste_copied_walls() : m.map_nothing_copied()}</TooltipContent>
		</Tooltip>
		<div class={DIVIDER}></div>
		{#each tools as t (t.id)}
			<Tooltip>
				<TooltipTrigger class="shrink-0">
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
		<div class={DIVIDER}></div>
		<!-- Latches for Alt and Shift, which a touch screen cannot hold down. -->
		<Tooltip>
			<TooltipTrigger class="shrink-0">
				<Button
					variant={editMode && !snapOff ? "secondary" : "ghost"}
					size="icon-sm"
					onclick={press(onsnaptoggle)}
					disabled={!editMode}
					aria-label={m.map_snap_label()}
				>
					<Magnet class="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{snapOff ? m.map_snap_on() : m.map_snap_off()}
			</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger class="shrink-0">
				<Button
					variant={editMode && additive ? "secondary" : "ghost"}
					size="icon-sm"
					onclick={press(onadditivetoggle)}
					disabled={!editMode}
					aria-label={m.map_add_selection()}
				>
					<SquareDashedMousePointer class="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{additive ? m.map_add_selection_stop() : m.map_add_selection_hint()}
			</TooltipContent>
		</Tooltip>
		<div class={DIVIDER}></div>
		<Tooltip>
			<TooltipTrigger class="shrink-0">
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={press(onlinkroom)}
					disabled={!editMode}
					aria-label={m.map_link_room()}
				>
					<DoorOpen class="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{m.map_link_room()}</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger class="shrink-0">
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={press(onfurniture)}
					disabled={!editMode}
					aria-label={m.map_furniture()}
				>
					<Sofa class="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{m.map_furniture()}</TooltipContent>
		</Tooltip>
	</div>
</div>

<div
	class="{PILL} top-14 {editMode && furnitureSelected && tool !== 'opening'
		? 'opacity-100'
		: 'pointer-events-none opacity-0'}"
>
	<div class={ROW}>
		{#each localizedFurnitureModes as mode (mode.id)}
			<Tooltip>
				<TooltipTrigger class="shrink-0">
					<Button
						variant={furnitureMode === mode.id ? "secondary" : "ghost"}
						size="icon-sm"
						onclick={press(() => onfurnituremode(mode.id))}
						disabled={!editMode || !furnitureSelected}
						aria-label={mode.label}
					>
						<mode.icon class="size-3.5" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>{mode.label}</TooltipContent>
			</Tooltip>
		{/each}
	</div>
</div>

<div
	class="{PILL} top-14 {editMode && tool === 'measure'
		? 'opacity-100'
		: 'pointer-events-none opacity-0'}"
>
	<div class={ROW}>
		{#each localizedMeasureKinds as k (k.id)}
			<Tooltip>
				<TooltipTrigger class="shrink-0">
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
		<div class={DIVIDER}></div>
		<Tooltip>
			<TooltipTrigger class="shrink-0">
				<Button
					variant={keepMeasures ? "secondary" : "ghost"}
					size="icon-sm"
					onclick={press(onkeepmeasures)}
					disabled={!editMode}
					aria-label={m.map_keep_measurements()}
				>
					<Pin class="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{keepMeasures ? m.map_clear_measurements_as_you_go() : m.map_keep_measurements()}
			</TooltipContent>
		</Tooltip>
	</div>
</div>

<div
	class="{PILL} top-14 {editMode && tool === 'opening'
		? 'opacity-100'
		: 'pointer-events-none opacity-0'}"
>
	<div class={ROW}>
		{#each localizedOpeningKinds as k (k.id)}
			<Tooltip>
				<TooltipTrigger class="shrink-0">
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
</div>

<div class="{PILL} top-3 {editMode ? 'pointer-events-none opacity-0' : 'opacity-100 delay-150'}">
	<div class={ROW}>
		{#if showBrush}
			<Button
				variant={brushOpen ? "secondary" : "ghost"}
				size="icon-sm"
				class="shrink-0"
				disabled={editMode}
				onclick={press(onbrushtoggle)}
				aria-label={m.map_paint_brush()}
			>
				<Paintbrush class="size-3.5" />
			</Button>
		{/if}
		{#if showMeshTools}
			<Button
				variant={showNeighbours ? "secondary" : "ghost"}
				size="icon-sm"
				class="shrink-0"
				disabled={editMode}
				onclick={press(onneighbourstoggle)}
				aria-label={showNeighbours ? m.map_hide_neighbour_links() : m.map_show_neighbour_links()}
			>
				<Radio class="size-3.5" />
			</Button>
		{/if}
		{#if showMeshSources}
			{#each meshSources as source (source.provider)}
				<Button
					variant={source.shown ? "secondary" : "ghost"}
					size="icon-sm"
					class="shrink-0"
					disabled={editMode}
					onclick={press(() => onsourcetoggle(source.provider))}
					aria-label={source.shown ? m.map_hide_provider_mesh({ provider: source.label }) : m.map_show_provider_mesh({ provider: source.label })}
				>
					<source.icon class="size-3.5" />
				</Button>
			{/each}
		{/if}
		{#if showTools}
			<div class={DIVIDER}></div>
		{/if}
		{#if showViews}
			<DropdownMenu bind:open={viewMenuOpen}>
				<DropdownMenuTrigger class="shrink-0">
					<Button variant="ghost" size="icon-sm" disabled={editMode} aria-label={m.map_view_picker()}>
						<Layers class="size-3.5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="center" class="w-44">
					{#each localizedMapViews.filter((v) => viewOptions.includes(v.id)) as v (v.id)}
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
		<Button
			variant="ghost"
			size="icon-sm"
			class="shrink-0"
			disabled={editMode}
			onclick={press(onfit)}
			aria-label={m.map_frame_plan()}
		>
			<Crosshair class="size-3.5" />
		</Button>
	</div>
</div>
