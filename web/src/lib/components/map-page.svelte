<script lang="ts">
	import { onDestroy, onMount, tick } from "svelte";
	import { fly } from "svelte/transition";
	import { formatRelative } from "$lib/time-format";
	import { me } from "$lib/stores/me.svelte";
	import { nowStore } from "$lib/stores/now.svelte";
	import { getContextClient, queryStore } from "@urql/svelte";
	import { page } from "$app/state";
	import { goto, pushState } from "$app/navigation";
	import {
		Copy,
		DoorOpen,
		ExternalLink,
		Ban,
		Check,
		Frame,
		Link as LinkIcon,
		Lock,
		LockOpen,
		Map as MapIcon,
		MousePointer2,
		Palette,
		Pencil,
		PenLine,
		Square,
		Trash2,
		Unlink,
		X,
	} from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import NumberInput from "$lib/components/number-input.svelte";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import FloorplanEditor, {
		emptySelection,
		placementViewKey,
		placementViewRef,
		type EditorSelection,
		type EditorTool,
		type FloorplanEditorApi,
		type MeasureKind,
		type PlacementView,
	} from "$lib/components/floorplan/floorplan-editor.svelte";
	import RoomPanel, {
		type DeviceRow,
		type GroupRow,
		type PanelGroup,
	} from "$lib/components/floorplan/room-panel.svelte";
	import DetachedRoomsCard from "$lib/components/floorplan/detached-rooms-card.svelte";
	import RoomDrawer from "$lib/components/room-drawer.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import PlanPointMenu from "$lib/components/floorplan/plan-point-menu.svelte";
	import type {
		GlowGroup,
		GlowView,
		LightmapFrame,
	} from "$lib/components/floorplan/glow-layer.svelte";
	import MapToolbar, {
		openingKinds,
		type FurnitureMode,
	} from "$lib/components/floorplan/map-toolbar.svelte";
	import MapBrushPalette, {
		type ArmedBrush,
	} from "$lib/components/floorplan/map-brush-palette.svelte";
	import {
		DEVICE_ACTION_TX_SUB,
		DEVICE_TX_SUB,
		NETWORK_TOPOLOGIES_QUERY,
		SET_DISPLAY_COLOR,
		TOPOLOGY_UPDATED_SUB,
	} from "$lib/graphql/map";
	import type { Device, DeviceState } from "$lib/gql/graphql";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { scenesStore } from "$lib/stores/scenes.svelte";
	import { floorplanStore } from "$lib/stores/floorplan.svelte";
	import {
		defaultFurniture,
		nearestPointOutside,
		placementsInsideFurniture,
		furnitureContainsPoint,
		furnitureGroups,
	} from "$lib/floorplan/furniture";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import { HistoryStack } from "$lib/stores/history.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import {
		deviceHasCapability,
		deviceStore,
		isLightControlDevice,
		needsDisplayColor,
	} from "$lib/stores/devices";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
	import { isEditableTarget } from "$lib/utils/keyboard";
	import { resolveTargetDevices } from "$lib/target-resolve";
	import { brightnessToTintStrength, miredToRgb, temperatureToRgb } from "$lib/device-tint";
	import type { RGB } from "$lib/device-tint";
	import {
		availableMapViews,
		placementVisibleInView,
		resolveMapView,
		TEMP_SOURCE_INTENSITY,
		type MapViewContext,
		type MapViewId,
	} from "$lib/map-views";
	import {
		buildMeshLinkViews,
		placedTopologyNodeCount,
		topologyNodePositions,
		type ConnectivityNodePosition,
		type ConnectivityPlacementInput,
	} from "$lib/floorplan/connectivity";
	import { markerGlow } from "$lib/floorplan/glow";
	import {
		combineLight,
		lampField,
		rasterisePlan,
		type LightmapGrid,
		type LightSource,
	} from "$lib/floorplan/lightmap";
	import { carryPlacements } from "$lib/floorplan/placement-carry";
	import {
		applyPlacement,
		needsConfirmation,
		placementConflicts,
		type Placement,
		type PlacementConflict,
		type PlacementRef,
	} from "$lib/floorplan/placement-conflicts";
	import { BRUSH_RADIUS_PX, createStrokeAccumulator } from "$lib/floorplan/brush";
	import { profile } from "$lib/stores/profile.svelte";
	import { commitGroupColor, commitGroupTemp, commitGroupToggle } from "$lib/group-commands";
	import { dropPointerFocus } from "$lib/pointer-focus";
	import { popoverDismissedRecently } from "$lib/popover-guard";
	import { flushThrottle, throttle, type Throttle } from "$lib/throttle";
	import {
		DEFAULT_GRID_SIZE,
		DEFAULT_WALL_THICKNESS,
		MAX_WALL_THICKNESS,
		MIN_WALL_THICKNESS,
		detectFaces,
		faceBounds,
		faceContainingPoint,
		facePairKeys,
		wallPairKey,
		formatArea,
		formatMeters,
		nearestPointInFace,
		addRoomClipped,
		normalizeGraph,
		snapRectOffset,
		removeOpenings,
		setOpeningKind,
		setWallThickness,
		wallLength,
		pointInPolygon,
		type Face,
		type OpeningKind,
		type PlanGraph,
		type PlanRoomMeta,
		faceKey,
		type PlanVertex,
		type PlanWall,
		type Point,
	} from "$lib/floorplan";
	import {
		buildUpdateFloorplanInput,
		floorplanToGraph,
		newPlanId,
		newVertexId,
		newWallId,
		placementKey,
		reconcileRooms,
		type FloorplanPlacementData,
		newFurnitureId,
		type FloorplanFurnitureData,
	} from "$lib/floorplan-editable";
	import { deviceDisplayName, sentenceCase } from "$lib/utils";
	import { integrationMeta } from "$lib/integrations";

	interface Props {
		/**
		 * Whether this is the page the user is on. The component outlives
		 * navigation — the layout keeps it mounted after the first visit — so
		 * global claims (keyboard shortcuts, the navigation guard, background
		 * recomputes) gate on this.
		 */
		visible: boolean;
	}

	let { visible }: Props = $props();



	const client = getContextClient();
	const errors = new BannerError();

	const isMobile = new IsMobile();

	let loading = $state(true);
	let saving = $state(false);
	let editMode = $state(true);
	let planId = $state("");
	let planName = $state("Home");
	let graph = $state<PlanGraph>({ vertices: [], walls: [] });
	let rooms = $state<PlanRoomMeta[]>([]);
	let placements = $state<FloorplanPlacementData[]>([]);
	let furniture = $state<FloorplanFurnitureData[]>([]);
	let draftFurniture = $state<FloorplanFurnitureData | null>(null);
	let measureKind = $state<MeasureKind>("line");
	let keepMeasures = $state(false);
	let furnitureDrawerOpen = $state(false);
	let furnitureMode = $state<FurnitureMode>("move");
	let furnitureMenu = $state<{ x: number; y: number; piece: FloorplanFurnitureData } | null>(null);
	let furnitureMenuOpen = $state(false);
	const hiveRooms = $derived(roomsStore.items);
	let tool = $state<EditorTool>("select");
	let openingKind = $state<OpeningKind>("door");
	// Latched stand-ins for Alt and Shift, which a touch screen cannot hold down.
	let snapOff = $state(false);
	let additive = $state(false);
	let selection = $state<EditorSelection>({ ...emptySelection });
	let editorApi: FloorplanEditorApi | null = $state(null);
	let copyBuffer = $state<{ vertices: PlanVertex[]; walls: PlanWall[] } | null>(null);
	/** A copied piece, with the size and angle it was copied at. */
	let furnitureBuffer = $state<FloorplanFurnitureData | null>(null);
	let drawerOpen = $state(false);
	let viewportVersion = $state(0);
	let highlightFaceKey = $state<string | null>(null);

	interface ExternalDrag {
		kind: "hive-room" | "detached" | "placement" | "furniture";
		hiveRoomId?: string;
		roomMetaId?: string;
		placement?: PlacementView;
		furnitureKind?: string;
		text?: string;
	}
	let externalDrag = $state<ExternalDrag | null>(null);
	let draftLabel = $state<{ point: Point; text: string } | null>(null);
	let draftRoom = $state<{ a: Point; b: Point } | null>(null);
	let draftPlacement = $state<PlacementView | null>(null);

	let brushOpen = $state(false);
	let brushRadiusPx = $state(profile.get("map.brushRadius", undefined) ?? BRUSH_RADIUS_PX);

	function setBrushRadius(px: number) {
		brushRadiusPx = px;
		profile.set("map.brushRadius", px);
	}

	let mapViewPref = $state<MapViewId>(profile.get("map.view", undefined) ?? "light");

	function setMapView(view: MapViewId) {
		mapViewPref = view;
		profile.set("map.view", view);
		if (view !== "light") {
			brushOpen = false;
			disarmBrush();
		}
	}

	/** One stored mesh snapshot per provider, as the map's query returns it. */
	interface TopologyView {
		provider: string;
		scannedAt: string;
		nodes: { id: string; deviceId?: string | null; role: string }[];
		links: { source: string; target: string; kind: string; quality: number; stale: boolean }[];
	}

	let topologies = $state<TopologyView[]>([]);
	/** Page-local: whether the connectivity view also draws neighbour links. */
	let showNeighbours = $state(false);
	/** Providers the user has switched off; every mesh draws until hidden. */
	let hiddenMeshSources = $state<Set<string>>(new Set());

	function toggleMeshSource(provider: string) {
		const next = new Set(hiddenMeshSources);
		if (!next.delete(provider)) next.add(provider);
		hiddenMeshSources = next;
	}

	const meshSources = $derived(
		topologies.map((t) => ({
			provider: t.provider,
			label: sentenceCase(t.provider),
			icon: integrationMeta(t.provider).icon,
			shown: !hiddenMeshSources.has(t.provider),
		})),
	);

	async function loadTopologies() {
		const result = await client
			.query(NETWORK_TOPOLOGIES_QUERY, {}, { requestPolicy: "network-only" })
			.toPromise();
		topologies = result.data?.networkTopologies ?? [];
	}

	let armedBrush = $state<ArmedBrush | null>(null);
	let discardOpen = $state(false);
	// The last state the server accepted. Held outside the history stack: its
	// cursor is not a stable index (pushes truncate the redo branch and the
	// stack is capped), so only a snapshot can be trusted to restore.
	let savedSnapshot: PlanSnapshot | null = null;
	const strokeAcc = createStrokeAccumulator();
	const brushColorThrottle: Throttle = { lastSent: 0, trailing: null };
	const brushTempThrottle: Throttle = { lastSent: 0, trailing: null };
	const brushPowerThrottle: Throttle = { lastSent: 0, trailing: null };

	const brushCss = $derived.by(() => {
		if (!armedBrush) return null;
		if (armedBrush.kind === "color") {
			const c = armedBrush.color;
			return `rgb(${c.r}, ${c.g}, ${c.b})`;
		}
		// On/off carries no hue: the ring reads neutral so it can't be mistaken
		// for a colour about to be painted.
		if (armedBrush.kind === "power") return "var(--muted-foreground)";
		const c = miredToRgb(armedBrush.mireds);
		return `rgb(${c.r}, ${c.g}, ${c.b})`;
	});
	const armedCapability = $derived.by(() => {
		if (!armedBrush) return null;
		if (armedBrush.kind === "color") return "color";
		if (armedBrush.kind === "temp") return "color_temp";
		return "power";
	});
	function disarmBrush() {
		armedBrush = null;
		flushThrottle(brushColorThrottle);
		flushThrottle(brushTempThrottle);
		flushThrottle(brushPowerThrottle);
		strokeAcc.reset();
	}

	function commitBrushPending() {
		const armed = armedBrush;
		if (!armed) return;
		const devices = strokeAcc
			.drainPending()
			.map((id) => liveDeviceById.get(id))
			.filter((d): d is Device => d != null);
		if (devices.length === 0) return;
		if (armed.kind === "color") commitGroupColor(client, devices, armed.color);
		else if (armed.kind === "temp") commitGroupTemp(client, devices, armed.mireds);
		else commitGroupToggle(client, devices, armed.on);
	}

	// The stroke reports placement keys; expanding them here means a group and a
	// member of it under the same brush still command each device once.
	function handleBrushStroke(placementKeys: string[]) {
		if (!armedBrush) return;
		strokeAcc.add(placementKeys.flatMap((k) => (viewDevices.get(k) ?? []).map((d) => d.id)));
		if (strokeAcc.pendingCount === 0) return;
		const t =
			armedBrush.kind === "color"
				? brushColorThrottle
				: armedBrush.kind === "temp"
					? brushTempThrottle
					: brushPowerThrottle;
		throttle(t, commitBrushPending);
	}

	function handleBrushEnd() {
		flushThrottle(brushColorThrottle);
		flushThrottle(brushTempThrottle);
		flushThrottle(brushPowerThrottle);
		commitBrushPending();
		strokeAcc.reset();
	}

	// Rooms are locked against whole-room dragging until explicitly unlocked
	// from the context menu; the unlock is a transient editing aid, so a
	// reload comes back fully locked.
	let unlockedRoomIds = $state<Set<string>>(new Set());
	/**
	 * Rooms whose corners may be dragged one at a time. Locked by default, so a
	 * corner handle resizes the room instead of pulling it out of square.
	 */
	let freeCornerRoomIds = $state<Set<string>>(new Set());
	/** Plan room the link drawer was opened for, when it came from that room's menu. */
	let linkTargetRowId = $state<string | null>(null);
	/**
	 * The open face menu. `unlocked` and `cornersFree` are read once, when it
	 * opens: a menu item that rewrites its own label the moment it is clicked
	 * changes the menu's text while it is still fading out.
	 */
	let faceMenu = $state<{
		x: number;
		y: number;
		roomId: string;
		faceIndex: number;
		unlocked: boolean;
		cornersFree: boolean;
	} | null>(null);
	let faceMenuOpen = $state(false);
	let markerMenu = $state<{ x: number; y: number; placement: PlacementView } | null>(null);
	let markerMenuOpen = $state(false);
	let openingMenu = $state<{ x: number; y: number; openingId: string } | null>(null);
	let openingMenuOpen = $state(false);
	let colorPickDeviceId = $state<string | null>(null);
	let colorPickAt = $state<{ x: number; y: number }>({ x: 0, y: 0 });
	let colorPickBoxEl = $state<HTMLDivElement | null>(null);
	let renameRoomId = $state<string | null>(null);
	let renameAt = $state<{ x: number; y: number }>({ x: 0, y: 0 });
	let renameInputEl = $state<HTMLInputElement | null>(null);
	let renameBoxEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (renameRoomId && renameInputEl) {
			renameInputEl.focus();
			renameInputEl.select();
		}
	});

	// Dismissed by a click outside rather than by losing focus. The menu that
	// opens this field is still closing when it mounts, and hands focus back to
	// the document as it goes — so the field is blurred a frame after it focuses
	// itself, and a blur is no evidence the user is done with it.
	$effect(() => {
		const box = renameRoomId ? renameBoxEl : null;
		if (!box) return;
		const dismiss = (e: PointerEvent) => {
			if (!box.contains(e.target as Node)) renameRoomId = null;
		};
		window.addEventListener("pointerdown", dismiss, true);
		return () => window.removeEventListener("pointerdown", dismiss, true);
	});

	$effect(() => {
		const box = colorPickDeviceId ? colorPickBoxEl : null;
		if (!box) return;
		const dismiss = (e: PointerEvent) => {
			if (box.contains(e.target as Node)) return;
			colorPickDeviceId = null;
			// One undo step per visit to the picker, however many samples the
			// wheel emitted on the way.
			if (changedDisplay) takeSnapshot();
			changedDisplay = false;
		};
		window.addEventListener("pointerdown", dismiss, true);
		return () => window.removeEventListener("pointerdown", dismiss, true);
	});

	const hiveGroups = $derived(groupsStore.items);
	const scenes = $derived(scenesStore.items);

	let previewByDevice = $state<Record<string, Partial<DeviceState>>>({});
	let interactingTimer: ReturnType<typeof setTimeout> | null = null;
	const INTERACT_COOLDOWN_MS = 1500;

	function noteInteract() {
		if (interactingTimer) clearTimeout(interactingTimer);
		interactingTimer = setTimeout(() => {
			interactingTimer = null;
			previewByDevice = {};
		}, INTERACT_COOLDOWN_MS);
	}

	const faces = $derived(detectFaces(graph));
	/**
	 * Display colours edited but not saved. They ride the plan's snapshot, so
	 * they undo, redo and discard with everything else the editor holds, and
	 * reach the server only when the plan is saved.
	 */
	let deviceDisplay = $state<Record<string, DeviceDisplay>>({});
	const displayed = $derived(
		Object.values($deviceStore).map((d) => {
			const edit = deviceDisplay[d.id];
			return edit
				? { ...d, displayColor: edit.color, displayBrightness: edit.brightness }
				: d;
		}),
	);
	const allDevices = $derived(displayed);
	const deviceById = $derived(new Map(allDevices.map((d) => [d.id, d])));

	/** Live-surface devices: disabled ones gone, picker previews merged in. */
	const liveDevices = $derived(
		allDevices
			.filter((d) => !d.disabled)
			.map((d) => {
				const preview = previewByDevice[d.id];
				return preview ? { ...d, state: { ...d.state, ...preview } } : d;
			}),
	);
	const liveDeviceById = $derived(new Map(liveDevices.map((d) => [d.id, d])));
	const hiveRoomById = $derived(
		new Map(hiveRooms.map((r) => [r.id, { name: r.name ?? r.id, icon: r.icon }])),
	);
	const roomByFace = $derived(new Map(rooms.map((r) => [faceKey(r), r])));
	const faceKeySet = $derived(new Set(faces.map((f) => faceKey(f))));
	const linkedHiveRoomIds = $derived(new Set(rooms.filter((r) => r.roomId).map((r) => r.roomId!)));
	const detachedRooms = $derived(
		rooms.filter((r) => (r.name || r.roomId) && !faceKeySet.has(faceKey(r))),
	);
	const unlockedFaceKeys = $derived(
		new Set(rooms.filter((r) => unlockedRoomIds.has(r.id)).map((r) => faceKey(r))),
	);
	const freeCornerFaceKeys = $derived(
		new Set(rooms.filter((r) => freeCornerRoomIds.has(r.id)).map((r) => faceKey(r))),
	);
	const menuRoom = $derived(
		faceMenu ? (rooms.find((r) => r.id === faceMenu!.roomId) ?? null) : null,
	);
	/** The menu room's bounding size, the plain fact a menu can end with. */
	const menuRoomSize = $derived.by(() => {
		const face = faceMenu ? faces[faceMenu.faceIndex] : null;
		if (!face) return null;
		const xs = face.polygon.map((p) => p.x);
		const ys = face.polygon.map((p) => p.y);
		return {
			width: Math.max(...xs) - Math.min(...xs),
			height: Math.max(...ys) - Math.min(...ys),
		};
	});

	const renameRoom = $derived(
		renameRoomId ? (rooms.find((r) => r.id === renameRoomId) ?? null) : null,
	);
	/** Every placement's target resolved to its devices, keyed by placement key. */
	const placementDevices = $derived.by(() => {
		const pool = editMode ? allDevices : liveDevices;
		const out = new Map<string, Device[]>();
		for (const p of placements) {
			out.set(
				placementKey(p),
				resolveTargetDevices({ type: p.memberType, id: p.memberId }, pool, hiveGroups, hiveRooms, {
					includeDisabled: true,
				}),
			);
		}
		return out;
	});
	/** Device ids carrying a marker of their own — a group's glow skips them. */
	const placedDeviceIds = $derived(
		new Set(placements.filter((p) => p.memberType === "device").map((p) => p.memberId)),
	);
	const placementViews = $derived(
		placements.flatMap((p): PlacementView[] => {
			if (p.memberType === "device") {
				const device = (editMode ? deviceById : liveDeviceById).get(p.memberId);
				return device ? [{ kind: "device", device, x: p.x, y: p.y }] : [];
			}
			const group = hiveGroups.find((g) => g.id === p.memberId);
			if (!group) return [];
			return [
				{
					kind: "group",
					group: { id: group.id, name: group.name, icon: group.icon },
					devices: placementDevices.get(placementKey(p)) ?? [],
					x: p.x,
					y: p.y,
				},
			];
		}),
	);
	const viewDevices = $derived(
		new Map(placementViews.map((pl) => [placementViewKey(pl), placementDeviceList(pl)])),
	);

	function placementDeviceList(pl: PlacementView): Device[] {
		return pl.kind === "device" ? [pl.device] : pl.devices;
	}

	const brushInertKeys = $derived.by(() => {
		if (!armedCapability) return new Set<string>();
		// on/off reaches anything switchable, which is the same set
		// `commitGroupToggle` commands; the colour brushes need a capability.
		const paints = (device: Device) =>
			armedCapability === "power"
				? isLightControlDevice(device)
				: deviceHasCapability(device, armedCapability);
		return new Set(
			placementViews
				.filter((pl) => !placementDeviceList(pl).some(paints))
				.map((pl) => placementViewKey(pl)),
		);
	});
	const placedDevices = $derived(placementViews.flatMap(placementDeviceList));
	const placedHasColor = $derived(placedDevices.some((d) => deviceHasCapability(d, "color")));
	const placedHasSwitchable = $derived(placedDevices.some(isLightControlDevice));
	const placedHasColorTemp = $derived(
		placedDevices.some((d) => deviceHasCapability(d, "color_temp")),
	);
	/** With nothing on the map to paint, the brush has no reason to be offered. */
	const canPaint = $derived(placedHasColor || placedHasColorTemp || placedHasSwitchable);

	const viewCtx = $derived<MapViewContext>({
		topologyProviders: new Set(topologies.map((t) => t.provider)),
	});
	/** Offered views come from the unfiltered pool, or there is no way back. */
	const availableViews = $derived(availableMapViews(placedDevices, viewCtx));
	/**
	 * The rendered view: the stored preference while its devices exist, light
	 * otherwise. The fallback is derived, never written back, so a sensor
	 * going offline does not erase the choice.
	 */
	const mapView = $derived(resolveMapView(mapViewPref, availableViews));
	/** Live mode shows only the view's devices; edit mode manages them all. */
	const visiblePlacements = $derived(
		editMode
			? placementViews
			: placementViews.filter((pl) =>
					placementVisibleInView(mapView, placementDeviceList(pl), viewCtx),
				),
	);

	/** Devices the stored snapshots know, keyed the way positions are. */
	const topologyDeviceIds = $derived(
		new Set(topologies.flatMap((t) => t.nodes.map((n) => n.deviceId ?? n.id))),
	);
	const connectivityInputs = $derived<ConnectivityPlacementInput[]>(
		visiblePlacements.map((pl) =>
			pl.kind === "device"
				? { kind: "device", x: pl.x, y: pl.y, deviceId: pl.device.id }
				: { kind: "group", x: pl.x, y: pl.y, memberIds: pl.devices.map((d) => d.id) },
		),
	);
	const meshPositions = $derived(
		!editMode && mapView === "connectivity"
			? topologyNodePositions(connectivityInputs, topologyDeviceIds)
			: new Map<string, ConnectivityNodePosition>(),
	);
	const meshLinks = $derived(
		topologies
			.filter((t) => !hiddenMeshSources.has(t.provider))
			.flatMap((t) => buildMeshLinkViews(t, meshPositions, { showNeighbours })),
	);
	/**
	 * Per-device TX pulse counters. A device's counter bumps when it reports,
	 * changing its ring's key so the one-shot animation remounts and replays.
	 * Bounded by device count; never cleared, since a stale entry just sits
	 * with its finished, invisible ring.
	 */
	let pulseSeqs = $state<Map<string, number>>(new Map());
	const meshPulses = $derived(
		!editMode && mapView === "connectivity"
			? [...pulseSeqs].flatMap(([id, seq]) => {
					const pos = meshPositions.get(id);
					return pos ? [{ key: `${id}-${seq}`, x: pos.x, y: pos.y }] : [];
				})
			: [],
	);
	/** The connectivity caption: snapshot age and how much of the mesh is placed. */
	const meshCaption = $derived.by(() => {
		if (editMode || mapView !== "connectivity" || topologies.length === 0) return null;
		let placed = 0;
		let total = 0;
		let latest: Date | null = null;
		for (const t of topologies) {
			const counts = placedTopologyNodeCount(t, meshPositions);
			placed += counts.placed;
			total += counts.total;
			const at = new Date(t.scannedAt);
			if (!latest || at > latest) latest = at;
		}
		return { placed, total, scannedAt: latest! };
	});

	/** The plan's raster for lighting; rebuilt when the graph changes. */
	/**
	 * The plan's raster, held across an edit session rather than rebuilt on the
	 * way back. Editing renders no light and changes the plan on every drag
	 * frame, and a fresh raster would also void every lamp field cached against
	 * it — which is what made returning to Live drop frames while toggling a
	 * single lamp did not.
	 */
	let gridCache: {
		graph: PlanGraph;
		faces: Face[];
		furniture: FloorplanFurnitureData[];
		grid: LightmapGrid | null;
	} | null = null;

	const lightGrid = $derived.by(() => {
		if (editMode) return gridCache?.grid ?? null;
		if (
			gridCache &&
			gridCache.graph === graph &&
			gridCache.faces === faces &&
			gridCache.furniture === furniture
		) {
			return gridCache.grid;
		}
		const grid = rasterisePlan(
			$state.snapshot(graph) as PlanGraph,
			faces,
			$state.snapshot(furniture) as FloorplanFurnitureData[],
		);
		gridCache = { graph, faces, furniture, grid };
		return grid;
	});

	/**
	 * Per-lamp light fields, cached by grid and position: a lamp's footprint
	 * depends only on where it stands and what walls surround it, so a
	 * brightness or colour change re-combines cached fields instead of
	 * re-tracing them.
	 */
	const lampFieldCache = new Map<string, Float32Array>();
	let lampFieldGrid: LightmapGrid | null = null;
	function lampFieldFor(grid: LightmapGrid, x: number, y: number): Float32Array {
		if (lampFieldGrid !== grid) {
			lampFieldCache.clear();
			lampFieldGrid = grid;
		}
		const key = `${Math.round(x / grid.cellM)}:${Math.round(y / grid.cellM)}`;
		let field = lampFieldCache.get(key);
		if (!field) {
			field = lampField(grid, { x, y });
			lampFieldCache.set(key, field);
		}
		return field;
	}

	/**
	 * The glow a marker casts. Which devices count as lights is this page's
	 * business; how they add up is the glow module's.
	 */
	function glowForPlacement(pl: PlacementView): GlowView | null {
		const lights = (pl.kind === "device" ? [pl.device] : pl.devices)
			.filter((d) => d.available && isLightControlDevice(d))
			.map((d) => ({
				id: d.id,
				state: d.state,
				displayColor: d.displayColor,
				displayBrightness: d.displayBrightness,
			}));
		return markerGlow(
			{ key: placementViewKey(pl), x: pl.x, y: pl.y, lights, pooled: pl.kind === "group" },
			placedDeviceIds,
		);
	}

	/**
	 * A placement's temperature reading: the mean over its available members
	 * that report one. Group members carrying their own marker are skipped,
	 * like a group's glow skips them.
	 */
	function tempForPlacement(pl: PlacementView): number | null {
		const members =
			pl.kind === "device" ? [pl.device] : pl.devices.filter((d) => !placedDeviceIds.has(d.id));
		const readings = members
			.filter((d) => d.available && d.state?.temperature != null)
			.map((d) => d.state!.temperature!);
		if (readings.length === 0) return null;
		return readings.reduce((sum, t) => sum + t, 0) / readings.length;
	}

	/**
	 * Everything the light map draws, summed into one bitmap. The light view
	 * sums every in-room lamp; the temperature view swaps that for a heat
	 * field around each reporting sensor, through the same cached unit
	 * fields. Markers outside every room keep their glow circles in the
	 * light view — the grid has no cells for them — while an outside sensor
	 * contributes nothing, since a glow disc's white core would read as a lamp.
	 */
	const combined = $derived.by(() => {
		if (editMode) return null;
		// Connectivity draws markers and link lines, no light field at all.
		if (mapView === "connectivity") return null;
		const grid = lightGrid;
		if (!grid) return null;
		const sources: LightSource[] = [];
		const outside: GlowView[] = [];
		for (const pl of visiblePlacements) {
			let rgb: RGB;
			let intensity: number;
			let glow: GlowView | null = null;
			if (mapView === "light") {
				glow = glowForPlacement(pl);
				if (!glow) continue;
				rgb = glow.rgb;
				intensity = glow.opacity;
			} else {
				const temp = tempForPlacement(pl);
				if (temp == null) continue;
				rgb = temperatureToRgb(temp);
				intensity = TEMP_SOURCE_INTENSITY;
			}
			// A marker against a wall sits on the wall band, where no face
			// contains its point — it still belongs to the room it hugs, and its
			// light starts just inside so it shines one-sided like a lamp
			// standing against that wall.
			const face =
				faceContainingPoint(faces, { x: pl.x, y: pl.y }) ?? nearestFaceWithin(pl, 0.5);
			if (face) {
				const at = nearestPointInFace({ x: pl.x, y: pl.y }, face, grid.cellM);
				sources.push({ field: lampFieldFor(grid, at.x, at.y), rgb, intensity });
			} else if (glow) {
				outside.push(glow);
			}
		}
		return { light: combineLight(grid, sources), outside };
	});

	/** The face whose interior comes closest to `p`, if any is within `reach`. */
	function nearestFaceWithin(p: Point, reach: number): Face | null {
		let best: Face | null = null;
		let bestDist = reach;
		for (const face of faces) {
			const near = nearestPointInFace(p, face);
			const dist = Math.hypot(near.x - p.x, near.y - p.y);
			if (dist < bestDist) {
				bestDist = dist;
				best = face;
			}
		}
		return best;
	}

	const lightmapFrame = $derived.by((): LightmapFrame | null => {
		const grid = lightGrid;
		if (!grid || !combined) return null;
		return {
			rgba: combined.light.rgba,
			cols: grid.width,
			rows: grid.height,
			x: grid.originX,
			y: grid.originY,
			width: grid.width * grid.cellM,
			height: grid.height * grid.cellM,
		};
	});

	const glowData = $derived.by((): { groups: GlowGroup[]; outside: GlowView[] } => {
		if (editMode) return { groups: [], outside: [] };
		const groups: GlowGroup[] = faces.map((face, i) => ({
			key: `face-${i}`,
			polygon: face.polygon,
		}));
		return { groups, outside: combined?.outside ?? [] };
	});

	const faceLabels = $derived.by(() => {
		const out = new Map<string, string>();
		for (const face of faces) {
			const room = roomByFace.get(faceKey(face));
			if (!room) continue;
			const label = room.roomId ? hiveRoomById.get(room.roomId)?.name : room.name;
			if (label) out.set(faceKey(face), label);
		}
		return out;
	});

	interface PlanSnapshot {
		graph: PlanGraph;
		rooms: PlanRoomMeta[];
		placements: FloorplanPlacementData[];
		furniture: FloorplanFurnitureData[];
		deviceDisplay: Record<string, DeviceDisplay>;
	}

	/** A device's map appearance while it has none of its own to report. */
	interface DeviceDisplay {
		color: string | null;
		brightness: number | null;
	}

	const history = new HistoryStack<PlanSnapshot>();
	// Cursor of the snapshot that matches what's persisted in the DB. Set on
	// initial load and after each successful save, so undo/redo back to the
	// saved baseline cleanly turns Save off.
	let savedCursor = $state(0);
	const isDirty = $derived(history.cursor !== savedCursor);

	function cloneSnapshot(): PlanSnapshot {
		return {
			graph: $state.snapshot(graph),
			rooms: $state.snapshot(rooms),
			placements: $state.snapshot(placements),
			furniture: $state.snapshot(furniture),
			deviceDisplay: $state.snapshot(deviceDisplay),
		};
	}

	function takeSnapshot() {
		history.push(cloneSnapshot());
	}

	function restoreSnapshot(snap: PlanSnapshot) {
		// Snapshots read back from the HistoryStack are $state proxies;
		// $state.snapshot deep-unwraps them into a fresh plain copy.
		const plain = $state.snapshot(snap);
		graph = plain.graph;
		rooms = plain.rooms;
		placements = plain.placements;
		furniture = plain.furniture ?? [];
		deviceDisplay = plain.deviceDisplay ?? {};
		selection = { ...emptySelection };
	}

	function handlePreview(g: PlanGraph) {
		graph = g;
	}

	function handleCommit(g: PlanGraph, opts: { snapshot: boolean }) {
		const normalized = normalizeGraph(g);
		const nextFaces = detectFaces(normalized);
		const nextRooms = reconcileRooms(rooms, nextFaces);
		// The pre-gesture snapshot anchors which room each light was in, so a
		// moved room carries its lights and a shrunk one stashes what it left
		// behind — and because this lands before the gesture's own snapshot,
		// undo restores walls and lights together.
		const before = history.current;
		graph = normalized;
		rooms = nextRooms;
		if (before) {
			const carried = carryPlacements({
				before: { graph: before.graph, rooms: before.rooms },
				after: { faces: nextFaces, rooms: nextRooms },
				placements: $state.snapshot(placements) as FloorplanPlacementData[],
			});
			if (carried.changed) placements = carried.placements;
		}
		if (opts.snapshot) takeSnapshot();
	}

	/**
	 * A room was split free of its neighbours to be dragged. Applied without
	 * normalizing — the split vertices sit on their originals, so a merge pass
	 * would undo it. Rooms are reconciled straight away so the unlocked outline
	 * and the detached-rooms card keep tracking the recomputed faces.
	 *
	 * The dragged row's vertex ids are remapped first: face-to-room matching
	 * scores vertex-id overlap, and a room whose every corner was shared comes
	 * out of the split with an all-new ring that would otherwise score zero and
	 * lose its name and Hive link.
	 */
	function handleDetach(g: PlanGraph, prevFaceKey: string, idMap: Map<string, string>) {
		const dragged = rooms.find((r) => faceKey(r) === prevFaceKey) ?? null;
		const remapped = dragged
			? rooms.map((r) =>
					r.id === dragged.id
						? { ...r, vertexIds: r.vertexIds.map((id) => idMap.get(id) ?? id) }
						: r,
				)
			: rooms;
		const nextFaces = detectFaces(g);
		const nextRooms = reconcileRooms(remapped, nextFaces);
		graph = g;
		rooms = nextRooms;
		if (dragged && selection.faceIndex !== null) {
			const index = nextRooms.findIndex((r) => r.id === dragged.id);
			if (index >= 0 && index < nextFaces.length) {
				selection = { ...selection, faceIndex: index };
			}
		}
	}

	function handleUndo() {
		const snap = history.undo();
		if (snap) restoreSnapshot(snap);
	}

	function handleRedo() {
		const snap = history.redo();
		if (snap) restoreSnapshot(snap);
	}

	function updateRoomRow(roomMetaId: string, patch: Partial<PlanRoomMeta>) {
		rooms = rooms.map((r) => (r.id === roomMetaId ? { ...r, ...patch } : r));
	}

	/** Tear down a room: its exclusive walls go; walls shared with a neighboring
	 * room stay (they still belong to the neighbor). A room with no exclusive
	 * walls at all loses everything, so Delete always visibly acts. */
	function deleteFace(face: Face) {
		const mine = facePairKeys(face);
		const others = new Set<string>();
		for (const f of faces) {
			if (f === face) continue;
			for (const k of facePairKeys(f)) others.add(k);
		}
		let doomed = graph.walls.filter(
			(w) => mine.has(wallPairKey(w)) && !others.has(wallPairKey(w)),
		);
		if (doomed.length === 0) doomed = graph.walls.filter((w) => mine.has(wallPairKey(w)));
		const drop = new Set(doomed.map((w) => w.id));
		selection = { ...emptySelection };
		handleCommit(
			{ vertices: graph.vertices, walls: graph.walls.filter((w) => !drop.has(w.id)) },
			{ snapshot: true },
		);
	}

	function deleteSelection() {
		if (selection.furnitureId) {
			removeFurniture(selection.furnitureId);
			return;
		}
		if (selection.placementKeys.length > 0) {
			const drop = new Set(selection.placementKeys);
			placements = placements.filter((p) => !drop.has(placementKey(p)));
			selection = { ...emptySelection };
			takeSnapshot();
			return;
		}
		if (selection.openingIds.length > 0) {
			dropOpenings(selection.openingIds);
			return;
		}
		if (selection.faceIndex !== null && selectedFace) {
			deleteFace(selectedFace);
			return;
		}
		if (selection.wallIds.length === 0 && selection.vertexIds.length === 0) return;
		const dropWalls = new Set(selection.wallIds);
		const dropVertices = new Set(selection.vertexIds);
		const g: PlanGraph = {
			vertices: graph.vertices.filter((v) => !dropVertices.has(v.id)),
			walls: graph.walls.filter(
				(w) => !dropWalls.has(w.id) && !dropVertices.has(w.a) && !dropVertices.has(w.b),
			),
		};
		selection = { ...emptySelection };
		handleCommit(g, { snapshot: true });
	}

	function handleCopy() {
		if (selectedFurniture) {
			// The whole piece travels, so a pasted copy stands at the size and
			// angle the original was given.
			furnitureBuffer = $state.snapshot(selectedFurniture) as FloorplanFurnitureData;
			return;
		}
		if (selection.wallIds.length === 0) return;
		const wallSet = new Set(selection.wallIds);
		const walls = graph.walls.filter((w) => wallSet.has(w.id));
		const vertexIds = new Set(walls.flatMap((w) => [w.a, w.b]));
		copyBuffer = {
			walls: $state.snapshot(walls),
			vertices: $state.snapshot(graph.vertices.filter((v) => vertexIds.has(v.id))),
		};
	}

	function handlePaste() {
		if (furnitureBuffer && !selection.wallIds.length) {
			const offset = 48 / (editorApi?.getZoom() ?? 50);
			const copy = {
				...furnitureBuffer,
				id: newFurnitureId(),
				x: furnitureBuffer.x + offset,
				y: furnitureBuffer.y + offset,
			};
			furniture = [...furniture, copy];
			// Paste again and the next copy lands beyond this one, rather than
			// stacking every copy on the same spot.
			furnitureBuffer = copy;
			selection = { ...emptySelection, furnitureId: copy.id };
			takeSnapshot();
			return;
		}
		if (!copyBuffer || copyBuffer.walls.length === 0) return;
		const offset = 48 / (editorApi?.getZoom() ?? 50);
		const idMap = new Map<string, string>();
		for (const v of copyBuffer.vertices) idMap.set(v.id, newVertexId());
		const newVertices = copyBuffer.vertices.map((v) => ({
			...v,
			id: idMap.get(v.id)!,
			x: v.x + offset,
			y: v.y + offset,
		}));
		const newWalls = copyBuffer.walls.map((w) => ({
			...w,
			id: newWallId(),
			a: idMap.get(w.a) ?? w.a,
			b: idMap.get(w.b) ?? w.b,
		}));
		const g: PlanGraph = {
			vertices: [...graph.vertices, ...newVertices],
			walls: [...graph.walls, ...newWalls],
		};
		selection = { ...emptySelection, wallIds: newWalls.map((w) => w.id) };
		handleCommit(g, { snapshot: true });
	}

	function gridSnap(p: Point): Point {
		return {
			x: Math.round(p.x / DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE,
			y: Math.round(p.y / DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE,
		};
	}

	/** Point every row at the right link: the target row takes the Hive room, and
	 * any other row that held it is unlinked keeping the Hive name as its label. */
	function applyLink(rowId: string, hiveRoomId: string) {
		const hiveName = hiveRoomById.get(hiveRoomId)?.name ?? null;
		rooms = rooms.map((r) => {
			if (r.id === rowId) return { ...r, roomId: hiveRoomId, name: null };
			if (r.roomId === hiveRoomId) return { ...r, roomId: null, name: r.name ?? hiveName };
			return r;
		});
	}

	function linkFace(face: Face, hiveRoomId: string) {
		const row = roomByFace.get(faceKey(face));
		if (!row) return;
		applyLink(row.id, hiveRoomId);
		takeSnapshot();
	}

	function unlinkSelectedRoom() {
		unlinkRoomRow(selectedRoom?.id ?? null);
	}

	/** Drop a plan room's Hive link, keeping the room's name as a loose label. */
	function unlinkRoomRow(rowId: string | null) {
		const row = rowId === null ? null : (rooms.find((r) => r.id === rowId) ?? null);
		if (!row?.roomId) return;
		const hiveName = hiveRoomById.get(row.roomId)?.name ?? null;
		updateRoomRow(row.id, { roomId: null, name: hiveName });
		takeSnapshot();
	}

	/** Stamp a grid-snapped 3 m x 3 m room at `center` and link its face. */
	/** Half the side of a room dropped in from the drawer, in meters. */
	const DROPPED_ROOM_HALF = 1.5;

	/**
	 * Where a room dropped at `center` would land. The preview and the drop read
	 * this same function, so what the pointer shows is what gets drawn.
	 */
	function droppedRoomRect(center: Point): { a: Point; b: Point } {
		const c = gridSnap(center);
		const half = DROPPED_ROOM_HALF;
		const dropped: Point[] = [
			{ x: c.x - half, y: c.y - half },
			{ x: c.x + half, y: c.y - half },
			{ x: c.x + half, y: c.y + half },
			{ x: c.x - half, y: c.y + half },
		];
		// Land the room flush against what is already drawn, the way the stamp
		// tool does — otherwise two rooms dropped side by side sit a fraction
		// apart and never share a wall.
		const shift = snapRectOffset(dropped, graph);
		const corners = dropped.map((p) => ({ x: p.x + shift.x, y: p.y + shift.y }));
		return { a: corners[0], b: corners[2] };
	}

	function stampLinkedRect(center: Point, hiveRoomId: string) {
		const c = gridSnap(center);
		const { a, b } = droppedRoomRect(center);
		handleCommit(
			addRoomClipped(
				graph,
				a,
				b,
				DEFAULT_WALL_THICKNESS,
				{ vertexId: newVertexId, wallId: newWallId },
				faces,
			),
			{ snapshot: false },
		);
		const face = faceContainingPoint(faces, c);
		if (face) {
			const row = roomByFace.get(faceKey(face));
			if (row) applyLink(row.id, hiveRoomId);
		}
		takeSnapshot();
	}

	function reattachDetached(roomMetaId: string, face: Face) {
		const detached = rooms.find((r) => r.id === roomMetaId);
		if (!detached) return;
		const fk = faceKey(face);
		rooms = rooms
			.filter((r) => r.id === roomMetaId || faceKey(r) !== fk)
			.map((r) => (r.id === roomMetaId ? { ...r, vertexIds: [...face.vertexIds] } : r));
		takeSnapshot();
	}

	/** The devices a placement ref covers, disabled ones included. */
	function devicesForRef(ref: PlacementRef): Device[] {
		return resolveTargetDevices(
			{ type: ref.memberType, id: ref.memberId },
			allDevices,
			hiveGroups,
			hiveRooms,
			{ includeDisabled: true },
		);
	}

	function deviceIdsForRef(ref: PlacementRef): string[] {
		return devicesForRef(ref).map((d) => d.id);
	}

	/**
	 * The face a marker belongs in: the linked room holding that device. A group
	 * spans whatever its members span, so it has no single home and lands where
	 * it is dropped.
	 */
	function homeFaceFor(ref: PlacementRef): Face | null {
		if (ref.memberType !== "device") return null;
		for (const face of faces) {
			const row = roomByFace.get(faceKey(face));
			if (!row?.roomId) continue;
			const hive = hiveRooms.find((r) => r.id === row.roomId);
			if (hive?.resolvedDevices?.some((d) => d.id === ref.memberId)) return face;
		}
		return null;
	}

	function settlePlacement(ref: PlacementRef, p: Point, alt: boolean): Point {
		if (alt) return p;
		const home = homeFaceFor(ref);
		if (home && !pointInPolygon(p, home.polygon)) {
			return nearestPointInFace(p, home, 0.2);
		}
		return p;
	}

	function handlePlacementPreview(ref: PlacementRef, p: Point) {
		const key = placementKey(ref);
		placements = placements.map((pl) =>
			placementKey(pl) === key ? { ...pl, x: p.x, y: p.y } : pl,
		);
		const home = homeFaceFor(ref);
		highlightFaceKey = home && !pointInPolygon(p, home.polygon) ? faceKey(home) : null;
	}

	function handlePlacementDrop(ref: PlacementRef, p: Point, alt: boolean) {
		const key = placementKey(ref);
		const settled = settlePlacement(ref, p, alt);
		placements = placements.map((pl) =>
			placementKey(pl) === key ? { ...pl, x: settled.x, y: settled.y } : pl,
		);
		highlightFaceKey = null;
		takeSnapshot();
	}

	function removePlacement(ref: PlacementRef) {
		const key = placementKey(ref);
		placements = placements.filter((p) => placementKey(p) !== key);
		takeSnapshot();
	}

	let pendingPlacement = $state<{ placement: Placement; conflict: PlacementConflict } | null>(null);
	let conflictOpen = $state(false);

	function refLabel(ref: PlacementRef): string {
		if (ref.memberType === "group") {
			return hiveGroups.find((g) => g.id === ref.memberId)?.name ?? ref.memberId;
		}
		const device = deviceById.get(ref.memberId);
		return device ? deviceDisplayName(device) : ref.memberId;
	}

	/**
	 * Land a marker, displacing anything already covering the same devices. The
	 * displacement and the insertion ship as one list assignment plus one
	 * snapshot, so undo restores both halves together.
	 */
	function requestPlacement(placement: Placement) {
		const existing = $state.snapshot(placements);
		const conflict = placementConflicts(placement, existing, deviceIdsForRef);
		if (needsConfirmation(placement, conflict)) {
			pendingPlacement = { placement, conflict };
			conflictOpen = true;
			return;
		}
		placements = applyPlacement(existing, placement, conflict);
		takeSnapshot();
	}

	function confirmPlacement() {
		const pending = pendingPlacement;
		conflictOpen = false;
		pendingPlacement = null;
		if (!pending) return;
		placements = applyPlacement($state.snapshot(placements), pending.placement, pending.conflict);
		takeSnapshot();
	}

	function cancelPlacement() {
		conflictOpen = false;
		pendingPlacement = null;
	}

	function startRoomDrag(kind: "hive-room" | "detached", id: string, text: string, e: PointerEvent) {
		externalDrag =
			kind === "hive-room" ? { kind, hiveRoomId: id, text } : { kind, roomMetaId: id, text };
		moveExternalDrag(e);
	}

	function startDeviceDrag(device: Device, e: PointerEvent) {
		const view: PlacementView = { kind: "device", device, x: 0, y: 0 };
		externalDrag = { kind: "placement", placement: view };
		draftPlacement = view;
		moveExternalDrag(e);
	}

	function startGroupDrag(group: PanelGroup, e: PointerEvent) {
		const view: PlacementView = {
			kind: "group",
			group,
			devices: devicesForRef({ memberType: "group", memberId: group.id }),
			x: 0,
			y: 0,
		};
		externalDrag = { kind: "placement", placement: view };
		draftPlacement = view;
		moveExternalDrag(e);
	}

	/** Tap instead of drag: drop the piece in the middle of what is on screen. */
	function placeFurnitureAtCentre(kindId: string) {
		furnitureDrawerOpen = false;
		const at = editorApi?.getViewportCenterWorld() ?? { x: 0, y: 0 };
		const piece = defaultFurniture(kindId, gridSnap(at), newFurnitureId());
		furniture = [...furniture, piece];
		selection = { ...emptySelection, furnitureId: piece.id };
		takeSnapshot();
	}

	const selectedFurniture = $derived(
		selection.furnitureId
			? (furniture.find((f) => f.id === selection.furnitureId) ?? null)
			: null,
	);

	/** A transform in flight: shown live, written to history only on release. */
	function previewFurniture(piece: FloorplanFurnitureData) {
		furniture = furniture.map((f) => (f.id === piece.id ? piece : f));
	}

	function commitFurniture(piece: FloorplanFurnitureData) {
		previewFurniture(piece);
		takeSnapshot();
	}

	function removeFurniture(id: string) {
		furniture = furniture.filter((f) => f.id !== id);
		if (selection.furnitureId === id) selection = { ...emptySelection };
		takeSnapshot();
	}

	function duplicateFurniture(piece: FloorplanFurnitureData) {
		const copy = { ...piece, id: newFurnitureId(), x: piece.x + 0.2, y: piece.y + 0.2 };
		furniture = [...furniture, copy];
		selection = { ...emptySelection, furnitureId: copy.id };
		takeSnapshot();
	}

	/**
	 * A marker dropped on an occluder slides out of it. Light from inside one
	 * never reaches the room — the cell is solid — so the marker settles where
	 * it can actually be seen instead.
	 */
	function clearOfOccluders(at: Point): Point {
		let out = at;
		for (const piece of furniture) {
			out = nearestPointOutside(piece, out);
		}
		return out;
	}

	/** The light standing inside a piece, if marking it would strand one. */
	function occludedLightNames(piece: FloorplanFurnitureData): string | null {
		const inside = placementsInsideFurniture({ ...piece, occluder: true }, placementViews);
		const lights = inside.filter((pl) => placementDeviceList(pl).some(isLightControlDevice));
		if (lights.length === 0) return null;
		const first = lights[0];
		const name =
			first.kind === "device" ? deviceDisplayName(first.device) : first.group.name;
		return lights.length > 1 ? `${name} and ${lights.length - 1} more` : name;
	}

	function toggleOccluder(piece: FloorplanFurnitureData) {
		commitFurniture({ ...piece, occluder: !piece.occluder });
	}

	function handleFurnitureMenu(piece: FloorplanFurnitureData, clientX: number, clientY: number) {
		if (!editMode) return;
		faceMenuOpen = false;
		markerMenuOpen = false;
		selection = { ...emptySelection, furnitureId: piece.id };
		furnitureMenu = { x: clientX, y: clientY, piece };
		furnitureMenuOpen = true;
	}

	function startFurnitureDrag(kindId: string, e: PointerEvent) {
		externalDrag = { kind: "furniture", furnitureKind: kindId };
		draftFurniture = defaultFurniture(kindId, { x: 0, y: 0 }, newFurnitureId());
		moveExternalDrag(e);
	}

	function moveExternalDrag(e: PointerEvent) {
		if (!externalDrag || !editorApi) return;
		const p = editorApi.clientToWorld(e.clientX, e.clientY);
		const dragged = externalDrag.placement;
		if (externalDrag.kind === "furniture" && draftFurniture) {
			const snapped = e.altKey ? p : gridSnap(p);
			draftFurniture = { ...draftFurniture, x: snapped.x, y: snapped.y };
			return;
		}
		if (externalDrag.kind === "placement" && dragged) {
			const snapped = e.altKey ? p : gridSnap(p);
			draftPlacement = { ...dragged, x: snapped.x, y: snapped.y };
			const home = homeFaceFor(placementViewRef(dragged));
			highlightFaceKey =
				home && !pointInPolygon(snapped, home.polygon) && !e.altKey ? faceKey(home) : null;
		} else {
			draftLabel = { point: p, text: externalDrag.text ?? "" };
			const face = faceContainingPoint(faces, p);
			highlightFaceKey = face ? faceKey(face) : null;
			// Over a room the drop links to it, which the highlight already shows.
			// Anywhere else it draws one, so show where.
			draftRoom =
				externalDrag.kind === "hive-room" && !face ? droppedRoomRect(p) : null;
		}
	}

	function endExternalDrag(e: PointerEvent) {
		const drag = externalDrag;
		clearExternalDrag();
		if (!drag || !editorApi) return;
		const p = editorApi.clientToWorld(e.clientX, e.clientY);
		if (drag.kind === "furniture" && drag.furnitureKind) {
			const snapped = e.altKey ? p : gridSnap(p);
			const piece = defaultFurniture(drag.furnitureKind, snapped, newFurnitureId());
			furniture = [...furniture, piece];
			selection = { ...emptySelection, furnitureId: piece.id };
			takeSnapshot();
			return;
		}
		if (drag.kind === "placement" && drag.placement) {
			const ref = placementViewRef(drag.placement);
			const snapped = e.altKey ? p : gridSnap(p);
			const settled = clearOfOccluders(settlePlacement(ref, snapped, e.altKey));
			requestPlacement({ ...ref, x: settled.x, y: settled.y });
			return;
		}
		if (drag.kind === "hive-room" && drag.hiveRoomId) {
			const face = faceContainingPoint(faces, p);
			if (face) linkFace(face, drag.hiveRoomId);
			else stampLinkedRect(p, drag.hiveRoomId);
			return;
		}
		if (drag.kind === "detached" && drag.roomMetaId) {
			const face = faceContainingPoint(faces, p);
			if (face) reattachDetached(drag.roomMetaId, face);
		}
	}

	function clearExternalDrag() {
		externalDrag = null;
		draftLabel = null;
		draftRoom = null;
		draftPlacement = null;
		draftFurniture = null;
		highlightFaceKey = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!visible) return;
		if (!editMode) {
			if (e.key === "Escape" && armedBrush && !isEditableTarget(e.target)) {
				disarmBrush();
			}
			return;
		}
		if (isEditableTarget(e.target)) return;
		const mod = e.metaKey || e.ctrlKey;
		if (mod && e.key === "z" && !e.shiftKey) {
			e.preventDefault();
			handleUndo();
		} else if (mod && (e.key === "Z" || e.key === "y")) {
			e.preventDefault();
			handleRedo();
		} else if (mod && e.key === "c") {
			if (selection.wallIds.length === 0 && !selection.furnitureId) return;
			e.preventDefault();
			handleCopy();
		} else if (mod && e.key === "v") {
			if (!copyBuffer && !furnitureBuffer) return;
			e.preventDefault();
			handlePaste();
		} else if (e.key === "Delete" || e.key === "Backspace") {
			e.preventDefault();
			deleteSelection();
		} else if (e.key === "Escape") {
			if (externalDrag) {
				clearExternalDrag();
				return;
			}
			if (editorApi?.cancelDraw()) return;
			selection = { ...emptySelection };
		}
	}

	async function handleSave() {
		if (saving || !isDirty) return;
		saving = true;
		try {
			const input = buildUpdateFloorplanInput(planId, planName, graph, rooms, placements, furniture);
			try {
				await floorplanStore.save(client, input);
			} catch (e) {
				errors.setWithAutoDismiss(graphqlErrorMessage(e, "Failed to save the plan."));
				return;
			}
			const displayError = await saveDisplayEdits();
			if (displayError) {
				errors.setWithAutoDismiss(displayError);
				return;
			}
			savedCursor = history.cursor;
			savedSnapshot = cloneSnapshot();
		} finally {
			saving = false;
		}
	}

	/**
	 * Push the display colours the plan is carrying to the devices they belong
	 * to. They are device metadata rather than plan data, so they travel beside
	 * the plan's own mutation; the message of the first failure comes back.
	 */
	async function saveDisplayEdits(): Promise<string | null> {
		for (const [id, edit] of Object.entries(deviceDisplay)) {
			const device = $deviceStore[id];
			if (!device) continue;
			if (
				(device.displayColor ?? null) === edit.color &&
				(device.displayBrightness ?? null) === edit.brightness
			) {
				continue;
			}
			const result = await client
				.mutation(SET_DISPLAY_COLOR, {
					id,
					input: { displayColor: edit.color, displayBrightness: edit.brightness },
				})
				.toPromise();
			if (result.error) {
				return graphqlErrorMessage(result.error, "Failed to save a display colour.");
			}
			deviceStore.updateDisplayColor(id, edit.color);
			deviceStore.updateDisplayBrightness(id, edit.brightness);
		}
		return null;
	}

	// Going Live with unsaved edits saves first and stays in Edit if that fails.
	function handleEnterEdit() {
		disarmBrush();
		brushOpen = false;
		editMode = true;
	}

	function handleCancelEdit() {
		if (saving) return;
		if (isDirty) {
			discardOpen = true;
			return;
		}
		exitEditMode();
	}

	function confirmDiscard() {
		discardOpen = false;
		revertToSaved();
		exitEditMode();
	}

	/**
	 * Put the plan back to what the server holds and start a fresh history, so
	 * Redo cannot resurrect the changes that were just discarded.
	 */
	function revertToSaved() {
		if (savedSnapshot) restoreSnapshot(savedSnapshot);
		history.reset(cloneSnapshot());
		savedCursor = history.cursor;
		savedSnapshot = cloneSnapshot();
	}

	function exitEditMode() {
		clearExternalDrag();
		editorApi?.cancelDraw();
		selection = { ...emptySelection };
		drawerOpen = false;
		unlockedRoomIds = new Set();
		freeCornerRoomIds = new Set();
		renameRoomId = null;
		colorPickDeviceId = null;
		faceMenuOpen = false;
		faceMenu = null;
		// Copied walls may not exist after a discard.
		copyBuffer = null;
		editMode = false;
	}

	function handleMarkerTap(pl: PlacementView) {
		if (popoverDismissedRecently()) return;
		const devices = placementDeviceList(pl).filter(
			(d) => !d.disabled && d.available && isLightControlDevice(d),
		);
		if (devices.length === 0) return;
		commitGroupToggle(client, devices, !devices.some((d) => d.state?.on));
	}

	function handleMarkerMenu(placement: PlacementView, clientX: number, clientY: number) {
		faceMenuOpen = false;
		markerMenu = { x: clientX, y: clientY, placement };
		markerMenuOpen = true;
	}

	function menuRemovePlacement() {
		const m = markerMenu;
		markerMenuOpen = false;
		markerMenu = null;
		if (m) removePlacement(placementViewRef(m.placement));
	}

	function menuOpenDevicePage() {
		const m = markerMenu;
		markerMenuOpen = false;
		markerMenu = null;
		if (m?.placement.kind === "device") goto(`/devices/${m.placement.device.id}`);
	}

	function menuSetDisplayColor() {
		const m = markerMenu;
		markerMenuOpen = false;
		markerMenu = null;
		if (m?.placement.kind !== "device") return;
		colorPickDeviceId = m.placement.device.id;
		colorPickAt = { x: m.x, y: m.y };
		changedDisplay = false;
	}

	const colorPickDevice = $derived(
		colorPickDeviceId ? (allDevices.find((d) => d.id === colorPickDeviceId) ?? null) : null,
	);
	const displayColorRgb = $derived(hexToRgbValue(colorPickDevice?.displayColor ?? null));

	/** `#rrggbb` to the picker's channels; its own default when unset. */
	function hexToRgbValue(hex: string | null): { r: number; g: number; b: number } {
		const m = hex ? /^#?([0-9a-f]{6})$/i.exec(hex.trim()) : null;
		if (!m) return { r: 255, g: 170, b: 80 };
		const n = parseInt(m[1], 16);
		return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
	}

	let changedDisplay = false;

	function editDisplay(deviceId: string, patch: Partial<DeviceDisplay>) {
		changedDisplay = true;
		const device = deviceById.get(deviceId);
		const current = deviceDisplay[deviceId] ?? {
			color: device?.displayColor ?? null,
			brightness: device?.displayBrightness ?? null,
		};
		deviceDisplay = { ...deviceDisplay, [deviceId]: { ...current, ...patch } };
	}

	function setDisplayBrightness(deviceId: string, brightness: number) {
		editDisplay(deviceId, { brightness: Math.max(1, Math.min(254, Math.round(brightness))) });
	}

	function setDisplayColor(deviceId: string, rgb: { r: number; g: number; b: number }) {
		const hex = `#${[rgb.r, rgb.g, rgb.b]
			.map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
			.join("")}`;
		editDisplay(deviceId, { color: hex });
	}

	function handleOpeningMenu(openingId: string, clientX: number, clientY: number) {
		if (!editMode) return;
		faceMenuOpen = false;
		selection = { ...emptySelection, openingIds: [openingId] };
		openingMenu = { x: clientX, y: clientY, openingId };
		openingMenuOpen = true;
	}

	/** The kind of the opening the menu is about, so the menu can mark it current. */
	const openingMenuKind = $derived.by(() => {
		if (!openingMenu) return null;
		for (const w of graph.walls) {
			const o = w.openings?.find((x) => x.id === openingMenu!.openingId);
			if (o) return o.kind;
		}
		return null;
	});

	function menuSetOpeningKind(kind: OpeningKind) {
		const m = openingMenu;
		openingMenuOpen = false;
		openingMenu = null;
		if (!m) return;
		handleCommit({
			...graph,
			walls: graph.walls.map((w) =>
				w.openings?.some((o) => o.id === m.openingId)
					? { ...w, openings: w.openings.map((o) => (o.id === m.openingId ? { ...o, kind } : o)) }
					: w,
			),
		}, { snapshot: true });
	}

	function menuRemoveOpening() {
		const m = openingMenu;
		openingMenuOpen = false;
		openingMenu = null;
		if (m) dropOpenings([m.openingId]);
	}

	function dropOpenings(ids: string[]) {
		handleCommit(removeOpenings(graph, ids), { snapshot: true });
		selection = { ...emptySelection };
	}

	function handleMarkerPreview(deviceIds: string[], partial: Partial<DeviceState>) {
		const next = { ...previewByDevice };
		for (const id of deviceIds) next[id] = { ...next[id], ...partial };
		previewByDevice = next;
		noteInteract();
	}

	function handleFaceTap(faceIndex: number) {
		if (popoverDismissedRecently()) return;
		const face = faces[faceIndex];
		if (!face) return;
		const row = roomByFace.get(faceKey(face));
		if (!row?.roomId) return;
		pushState("", { ...page.state, mapRoomId: row.roomId });
	}

	function handleFaceMenu(faceIndex: number, clientX: number, clientY: number) {
		if (!editMode) return;
		const face = faces[faceIndex];
		if (!face) return;
		const row = roomByFace.get(faceKey(face));
		if (!row) return;
		// Right-click opens the menu and nothing else — selecting is what a left
		// click is for, and it is what opens the room's panel.
		renameRoomId = null;
		faceMenu = {
			x: clientX,
			y: clientY,
			roomId: row.id,
			faceIndex,
			unlocked: unlockedRoomIds.has(row.id),
			cornersFree: freeCornerRoomIds.has(row.id),
		};
		faceMenuOpen = true;
	}

	function menuToggleCornerLock() {
		const m = faceMenu;
		faceMenuOpen = false;
		if (!m) return;
		const next = new Set(freeCornerRoomIds);
		if (next.has(m.roomId)) next.delete(m.roomId);
		else next.add(m.roomId);
		freeCornerRoomIds = next;
	}

	function menuToggleLock() {
		const m = faceMenu;
		faceMenuOpen = false;
		if (!m) return;
		const next = new Set(unlockedRoomIds);
		if (next.has(m.roomId)) next.delete(m.roomId);
		else next.add(m.roomId);
		unlockedRoomIds = next;
	}

	function menuRename() {
		const m = faceMenu;
		faceMenuOpen = false;
		if (!m) return;
		renameAt = { x: m.x, y: m.y };
		renameRoomId = m.roomId;
	}

	function menuLink() {
		const m = faceMenu;
		faceMenuOpen = false;
		if (!m) return;
		linkTargetRowId = m.roomId;
		drawerOpen = true;
	}

	function menuUnlink() {
		const m = faceMenu;
		faceMenuOpen = false;
		unlinkRoomRow(m?.roomId ?? null);
	}

	/**
	 * A right-click while one of the plan's menus is open lands on the menu's own
	 * layer, not the plan, so the browser would raise its menu instead. Take the
	 * click and move the plan's menu to it.
	 */
	async function handlePlanContextMenu(e: MouseEvent) {
		if (!faceMenuOpen && !markerMenuOpen && !openingMenuOpen) return;
		e.preventDefault();
		const { clientX, clientY } = e;
		faceMenuOpen = false;
		markerMenuOpen = false;
		openingMenuOpen = false;
		// The menu has to actually close before it will anchor somewhere new;
		// closing and opening in one go leaves it where it was.
		await tick();
		editorApi?.openMenuAt(clientX, clientY);
	}

	function menuDelete() {
		const m = faceMenu;
		faceMenuOpen = false;
		const face = m === null ? null : faces[m.faceIndex];
		if (face) deleteFace(face);
	}

	const openRoomId = $derived<string | null>(
		(page.state as { mapRoomId?: string }).mapRoomId ?? null,
	);
	const openRoom = $derived(
		openRoomId ? (hiveRooms.find((r) => r.id === openRoomId) ?? null) : null,
	);

	function closeRoomDrawer() {
		if (openRoomId !== null) window.history.back();
	}

	async function handleApplyScene(scene: { id: string; name: string }) {
		try {
			await scenesStore.apply(client, scene.id);
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Failed to apply the scene."));
		}
	}

	onMount(async () => {
		if (floorplanStore.error) {
			errors.setWithAutoDismiss(floorplanStore.error);
		}
		const plan = floorplanStore.current;
		if (plan) {
			const converted = floorplanToGraph(plan);
			planId = plan.id;
			planName = plan.name;
			graph = converted.graph;
			rooms = converted.rooms;
			placements = converted.placements;
			furniture = converted.furniture;
		} else {
			planId = newPlanId();
		}
		history.reset(cloneSnapshot());
		savedCursor = history.cursor;
		savedSnapshot = cloneSnapshot();
		// The map's day-to-day job is being looked at, not edited: a plan with
		// anything on it opens Live; only a blank plan opens in Edit.
		editMode = graph.walls.length === 0 && rooms.length === 0;
		void loadTopologies();
		topologySubHandle = client.subscription(TOPOLOGY_UPDATED_SUB, {}).subscribe((r) => {
			// The event fires only after the merged snapshot is persisted, so
			// re-querying here always reads the fresh one.
			if (r.data?.networkTopologyUpdated) void loadTopologies();
		});
		// The TX pulses ride the raw event streams, not deviceStore: the store
		// drops no-change reports, and a report is a transmission either way.
		txSubHandle = client.subscription(DEVICE_TX_SUB, {}).subscribe((r) => {
			const id = r.data?.deviceStateChanged.deviceId;
			if (id) bumpPulse(id);
		});
		actionTxSubHandle = client.subscription(DEVICE_ACTION_TX_SUB, {}).subscribe((r) => {
			const id = r.data?.deviceActionFired.deviceId;
			if (id) bumpPulse(id);
		});
		loading = false;
	});

	function bumpPulse(deviceId: string) {
		if (!visible) return;
		if (editMode || mapView !== "connectivity") return;
		if (!meshPositions.has(deviceId)) return;
		const next = new Map(pulseSeqs);
		next.set(deviceId, (next.get(deviceId) ?? 0) + 1);
		pulseSeqs = next;
	}

	let topologySubHandle: { unsubscribe: () => void } | null = null;
	let txSubHandle: { unsubscribe: () => void } | null = null;
	let actionTxSubHandle: { unsubscribe: () => void } | null = null;

	onDestroy(() => {
		pageHeader.reset();
		topologySubHandle?.unsubscribe();
		txSubHandle?.unsubscribe();
		actionTxSubHandle?.unsubscribe();
		if (interactingTimer) clearTimeout(interactingTimer);
	});

	$effect(() => {
		if (!visible) return;
		pageHeader.breadcrumbs = [{ label: "Map" }];
		if (loading) {
			pageHeader.actions = [];
			return;
		}
		// `saving` is the layout's discriminator for rendering SaveButton, which
		// hardcodes its own label and icon — the other actions must omit it.
		pageHeader.actions = editMode
			? [
					{
						label: "Cancel",
						icon: X,
						variant: "outline" as const,
						onclick: handleCancelEdit,
						disabled: saving,
						hideLabelOnMobile: true,
					},
					{
						label: "Save",
						saving,
						onclick: handleSave,
						disabled: saving || !isDirty,
						hideLabelOnMobile: true,
					},
				]
			: [
					{
						label: "Edit",
						icon: Pencil,
						onclick: handleEnterEdit,
						hideLabelOnMobile: true,
					},
				];
	});

	const selectedFace = $derived<Face | null>(
		selection.faceIndex !== null && selection.faceIndex < faces.length
			? faces[selection.faceIndex]
			: null,
	);
	const selectedFaceBounds = $derived(selectedFace ? faceBounds(selectedFace) : null);
	/** The lone selected wall, which is what the metadata card can edit. */
	const selectedWall = $derived<PlanWall | null>(
		selection.wallIds.length === 1
			? (graph.walls.find((w) => w.id === selection.wallIds[0]) ?? null)
			: null,
	);

	function setSelectedWallThickness(next: number | null) {
		const wall = selectedWall;
		if (!wall || next === null || next === wall.thickness) return;
		handleCommit(setWallThickness(graph, wall.id, next), { snapshot: true });
	}
	const selectedRoom = $derived(selectedFace ? (roomByFace.get(faceKey(selectedFace)) ?? null) : null);
	const selectedLinkedRoom = $derived.by(() => {
		if (!selectedRoom?.roomId) return null;
		const hive = hiveRoomById.get(selectedRoom.roomId);
		return hive ? { id: selectedRoom.roomId, name: hive.name, icon: hive.icon } : null;
	});
	const panelAnchor = $derived.by(() => {
		void viewportVersion;
		if (!selectedFace || !editorApi) return null;
		return editorApi.faceClientRect(selectedFace);
	});
	const placedKeys = $derived(new Set(placements.map((p) => placementKey(p))));
	const panelRoomDevices = $derived.by<Device[]>(() => {
		if (!selectedRoom?.roomId) return [];
		return resolveTargetDevices(
			{ type: "room", id: selectedRoom.roomId },
			allDevices,
			hiveGroups,
			hiveRooms,
			{ includeDisabled: true },
		);
	});
	const panelDeviceRows = $derived<DeviceRow[]>(
		panelRoomDevices.map((device) => ({
			device,
			placed: placedKeys.has(placementKey({ memberType: "device", memberId: device.id })),
		})),
	);
	/** Groups reaching into the selected room, derived from device-set overlap. */
	const panelGroupRows = $derived.by<GroupRow[]>(() => {
		if (panelRoomDevices.length === 0) return [];
		const roomDeviceIds = new Set(panelRoomDevices.map((d) => d.id));
		return hiveGroups.flatMap((group) => {
			const overlap = deviceIdsForRef({ memberType: "group", memberId: group.id }).filter((id) =>
				roomDeviceIds.has(id),
			);
			if (overlap.length === 0) return [];
			return [
				{
					group: { id: group.id, name: group.name, icon: group.icon },
					deviceCount: overlap.length,
					placed: placedKeys.has(placementKey({ memberType: "group", memberId: group.id })),
				},
			];
		});
	});
	const metadataLabel = $derived(
		selectedLinkedRoom?.name ?? (selectedRoom?.name || null),
	);

	const furnitureDrawerGroups = $derived<DrawerGroup<"furniture">[]>(
		furnitureGroups().map((g) => ({
			heading: g.group,
			items: g.kinds.map((k) => ({
				type: "furniture" as const,
				id: k.id,
				name: k.label,
				icon: k.icon,
				badge: `${k.size.width.toFixed(2)} × ${k.size.height.toFixed(2)} m`,
			})),
		})),
	);

	const drawerGroups = $derived<DrawerGroup<"room">[]>([
		{
			heading: "Rooms",
			items: hiveRooms.map((r) => {
				const linked = linkedHiveRoomIds.has(r.id);
				return {
					type: "room" as const,
					id: r.id,
					name: r.name ?? r.id,
					icon: DoorOpen,
					iconRef: r.icon,
					badge: linked ? "Linked" : `${r.resolvedDevices?.length ?? 0} devices`,
					disabled: linked,
				};
			}),
		},
	]);

	function handleDrawerSelect(_type: "room", id: string) {
		drawerOpen = false;
		// The menu names its own room; otherwise fall back to whatever is selected.
		const target = linkTargetRowId;
		linkTargetRowId = null;
		if (target) {
			applyLink(target, id);
			takeSnapshot();
			return;
		}
		if (selectedFace && selectedRoom) {
			linkFace(selectedFace, id);
			return;
		}
		if (!editorApi) return;
		stampLinkedRect(editorApi.getViewportCenterWorld(), id);
	}

</script>

<svelte:window
	oncontextmenu={handlePlanContextMenu}
	onkeydown={handleKeydown}
	onpointermove={externalDrag ? moveExternalDrag : undefined}
	onpointerup={externalDrag ? endExternalDrag : undefined}
/>
<UnsavedGuard dirty={isDirty} blockNavigation={false} />

<div class="flex h-[calc(100vh-6rem)] flex-col">
	{#if errors.message}
		<ErrorBanner class="mb-2" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}

	<div class="relative mt-2 flex-1 overflow-hidden rounded-lg shadow-card">
		<div class="dark absolute inset-0 bg-background">
			{#if loading}
				<div class="h-full w-full animate-pulse bg-muted/30"></div>
			{:else}
				<div in:fly={{ y: -4, duration: 150 }} class="h-full w-full">
					<FloorplanEditor
						{graph}
						{faces}
						{tool}
						{selection}
						live={!editMode}
						unlockedKeys={unlockedFaceKeys}
						freeCornerKeys={freeCornerFaceKeys}
						brush={armedBrush && brushCss ? { kind: armedBrush.kind, css: brushCss } : null}
						inertKeys={brushInertKeys}
						onbrushstroke={handleBrushStroke}
						onbrushend={handleBrushEnd}
						{brushRadiusPx}
						onbrushresize={setBrushRadius}
						glowGroups={glowData.groups}
						lightmap={lightmapFrame}
						outsideGlows={glowData.outside}
						{meshLinks}
						txPulses={meshPulses}
						hideReadings={mapView === "connectivity"}
						placements={visiblePlacements}
						{furniture}
						{draftFurniture}
						selectedFurnitureId={selection.furnitureId}
						{furnitureMode}
						onfurnituremenu={handleFurnitureMenu}
						onfurniturepreview={previewFurniture}
						onfurniturecommit={commitFurniture}
						{draftPlacement}
						{draftLabel}
						{draftRoom}
						{faceLabels}
						{highlightFaceKey}
						onselectionchange={(sel) => (selection = sel)}
						onpreview={handlePreview}
						oncommit={handleCommit}
						ondetach={handleDetach}
						onsnapshot={takeSnapshot}
						onplacementpreview={handlePlacementPreview}
						onplacementdrop={handlePlacementDrop}
						onmarkertap={handleMarkerTap}
						onmarkermenu={handleMarkerMenu}
						{openingKind}
						{measureKind}
						{keepMeasures}
						onopeningmenu={handleOpeningMenu}
						{snapOff}
						{additive}
						onfacetap={handleFaceTap}
						onfacemenu={handleFaceMenu}
						onmarkerpreview={handleMarkerPreview}
						onviewportchange={() => viewportVersion++}
						onready={(api) => (editorApi = api)}
					/>
				</div>
			{/if}
		</div>

		{#if !loading}
			<MapToolbar
				{editMode}
				{tool}
				ontool={(next) => (tool = next)}
				{openingKind}
				onopeningkind={(next) => (openingKind = next)}
				{measureKind}
				onmeasurekind={(next) => (measureKind = next)}
				{keepMeasures}
				onkeepmeasures={() => (keepMeasures = !keepMeasures)}
				canUndo={history.canUndo}
				canRedo={history.canRedo}
				onundo={handleUndo}
				onredo={handleRedo}
				selectedWallCount={selection.wallIds.length + (selection.furnitureId ? 1 : 0)}
				hasCopyBuffer={!!copyBuffer || !!furnitureBuffer}
				oncopy={handleCopy}
				onpaste={handlePaste}
				{snapOff}
				onsnaptoggle={() => (snapOff = !snapOff)}
				{additive}
				onadditivetoggle={() => (additive = !additive)}
				onlinkroom={() => (drawerOpen = true)}
				onfurniture={() => (furnitureDrawerOpen = true)}
				furnitureSelected={!!selection.furnitureId}
				{furnitureMode}
				onfurnituremode={(mode: FurnitureMode) => (furnitureMode = mode)}
				{brushOpen}
				{canPaint}
				onbrushtoggle={() => {
					brushOpen = !brushOpen;
					if (!brushOpen) disarmBrush();
				}}
				view={mapView}
				viewOptions={availableViews}
				onviewchange={setMapView}
				onfit={() => editorApi?.fitToContent()}
				{showNeighbours}
				onneighbourstoggle={() => (showNeighbours = !showNeighbours)}
				{meshSources}
				onsourcetoggle={toggleMeshSource}
			/>

			<div
				class="absolute bottom-3 left-3 z-10 rounded-lg bg-card/90 shadow-card px-3 py-2 text-xs backdrop-blur-sm transition-opacity duration-200 {editMode &&
				(selectedFace || selectedWall)
					? 'opacity-100'
					: 'pointer-events-none opacity-0'}"
			>
				{#if selectedFace && selectedFaceBounds}
					{#if metadataLabel}
						<div class="flex items-center gap-1.5 pb-0.5 font-medium">
							{#if selectedLinkedRoom}
								<DoorOpen class="size-3 text-muted-foreground" />
							{/if}
							{metadataLabel}
						</div>
					{/if}
					<div class="font-medium">{formatArea(selectedFace.area)}</div>
					<div class="text-muted-foreground">
						{formatMeters(selectedFaceBounds.width)} × {formatMeters(selectedFaceBounds.height)}
					</div>
				{:else if selectedWall}
					<div class="font-medium">{formatMeters(wallLength(selectedWall, graph.vertices))}</div>
					<div class="flex items-center gap-2 pt-1">
						<span class="text-muted-foreground">Thickness</span>
						<NumberInput
							value={selectedWall.thickness}
							min={MIN_WALL_THICKNESS}
							max={MAX_WALL_THICKNESS}
							allowDecimal
							class="h-6 w-16 text-xs"
							ariaLabel="Wall thickness in meters"
							onValueChange={setSelectedWallThickness}
						/>
					</div>
				{/if}
			</div>

			<div
				class="absolute bottom-3 left-3 z-10 rounded-lg bg-card/90 shadow-card px-3 py-2 text-xs backdrop-blur-sm transition-opacity duration-200 {meshCaption
					? 'opacity-100'
					: 'pointer-events-none opacity-0'}"
			>
				{#if meshCaption}
					<div class="font-medium">
						Mesh scanned {formatRelative(
							meshCaption.scannedAt,
							nowStore.current,
							me.user?.timeFormat ?? "24h",
						)}
					</div>
					<div class="text-muted-foreground">
						{meshCaption.placed} of {meshCaption.total} devices placed
					</div>
				{/if}
			</div>

			{#if !editMode && brushOpen && canPaint && mapView === "light"}
				<MapBrushPalette
					hasColor={placedHasColor}
					hasColorTemp={placedHasColorTemp}
					hasSwitchable={placedHasSwitchable}
					armed={armedBrush}
					radiusPx={brushRadiusPx}
					onradiuschange={setBrushRadius}
					onarm={(b) => {
						if (b === null) disarmBrush();
						else armedBrush = b;
					}}
				/>
			{/if}

			{#if editMode && detachedRooms.length > 0}
				<DetachedRoomsCard
					rooms={detachedRooms}
					{hiveRoomById}
					ondiscard={(id) => {
						rooms = rooms.filter((r) => r.id !== id);
						takeSnapshot();
					}}
					ondragstart={(room, e) =>
						startRoomDrag(
							"detached",
							room.id,
							room.roomId
								? (hiveRoomById.get(room.roomId)?.name ?? room.name ?? "Room")
								: (room.name ?? "Room"),
							e,
						)}
					ondragmove={moveExternalDrag}
					ondragend={endExternalDrag}
					ondragcancel={clearExternalDrag}
				/>
			{/if}

			{#if editMode && graph.walls.length === 0}
				<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div class="rounded-lg shadow-card bg-card p-8 text-center">
						<div
							class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted"
						>
							<MapIcon class="size-6 text-muted-foreground" />
						</div>
						<p class="text-muted-foreground">No plan yet.</p>
						<p class="mt-2 text-sm text-muted-foreground">
							Pick the wall tool and click to start drawing.
						</p>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

{#if editMode && selectedFace && selectedLinkedRoom && (isMobile.current || panelAnchor) && !externalDrag}
	<!--
		Keyed on the room so moving from one to another builds a new panel rather
		than rewriting this one in place: the old fades out and the new fades in,
		the same as opening and closing it.
	-->
	{#key selectedLinkedRoom.id}
		<RoomPanel
			docked={isMobile.current}
			anchor={panelAnchor}
			linkedRoom={selectedLinkedRoom}
			deviceRows={panelDeviceRows}
			groupRows={panelGroupRows}
			ondevicedragstart={startDeviceDrag}
			ongroupdragstart={startGroupDrag}
			ondragmove={moveExternalDrag}
			ondragend={endExternalDrag}
			ondragcancel={clearExternalDrag}
			onremoveplacement={removePlacement}
			onclose={() => (selection = { ...emptySelection })}
		/>
	{/key}
{/if}

{#if editMode && renameRoom}
	<div
		bind:this={renameBoxEl}
		class="fixed z-50 w-56 rounded-md bg-popover p-2 shadow-md ring-1 ring-foreground/10"
		style="left: {renameAt.x}px; top: {renameAt.y}px;"
	>
		<Input
			bind:ref={renameInputEl}
			value={renameRoom.name ?? ""}
			placeholder="Room label"
			class="h-8 text-sm"
			oninput={(e) => {
				if (!renameRoomId) return;
				const v = e.currentTarget.value;
				updateRoomRow(renameRoomId, { name: v === "" ? null : v });
				queueMicrotask(takeSnapshot);
			}}
			onkeydown={(e) => {
				if (e.key === "Enter" || e.key === "Escape") renameRoomId = null;
			}}
		/>
	</div>
{/if}

{#if colorPickDevice}
	<!-- Anchored where the menu was, and dismissed by a click outside: the same
	     shape as the room rename field. -->
	<div
		bind:this={colorPickBoxEl}
		class="fixed z-50 w-64 rounded-md bg-popover p-3 shadow-md ring-1 ring-foreground/10"
		style="left: {colorPickAt.x}px; top: {colorPickAt.y}px;"
	>
		<LightColorPicker
			color={displayColorRgb}
			colorTemp={null}
			hasColor={true}
			hasColorTemp={true}
			hasBrightness={true}
			brightness={colorPickDevice?.displayBrightness ?? 254}
			onbrightnesschange={(v) => colorPickDeviceId && setDisplayBrightness(colorPickDeviceId, v)}
			oncolorchange={(c) => colorPickDeviceId && setDisplayColor(colorPickDeviceId, c)}
			ontempchange={(mired) =>
				colorPickDeviceId && setDisplayColor(colorPickDeviceId, miredToRgb(mired))}
		/>
	</div>
{/if}

<PlanPointMenu bind:open={markerMenuOpen} at={markerMenu} onclose={() => (markerMenu = null)}>
		{#if markerMenu?.placement.kind === "device"}
			<DropdownMenuItem onclick={menuOpenDevicePage}>
				<ExternalLink class="size-3.5" />
				Open device
			</DropdownMenuItem>
			{#if editMode && needsDisplayColor(markerMenu.placement.device)}
				<DropdownMenuItem onclick={menuSetDisplayColor}>
					<Palette class="size-3.5" />
					Set display color
				</DropdownMenuItem>
			{/if}
			<DropdownMenuSeparator />
		{/if}
		<DropdownMenuItem onclick={menuRemovePlacement}>
			<X class="size-3.5" />
			Remove from map
		</DropdownMenuItem>
</PlanPointMenu>

<PlanPointMenu bind:open={openingMenuOpen} at={openingMenu} onclose={() => (openingMenu = null)}>
		{#each openingKinds as k (k.id)}
			<DropdownMenuItem disabled={openingMenuKind === k.id} onclick={() => menuSetOpeningKind(k.id)}>
				<k.icon class="size-3.5" />
				{k.label}
			</DropdownMenuItem>
		{/each}
		<DropdownMenuSeparator />
		<DropdownMenuItem onclick={menuRemoveOpening}>
			<X class="size-3.5" />
			Remove opening
		</DropdownMenuItem>
</PlanPointMenu>

<PlanPointMenu bind:open={faceMenuOpen} at={faceMenu}>
		<DropdownMenuItem onclick={menuToggleLock}>
			{#if faceMenu?.unlocked}
				<Lock class="size-3.5" />
				Lock room
			{:else}
				<LockOpen class="size-3.5" />
				Unlock room
			{/if}
		</DropdownMenuItem>
		<DropdownMenuItem onclick={menuToggleCornerLock}>
			{#if faceMenu?.cornersFree}
				<Frame class="size-3.5" />
				Keep corners square
			{:else}
				<PenLine class="size-3.5" />
				Move corners freely
			{/if}
		</DropdownMenuItem>
		<DropdownMenuItem onclick={menuRename}>
			<Pencil class="size-3.5" />
			Rename
		</DropdownMenuItem>
		<DropdownMenuSeparator />
		{#if menuRoom?.roomId}
			<DropdownMenuItem onclick={menuUnlink}>
				<Unlink class="size-3.5" />
				Unlink room
			</DropdownMenuItem>
		{:else}
			<DropdownMenuItem onclick={menuLink}>
				<LinkIcon class="size-3.5" />
				Link room
			</DropdownMenuItem>
		{/if}
	<DropdownMenuSeparator />
		<DropdownMenuItem variant="destructive" onclick={menuDelete}>
			<Trash2 class="size-3.5" />
			Delete room
		</DropdownMenuItem>
		{#if menuRoomSize}
			<div class="mt-1 px-2 pt-1.5 pb-1 text-xs text-muted-foreground">
				{formatMeters(menuRoomSize.width)} × {formatMeters(menuRoomSize.height)}
			</div>
		{/if}
</PlanPointMenu>

<ConfirmDialog
	bind:open={conflictOpen}
	title="Already on the map"
	description="{pendingPlacement
		? refLabel(pendingPlacement.placement)
		: ''} covers these. They come off the map; nothing else changes."
	confirmLabel="Remove and place"
	onconfirm={confirmPlacement}
	oncancel={cancelPlacement}
>
	{#if pendingPlacement}
		<div class="rounded-lg bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
			<span>These markers leave the plan:</span>
			<div class="mt-2 flex flex-wrap gap-1.5">
				{#each pendingPlacement.conflict.displaced as d (placementKey(d))}
					<HiveChip type={d.memberType} label={refLabel(d)} />
				{/each}
			</div>
		</div>
	{/if}
</ConfirmDialog>

<ConfirmDialog
	bind:open={discardOpen}
	title="Discard changes?"
	description="Your unsaved changes to the plan will be lost."
	confirmLabel="Discard"
	onconfirm={confirmDiscard}
	oncancel={() => (discardOpen = false)}
/>

<HiveDrawer
	bind:open={drawerOpen}
	title="Link a Hive room"
	description="Drag a room onto the plan, or select it to stamp a linked room."
	groups={drawerGroups}
	onselect={handleDrawerSelect}
	ondragout={(item, e) => startRoomDrag("hive-room", item.id, item.name, e)}
/>

<PlanPointMenu
	bind:open={furnitureMenuOpen}
	at={furnitureMenu}
	onclose={() => (furnitureMenu = null)}
>
	{#if furnitureMenu}
		{@const piece = furnitureMenu.piece}
		{@const blockedBy = occludedLightNames(piece)}
		<DropdownMenuItem
			disabled={!piece.occluder && blockedBy !== null}
			onclick={() => {
				furnitureMenuOpen = false;
				toggleOccluder(piece);
			}}
		>
			{#if piece.occluder}
				<Check class="size-3.5" />
			{:else}
				<Ban class="size-3.5" />
			{/if}
			{piece.occluder
				? "Lets light through"
				: blockedBy
					? `${blockedBy} sits inside this piece`
					: "Blocks light"}
		</DropdownMenuItem>
		<DropdownMenuItem
			onclick={() => {
				furnitureMenuOpen = false;
				duplicateFurniture(piece);
			}}
		>
			<Copy class="size-3.5" />
			Duplicate
		</DropdownMenuItem>
		<DropdownMenuSeparator />
		<DropdownMenuItem
			onclick={() => {
				furnitureMenuOpen = false;
				removeFurniture(piece.id);
			}}
		>
			<X class="size-3.5" />
			Remove from plan
		</DropdownMenuItem>
	{/if}
</PlanPointMenu>

<HiveDrawer
	bind:open={furnitureDrawerOpen}
	title="Furniture"
	description="Drag a piece onto the plan. It arrives at its real size."
	groups={furnitureDrawerGroups}
	onselect={(_type, id) => placeFurnitureAtCentre(id)}
	ondragout={(item, e) => startFurnitureDrag(item.id, e)}
/>

<RoomDrawer
	room={openRoom}
	open={openRoomId !== null}
	devices={liveDevices}
	groups={hiveGroups}
	rooms={hiveRooms}
	{scenes}
	{client}
	onclose={closeRoomDrawer}
	onapplyscene={handleApplyScene}
/>
