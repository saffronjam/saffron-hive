<script lang="ts" module>
	import { placementKey } from "$lib/floorplan/placement-conflicts";
	import type { PlacementRef } from "$lib/floorplan/placement-conflicts";
	import type { Face as PlanFace, Point as PlanPoint } from "$lib/floorplan";
	import type { Device as PlanDevice } from "$lib/gql/graphql";

	export type EditorTool = "select" | "wall" | "rect" | "opening" | "measure";

	/** What the measure tool lays down: a length, or a boxed area. */
	export type MeasureKind = "line" | "rect";

	/** A measurement drawn on the plan. Scratch work: never part of the plan. */
	export interface PlanMeasure {
		id: string;
		kind: MeasureKind;
		a: Point;
		b: Point;
	}

	export interface EditorSelection {
		vertexIds: string[];
		wallIds: string[];
		faceIndex: number | null;
		/** `placementKey`s of the selected markers — devices and groups alike. */
		placementKeys: string[];
		/** Ids of the selected wall openings. */
		openingIds: string[];
		/** The selected furniture piece; one at a time. */
		furnitureId: string | null;
	}

	/** An empty selection — spread it to build a "select only this" update. */
	export const emptySelection: EditorSelection = {
		vertexIds: [],
		wallIds: [],
		faceIndex: null,
		placementKeys: [],
		openingIds: [],
		furnitureId: null,
	};

	/** The group half of a placement: what its marker needs in order to render. */
	export interface PlacementGroup {
		id: string;
		name: string;
		icon?: string | null;
	}

	/** A marker on the plan, resolved against live data. */
	export type PlacementView =
		| { kind: "device"; device: PlanDevice; x: number; y: number }
		| {
				kind: "group";
				group: PlacementGroup;
				/** The group's resolved devices, for tint and commands. */
				devices: PlanDevice[];
				x: number;
				y: number;
		  };

	/** The target a marker stands for. */
	export function placementViewRef(pl: PlacementView): PlacementRef {
		return pl.kind === "device"
			? { memberType: "device", memberId: pl.device.id }
			: { memberType: "group", memberId: pl.group.id };
	}

	/** The `placementKey` identifying a marker. */
	export function placementViewKey(pl: PlacementView): string {
		return placementKey(placementViewRef(pl));
	}

	export interface FloorplanEditorApi {
		/** Cancel an in-progress polyline. Returns true when there was one to cancel. */
		cancelDraw: () => boolean;
		/** Open the plan's own menu for a screen point. */
		openMenuAt: (clientX: number, clientY: number) => void;
		/** Current screen pixels per world meter, for zoom-relative offsets. */
		getZoom: () => number;
		/** Convert client (screen) coordinates to world meters. */
		clientToWorld: (clientX: number, clientY: number) => PlanPoint;
		/** Screen rect of a face's bounding box, for anchoring chrome beside it. */
		faceClientRect: (
			face: PlanFace,
		) => { left: number; top: number; width: number; height: number } | null;
		/** World point at the center of the visible viewport. */
		getViewportCenterWorld: () => PlanPoint;
		/** Screen point of a world point, for anchoring chrome to a piece. */
		worldToClient: (p: PlanPoint) => { left: number; top: number } | null;
	}
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { select } from "d3-selection";
	import { zoom as d3zoom, zoomIdentity, type D3ZoomEvent } from "d3-zoom";
	import {
		DEFAULT_GRID_SIZE,
		DEFAULT_WALL_THICKNESS,
		DEFAULT_OPENING_WIDTH_M,
		MIN_OPENING_WIDTH_M,
		arcLengthAtT,
		bendWall,
		addOpening,
		addRoomClipped,
		carryWallCurves,
		clampWallDrag,
		cloneGraph,
		connectPoints,
		detachFace,
		detachWallEnds,
		faceKey,
		flattenWall,
		grabTarget,
		gridSlide,
		hitFace,
		hitVertex,
		hitWall,
		openingViews as buildOpeningViews,
		planLabels as buildPlanLabels,
		polygonBounds,
		sweptSelection,
		trimWallsInsideFaces,
		wallApex,
		withOpening,
		projectOntoWall,
		resizeAtCorner,
		resolveSnap,
		snapGuides,
		tAtArcLength,
		wallLength,
		wallMetrics,
		wallOutline,
		formatMeters,
		formatArea,
		type Face,
		type OpeningKind,
		type PlanGraph,
		type PlanOpening,
		type PlanVertex,
		type PlanWall,
		type Point,
		type SnapResult,
	} from "$lib/floorplan";
	import {
		BRUSH_RADIUS_PX,
		brushHits,
		screenRadiusToWorld,
		stepBrushRadius,
	} from "$lib/floorplan/brush";
	import { newOpeningId, newVertexId, newWallId } from "$lib/floorplan-editable";
	import { deviceHasCapability } from "$lib/stores/devices";
	import DeviceMarker from "$lib/components/floorplan/device-marker.svelte";
	import GroupMarker from "$lib/components/floorplan/group-marker.svelte";
	import PlanLabels from "$lib/components/floorplan/plan-labels.svelte";
	import PlanSnapGuides from "$lib/components/floorplan/plan-snap-guides.svelte";
	import GlowLayer, {
		type GlowGroup,
		type GlowView,
		type LightmapFrame,
	} from "$lib/components/floorplan/glow-layer.svelte";
	import type { DeviceState } from "$lib/gql/graphql";
	import { fade } from "svelte/transition";
	import FurniturePiece from "$lib/components/floorplan/furniture-piece.svelte";
	import type { FloorplanFurnitureData } from "$lib/floorplan-editable";
	import {
		furnitureContainsPoint,
		furnitureCorners,
		furnitureKind,
		moveFurniture,
		resizeFromHandle,
		rotateFurnitureTo,
		scaleHandlePoint,
		scaleHandles,
		snapFurnitureToWalls,
		type ScaleHandle,
	} from "$lib/floorplan/furniture";
	import { profile } from "$lib/stores/profile.svelte";
	import { throttle, type Throttle } from "$lib/throttle";

	interface Props {
		graph: PlanGraph;
		faces: Face[];
		tool: EditorTool;
		selection: EditorSelection;
		/** Live map mode: glow + taps instead of editing; grid and handles hide. */
		live?: boolean;
		/** Face keys of rooms unlocked for whole-room dragging; others pan. */
		unlockedKeys?: Set<string>;
		/**
		 * Face keys of rooms whose corners move on their own. Everywhere else a
		 * corner drag takes its walls along, so the room resizes rather than skews.
		 */
		freeCornerKeys?: Set<string>;
		/** Armed paint brush: single-pointer drag paints instead of panning. */
		brush?: { kind: "color" | "temp" | "power"; css: string } | null;
		/** Placement keys the armed brush cannot paint; rendered muted. */
		inertKeys?: Set<string>;
		/** Placement keys the brush circle currently covers (page dedupes). */
		onbrushstroke?: (placementKeys: string[]) => void;
		onbrushend?: () => void;
		/** Brush cursor radius in screen pixels; the page persists it. */
		brushRadiusPx?: number;
		onbrushresize?: (px: number) => void;
		/** Latched Alt: snapping stays suppressed without a key held down. */
		snapOff?: boolean;
		/** Latched Shift: clicks and drags add to the selection instead of replacing it. */
		additive?: boolean;
		glowGroups?: GlowGroup[];
		outsideGlows?: GlowView[];
		lightmap?: LightmapFrame | null;
		onmarkertap?: (placement: PlacementView, e: PointerEvent) => void;
		onfacetap?: (faceIndex: number) => void;
		/** Right-click / touch-hold on a room face (edit mode). */
		onfacemenu?: (faceIndex: number, clientX: number, clientY: number) => void;
		/** Right-click / touch-hold on a placed marker, in either mode. */
		onmarkermenu?: (placement: PlacementView, clientX: number, clientY: number) => void;
		/** What the opening tool places. */
		openingKind?: OpeningKind;
		/** What the measure tool lays down. */
		measureKind?: MeasureKind;
		/** Whether a finished measurement stays on the plan. */
		keepMeasures?: boolean;
		/** Right-click / touch-hold on an opening (edit mode). */
		onopeningmenu?: (openingId: string, clientX: number, clientY: number) => void;
		onmarkerpreview?: (deviceIds: string[], partial: Partial<DeviceState>) => void;
		placements?: PlacementView[];
		/** Furniture standing on the plan. */
		furniture?: FloorplanFurnitureData[];
		/** In-flight furniture following the pointer during a drag-in. */
		draftFurniture?: FloorplanFurnitureData | null;
		/** The selected piece, which draws its handles. */
		selectedFurnitureId?: string | null;
		/** Which gizmo the selected piece is showing. */
		furnitureMode?: "move" | "rotate" | "scale";
		/** Right-click / touch-hold on a piece (edit mode). */
		onfurnituremenu?: (piece: FloorplanFurnitureData, clientX: number, clientY: number) => void;
		/** Frame-by-frame during a transform; the page holds the draft. */
		onfurniturepreview?: (piece: FloorplanFurnitureData) => void;
		/** End of a transform gesture: one undo step. */
		onfurniturecommit?: (piece: FloorplanFurnitureData) => void;
		/** In-flight placement following the pointer during a drag-in. */
		draftPlacement?: PlacementView | null;
		/** In-flight room label following the pointer during a link drag. */
		draftLabel?: { point: Point; text: string } | null;
		/** A room being dragged in from outside, previewed as the stamp tool's rectangle. */
		draftRoom?: { a: Point; b: Point } | null;
		/** Face key → display label (linked Hive room name or loose label). */
		faceLabels?: Map<string, string>;
		/** Face key highlighted as the active snap-in target of a drag. */
		highlightFaceKey?: string | null;
		onselectionchange: (sel: EditorSelection) => void;
		/** Mid-gesture graph update: no normalize, no face recompute, no snapshot. */
		onpreview: (graph: PlanGraph) => void;
		/** Gesture finished: normalize + recompute faces (+ snapshot when asked). */
		oncommit: (graph: PlanGraph, opts: { snapshot: boolean }) => void;
		/**
		 * A room was split free of its neighbours at the start of a drag. Apply
		 * as-is: normalizing here would merge the split back together.
		 */
		ondetach?: (graph: PlanGraph, prevFaceKey: string, idMap: Map<string, string>) => void;
		/** A multi-commit gesture (wall polyline) ended; take one snapshot. */
		onsnapshot: () => void;
		onplacementpreview?: (ref: PlacementRef, p: Point) => void;
		onplacementdrop?: (ref: PlacementRef, p: Point, alt: boolean) => void;
		/** Fires on every pan/zoom step so screen-anchored chrome can follow. */
		onviewportchange?: () => void;
		onready?: (api: FloorplanEditorApi) => void;
	}

	let {
		graph,
		faces,
		tool,
		selection,
		live = false,
		unlockedKeys = new Set(),
		freeCornerKeys = new Set(),
		brush = null,
		inertKeys = new Set(),
		onbrushstroke,
		onbrushend,
		brushRadiusPx = BRUSH_RADIUS_PX,
		onbrushresize,
		snapOff = false,
		additive = false,
		glowGroups = [],
		outsideGlows = [],
		lightmap = null,
		onmarkertap,
		onfacetap,
		onfacemenu,
		onmarkermenu,
		openingKind = "door",
		measureKind = "line",
		keepMeasures = false,
		onopeningmenu,
		onmarkerpreview,
		placements = [],
		furniture = [],
		draftFurniture = null,
		selectedFurnitureId = null,
		furnitureMode = "move",
		onfurnituremenu,
		onfurniturepreview,
		onfurniturecommit,
		draftPlacement = null,
		draftLabel = null,
		draftRoom = null,
		faceLabels = new Map(),
		highlightFaceKey = null,
		onselectionchange,
		onpreview,
		oncommit,
		ondetach,
		onsnapshot,
		onplacementpreview,
		onplacementdrop,
		onviewportchange,
		onready,
	}: Props = $props();

	/** Screen pixels per meter at zoom k = 1. */
	const PX_PER_M = 50;
	/** Id factories the graph edits mint through, so the module stays dependency-free. */
	const idMint = { vertexId: newVertexId, wallId: newWallId };
	/** Minimum rectangle-stamp side, in meters, below which the stamp is discarded. */
	const MIN_STAMP_SIDE = 0.05;

	/** Shorter than this and a measurement has nothing to say. */
	const MIN_MEASURE_SPAN_M = 0.05;

	/** How close a piece's edge must come to a wall face to sit flush against it. */
	const WALL_SNAP_REACH_PX = 14;

	let svgEl: SVGSVGElement | null = $state(null);
	let width = $state(0);
	let height = $state(0);
	let transform = $state(profile.get("map.viewport", undefined) ?? { x: 80, y: 80, k: 1 });

	const pxPerM = $derived(transform.k * PX_PER_M);
	/** Hit/snap radius in world meters — 8 screen px at the current zoom. */
	const hitRadius = $derived(8 / pxPerM);

	const vpThrottle: Throttle = { lastSent: 0, trailing: null };
	$effect(() => {
		const t = { x: transform.x, y: transform.y, k: transform.k };
		throttle(vpThrottle, () => profile.set("map.viewport", t), 300);
	});

	const vertexById = $derived(new Map(graph.vertices.map((v) => [v.id, v])));

	const selectedVertexSet = $derived(new Set(selection.vertexIds));
	const selectedWallSet = $derived(new Set(selection.wallIds));
	const selectedKeySet = $derived(new Set(selection.placementKeys));
	const selectedOpeningSet = $derived(new Set(selection.openingIds));

	/**
	 * Alt suppresses snapping and Shift adds to the selection. Touch has neither,
	 * so the toolbar carries a latch for each and both routes meet here.
	 */
	function noSnap(e: { altKey: boolean }): boolean {
		return e.altKey || snapOff;
	}

	function adding(e: { shiftKey: boolean }): boolean {
		return e.shiftKey || additive;
	}

	function toWorld(e: PointerEvent | MouseEvent): Point {
		const rect = svgEl!.getBoundingClientRect();
		return {
			x: (e.clientX - rect.left - transform.x) / transform.k / PX_PER_M,
			y: (e.clientY - rect.top - transform.y) / transform.k / PX_PER_M,
		};
	}

	// The zoom wiring must depend on the element alone: the initial
	// zoom.transform dispatch runs the zoom handler synchronously, and any
	// state read inside this effect (transform, props touched by the handler)
	// would become a dependency the handler's own write then invalidates —
	// an infinite effect loop. Hence the whole body runs untracked.
	$effect(() => {
		if (!svgEl) return;
		const el = svgEl;
		return untrack(() => {
			const sel = select(el);
			const zoom = d3zoom<SVGSVGElement, unknown>()
				.scaleExtent([0.2, 8])
				.clickDistance(4)
				.filter((event: Event & { button?: number; touches?: TouchList }) => {
					if (event.type === "dblclick") return false;
					// A wheel resizes an armed brush unless it is a zoom gesture.
					if (event.type === "wheel") {
						const e = event as WheelEvent;
						return !(live && brush) || e.ctrlKey || e.metaKey;
					}
					// Two fingers always pan and pinch, whatever tool is active — one
					// finger is what draws and paints, so it is the only thing a tool
					// may take away.
					if ((event.touches?.length ?? 0) >= 2) return true;
					if (event.button === 1) return true;
					// An armed brush takes the left button, so the right one pans —
					// painting several rooms otherwise means disarming to move.
					if (event.button === 2) return live && !!brush;
					if (event.button !== 0 && event.button !== undefined) return false;
					if (live) {
						if (brush) return false;
						return !(event.target as Element).closest('[data-plan-hit="marker"]');
					}
					if (tool !== "select") return false;
					// Shift-drag is the marquee, so d3 must not treat it as a pan.
					if (((event as MouseEvent).shiftKey || additive)) return false;
					return !(event.target as Element).closest("[data-plan-hit]");
				})
				.on("zoom", (e: D3ZoomEvent<SVGSVGElement, unknown>) => {
					transform = { x: e.transform.x, y: e.transform.y, k: e.transform.k };
					onviewportchange?.();
				});
			sel.call(zoom);
			sel.call(zoom.transform, zoomIdentity.translate(transform.x, transform.y).scale(transform.k));
			return () => {
				sel.on(".zoom", null);
			};
		});
	});

	interface DragState {
		kind: "vertex" | "wall" | "face" | "marker" | "opening" | "openingEdge" | "bend" | "furniture";
		pointerId: number;
		start: Point;
		moved: boolean;
		vertexId?: string;
		wallId?: string;
		wallNormal?: Point;
		origin?: Map<string, Point>;
		faceIndex?: number;
		placementRef?: PlacementRef;
		openingId?: string;
		/** Arc length of the end a width drag pivots around, in meters. */
		openingAnchorS?: number;
		/** Selected markers and where they stood when the gesture began. */
		markerOrigin?: Map<string, Point>;
		/** The piece a furniture gesture started from, to transform against. */
		furnitureFrom?: FloorplanFurnitureData;
		/** Which scale handle is held, or the angle a rotation started at. */
		furnitureHandle?: ScaleHandle;
		furnitureStartAngle?: number;
		snap?: SnapResult | null;
	}
	let drag = $state<DragState | null>(null);

	function markerSnap(p: Point, alt: boolean): Point {
		if (alt) return p;
		return {
			x: Math.round(p.x / DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE,
			y: Math.round(p.y / DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE,
		};
	}

	function hitMarker(p: Point): PlacementView | null {
		const grab = grabAt(p);
		return grab?.kind === "marker" ? placements[grab.index] : null;
	}

	interface DrawState {
		start: Point;
		startVertexId: string | null;
		anchor: Point;
		wallCount: number;
	}
	let draw = $state<DrawState | null>(null);
	let rubber = $state<{ end: Point; snap: SnapResult } | null>(null);

	let stamp = $state<{ a: Point; b: Point } | null>(null);
	/**
	 * Measurements taken with the measure tool. They are scratch work — never
	 * saved, never in the undo stack — so they live here and go when the tool
	 * does.
	 */
	let measures = $state<PlanMeasure[]>([]);
	let measureSeq = 0;
	let measuring = $state<PlanMeasure | null>(null);

	$effect(() => {
		// Measurements last as long as the tool is armed and kept: unarming it,
		// leaving edit mode, or turning keep off all clear the plan.
		if (tool !== "measure" || live || !keepMeasures) {
			measures = [];
			measuring = null;
		}
	});
	/** Shift-drag selection rectangle. Plain drag stays d3-zoom's, for panning. */
	let marquee = $state<{ a: Point; b: Point; pointerId: number; moved: boolean } | null>(null);

	let hover = $state<{ kind: "vertex" | "wall" | "opening"; id: string } | null>(null);
	/** Screen position of a select-tool press on open surface, for click-vs-pan telling. */
	let pressed: { x: number; y: number; id: number } | null = null;

	function clientToWorld(clientX: number, clientY: number): Point {
		const rect = svgEl?.getBoundingClientRect();
		if (!rect) return { x: 0, y: 0 };
		return {
			x: (clientX - rect.left - transform.x) / transform.k / PX_PER_M,
			y: (clientY - rect.top - transform.y) / transform.k / PX_PER_M,
		};
	}

	function worldToClient(p: Point) {
		const rect = svgEl?.getBoundingClientRect();
		if (!rect) return null;
		return {
			left: rect.left + transform.x + p.x * pxPerM,
			top: rect.top + transform.y + p.y * pxPerM,
		};
	}

	function faceClientRect(face: Face) {
		const rect = svgEl?.getBoundingClientRect();
		if (!rect) return null;
		const b = polygonBounds(face.polygon);
		return {
			left: rect.left + transform.x + b.minX * pxPerM,
			top: rect.top + transform.y + b.minY * pxPerM,
			width: b.width * pxPerM,
			height: b.height * pxPerM,
		};
	}

	function getViewportCenterWorld(): Point {
		return {
			x: (width / 2 - transform.x) / transform.k / PX_PER_M,
			y: (height / 2 - transform.y) / transform.k / PX_PER_M,
		};
	}

	$effect(() => {
		onready?.({
			cancelDraw,
			openMenuAt,
			getZoom: () => pxPerM,
			clientToWorld,
			worldToClient,
			faceClientRect,
			getViewportCenterWorld,
		});
	});

	function clearMeasures(): boolean {
		if (!measuring && measures.length === 0) return false;
		measuring = null;
		measures = [];
		return true;
	}

	function cancelDraw(): boolean {
		if (clearMeasures()) return true;
		if (stamp) {
			stamp = null;
			return true;
		}
		if (!draw) return false;
		const had = draw.wallCount > 0;
		draw = null;
		rubber = null;
		if (had) onsnapshot();
		return true;
	}

	let prevTool = untrack(() => tool);
	let prevLive = untrack(() => live);
	$effect(() => {
		// Switching tools or modes abandons any in-progress gesture.
		if (tool !== prevTool || live !== prevLive) {
			prevTool = tool;
			prevLive = live;
			untrack(() => {
				cancelDraw();
				drag = null;
				marquee = null;
				hover = null;
			});
		}
	});

	/**
	 * Whether this corner moves on its own. Unlocking is the escape hatch, so one
	 * room having asked for free corners is enough to free the corners it holds.
	 */
	function cornersFree(vertexId: string): boolean {
		if (freeCornerKeys.size === 0) return false;
		return faces.some((f) => freeCornerKeys.has(faceKey(f)) && f.vertexIds.includes(vertexId));
	}

	function wallsTouching(vertexId: string): string[] {
		return graph.walls.filter((w) => w.a === vertexId || w.b === vertexId).map((w) => w.id);
	}


	const allOpeningViews = $derived(buildOpeningViews(graph));
	/** The openings the pointer can act on; none in live mode, where none are editable. */
	const openingViews = $derived(live ? [] : allOpeningViews);
	/**
	 * The openings that draw a line across their gap: every window and door,
	 * in both modes — the thin pane reads as a window, the thicker leaf as a
	 * door, and a bare gap as a cased opening — plus whatever the pointer is
	 * on, to pick it out.
	 */
	const strokedOpenings = $derived(
		allOpeningViews.filter(
			(v) =>
				v.opening.kind === "window" ||
				v.opening.kind === "door" ||
				selectedOpeningSet.has(v.opening.id) ||
				(hover?.kind === "opening" && hover.id === v.opening.id),
		),
	);

	/**
	 * The single selected wall's bend handle. One wall at a time keeps the plan
	 * readable, and the handle only exists in edit mode.
	 */
	const bendHandle = $derived.by(() => {
		if (live || selection.wallIds.length !== 1) return null;
		const wall = graph.walls.find((w) => w.id === selection.wallIds[0]);
		if (!wall) return null;
		return { wall, point: wallApex(wall, graph.vertices) };
	});

	const selectedFurniture = $derived(
		live || !selectedFurnitureId
			? null
			: (furniture.find((f) => f.id === selectedFurnitureId) ?? null),
	);
	/** Screen-size handles in world meters, so they hold their size at any zoom. */
	const handleR = $derived(5 / pxPerM);
	const furnitureHandles = $derived.by(() => {
		const piece = selectedFurniture;
		if (!piece || furnitureMode !== "scale") return [];
		const kind = furnitureKind(piece.kind);
		if (!kind) return [];
		return scaleHandles(kind).map((h) => ({ handle: h, point: scaleHandlePoint(piece, h) }));
	});
	/** The rotate gizmo's ring and its one dot, above the piece. */
	const rotateGizmo = $derived.by(() => {
		const piece = selectedFurniture;
		if (!piece || furnitureMode !== "rotate") return null;
		const radius = Math.max(piece.width, piece.height) / 2 + 0.25;
		const rad = ((piece.rotation - 90) * Math.PI) / 180;
		return {
			radius,
			dot: { x: piece.x + radius * Math.cos(rad), y: piece.y + radius * Math.sin(rad) },
		};
	});

	/**
	 * Where a dragged piece comes to rest: on the grid, unless a wall face is
	 * near enough to sit flush against.
	 */
	function settleFurniture(piece: FloorplanFurnitureData, to: Point, alt: boolean) {
		const moved = moveFurniture(piece, markerSnap(to, alt));
		if (alt) return moved;
		return moveFurniture(moved, snapFurnitureToWalls(moved, graph, WALL_SNAP_REACH_PX / pxPerM));
	}

	/** The topmost piece under `p` — later pieces draw on top, so search back. */
	function furnitureAt(p: Point): FloorplanFurnitureData | null {
		for (let i = furniture.length - 1; i >= 0; i--) {
			if (furnitureContainsPoint(furniture[i], p)) return furniture[i];
		}
		return null;
	}

	function handleNear(p: Point): { handle: ScaleHandle; point: Point } | null {
		let best: { handle: ScaleHandle; point: Point } | null = null;
		let bestD = handleR * 2;
		for (const h of furnitureHandles) {
			const d = Math.hypot(h.point.x - p.x, h.point.y - p.y);
			if (d < bestD) {
				bestD = d;
				best = h;
			}
		}
		return best;
	}

	const grabInput = $derived({
		graph,
		faces,
		openings: openingViews,
		selectedOpeningIds: selectedOpeningSet,
		markers: placements.map((pl) => ({ x: pl.x, y: pl.y })),
		markerReach: 16 / pxPerM,
		bend: bendHandle ? { wallId: bendHandle.wall.id, point: bendHandle.point } : null,
		reach: hitRadius,
	});

	const grabAt = (p: Point, handles = true) => grabTarget(grabInput, p, handles);


	function openingView(id: string) {
		return openingViews.find((v) => v.opening.id === id) ?? null;
	}


	function snapMeters(v: number, alt: boolean): number {
		return alt ? v : Math.round(v / DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE;
	}

	/**
	 * The detached graph a face drag translates from. Held outside `$state`:
	 * it is a whole graph read on every pointermove, and the parent's copy of
	 * it has not propagated back through the prop yet when the drag starts.
	 */
	let faceDragBase: PlanGraph | null = null;
	let faceDragDetach: { key: string; idMap: Map<string, string> } | null = null;
	/** Same holding pattern for a wall drag, which splits its ends the same way. */
	let wallDragBase: PlanGraph | null = null;

	/**
	 * Split the dragged room free of its neighbours and take the resulting ring
	 * as the drag's origin. Runs once, on the first frame that leaves the dead
	 * zone, so a click never mutates the plan.
	 */
	function beginFaceDetach(state: DragState) {
		const index = state.faceIndex;
		const face = index === undefined ? undefined : faces[index];
		if (!face) return;
		const result = detachFace(
			graph,
			face,
			faces.filter((f) => f !== face),
			{ vertexId: newVertexId, wallId: newWallId },
		);
		faceDragBase = result.graph;
		faceDragDetach =
			result.idMap.size > 0 ? { key: faceKey(face), idMap: result.idMap } : null;
		const origin = new Map<string, Point>();
		for (const v of result.graph.vertices) {
			if (result.movedVertexIds.has(v.id)) origin.set(v.id, { x: v.x, y: v.y });
		}
		state.origin = origin;
	}

	/**
	 * Cut the room that was just dragged back to the edge of any room it landed
	 * on, so dropping one room over another reads the same as placing it there.
	 *
	 * A room that stays put is one whose corners the drag never touched. That is
	 * what identifies the rooms to cut against, rather than the dragged face's
	 * index — the faces are rederived every frame, so by release the index means
	 * something else.
	 */
	function clipDraggedRoom(origin: Map<string, Point>): PlanGraph {
		const moved = new Set(origin.keys());
		const dragged = new Set(
			graph.walls.filter((w) => moved.has(w.a) && moved.has(w.b)).map((w) => w.id),
		);
		const staying = faces.filter((f) => f.vertexIds.every((id) => !moved.has(id)));
		return trimWallsInsideFaces(graph, dragged, staying);
	}


	/**
	 * Split the dragged wall off the straight run continuing past its ends and
	 * take the result as the drag's origin. Runs once, on the first frame that
	 * leaves the dead zone, so a click never mutates the plan.
	 */
	function beginWallDetach(state: DragState) {
		if (!state.wallId) return;
		const result = detachWallEnds(graph, state.wallId, faces, {
			vertexId: newVertexId,
			wallId: newWallId,
		});
		wallDragBase = result.graph;
		state.origin = result.moved;
	}

	/**
	 * Add the polyline's next point, closing the loop when it lands back on the
	 * start. Both the mouse's click and touch's release end up here.
	 */
	function placeWallPoint(snap: SnapResult) {
		if (!draw) return;
		const closing =
			draw.wallCount > 0 &&
			Math.hypot(snap.point.x - draw.start.x, snap.point.y - draw.start.y) <= hitRadius;
		const end = closing ? draw.start : snap.point;
		commitWallSegment(draw.anchor, end, false);
		draw = { ...draw, anchor: end, wallCount: draw.wallCount + 1 };
		if (closing) {
			draw = null;
			rubber = null;
			onsnapshot();
		}
	}

	function commitWallSegment(from: Point, to: Point, snapshot: boolean) {
		const next = connectPoints(graph, from, to, DEFAULT_WALL_THICKNESS, idMint);
		if (next !== graph) oncommit(next, { snapshot });
	}

	function handlePointerDown(e: PointerEvent) {
		if (!svgEl || e.button !== 0) return;
		// A second finger means the user is reaching for pan/pinch, which d3 owns.
		// Abandon whatever the first finger started rather than let the two fight.
		if (e.pointerType === "touch") {
			if (touchPointers.size > 0) {
				abandonGesture();
				touchPointers.add(e.pointerId);
				return;
			}
			touchPointers.add(e.pointerId);
		}
		const p = toWorld(e);

		if (live) {
			if (brush) {
				e.preventDefault();
				brushPointerType = e.pointerType || "mouse";
				brushOver = true;
				brushStroke = e.pointerId;
				brushCursor = p;
				svgEl.setPointerCapture(e.pointerId);
				onbrushstroke?.(brushHits(brushPlacements, p, brushRadiusWorld));
				return;
			}
			// Live mode: d3 pans everything but markers; a no-movement release
			// resolves as a tap (marker toggle / room drawer) on pointerup.
			const held = hitMarker(p);
			if (held) armMarkerHold(held, e);
			pressed = { x: e.clientX, y: e.clientY, id: e.pointerId };
			return;
		}

		if (tool === "wall") {
			e.preventDefault();
			const snap = resolveSnap(p, {
				graph,
				zoom: pxPerM,
				alt: noSnap(e),
				prevPoint: draw?.anchor,
			});
			if (!draw) {
				draw = {
					start: snap.point,
					startVertexId: snap.indicator?.kind === "vertex" ? snap.indicator.vertexId : null,
					anchor: snap.point,
					wallCount: 0,
				};
				return;
			}
			// A finger has no hover, so committing on touch-down would place the
			// segment before it could be aimed. Touch previews on the way down and
			// places on release; a mouse places on the click itself.
			if (e.pointerType === "touch") {
				rubber = { end: snap.point, snap };
				return;
			}
			placeWallPoint(snap);
			return;
		}

		if (tool === "measure") {
			e.preventDefault();
			const snap = resolveSnap(p, { graph, zoom: pxPerM, alt: noSnap(e) });
			measuring = { id: `m-${measureSeq++}`, kind: measureKind, a: snap.point, b: snap.point };
			svgEl.setPointerCapture(e.pointerId);
			return;
		}

		if (tool === "rect") {
			e.preventDefault();
			const snap = resolveSnap(p, { graph, zoom: pxPerM, alt: noSnap(e) });
			stamp = { a: snap.point, b: snap.point };
			svgEl.setPointerCapture(e.pointerId);
			return;
		}

		if (tool === "opening") {
			e.preventDefault();
			const w = hitWall(graph, p, hitRadius);
			if (!w) return;
			const id = newOpeningId();
			oncommit(addOpening(graph, w.id, p, openingKind, id), { snapshot: true });
			onselectionchange({ ...emptySelection, openingIds: [id] });
			return;
		}

		// Shift-drag sweeps a selection rectangle. `pressed` is still recorded, so
		// a shift-press that never moves falls through to the click path and
		// toggles whatever is under it.
		if (adding(e)) {
			e.preventDefault();
			marquee = { a: p, b: p, pointerId: e.pointerId, moved: false };
			pressed = { x: e.clientX, y: e.clientY, id: e.pointerId };
			svgEl.setPointerCapture(e.pointerId);
			return;
		}

		// One resolved answer for what is under the pointer, so the press, the
		// click it may become, and the hover cannot disagree.
		if (!live) {
			// A scale handle is the smallest target on the plan, so it is asked
			// about first; then the piece body, which sits under the markers.
			const handle = furnitureMode === "scale" ? handleNear(p) : null;
			if (handle && selectedFurniture) {
				e.preventDefault();
				drag = {
					kind: "furniture",
					pointerId: e.pointerId,
					start: p,
					moved: false,
					furnitureFrom: selectedFurniture,
					furnitureHandle: handle.handle,
				};
				svgEl.setPointerCapture(e.pointerId);
				return;
			}
			if (selectedFurniture && furnitureMode === "rotate" && rotateGizmo) {
				const d = Math.hypot(rotateGizmo.dot.x - p.x, rotateGizmo.dot.y - p.y);
				if (d <= handleR * 2.5) {
					e.preventDefault();
					drag = {
						kind: "furniture",
						pointerId: e.pointerId,
						start: p,
						moved: false,
						furnitureFrom: selectedFurniture,
					};
					svgEl.setPointerCapture(e.pointerId);
					return;
				}
			}
		}

		const grab = grabAt(p);
		if (grab?.kind === "marker") {
			const m = placements[grab.index];
			e.preventDefault();
			armMarkerHold(m, e);
			drag = {
				kind: "marker",
				pointerId: e.pointerId,
				start: p,
				moved: false,
				placementRef: placementViewRef(m),
			};
			svgEl.setPointerCapture(e.pointerId);
			return;
		}
		if (!live) {
			const piece = furnitureAt(p);
			if (piece) {
				e.preventDefault();
				if (selectedFurnitureId !== piece.id) {
					onselectionchange?.({ ...emptySelection, furnitureId: piece.id });
				}
				armFurnitureHold(piece, e);
				drag = {
					kind: "furniture",
					pointerId: e.pointerId,
					start: p,
					moved: false,
					furnitureFrom: piece,
				};
				svgEl.setPointerCapture(e.pointerId);
				return;
			}
		}
		if (grab?.kind === "bend") {
			e.preventDefault();
			drag = { kind: "bend", pointerId: e.pointerId, start: p, moved: false, wallId: grab.wallId };
			svgEl.setPointerCapture(e.pointerId);
			return;
		}
		if (grab?.kind === "openingEdge") {
			e.preventDefault();
			const wall = graph.walls.find((x) => x.id === grab.wallId)!;
			drag = {
				kind: "openingEdge",
				pointerId: e.pointerId,
				start: p,
				moved: false,
				wallId: grab.wallId,
				openingId: grab.openingId,
				openingAnchorS: arcLengthAtT(
					wallMetrics(wall, graph.vertices),
					projectOntoWall(grab.anchor, wall, graph.vertices).t,
				),
			};
			svgEl.setPointerCapture(e.pointerId);
			return;
		}
		if (grab?.kind === "opening") {
			e.preventDefault();
			armOpeningHold(grab.openingId, e);
			drag = {
				kind: "opening",
				pointerId: e.pointerId,
				start: p,
				moved: false,
				wallId: grab.wallId,
				openingId: grab.openingId,
			};
			svgEl.setPointerCapture(e.pointerId);
			return;
		}
		if (grab?.kind === "vertex") {
			e.preventDefault();
			// Grabbing one of several selected vertices translates the whole set;
			// `origin` is what says which, so a lone vertex leaves it unset.
			const group =
				selection.vertexIds.length > 1 && selection.vertexIds.includes(grab.vertexId)
					? new Map(
							graph.vertices
								.filter((x) => selection.vertexIds.includes(x.id))
								.map((x) => [x.id, { x: x.x, y: x.y }] as const),
						)
					: undefined;
			drag = {
				kind: "vertex",
				pointerId: e.pointerId,
				start: p,
				moved: false,
				vertexId: grab.vertexId,
				origin: group,
				markerOrigin: group ? selectedMarkerOrigin() : undefined,
				snap: null,
			};
			svgEl.setPointerCapture(e.pointerId);
			return;
		}
		if (grab?.kind === "wall") {
			e.preventDefault();
			const w = graph.walls.find((x) => x.id === grab.wallId)!;
			const a = vertexById.get(w.a)!;
			const b = vertexById.get(w.b)!;
			const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
			// The ends are split off the run on the first moved frame, so a click
			// that never leaves the dead zone changes nothing.
			drag = {
				kind: "wall",
				pointerId: e.pointerId,
				start: p,
				moved: false,
				wallId: w.id,
				wallNormal: { x: -(b.y - a.y) / len, y: (b.x - a.x) / len },
				snap: null,
			};
			svgEl.setPointerCapture(e.pointerId);
			return;
		}
		if (grab?.kind === "face") {
			const f = grab.index;
			armFaceHold(f, e);
			if (unlockedKeys.has(faceKey(faces[f]))) {
				e.preventDefault();
				// The ring is split off the neighbours on the first moved frame,
				// so a click that never leaves the dead zone changes nothing.
				drag = { kind: "face", pointerId: e.pointerId, start: p, moved: false, faceIndex: f };
				svgEl.setPointerCapture(e.pointerId);
				return;
			}
			// Locked room: the press pans (d3) and a still release selects.
			pressed = { x: e.clientX, y: e.clientY, id: e.pointerId };
			return;
		}
		// Open surface: d3-zoom owns the drag (pan); remember the press so a
		// no-movement release still reads as a click (clear the selection).
		pressed = { x: e.clientX, y: e.clientY, id: e.pointerId };
	}

	let brushCursor = $state<Point | null>(null);
	let brushStroke = $state<number | null>(null);
	/** Last brush pointer's type: touch gets no hover cursor, only a painting one. */
	let brushPointerType = $state("mouse");
	/** Kept true while fading out, so the ring animates instead of vanishing. */
	let brushOver = $state(false);
	const brushRadiusWorld = $derived(screenRadiusToWorld(brushRadiusPx, pxPerM));

	/** A wheel over an armed brush resizes it; ctrl/cmd keeps zooming. */
	function handleWheel(e: WheelEvent) {
		if (!live || !brush || e.ctrlKey || e.metaKey) return;
		e.preventDefault();
		onbrushresize?.(stepBrushRadius(brushRadiusPx, e.deltaY < 0 ? 1 : -1));
	}
	const brushPainting = $derived(brushStroke !== null);
	// Hovering shows the ring so the reach is readable; the fill only appears
	// while actually painting. Touch has no hover, so nothing shows until the
	// finger is down.
	const brushRingVisible = $derived(
		brushOver && (brushPointerType !== "touch" || brushPainting),
	);
	const brushPlacements = $derived(
		placements.map((pl) => ({ id: placementViewKey(pl), x: pl.x, y: pl.y })),
	);

	/** Occupancy rings are a device affordance: a group marker never draws one. */
	const occupancyMarkers = $derived(
		placements.flatMap((pl) =>
			pl.kind === "device" &&
			!pl.device.disabled &&
			deviceHasCapability(pl.device, "occupancy")
				? [
						{
							id: pl.device.id,
							x: pl.x,
							y: pl.y,
							occupied: pl.device.state?.occupancy === true,
						},
					]
				: [],
		),
	);

	$effect(() => {
		if (!brush) {
			brushCursor = null;
			brushStroke = null;
			brushOver = false;
		}
	});

	/** The pointer left the plan: fade the brush out where it stands. */
	function handlePointerLeave() {
		brushOver = false;
		if (brushStroke !== null) {
			brushStroke = null;
			onbrushend?.();
		}
	}

	/** Fingers currently on the surface, so a second one can hand over to d3. */
	const touchPointers = new Set<number>();

	/** Drop every in-flight single-pointer gesture without committing anything. */
	function abandonGesture() {
		clearFaceHold();
		drag = null;
		faceDragBase = null;
		faceDragDetach = null;
		wallDragBase = null;
		marquee = null;
		stamp = null;
		pressed = null;
		if (brushStroke !== null) {
			brushStroke = null;
			brushOver = false;
			onbrushend?.();
		}
	}

	/** Touch/pen press-and-hold opens the context menu for whatever is under it. */
	let faceHold: { x: number; y: number; timer: ReturnType<typeof setTimeout> } | null = null;

	/** Mouse gets the same menus through `contextmenu`; this is the touch route. */
	function armHold(e: PointerEvent, open: () => void) {
		if (e.pointerType === "mouse") return;
		clearFaceHold();
		faceHold = {
			x: e.clientX,
			y: e.clientY,
			timer: setTimeout(() => {
				faceHold = null;
				drag = null;
				try {
					navigator.vibrate?.(15);
				} catch {
					// unsupported on some platforms
				}
				open();
			}, 350),
		};
	}

	function armFaceHold(faceIndex: number, e: PointerEvent) {
		if (live || !onfacemenu) return;
		armHold(e, () => onfacemenu(faceIndex, e.clientX, e.clientY));
	}

	function armFurnitureHold(piece: FloorplanFurnitureData, e: PointerEvent) {
		if (!onfurnituremenu) return;
		armHold(e, () => onfurnituremenu?.(piece, e.clientX, e.clientY));
	}

	function armMarkerHold(placement: PlacementView, e: PointerEvent) {
		if (!onmarkermenu) return;
		armHold(e, () => onmarkermenu(placement, e.clientX, e.clientY));
	}

	function armOpeningHold(openingId: string, e: PointerEvent) {
		if (!onopeningmenu) return;
		armHold(e, () => onopeningmenu(openingId, e.clientX, e.clientY));
	}

	function clearFaceHold() {
		if (faceHold) {
			clearTimeout(faceHold.timer);
			faceHold = null;
		}
	}

	/**
	 * A release outside the plan — over the toolbar, or past the edge — still
	 * has to finish the gesture, so it is caught at the window as well.
	 */
	function handleWindowPointerUp(e: PointerEvent) {
		if (!drag || e.pointerId !== drag.pointerId) return;
		handlePointerUp(e);
	}

	/**
	 * A cancelled gesture (browser scroll takeover, palm rejection) must not
	 * strand a detached, uncommitted plan: commit what moved, drop the rest.
	 */
	function handlePointerCancel(e: PointerEvent) {
		clearFaceHold();
		touchPointers.delete(e.pointerId);
		if (marquee?.pointerId === e.pointerId) marquee = null;
		if (!drag || e.pointerId !== drag.pointerId) return;
		const d = drag;
		drag = null;
		faceDragBase = null;
		wallDragBase = null;
		faceDragDetach = null;
		if (d.moved && d.kind !== "marker") oncommit(graph, { snapshot: true });
	}

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		// The right button is panning while a brush is armed; a menu on release
		// would land on whatever the pan happened to stop over.
		if (live && brush) return;
		openMenuAt(e.clientX, e.clientY);
	}

	/**
	 * Open whichever menu belongs to the plan at this screen point. Exposed so a
	 * right-click landing on an already-open menu can move it here instead of
	 * falling through to the browser's own.
	 */
	function openMenuAt(clientX: number, clientY: number) {
		if (!svgEl) return;
		const e = { clientX, clientY };
		const p = clientToWorld(clientX, clientY);
		// Markers sit above faces, so they claim the menu first — and they carry
		// one in live mode too, where the face menu is an editing affordance.
		const marker = hitMarker(p);
		if (marker && onmarkermenu) {
			onmarkermenu(marker, e.clientX, e.clientY);
			return;
		}
		if (live) return;
		// Openings sit on top of their wall, so they claim the menu before the
		// face that wall encloses.
		const grab = grabAt(p, false);
		if (grab?.kind === "opening" && onopeningmenu) {
			onopeningmenu(grab.openingId, e.clientX, e.clientY);
			return;
		}
		// A piece covers the room it stands in, so its menu comes first.
		const piece = furnitureAt(p);
		if (piece && onfurnituremenu) {
			onfurnituremenu(piece, e.clientX, e.clientY);
			return;
		}
		if (!onfacemenu) return;
		const f = hitFace(faces, p);
		if (f !== null) onfacemenu(f, e.clientX, e.clientY);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!svgEl) return;
		if (faceHold && Math.hypot(e.clientX - faceHold.x, e.clientY - faceHold.y) > 8) {
			clearFaceHold();
		}
		if (live) {
			if (brush) {
				const bp = toWorld(e);
				brushPointerType = e.pointerType || "mouse";
				brushOver = true;
				brushCursor = bp;
				if (brushStroke === e.pointerId) {
					onbrushstroke?.(brushHits(brushPlacements, bp, brushRadiusWorld));
				}
			}
			return;
		}
		const p = toWorld(e);

		if (tool === "wall" && draw) {
			const snap = resolveSnap(p, { graph, zoom: pxPerM, alt: noSnap(e), prevPoint: draw.anchor });
			rubber = { end: snap.point, snap };
			return;
		}

		if (tool === "measure" && measuring) {
			const snap = resolveSnap(p, { graph, zoom: pxPerM, alt: noSnap(e) });
			measuring = { ...measuring, b: snap.point };
			return;
		}

		if (tool === "rect" && stamp) {
			const snap = resolveSnap(p, { graph, zoom: pxPerM, alt: noSnap(e) });
			stamp = { a: stamp.a, b: snap.point };
			return;
		}

		if (marquee && e.pointerId === marquee.pointerId) {
			if (!marquee.moved && Math.hypot(p.x - marquee.a.x, p.y - marquee.a.y) * pxPerM < 3) return;
			marquee = { ...marquee, b: p, moved: true };
			return;
		}

		if (drag && e.pointerId === drag.pointerId) {
			if (!drag.moved && Math.hypot(p.x - drag.start.x, p.y - drag.start.y) * pxPerM < 3) return;
			drag.moved = true;
			// The drag engages at 3 px but the hold timer only cancels at 8 px:
			// without this a slow touch drag would open the room menu and drop
			// the gesture mid-flight.
			clearFaceHold();
			if (drag.kind === "marker" && drag.placementRef) {
				onplacementpreview?.(drag.placementRef, markerSnap(p, noSnap(e)));
			} else if (drag.kind === "vertex" && drag.vertexId) {
				const snap = resolveSnap(p, {
					graph,
					zoom: pxPerM,
					alt: noSnap(e),
					excludeVertexIds: [drag.vertexId],
					excludeWallIds: wallsTouching(drag.vertexId),
				});
				drag.snap = snap;
				const g = cloneGraph(graph);
				const origin = drag.origin;
				if (!origin && !cornersFree(drag.vertexId)) {
					const resized = resizeAtCorner(graph, drag.vertexId, snap.point);
					const movedIds = new Set(
						resized.vertices
							.filter((v) => {
								const was = graph.vertices.find((x) => x.id === v.id);
								return was && (was.x !== v.x || was.y !== v.y);
							})
							.map((v) => v.id),
					);
					if (!carryWallCurves(resized, (id) => movedIds.has(id), { x: 0, y: 0 })) return;
					onpreview(resized);
				} else if (origin) {
					const from = origin.get(drag.vertexId);
					if (from) {
						const dx = snap.point.x - from.x;
						const dy = snap.point.y - from.y;
						for (const [id, o] of origin) {
							const v = g.vertices.find((x) => x.id === id);
							if (v) {
								v.x = o.x + dx;
								v.y = o.y + dy;
							}
						}
						if (!carryWallCurves(g, (id) => origin.has(id), { x: dx, y: dy })) return;
						if (drag.markerOrigin) carryMarkers(drag.markerOrigin, dx, dy, noSnap(e), false);
						onpreview(g);
					}
				} else {
					const v = g.vertices.find((x) => x.id === drag!.vertexId);
					if (v) {
						v.x = snap.point.x;
						v.y = snap.point.y;
						if (!carryWallCurves(g, (id) => id === drag!.vertexId, { x: 0, y: 0 })) return;
						onpreview(g);
					}
				}
			} else if (drag.kind === "furniture" && drag.furnitureFrom) {
				const from = drag.furnitureFrom;
				if (drag.furnitureHandle) {
					onfurniturepreview?.(
						resizeFromHandle(from, drag.furnitureHandle, p, noSnap(e) ? 0 : DEFAULT_GRID_SIZE),
					);
				} else if (furnitureMode === "rotate") {
					onfurniturepreview?.(rotateFurnitureTo(from, p, noSnap(e) ? 0 : 15));
				} else {
					const to = {
						x: from.x + (p.x - drag.start.x),
						y: from.y + (p.y - drag.start.y),
					};
					onfurniturepreview?.(settleFurniture(from, to, noSnap(e)));
				}
			} else if (drag.kind === "bend" && drag.wallId) {
				onpreview(bendWall(graph, drag.wallId, markerSnap(p, noSnap(e)), hitRadius));
			} else if (drag.kind === "opening" && drag.wallId && drag.openingId) {
				const w = graph.walls.find((x) => x.id === drag!.wallId);
				if (w) {
					const m = wallMetrics(w, graph.vertices);
					const s = snapMeters(
						arcLengthAtT(m, projectOntoWall(p, w, graph.vertices).t),
						noSnap(e),
					);
					onpreview(withOpening(graph, w.id, drag.openingId, (o) => ({ ...o, t: tAtArcLength(m, s) })));
				}
			} else if (
				drag.kind === "openingEdge" &&
				drag.wallId &&
				drag.openingId &&
				drag.openingAnchorS !== undefined
			) {
				const w = graph.walls.find((x) => x.id === drag!.wallId);
				if (w) {
					const m = wallMetrics(w, graph.vertices);
					const anchorS = drag.openingAnchorS;
					const s = arcLengthAtT(m, projectOntoWall(p, w, graph.vertices).t);
					const width = Math.max(
						MIN_OPENING_WIDTH_M,
						snapMeters(Math.abs(s - anchorS), noSnap(e)),
					);
					const centreS = anchorS + (s >= anchorS ? 1 : -1) * (width / 2);
					onpreview(
						withOpening(graph, w.id, drag.openingId, (o) => ({
							...o,
							t: tAtArcLength(m, centreS),
							width,
						})),
					);
				}
			} else if (drag.kind === "wall" && drag.wallNormal) {
				if (!drag.origin) beginWallDetach(drag);
				if (!drag.origin) return;
				const n = drag.wallNormal;
				const raw = (p.x - drag.start.x) * n.x + (p.y - drag.start.y) * n.y;
				// The whole wall slides by one distance, so snapping the distance
				// lands it on the grid without bending it.
				const anchor = drag.origin.values().next().value;
				const slid = noSnap(e) || !anchor ? raw : gridSlide(raw, n, anchor);
				const base = wallDragBase ?? graph;
				const d = clampWallDrag(base, drag.origin, n, slid);
				const g = cloneGraph(base);
				for (const [id, o] of drag.origin) {
					const v = g.vertices.find((x) => x.id === id);
					if (v) {
						v.x = o.x + n.x * d;
						v.y = o.y + n.y * d;
					}
				}
				if (!carryWallCurves(g, (id) => drag!.origin!.has(id), { x: n.x * d, y: n.y * d })) return;
				onpreview(g);
			} else if (drag.kind === "face") {
				const detaching = !drag.origin;
				if (detaching) beginFaceDetach(drag);
				if (!drag.origin) return;
				let dx = p.x - drag.start.x;
				let dy = p.y - drag.start.y;
				if (!noSnap(e)) {
					dx = Math.round(dx / DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE;
					dy = Math.round(dy / DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE;
				}
				const g = cloneGraph(faceDragBase ?? graph);
				for (const [id, o] of drag.origin) {
					const v = g.vertices.find((x) => x.id === id);
					if (v) {
						v.x = o.x + dx;
						v.y = o.y + dy;
					}
				}
				if (!carryWallCurves(g, (id) => drag!.origin!.has(id), { x: dx, y: dy })) return;
				// The split and the first translation ship as one graph, so the
				// degenerate frame where the copies sit on their originals is
				// never rendered.
				if (detaching && faceDragDetach) {
					ondetach?.(g, faceDragDetach.key, faceDragDetach.idMap);
				} else {
					onpreview(g);
				}
			}
			return;
		}

		if (tool === "select") {
			hover = hoverAt(p);
		}
	}

	/** What the select tool would grab at `p`, for the hover highlight. */
	function hoverAt(p: Point): { kind: "vertex" | "wall" | "opening"; id: string } | null {
		const grab = grabAt(p, false);
		if (grab?.kind === "opening") return { kind: "opening", id: grab.openingId };
		if (grab?.kind === "vertex") return { kind: "vertex", id: grab.vertexId };
		if (grab?.kind === "wall") return { kind: "wall", id: grab.wallId };
		return null;
	}

	function handlePointerUp(e: PointerEvent) {
		if (!svgEl) return;
		clearFaceHold();
		touchPointers.delete(e.pointerId);
		const p = toWorld(e);

		if (live) {
			if (brushStroke === e.pointerId) {
				brushStroke = null;
				// A finger leaves no cursor behind; a mouse keeps its ring.
				if (brushPointerType === "touch") brushOver = false;
				onbrushend?.();
				return;
			}
			if (pressed && e.pointerId === pressed.id) {
				const clicked = Math.hypot(e.clientX - pressed.x, e.clientY - pressed.y) < 4;
				pressed = null;
				if (clicked) {
					const m = hitMarker(p);
					if (m) {
						onmarkertap?.(m, e);
						return;
					}
					const f = hitFace(faces, p);
					if (f !== null) onfacetap?.(f);
				}
			}
			return;
		}

		if (tool === "wall" && draw && rubber && e.pointerType === "touch") {
			placeWallPoint(rubber.snap);
			return;
		}

		if (tool === "measure" && measuring) {
			const m = measuring;
			measuring = null;
			// A tap leaves nothing to read, so it lays nothing down.
			if (keepMeasures && Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y) >= MIN_MEASURE_SPAN_M) {
				measures = [...measures, m];
			}
			return;
		}

		if (tool === "rect" && stamp) {
			const { a, b } = stamp;
			stamp = null;
			if (Math.abs(b.x - a.x) >= MIN_STAMP_SIDE && Math.abs(b.y - a.y) >= MIN_STAMP_SIDE) {
				oncommit(addRoomClipped(graph, a, b, DEFAULT_WALL_THICKNESS, idMint, faces), {
					snapshot: true,
				});
			}
			return;
		}

		if (drag && e.pointerId === drag.pointerId) {
			const d = drag;
			drag = null;
			faceDragBase = null;
			wallDragBase = null;
			faceDragDetach = null;
			if (d.moved) {
				if (d.kind === "furniture" && d.furnitureFrom) {
					const from = d.furnitureFrom;
					const settled = d.furnitureHandle
						? resizeFromHandle(from, d.furnitureHandle, p, noSnap(e) ? 0 : DEFAULT_GRID_SIZE)
						: furnitureMode === "rotate"
							? rotateFurnitureTo(from, p, noSnap(e) ? 0 : 15)
							: settleFurniture(
									from,
									{ x: from.x + (p.x - d.start.x), y: from.y + (p.y - d.start.y) },
									noSnap(e),
								);
					onfurniturecommit?.(settled);
				} else if (d.kind === "marker" && d.placementRef) {
					onplacementdrop?.(d.placementRef, markerSnap(p, noSnap(e)), noSnap(e));
				} else if (d.kind === "face" && d.origin) {
					oncommit(clipDraggedRoom(d.origin), { snapshot: true });
				} else {
					if (d.kind === "vertex" && d.markerOrigin && d.origin) {
						// The markers land where the joints left them, in the same
						// commit, so the whole move is one undo step.
						const from = d.origin.get(d.vertexId!);
						const settled = d.snap?.point ?? p;
						if (from) {
							carryMarkers(
								d.markerOrigin,
								settled.x - from.x,
								settled.y - from.y,
								noSnap(e),
								true,
							);
						}
					}
					oncommit(graph, { snapshot: true });
				}
				return;
			}
			// A press that never moved is a click: selection.
			applyClickSelection(e, p);
			return;
		}

		if (marquee && e.pointerId === marquee.pointerId) {
			const swept = marquee;
			marquee = null;
			if (swept.moved) {
				pressed = null;
				applyMarquee(swept.a, swept.b);
				return;
			}
		}

		if (tool === "select" && pressed && e.pointerId === pressed.id) {
			const clicked = Math.hypot(e.clientX - pressed.x, e.clientY - pressed.y) < 4;
			pressed = null;
			if (clicked) applyClickSelection(e, p);
		}
	}

	/**
	 * Add everything the rectangle encloses to the selection. A wall counts only
	 * when both of its ends are inside, so half-covered walls are left alone.
	 */
	/** Where each selected marker stands right now, to translate it from. */
	function selectedMarkerOrigin(): Map<string, Point> | undefined {
		if (selection.placementKeys.length === 0) return undefined;
		const keys = new Set(selection.placementKeys);
		const out = new Map<string, Point>();
		for (const pl of placements) {
			const key = placementViewKey(pl);
			if (keys.has(key)) out.set(key, { x: pl.x, y: pl.y });
		}
		return out.size > 0 ? out : undefined;
	}

	/** Move every carried marker by the gesture's delta. */
	function carryMarkers(
		origin: Map<string, Point>,
		dx: number,
		dy: number,
		alt: boolean,
		commit: boolean,
	) {
		for (const pl of placements) {
			const from = origin.get(placementViewKey(pl));
			if (!from) continue;
			const to = markerSnap({ x: from.x + dx, y: from.y + dy }, alt);
			const ref = placementViewRef(pl);
			if (commit) onplacementdrop?.(ref, to, alt);
			else onplacementpreview?.(ref, to);
		}
	}

	function applyMarquee(a: Point, b: Point) {
		const minX = Math.min(a.x, b.x);
		const maxX = Math.max(a.x, b.x);
		const minY = Math.min(a.y, b.y);
		const maxY = Math.max(a.y, b.y);
		const swept = new Set(
			graph.vertices
				.filter((v) => v.x >= minX && v.x <= maxX && v.y >= minY && v.y <= maxY)
				.map((v) => v.id),
		);
		const walls = graph.walls.filter((w) => swept.has(w.a) && swept.has(w.b)).map((w) => w.id);
		// Markers inside the sweep come along, so dragging the corners takes the
		// devices standing between them.
		const markers = placements
			.filter((pl) => pl.x >= minX && pl.x <= maxX && pl.y >= minY && pl.y <= maxY)
			.map((pl) => placementViewKey(pl));
		onselectionchange({
			...emptySelection,
			vertexIds: [...new Set([...selection.vertexIds, ...swept])],
			wallIds: [...new Set([...selection.wallIds, ...walls])],
			placementKeys: [...new Set([...selection.placementKeys, ...markers])],
		});
	}

	function applyClickSelection(e: PointerEvent, p: Point) {
		// Handles are for dragging: a click that never moved selects whatever lies
		// under them instead.
		const grab = grabAt(p, false);
		// Furniture is not part of the graph the grab resolver walks, so a click
		// on a piece is answered here — otherwise the press selects it and the
		// release clears it again.
		// A piece stands on top of the room it is in, so it beats a face grab —
		// but never a marker, a wall or a handle, which sit above it.
		if (!live && (!grab || grab.kind === "face")) {
			const piece = furnitureAt(p);
			if (piece) {
				onselectionchange({ ...emptySelection, furnitureId: piece.id });
				return;
			}
		}
		const toggle = (ids: string[], id: string) =>
			ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];

		if (grab?.kind === "marker") {
			const key = placementViewKey(placements[grab.index]);
			onselectionchange(
				adding(e)
					? { ...selection, placementKeys: toggle(selection.placementKeys, key), faceIndex: null }
					: { ...emptySelection, placementKeys: [key] },
			);
			return;
		}
		if (grab?.kind === "opening") {
			onselectionchange(
				adding(e)
					? {
							...selection,
							openingIds: toggle(selection.openingIds, grab.openingId),
							faceIndex: null,
						}
					: { ...emptySelection, openingIds: [grab.openingId] },
			);
			return;
		}
		if (grab?.kind === "vertex") {
			onselectionchange(
				adding(e)
					? { ...selection, vertexIds: toggle(selection.vertexIds, grab.vertexId), faceIndex: null }
					: { ...emptySelection, vertexIds: [grab.vertexId] },
			);
			return;
		}
		if (grab?.kind === "wall") {
			onselectionchange(
				adding(e)
					? { ...selection, wallIds: toggle(selection.wallIds, grab.wallId), faceIndex: null }
					: { ...emptySelection, wallIds: [grab.wallId] },
			);
			return;
		}
		onselectionchange({ ...emptySelection, faceIndex: grab?.kind === "face" ? grab.index : null });
	}

	function handleDblClick(e: MouseEvent) {
		if (tool === "wall" && draw) {
			e.preventDefault();
			const had = draw.wallCount > 0;
			draw = null;
			rubber = null;
			if (had) onsnapshot();
		}
	}

	const visible = $derived.by(() => {
		const inv = (sx: number, sy: number) => ({
			x: (sx - transform.x) / transform.k / PX_PER_M,
			y: (sy - transform.y) / transform.k / PX_PER_M,
		});
		const tl = inv(0, 0);
		const br = inv(width, height);
		return { minX: tl.x, minY: tl.y, maxX: br.x, maxY: br.y };
	});

	interface GridLine {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
		major: boolean;
	}
	const gridLines = $derived.by(() => {
		const lines: GridLine[] = [];
		const { minX, minY, maxX, maxY } = visible;
		const minorVisible = pxPerM * 0.1 >= 8;
		const step = minorVisible ? 0.1 : 1;
		const startX = Math.floor(minX / step) * step;
		const startY = Math.floor(minY / step) * step;
		const count = (maxX - minX) / step + (maxY - minY) / step;
		if (!Number.isFinite(count) || count > 800) return lines;
		for (let x = startX; x <= maxX; x += step) {
			const major = Math.abs(x - Math.round(x)) < 1e-9;
			lines.push({ x1: x, y1: minY, x2: x, y2: maxY, major });
		}
		for (let y = startY; y <= maxY; y += step) {
			const major = Math.abs(y - Math.round(y)) < 1e-9;
			lines.push({ x1: minX, y1: y, x2: maxX, y2: y, major });
		}
		return lines;
	});

	const wallOutlines = $derived(
		graph.walls.flatMap((w) =>
			wallOutline(
				w,
				graph.vertices,
				graph.walls.filter((o) => o.id !== w.id && (o.a === w.a || o.a === w.b || o.b === w.a || o.b === w.b)),
			).map((polygon, i) => ({
				wall: w,
				key: `${w.id}#${i}`,
				points: polygon.map((pt) => `${pt.x},${pt.y}`).join(" "),
			})),
		),
	);

	/** Walls whose dimension labels are live: mid-drag neighbours and the rubber band. */
	const draggedWallIds = $derived.by(() => {
		// The measurements appear on the press, not on the first movement: a
		// held handle should already say what it is about to change.
		if (!drag) return new Set<string>();
		if (drag.kind === "vertex" && drag.vertexId) return new Set(wallsTouching(drag.vertexId));
		if (drag.kind === "face" && drag.origin) {
			// The room is detached before it moves, so nothing stretches: label
			// its own walls instead.
			const inside = drag.origin;
			return new Set(
				graph.walls.filter((w) => inside.has(w.a) && inside.has(w.b)).map((w) => w.id),
			);
		}
		if (drag.kind === "wall" && drag.wallId) {
			const w = graph.walls.find((x) => x.id === drag!.wallId);
			if (!w) return new Set<string>();
			const ids = new Set<string>([w.id]);
			for (const o of graph.walls) {
				if (o.a === w.a || o.a === w.b || o.b === w.a || o.b === w.b) ids.add(o.id);
			}
			return ids;
		}
		return new Set<string>();
	});

	function wallMidpoint(w: PlanWall): Point {
		const a = vertexById.get(w.a);
		const b = vertexById.get(w.b);
		if (!a || !b) return { x: 0, y: 0 };
		return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
	}

	function faceCenter(face: Face): Point {
		const b = polygonBounds(face.polygon);
		return { x: b.minX + b.width / 2, y: b.minY + b.height / 2 };
	}

	const activeSnap = $derived(rubber?.snap ?? (drag?.moved ? (drag.snap ?? null) : null));

	const guides = $derived(
		snapGuides(activeSnap, graph, rubber?.end ?? drag?.snap?.point ?? null),
	);


	/** Everything the measure tool is showing: settled measurements and the live one. */
	const shownMeasures = $derived(measuring ? [...measures, measuring] : measures);

	const stampRect = $derived.by(() => {
		const box = stamp ?? draftRoom;
		if (!box) return null;
		const x = Math.min(box.a.x, box.b.x);
		const y = Math.min(box.a.y, box.b.y);
		const w = Math.abs(box.b.x - box.a.x);
		const h = Math.abs(box.b.y - box.a.y);
		return { x, y, w, h };
	});

	const marqueeRect = $derived.by(() => {
		if (!marquee?.moved) return null;
		return {
			x: Math.min(marquee.a.x, marquee.b.x),
			y: Math.min(marquee.a.y, marquee.b.y),
			w: Math.abs(marquee.b.x - marquee.a.x),
			h: Math.abs(marquee.b.y - marquee.a.y),
		};
	});

	const rubberLength = $derived(
		draw && rubber ? Math.hypot(rubber.end.x - draw.anchor.x, rubber.end.y - draw.anchor.y) : 0,
	);

	const planLabels = $derived(
		buildPlanLabels({
			faces,
			faceNames: faces.map((f) => faceLabels.get(faceKey(f)) ?? null),
			live,
			draft: draftLabel,
			graph,
			measuredWallIds: draggedWallIds,
			rubber:
				draw && rubber ? { from: draw.anchor, to: rubber.end, length: rubberLength } : null,
			stamp: stampRect,
			measures: shownMeasures,
			// Resizing is the one gesture where the size is the point, so the
			// piece carries its dimensions while its handles are out.
			furniture: furnitureMode === "scale" ? selectedFurniture : null,
		}),
	);
</script>

<svelte:window onpointerup={handleWindowPointerUp} />

<div
	class="relative h-full w-full overflow-hidden"
	bind:clientWidth={width}
	bind:clientHeight={height}
>
	<svg
		bind:this={svgEl}
		class="h-full w-full touch-none select-none bg-background {live || tool === 'select'
			? hover
				? 'cursor-pointer'
				: 'cursor-default'
			: 'cursor-crosshair'}"
		role="application"
		aria-label="Floor plan editor"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerCancel}
		onpointerleave={handlePointerLeave}
		ondblclick={handleDblClick}
		oncontextmenu={handleContextMenu}
		onwheel={handleWheel}
	>
		<g transform="translate({transform.x} {transform.y}) scale({transform.k})">
			<g transform="scale({PX_PER_M})">
				<g class="transition-opacity duration-200" opacity={live ? 0 : 1}>
					{#each live ? [] : gridLines as l (`${l.x1},${l.y1},${l.x2},${l.y2}`)}
						<line
							x1={l.x1}
							y1={l.y1}
							x2={l.x2}
							y2={l.y2}
							stroke="var(--border)"
							stroke-opacity={l.major ? 0.6 : 0.25}
							vector-effect="non-scaling-stroke"
						/>
					{/each}
				</g>

				<g>
					{#each faces as face, i (face.vertexIds.join("-"))}
						{@const highlighted =
							!live && highlightFaceKey !== null && highlightFaceKey === faceKey(face)}
						{@const outlined = !live && (selection.faceIndex === i || highlighted)}
						{@const unlocked = !live && unlockedKeys.has(faceKey(face))}
						<polygon
							data-plan-hit={unlocked ? "face" : undefined}
							points={face.polygon.map((pt) => `${pt.x},${pt.y}`).join(" ")}
							fill={live ? "color-mix(in srgb, var(--card) 65%, var(--background))" : "var(--card)"}
							stroke={outlined || unlocked ? "var(--primary)" : "none"}
							stroke-width={outlined || unlocked ? 1.5 : 0}
							stroke-dasharray={unlocked && !outlined ? "6 4" : undefined}
							vector-effect="non-scaling-stroke"
							class="transition-opacity duration-200"
							fill-opacity={outlined ? 1 : 0.8}
						/>
					{/each}
				</g>

				{#if live}
					<g class="pointer-events-none">
						<GlowLayer groups={glowGroups} outside={outsideGlows} {lightmap} />
					</g>
				{/if}

				<g>
					{#each furniture as fp (fp.id)}
						<FurniturePiece piece={fp} {live} selected={!live && selectedFurnitureId === fp.id} />
					{/each}
					{#if draftFurniture}
						<FurniturePiece piece={draftFurniture} draft />
					{/if}
				</g>

				{#if selectedFurniture}
					{@const piece = selectedFurniture}
					<g class="pointer-events-none">
						{#if furnitureMode === "move"}
							<g transform="translate({piece.x} {piece.y})">
								<line x1={-handleR * 1.6} y1="0" x2={handleR * 1.6} y2="0" stroke="var(--primary)" stroke-width="2" vector-effect="non-scaling-stroke" />
								<line x1="0" y1={-handleR * 1.6} x2="0" y2={handleR * 1.6} stroke="var(--primary)" stroke-width="2" vector-effect="non-scaling-stroke" />
							</g>
						{:else if furnitureMode === "rotate" && rotateGizmo}
							<circle
								cx={piece.x}
								cy={piece.y}
								r={rotateGizmo.radius}
								fill="none"
								stroke="var(--primary)"
								stroke-opacity="0.5"
								stroke-width="1.5"
								vector-effect="non-scaling-stroke"
							/>
							<circle cx={rotateGizmo.dot.x} cy={rotateGizmo.dot.y} r={handleR} fill="var(--primary)" />
						{:else if furnitureMode === "scale"}
							<polygon
								points={furnitureCorners(piece).map((c) => `${c.x},${c.y}`).join(" ")}
								fill="none"
								stroke="var(--primary)"
								stroke-opacity="0.6"
								stroke-width="1.5"
								stroke-dasharray="4 3"
								vector-effect="non-scaling-stroke"
							/>
							{#each furnitureHandles as h (h.handle)}
								<rect
									x={h.point.x - handleR}
									y={h.point.y - handleR}
									width={handleR * 2}
									height={handleR * 2}
									fill="var(--primary)"
								/>
							{/each}
						{/if}
					</g>
				{/if}


				<g>
					{#each wallOutlines as { wall, key, points } (key)}
						<polygon
							data-plan-hit="wall"
							{points}
							fill={selectedWallSet.has(wall.id) ? "var(--primary)" : "var(--foreground)"}
							fill-opacity={selectedWallSet.has(wall.id) ? 0.9 : hover?.kind === "wall" && hover.id === wall.id ? 0.85 : 0.7}
							class="transition-[fill-opacity] duration-200"
						/>
					{/each}
				</g>

				<g>
					{#each strokedOpenings as { opening, span } (opening.id)}
						{@const active =
							selectedOpeningSet.has(opening.id) ||
							(hover?.kind === "opening" && hover.id === opening.id)}
						<polyline
							points={span.map((pt) => `${pt.x},${pt.y}`).join(" ")}
							fill="none"
							stroke={active ? "var(--primary)" : "var(--foreground)"}
							stroke-opacity={active ? 1 : 0.7}
							stroke-width={opening.kind === "door" ? 3.5 : 2}
							vector-effect="non-scaling-stroke"
							class="transition-[stroke-opacity] duration-200"
						/>
					{/each}
				</g>

				<g>
					{#each openingViews.filter((v) => selectedOpeningSet.has(v.opening.id)) as { opening, span } (opening.id)}
						{#each [span[0], span[span.length - 1]] as end, i (i)}
							<circle
								cx={end.x}
								cy={end.y}
								r={5 / pxPerM}
								fill="var(--primary)"
								stroke="var(--primary)"
								stroke-width="1.5"
								vector-effect="non-scaling-stroke"
							/>
						{/each}
					{/each}
				</g>

				{#if bendHandle}
					<circle
						cx={bendHandle.point.x}
						cy={bendHandle.point.y}
						r={5 / pxPerM}
						fill="var(--primary)"
						stroke="var(--primary)"
						stroke-width="1.5"
						vector-effect="non-scaling-stroke"
					/>
				{/if}

				<g>
					{#each live ? [] : graph.vertices as v (v.id)}
						<circle
							data-plan-hit="vertex"
							cx={v.x}
							cy={v.y}
							r={(selectedVertexSet.has(v.id) || (hover?.kind === "vertex" && hover.id === v.id)
								? 5
								: 3.5) / pxPerM}
							fill={selectedVertexSet.has(v.id) ? "var(--primary)" : "var(--background)"}
							stroke={selectedVertexSet.has(v.id) || (hover?.kind === "vertex" && hover.id === v.id)
								? "var(--primary)"
								: "var(--foreground)"}
							stroke-width="1.5"
							vector-effect="non-scaling-stroke"
						/>
					{/each}
				</g>

				<PlanSnapGuides
					segment={guides.segment}
					ray={guides.ray}
					vertex={guides.vertex}
					rubber={draw && rubber ? { from: draw.anchor, to: rubber.end } : null}
					{pxPerM}
				/>

				{#if live && brush && brushCursor}
					<circle
						class="pointer-events-none"
						cx={brushCursor.x}
						cy={brushCursor.y}
						r={brushRadiusWorld}
						fill="none"
						stroke={brush.css}
						stroke-width="2"
						vector-effect="non-scaling-stroke"
						style="transition: opacity 200ms ease, stroke-opacity 200ms ease"
						stroke-opacity={brushPainting ? 0.8 : 0.5}
						opacity={brushRingVisible ? 1 : 0}
					/>
				{/if}

				{#if marqueeRect}
					<rect
						x={marqueeRect.x}
						y={marqueeRect.y}
						width={marqueeRect.w}
						height={marqueeRect.h}
						fill="var(--primary)"
						fill-opacity="0.08"
						stroke="var(--primary)"
						stroke-width="2"
						stroke-dasharray="6 4"
						vector-effect="non-scaling-stroke"
					/>
				{/if}

				{#each shownMeasures as m (m.id)}
					{#if m.kind === "line"}
						<line
							x1={m.a.x}
							y1={m.a.y}
							x2={m.b.x}
							y2={m.b.y}
							stroke="var(--primary)"
							stroke-width="2"
							stroke-dasharray="6 4"
							vector-effect="non-scaling-stroke"
						/>
					{:else}
						<rect
							x={Math.min(m.a.x, m.b.x)}
							y={Math.min(m.a.y, m.b.y)}
							width={Math.abs(m.b.x - m.a.x)}
							height={Math.abs(m.b.y - m.a.y)}
							fill="var(--primary)"
							fill-opacity="0.08"
							stroke="var(--primary)"
							stroke-width="2"
							stroke-dasharray="6 4"
							vector-effect="non-scaling-stroke"
						/>
					{/if}
				{/each}

				{#if stampRect}
					<rect
						x={stampRect.x}
						y={stampRect.y}
						width={stampRect.w}
						height={stampRect.h}
						fill="var(--primary)"
						fill-opacity="0.08"
						stroke="var(--primary)"
						stroke-width="2"
						stroke-dasharray="6 4"
						vector-effect="non-scaling-stroke"
					/>
				{/if}

				{#if live}
					<g class="pointer-events-none">
						{#each occupancyMarkers as om (om.id)}
							<g transform="translate({om.x} {om.y}) scale({1 / pxPerM})">
								<circle
									class="map-occupancy-ring transition-opacity duration-200"
									opacity={om.occupied ? 1 : 0}
									fill="none"
									stroke-width="2"
								/>
								<circle
									class="map-occupancy-ring transition-opacity duration-200"
									opacity={om.occupied ? 1 : 0}
									fill="none"
									stroke-width="2"
									style="animation-delay: 900ms"
								/>
								<circle
									cx="-10"
									cy="-10"
									r="3"
									fill="var(--primary)"
									class="transition-opacity duration-200"
									opacity={om.occupied ? 1 : 0.45}
								/>
							</g>
						{/each}
					</g>
				{/if}

				<g>
					{#each placements as pl (placementViewKey(pl))}
						{@const key = placementViewKey(pl)}
						<!-- A marker leaving the map fades over the same 300 ms as the
						     light it cast, so both go out together. -->
						<g out:fade={{ duration: 300 }}>
						{#if pl.kind === "device"}
							<DeviceMarker
								device={pl.device}
								x={pl.x}
								y={pl.y}
								{pxPerM}
								{live}
								inert={inertKeys.has(key)}
								selected={!live && selectedKeySet.has(key)}
								onpreviewstate={(partial) => onmarkerpreview?.([pl.device.id], partial)}
							/>
						{:else}
							<GroupMarker
								group={pl.group}
								devices={pl.devices}
								x={pl.x}
								y={pl.y}
								{pxPerM}
								{live}
								inert={inertKeys.has(key)}
								selected={!live && selectedKeySet.has(key)}
								onpreviewstate={(partial) =>
									onmarkerpreview?.(
										pl.devices.map((d) => d.id),
										partial,
									)}
							/>
						{/if}
						</g>
					{/each}
					{#if draftPlacement}
						{#if draftPlacement.kind === "device"}
							<DeviceMarker
								device={draftPlacement.device}
								x={draftPlacement.x}
								y={draftPlacement.y}
								{pxPerM}
								draft
							/>
						{:else}
							<GroupMarker
								group={draftPlacement.group}
								devices={draftPlacement.devices}
								x={draftPlacement.x}
								y={draftPlacement.y}
								{pxPerM}
								draft
							/>
						{/if}
					{/if}
				</g>

				<PlanLabels labels={planLabels} {pxPerM} />
			</g>
		</g>
	</svg>
</div>
