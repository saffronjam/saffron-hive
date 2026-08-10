<script lang="ts" module>
	import { Columns2, DoorClosed, Grid2x2, MousePointer2 } from "@lucide/svelte";
	import type { OpeningKind } from "$lib/floorplan";

	/** What the opening tool can place, shared with the opening context menu. */
	export const openingKinds: { id: OpeningKind; icon: typeof MousePointer2; label: string }[] = [
		{ id: "door", icon: DoorClosed, label: "Door" },
		{ id: "window", icon: Grid2x2, label: "Window" },
		{ id: "opening", icon: Columns2, label: "Cased opening" },
	];
</script>

<script lang="ts">
	import {
		ClipboardPaste,
		Copy,
		DoorOpen,
		Magnet,
		Paintbrush,
		PenLine,
		Redo2,
		Square,
		SquareDashedMousePointer,
		SquareSplitHorizontal,
		Undo2,
	} from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import type { EditorTool } from "$lib/components/floorplan/floorplan-editor.svelte";
	import { dropPointerFocus } from "$lib/pointer-focus";

	interface Props {
		editMode: boolean;
		tool: EditorTool;
		ontool: (tool: EditorTool) => void;
		openingKind: OpeningKind;
		onopeningkind: (kind: OpeningKind) => void;
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
		brushOpen: boolean;
		/** Whether any device on the map can take what the brush paints. */
		canPaint: boolean;
		onbrushtoggle: () => void;
	}

	let {
		editMode,
		tool,
		ontool,
		openingKind,
		onopeningkind,
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
		brushOpen,
	canPaint,
		onbrushtoggle,
	}: Props = $props();

	const PILL =
		"absolute left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-lg bg-card/90 shadow-card px-2 py-1.5 backdrop-blur-sm transition-opacity duration-150";

	const tools: { id: EditorTool; icon: typeof MousePointer2; label: string }[] = [
		{ id: "select", icon: MousePointer2, label: "Select" },
		{ id: "wall", icon: PenLine, label: "Draw walls" },
		{ id: "rect", icon: Square, label: "Stamp a room" },
		{ id: "opening", icon: SquareSplitHorizontal, label: "Cut an opening" },
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

{#if canPaint}
	<div class="{PILL} top-3 {editMode ? 'pointer-events-none opacity-0' : 'opacity-100 delay-150'}">
		<Button
			variant={brushOpen ? "secondary" : "ghost"}
			size="icon-sm"
			disabled={editMode}
			onclick={press(onbrushtoggle)}
			aria-label="Paint brush"
		>
			<Paintbrush class="size-3.5" />
		</Button>
	</div>
{/if}
