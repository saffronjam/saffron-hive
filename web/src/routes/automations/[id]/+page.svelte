<script lang="ts">
	import { page } from "$app/state";
	import { deviceDisplayName, deviceSourceName, groupDisplayName, groupSourceName } from "$lib/utils";
	import { goto } from "$app/navigation";
	import { onMount, onDestroy, tick, untrack } from "svelte";
	import { fly } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { AUTOMATION_DETAIL_QUERY as AUTOMATION_QUERY } from "$lib/graphql/details";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import {
		Tabs,
		TabsContent,
		TabsList,
		TabsTrigger,
	} from "$lib/components/ui/tabs/index.js";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import IconPickerTrigger from "$lib/components/icon-picker-trigger.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import { Workflow } from "@lucide/svelte";
	import { isEditableTarget } from "$lib/utils/keyboard";
	import type { Clause } from "$lib/target-resolve";
	import dagre from "@dagrejs/dagre";
	import AutomationFlow from "$lib/components/graph/automation-flow.svelte";
	import type { FlowApi } from "$lib/components/graph/flow-bridge.svelte";
	import JsonEditor from "$lib/components/json-editor.svelte";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import {
		ArrowLeft,
		Trash2,
		Zap,
		ShieldCheck,
		GitMerge,
		Play,
		Eye,
		Pencil,
		Code,
		LayoutGrid,
		Undo2,
		Redo2,
		Rows3,
		Copy,
		ClipboardPaste,
		Plus,
		X,
		Lock,
		LockOpen,
	} from "@lucide/svelte";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu/index.js";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { HistoryStack } from "$lib/stores/history.svelte";
	import { type Node, type Edge, type Connection } from "@xyflow/svelte";
	import { deviceStore, isRuntimeEnabledDevice, type Device } from "$lib/stores/devices";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { scenesStore } from "$lib/stores/scenes.svelte";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";
	import { automationsStore } from "$lib/stores/automations.svelte";
	import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
	import { holdDrag } from "$lib/actions/hold-drag";
	import { haptics } from "$lib/stores/haptics.svelte";
	import {
		type TriggerConfig,
		defaultTriggerConfig,
		normalizeTriggerConfig,
		serializeTriggerConfig,
		generateFilterExpr,
		serializeOperatorConfig,
		normalizeActionConfig,
		serializeActionConfig,
		validateTriggerConfig,
		validateActionConfig,
	} from "$lib/components/graph/trigger-expr";
	import {
		type ConditionConfig,
		defaultConditionConfig,
		normalizeConditionConfig,
		serializeConditionConfig,
		validateConditionConfig,
	} from "$lib/components/graph/condition-expr";

	interface OperatorConfig {
		operator: string;
	}

	interface ActionConfig {
		actionType: string;
		targetType: string;
		targetId: string;
		targetName: string;
		targetExpr?: Clause[];
		payload: string;
	}

	type NodeConfig = TriggerConfig | ConditionConfig | OperatorConfig | ActionConfig;

	interface AutomationNodeData {
		id: string;
		type: string;
		config: string;
		positionX: number;
		positionY: number;
		runtimeState: string;
	}

	interface AutomationEdgeData {
		fromNodeId: string;
		toNodeId: string;
	}

	interface AutomationData {
		id: string;
		name: string;
		icon?: string | null;
		enabled: boolean;
		compilable: boolean;
		nodes: AutomationNodeData[];
		edges: AutomationEdgeData[];
	}

	interface GroupData {
		id: string;
		name?: string | null;
		friendlyName?: string | null;
		source: string;
		removed: boolean;
		members: { id: string; memberType: string; memberId: string }[];
	}

	interface AutomationQueryResult {
		automation: AutomationData | null;
	}

	interface UpdateAutomationResult {
		updateAutomation: AutomationData;
	}

	interface DevicesQueryResult {
		devices: Device[];
	}

	interface GroupsQueryResult {
		groups: GroupData[];
	}

	interface RoomData {
		id: string;
		name: string;
		members: { memberType: string; memberId: string }[];
		resolvedDevices: { id: string }[];
	}

	interface RoomsQueryResult {
		rooms: RoomData[];
	}

	interface AutomationNodeActivationResult {
		automationNodeActivated: {
			automationId: string;
			nodeId: string;
			active: boolean;
		};
	}

	const UPDATE_AUTOMATION = graphql(`
		mutation AutomationEditUpdate($id: ID!, $input: UpdateAutomationInput!) {
			updateAutomation(id: $id, input: $input) {
				id
				name
				icon
				enabled
				compilable
				nodes {
					id
					type
					config
					positionX
					positionY
					runtimeState
				}
				edges {
					fromNodeId
					toNodeId
				}
			}
		}
	`);

	const FIRE_AUTOMATION_TRIGGER = graphql(`
		mutation AutomationEditFireTrigger($automationId: ID!, $nodeId: ID!) {
			fireAutomationTrigger(automationId: $automationId, nodeId: $nodeId)
		}
	`);

	const EFFECTS_QUERY = graphql(`
		query AutomationEditEffects {
			effects {
				id
				name
			}
			nativeEffectOptions {
				name
				displayName
			}
		}
	`);

	const GROUP_REFERENCE_QUERY = graphql(`
		query AutomationEditGroupReference($id: ID!) {
			group(id: $id) {
				id
				name
				friendlyName
				source
				removed
				members {
					id
					memberType
					memberId
				}
			}
		}
	`);

	interface EffectsQueryResult {
		effects: { id: string; name: string }[];
		nativeEffectOptions: { name: string; displayName: string }[];
	}

	type EffectOption =
		| { kind: "timeline"; id: string; name: string }
		| { kind: "native"; nativeName: string; name: string };

	const NODE_ACTIVATED_SUBSCRIPTION = graphql(`
		subscription AutomationEditNodeActivated($automationId: ID) {
			automationNodeActivated(automationId: $automationId) {
				automationId
				nodeId
				active
			}
		}
	`);

	const automationId = $derived(page.params.id ?? "");
	const isMobile = new IsMobile();

	const client = getContextClient();
	const messageOptions = $derived(locale.messageOptions());

	let automationName = $state("");
	let automationIcon = $state<string | null>(null);

	$effect(() => {
		pageHeader.breadcrumbs = [
			{ label: m.nav_automations({}, messageOptions), href: "/automations" },
			{ label: automationName ? localizedNamesStore.display("automation", automationId, automationName) : m.automation_editor_fallback({}, messageOptions) },
		];
	});

	function handleCancel() {
		goto("/automations");
	}

	$effect(() => {
		pageHeader.actions = [
			{ label: m.common_cancel({}, messageOptions), icon: X, variant: "outline" as const, onclick: handleCancel, hideLabelOnMobile: true },
			{
				label: m.common_save({}, messageOptions),
				saving,
				onclick: handleSave,
				disabled: !editMode || saving || !isDirty,
				hideLabelOnMobile: true,
			},
			{ label: m.common_delete({}, messageOptions), icon: Trash2, variant: "destructive" as const, onclick: () => (deleteConfirmOpen = true), disabled: !editMode, hideLabelOnMobile: true },
		];
	});
	let automationEnabled = $state(false);
	let savedAutomationEnabled = $state(false);
	let automationCompilable = $state(false);
	let flowNodes = $state<Node[]>([]);
	let flowEdges = $state<Edge[]>([]);

	let editMode = $state(true);
	let placementMode = $state<"free" | "auto">("auto");
	let viewMode = $state<"visual" | "code">("visual");
	let initialAutoLayoutPending = $state(false);
	let jsonString = $state("");
	let jsonError = $state<string | null>(null);
	let syncSource = $state<"visual" | "code" | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	const errors = new BannerError();
	let deleteConfirmOpen = $state(false);
	let deleteLoading = $state(false);

	// Dropped at the source so every target picker, capability union and
	// selector on this page follows.
	const devices = $derived(Object.values($deviceStore).filter(isRuntimeEnabledDevice));
	let referencedRemovedGroups = $state<GroupData[]>([]);
	const groups = $derived.by<GroupData[]>(() => {
		const active = groupsStore.items;
		const activeIDs = new Set(active.map((group) => group.id));
		return [
			...active,
			...referencedRemovedGroups.filter((group) => !activeIDs.has(group.id)),
		];
	});
	const rooms = $derived(roomsStore.items);
	const scenes = $derived(scenesStore.items);
	let effects = $state<EffectOption[]>([]);
	const loadedGroupReferences = new Set<string>();

	function referencedGroupIDs(nodes: { config: string }[]): string[] {
		const ids = new Set<string>();
		function walk(value: unknown) {
			if (Array.isArray(value)) {
				for (const item of value) walk(item);
				return;
			}
			if (value === null || typeof value !== "object") return;
			const record = value as Record<string, unknown>;
			if (record.targetType === "group" && typeof record.targetId === "string") {
				ids.add(record.targetId);
			}
			if (record.subject === "group" && Array.isArray(record.values)) {
				for (const id of record.values) if (typeof id === "string") ids.add(id);
			}
			for (const child of Object.values(record)) walk(child);
		}
		for (const node of nodes) {
			try {
				walk(JSON.parse(node.config));
			} catch {
				continue;
			}
		}
		return Array.from(ids);
	}

	async function loadRemovedGroupReference(id: string) {
		const result = await client
			.query(GROUP_REFERENCE_QUERY, { id }, { requestPolicy: "network-only" })
			.toPromise();
		const group = result.data?.group;
		if (!group?.removed) return;
		referencedRemovedGroups = [
			...referencedRemovedGroups.filter((existing) => existing.id !== group.id),
			group,
		];
	}

	$effect(() => {
		const activeIDs = new Set(groupsStore.items.map((group) => group.id));
		for (const id of referencedGroupIDs(flowNodesToAutomationNodes(flowNodes))) {
			if (activeIDs.has(id) || loadedGroupReferences.has(id)) continue;
			loadedGroupReferences.add(id);
			void loadRemovedGroupReference(id);
		}
	});

	let activatedNodes = $state<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	let unsubscribers: (() => void)[] = [];

	let nodeIdCounter = $state(0);
	let flowApi: FlowApi | null = $state(null);
	type AutomationNodeType = "trigger" | "condition" | "operator" | "action";
	type GraphContextMenuState =
		| {
				kind: "canvas";
				x: number;
				y: number;
				position: { x: number; y: number };
		  }
		| {
				kind: "node";
				x: number;
				y: number;
				nodeId: string;
		  }
		| {
				kind: "selection";
				x: number;
				y: number;
				nodeIds: string[];
		  };
	let graphContextMenuOpen = $state(false);
	let graphContextMenuState = $state<GraphContextMenuState | null>(null);
	const graphContextMenuNode = $derived.by(() => {
		const state = graphContextMenuState;
		return state?.kind === "node"
			? flowNodes.find((node) => node.id === state.nodeId) ?? null
			: null;
	});
	let flowSurface: HTMLDivElement | null = $state(null);
	let graphContextMenuRequest = 0;
	let autoLayoutFrame: number | null = null;
	let layoutTweenFrame: number | null = null;
	let lockedNodeIds = $state<Set<string>>(new Set());
	const graphContextMenuSelectionAllLocked = $derived.by(() => {
		const state = graphContextMenuState;
		return state?.kind === "selection" && state.nodeIds.length > 0
			? state.nodeIds.every((id) => lockedNodeIds.has(id))
			: false;
	});
	let toolbarDrag = $state<{ nodeType: AutomationNodeType; x: number; y: number } | null>(null);
	let suppressToolbarClick = false;
	// In-editor copy buffer for duplicating selected nodes.
	let copyBuffer = $state<{ nodes: Node[]; edges: Edge[] } | null>(null);
	const anyNodeSelected = $derived(flowNodes.some((n) => n.selected));
	let restoringSnapshot = false;

	interface AutomationSnapshot {
		name: string;
		icon: string | null;
		enabled: boolean;
		nodes: Node[];
		edges: Edge[];
	}

	const history = new HistoryStack<AutomationSnapshot>();
	// Cursor of the snapshot that matches what's persisted in the DB. Set on
	// initial load and after each successful save. isDirty compares against this
	// so undo/redo back to the saved baseline cleanly turns Save off.
	let savedCursor = $state(0);
	const isDirty = $derived(history.cursor !== savedCursor);

	const hasValidationErrors = $derived.by(() => {
		for (const n of flowNodes) {
			const nodeType = n.type ?? "";
			const config = (n.data as Record<string, unknown>).config;
			let err: { field: string; code: string } | null = null;
			if (nodeType === "trigger") err = validateTriggerConfig(config as TriggerConfig);
			else if (nodeType === "condition") err = validateConditionConfig(config as ConditionConfig);
			else if (nodeType === "action") err = validateActionConfig(config as ActionConfig);
			if (err) return true;
		}
		return false;
	});

	const liveDisabled = $derived(
		saving || isDirty || hasValidationErrors || !automationCompilable,
	);

	function cloneNodes(nodes: Node[]): Node[] {
		return nodes.map((n) => {
			const data = n.data as Record<string, unknown>;
			const clonedData: Record<string, unknown> = {};
			for (const key of Object.keys(data)) {
				if (typeof data[key] !== "function") {
					clonedData[key] = data[key];
				}
			}
			if (typeof data.config === "object" && data.config !== null) {
				clonedData.config = JSON.parse(JSON.stringify(data.config));
			}
			return { ...n, position: { ...n.position }, data: clonedData };
		}) as Node[];
	}

	function cloneEdges(edges: Edge[]): Edge[] {
		return edges.map((e) => ({ ...e })) as Edge[];
	}

	function takeSnapshot() {
		takeSnapshotWithNodes(flowNodes);
	}

	function takeSnapshotWithNodes(nodes: Node[]) {
		if (restoringSnapshot) return;
		history.push({
			name: automationName,
			icon: automationIcon,
			enabled: automationEnabled,
			nodes: cloneNodes(nodes),
			edges: cloneEdges(flowEdges),
		});
	}

	function restoreSnapshot(snap: AutomationSnapshot) {
		restoringSnapshot = true;
		automationName = snap.name;
		automationIcon = snap.icon;
		automationEnabled = snap.enabled;
		flowNodes = snap.nodes.map((n) => {
			const nodeType = n.type ?? "trigger";
			const config = (n.data as Record<string, unknown>).config as NodeConfig;
			return {
				...n,
				draggable: !lockedNodeIds.has(n.id),
				data: makeNodeData(nodeType, config, editMode, false, n.id),
			};
		}) as Node[];
		flowEdges = snap.edges;
		restoringSnapshot = false;
		if (placementMode === "auto") scheduleAutoLayout();
	}

	function handleSort() {
		if (placementMode === "auto") return;
		const laidOut = layoutGraph(flowNodes, flowEdges);
		if (sameNodePositions(flowNodes, laidOut)) return;
		animateLayoutTo(laidOut);
		takeSnapshotWithNodes(laidOut);
	}

	function setPlacementMode(mode: "free" | "auto") {
		if (placementMode === mode) return;
		placementMode = mode;
		if (mode !== "auto") return;
		const laidOut = layoutGraph(flowNodes, flowEdges);
		if (sameNodePositions(flowNodes, laidOut)) return;
		animateLayoutTo(laidOut);
		takeSnapshotWithNodes(laidOut);
	}

	function handleCopy() {
		const selectedNodes = flowNodes.filter((n) => n.selected);
		copyNodes(selectedNodes);
	}

	function copyNodes(nodes: Node[]) {
		if (nodes.length === 0) return;
		const selectedIds = new Set(nodes.map((n) => n.id));
		const internalEdges = flowEdges.filter(
			(e) => selectedIds.has(e.source) && selectedIds.has(e.target)
		);
		copyBuffer = {
			nodes: cloneNodes(nodes),
			edges: cloneEdges(internalEdges),
		};
	}

	function handlePaste(position?: { x: number; y: number }) {
		if (!copyBuffer || copyBuffer.nodes.length === 0) return;
		const idMap = new Map<string, string>();
		for (const n of copyBuffer.nodes) {
			idMap.set(n.id, `node-${crypto.randomUUID()}`);
		}
		const offset = 48;
		const minX = Math.min(...copyBuffer.nodes.map((node) => node.position.x));
		const minY = Math.min(...copyBuffer.nodes.map((node) => node.position.y));
		const newNodes: Node[] = copyBuffer.nodes.map((n) => {
			const newId = idMap.get(n.id)!;
			const nodeType = n.type ?? "trigger";
			const config = (n.data as Record<string, unknown>).config as NodeConfig;
			return {
				...n,
				id: newId,
				position: position
					? { x: position.x + n.position.x - minX, y: position.y + n.position.y - minY }
					: { x: n.position.x + offset, y: n.position.y + offset },
				draggable: true,
				selected: true,
				// Rebuild data so callbacks (onConfigChange etc.) close over the new
				// nodeId. Reuse the existing makeNodeData so trigger/condition/action
				// wiring stays consistent.
				data: makeNodeData(nodeType, config, editMode, false, newId),
			};
		});
		const newEdges: Edge[] = copyBuffer.edges.map((e) => ({
			...e,
			id: `edge-${crypto.randomUUID()}`,
			source: idMap.get(e.source) ?? e.source,
			target: idMap.get(e.target) ?? e.target,
		}));
		flowNodes = [
			...flowNodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
			...newNodes,
		];
		flowEdges = [...flowEdges, ...newEdges];
		takeSnapshot();
	}

	function handleUndo() {
		const snap = history.undo();
		if (snap) restoreSnapshot(snap);
	}

	function handleRedo() {
		const snap = history.redo();
		if (snap) restoreSnapshot(snap);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!editMode) return;
		// Don't hijack native copy/paste/undo inside form fields. Graph-level
		// shortcuts only fire when focus is on the canvas (or nothing).
		if (isEditableTarget(e.target)) return;
		const mod = e.metaKey || e.ctrlKey;
		if (mod && e.key === "z" && !e.shiftKey) {
			e.preventDefault();
			handleUndo();
		} else if (mod && (e.key === "Z" || e.key === "y")) {
			e.preventDefault();
			handleRedo();
		} else if (mod && e.key === "c") {
			if (!anyNodeSelected) return;
			e.preventDefault();
			handleCopy();
		} else if (mod && e.key === "v") {
			if (!copyBuffer) return;
			e.preventDefault();
			handlePaste();
		}
	}

	function enrichTriggerConfigWithDevice(cfg: TriggerConfig): TriggerConfig {
		// normalizeTriggerConfig can only recover one of {deviceId, deviceName}
		// from an expression depending on the mode — look up the other side in
		// the loaded devices list so the UI has both.
		if (!devices.length) return cfg;
		if (cfg.deviceId && !cfg.deviceName) {
			const d = devices.find((x) => x.id === cfg.deviceId);
			if (d) return { ...cfg, deviceName: deviceSourceName(d) };
		}
		if (cfg.deviceName && !cfg.deviceId) {
			const d = devices.find((x) => deviceSourceName(x) === cfg.deviceName);
			if (d) return { ...cfg, deviceId: d.id };
		}
		return cfg;
	}

	function enrichConditionConfigWithTarget(cfg: ConditionConfig): ConditionConfig {
		// The stored expression carries only the target name (the expr-lang
		// `device(...)` lookup is overloaded server-side across devices,
		// groups, and rooms). Resolve the live ID and target type so the UI
		// dropdown pre-selects the correct row.
		if (cfg.mode !== "device_state") return cfg;
		if (!cfg.targetName) {
			if (cfg.targetId && cfg.targetType === "device") {
				const d = devices.find((x) => x.id === cfg.targetId);
				if (d) return { ...cfg, targetName: deviceSourceName(d) };
			}
			return cfg;
		}
		const dev = devices.find((x) => deviceSourceName(x) === cfg.targetName);
		if (dev) return { ...cfg, targetType: "device", targetId: dev.id };
		const grp = groups.find((g) => groupSourceName(g) === cfg.targetName);
		if (grp) return { ...cfg, targetType: "group", targetId: grp.id };
		const room = rooms.find((r) => r.name === cfg.targetName);
		if (room) return { ...cfg, targetType: "room", targetId: room.id };
		return cfg;
	}

	function parseConfig(nodeType: string, configJson: string): NodeConfig {
		try {
			const raw = JSON.parse(configJson) as Record<string, unknown>;
			if (nodeType === "trigger") {
				return enrichTriggerConfigWithDevice(normalizeTriggerConfig(raw));
			}
			if (nodeType === "condition") {
				return enrichConditionConfigWithTarget(normalizeConditionConfig(raw));
			}
			if (nodeType === "operator") {
				return { operator: ((raw.kind as string) ?? (raw.operator as string) ?? "AND").toUpperCase() };
			}
			if (nodeType === "action") {
				return normalizeActionConfig(raw);
			}
			return raw as unknown as NodeConfig;
		} catch {
			return defaultTriggerConfig();
		}
	}

	function defaultOperatorConfig(): OperatorConfig {
		return { operator: "AND" };
	}

	function defaultActionConfig(): ActionConfig {
		return { actionType: "", targetType: "", targetId: "", targetName: "", payload: "" };
	}

	function deleteNode(nodeId: string) {
		flowNodes = flowNodes.filter((n) => n.id !== nodeId);
		flowEdges = flowEdges.filter((e) => e.source !== nodeId && e.target !== nodeId);
		if (lockedNodeIds.has(nodeId)) {
			const next = new Set(lockedNodeIds);
			next.delete(nodeId);
			lockedNodeIds = next;
		}
		takeSnapshot();
	}

	function makeNodeData(
		nodeType: string,
		config: NodeConfig,
		isEditable: boolean,
		isActivated: boolean,
		nodeId: string,
		runtimeState: string = "{}",
	): Record<string, unknown> {
		const onConfigChange = (newConfig: NodeConfig) => {
			if (!editMode) return;
			flowNodes = flowNodes.map((n) =>
				n.id === nodeId ? { ...n, data: { ...n.data, config: newConfig } } : n
			);
			queueMicrotask(takeSnapshot);
		};

		const base = {
			config,
			readOnly: !isEditable,
			activated: isActivated,
			onConfigChange,
		};

		if (nodeType === "trigger") {
			return {
				...base,
				devices,
				rooms,
				automationEnabled,
			};
		}

		if (nodeType === "condition") {
			return {
				...base,
				devices,
				groups,
				rooms,
			};
		}

		if (nodeType === "action") {
			return {
				...base,
				devices,
				groups,
				rooms,
				scenes,
				effects,
				runtimeState,
			};
		}

		return base;
	}

	const EDGE_STYLE_IDLE = "stroke: var(--color-muted-foreground); stroke-width: 1px; opacity: 0.5;";
	const EDGE_STYLE_SELECTED = "stroke: var(--color-foreground); stroke-width: 2px; opacity: 1;";
	// Active-edge color matches the source node's theme color so the user can
	// tell at a glance what's driving a given line during Live mode.
	const EDGE_STYLE_ACTIVE_BY_TYPE: Record<string, string> = {
		trigger: "stroke: var(--color-automation-trigger); stroke-width: 2px; opacity: 1;",
		condition: "stroke: var(--color-automation-condition); stroke-width: 2px; opacity: 1;",
		operator: "stroke: var(--color-automation-operator); stroke-width: 2px; opacity: 1;",
		action: "stroke: var(--color-automation-action); stroke-width: 2px; opacity: 1;",
	};
	const EDGE_STYLE_ACTIVE_FALLBACK = "stroke: var(--color-automation-trigger); stroke-width: 2px; opacity: 1;";

	const COLUMN_ORDER = ["trigger", "condition", "operator", "action"] as const;
	const COLUMN_WIDTH = 280;
	const ROW_SPACING: Record<string, number> = {
		trigger: 320,
		condition: 320,
		operator: 150,
		action: 300,
	};

	// Fallback dimensions used when a node hasn't been measured by xyflow yet
	// (e.g. on first load before mount). These are upper-bound estimates so
	// dagre leaves enough vertical room — a too-small height is what produced
	// the overlapping rows in the old type-bucketed layout.
	const NODE_FALLBACK_DIMS: Record<string, { width: number; height: number }> = {
		trigger: { width: 256, height: 360 },
		condition: { width: 256, height: 280 },
		operator: { width: 176, height: 140 },
		action: { width: 256, height: 320 },
	};

	// layoutGraph runs dagre's hierarchical algorithm left-to-right with
	// per-node measured dimensions, producing a layout that respects edge
	// directionality and minimises crossings. Falls back to per-type
	// estimates when a node hasn't been measured yet.
	function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
		const g = new dagre.graphlib.Graph();
		g.setDefaultEdgeLabel(() => ({}));
		g.setGraph({ rankdir: "LR", ranksep: 80, nodesep: 40, marginx: 20, marginy: 20 });

		for (const n of nodes) {
			const measured = n.measured;
			const fallback = NODE_FALLBACK_DIMS[n.type ?? ""] ?? { width: 256, height: 240 };
			g.setNode(n.id, {
				width: measured?.width ?? fallback.width,
				height: measured?.height ?? fallback.height,
			});
		}
		for (const e of edges) {
			g.setEdge(e.source, e.target);
		}

		dagre.layout(g);

		return nodes.map((n) => {
			const laid = g.node(n.id);
			if (!laid) return n;
			return {
				...n,
				position: { x: laid.x - laid.width / 2, y: laid.y - laid.height / 2 },
			};
		});
	}

	function sameNodePositions(left: Node[], right: Node[]): boolean {
		if (left.length !== right.length) return false;
		return left.every((node, index) => {
			const next = right[index];
			return (
				next?.id === node.id &&
				Math.abs(next.position.x - node.position.x) < 0.5 &&
				Math.abs(next.position.y - node.position.y) < 0.5
			);
		});
	}

	function animateLayoutTo(targetNodes: Node[]) {
		if (layoutTweenFrame !== null) cancelAnimationFrame(layoutTweenFrame);
		const starts = new Map(flowNodes.map((node) => [node.id, { ...node.position }]));
		const targets = new Map(targetNodes.map((node) => [node.id, { ...node.position }]));
		const startedAt = performance.now();
		const duration = 250;

		const step = (now: number) => {
			const progress = Math.min(1, (now - startedAt) / duration);
			const eased = 1 - Math.pow(1 - progress, 3);
			flowNodes = flowNodes.map((node) => {
				const start = starts.get(node.id);
				const target = targets.get(node.id);
				if (!start || !target) return node;
				return {
					...node,
					position: {
						x: start.x + (target.x - start.x) * eased,
						y: start.y + (target.y - start.y) * eased,
					},
				};
			});
			if (progress < 1) {
				layoutTweenFrame = requestAnimationFrame(step);
			} else {
				layoutTweenFrame = null;
			}
		};

		layoutTweenFrame = requestAnimationFrame(step);
	}

	function applyInitialAutoLayout() {
		if (!initialAutoLayoutPending) return;
		if (placementMode === "auto") {
			const laidOut = layoutGraph(flowNodes, flowEdges);
			if (!sameNodePositions(flowNodes, laidOut)) flowNodes = laidOut;
		}
		initialAutoLayoutPending = false;
	}

	function scheduleAutoLayout() {
		if (initialAutoLayoutPending) return;
		if (autoLayoutFrame !== null) cancelAnimationFrame(autoLayoutFrame);
		autoLayoutFrame = requestAnimationFrame(() => {
			autoLayoutFrame = null;
			if (placementMode !== "auto") return;
			const laidOut = layoutGraph(flowNodes, flowEdges);
			if (!sameNodePositions(flowNodes, laidOut)) animateLayoutTo(laidOut);
		});
	}

	const autoLayoutSignature = $derived.by(() => {
		const nodes = flowNodes
			.map(
				(node) =>
					`${node.id}:${node.type ?? ""}:${node.measured?.width ?? 0}:${node.measured?.height ?? 0}`
			)
			.join("|");
		const edges = flowEdges.map((edge) => `${edge.source}>${edge.target}`).join("|");
		return `${nodes}::${edges}`;
	});

	$effect(() => {
		const mode = placementMode;
		void autoLayoutSignature;
		if (mode === "auto") untrack(scheduleAutoLayout);
	});

	function automationNodesToFlowNodes(
		nodes: AutomationNodeData[],
		edges: AutomationEdgeData[],
		isEditable: boolean,
		activatedSet: Map<string, ReturnType<typeof setTimeout>>
	): Node[] {
		const allZeroPositions = nodes.every((n) => n.positionX === 0 && n.positionY === 0);
		const baseNodes: Node[] = nodes.map((n) => {
			const config = parseConfig(n.type, n.config);
			return {
				id: n.id,
				type: n.type,
				position: { x: n.positionX, y: n.positionY },
				data: makeNodeData(n.type, config, isEditable, activatedSet.has(n.id), n.id, n.runtimeState),
			};
		});
		if (!allZeroPositions) return baseNodes;
		const layoutEdges: Edge[] = edges.map((e) => ({
			id: `edge-${e.fromNodeId}-${e.toNodeId}`,
			source: e.fromNodeId,
			target: e.toNodeId,
		}));
		return layoutGraph(baseNodes, layoutEdges);
	}

	function automationEdgesToFlowEdges(edges: AutomationEdgeData[]): Edge[] {
		return edges.map((e) => ({
			id: `edge-${e.fromNodeId}-${e.toNodeId}`,
			source: e.fromNodeId,
			target: e.toNodeId,
			animated: true,
		}));
	}

	function flowNodesToAutomationNodes(
		nodes: Node[]
	): { id: string; type: string; config: string; positionX: number; positionY: number }[] {
		return nodes.map((n) => {
			const nodeType = n.type ?? "trigger";
			const config = (n.data as Record<string, unknown>).config;
			let serialized: string;
			switch (nodeType) {
				case "trigger":
					serialized = serializeTriggerConfig(config as TriggerConfig);
					break;
				case "condition":
					serialized = serializeConditionConfig(config as ConditionConfig);
					break;
				case "operator":
					serialized = serializeOperatorConfig(config as OperatorConfig);
					break;
				case "action":
					serialized = serializeActionConfig(config as ActionConfig);
					break;
				default:
					serialized = JSON.stringify(config);
			}
			return {
				id: n.id,
				type: nodeType,
				config: serialized,
				positionX: n.position?.x ?? 0,
				positionY: n.position?.y ?? 0,
			};
		});
	}

	function flowEdgesToAutomationEdges(
		edges: Edge[],
		nodes: Node[]
	): { fromNodeId: string; toNodeId: string }[] {
		const validNodeIds = new Set(nodes.map((n) => n.id));
		const seen = new Set<string>();
		const result: { fromNodeId: string; toNodeId: string }[] = [];
		for (const e of edges) {
			if (!validNodeIds.has(e.source) || !validNodeIds.has(e.target)) continue;
			const key = `${e.source}->${e.target}`;
			if (seen.has(key)) continue;
			seen.add(key);
			result.push({ fromNodeId: e.source, toNodeId: e.target });
		}
		return result;
	}

	interface AutomationJson {
		name: string;
		nodes: {
			id: string;
			type: string;
			config: Record<string, unknown>;
			positionX: number;
			positionY: number;
		}[];
		edges: { from: string; to: string }[];
	}

	function flowStateToJson(): string {
		const obj: AutomationJson = {
			name: automationName,
			nodes: flowNodes.map((n) => {
				const nodeType = n.type ?? "trigger";
				const config = (n.data as Record<string, unknown>).config;
				const serialized = (() => {
					switch (nodeType) {
						case "trigger":
							return JSON.parse(serializeTriggerConfig(config as TriggerConfig));
						case "condition":
							return JSON.parse(serializeConditionConfig(config as ConditionConfig));
						case "operator":
							return JSON.parse(serializeOperatorConfig(config as OperatorConfig));
						case "action":
							return JSON.parse(serializeActionConfig(config as ActionConfig));
						default:
							return config;
					}
				})();
				return {
					id: n.id,
					type: nodeType,
					config: serialized as Record<string, unknown>,
					positionX: n.position?.x ?? 0,
					positionY: n.position?.y ?? 0,
				};
			}),
			edges: flowEdges.map((e) => ({
				from: e.source,
				to: e.target,
			})),
		};
		return JSON.stringify(obj, null, 2);
	}

	function jsonToFlowState(jsonStr: string): { ok: true; name: string; nodes: AutomationNodeData[]; edges: AutomationEdgeData[] } | { ok: false; error: string } {
		let parsed: unknown;
		try {
			parsed = JSON.parse(jsonStr);
		} catch (e) {
			return { ok: false, error: (e as SyntaxError).message };
		}

		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
			return { ok: false, error: "Root must be an object" };
		}

		const obj = parsed as Record<string, unknown>;

		if (typeof obj.name !== "string") {
			return { ok: false, error: "\"name\" must be a string" };
		}

		if (!Array.isArray(obj.nodes)) {
			return { ok: false, error: "\"nodes\" must be an array" };
		}

		const validTypes = new Set(["trigger", "operator", "action"]);
		const nodeIds = new Set<string>();

		for (let i = 0; i < obj.nodes.length; i++) {
			const node = obj.nodes[i] as Record<string, unknown>;
			if (typeof node.id !== "string") {
				return { ok: false, error: `nodes[${i}]: "id" must be a string` };
			}
			if (typeof node.type !== "string" || !validTypes.has(node.type)) {
				return { ok: false, error: `nodes[${i}]: "type" must be one of trigger, operator, action` };
			}
			if (typeof node.config !== "object" || node.config === null || Array.isArray(node.config)) {
				return { ok: false, error: `nodes[${i}]: "config" must be an object` };
			}
			nodeIds.add(node.id);
		}

		if (!Array.isArray(obj.edges)) {
			return { ok: false, error: "\"edges\" must be an array" };
		}

		for (let i = 0; i < obj.edges.length; i++) {
			const edge = obj.edges[i] as Record<string, unknown>;
			if (typeof edge.from !== "string") {
				return { ok: false, error: `edges[${i}]: "from" must be a string` };
			}
			if (typeof edge.to !== "string") {
				return { ok: false, error: `edges[${i}]: "to" must be a string` };
			}
			if (!nodeIds.has(edge.from)) {
				return { ok: false, error: `edges[${i}]: "from" references unknown node "${edge.from}"` };
			}
			if (!nodeIds.has(edge.to)) {
				return { ok: false, error: `edges[${i}]: "to" references unknown node "${edge.to}"` };
			}
		}

		const nodes: AutomationNodeData[] = (obj.nodes as Record<string, unknown>[]).map((n) => ({
			id: n.id as string,
			type: n.type as string,
			config: JSON.stringify(n.config),
			positionX: typeof n.positionX === "number" ? n.positionX : 0,
			positionY: typeof n.positionY === "number" ? n.positionY : 0,
			runtimeState: "{}",
		}));

		const edges: AutomationEdgeData[] = (obj.edges as Record<string, unknown>[]).map((e) => ({
			fromNodeId: e.from as string,
			toNodeId: e.to as string,
		}));

		return { ok: true, name: obj.name, nodes, edges };
	}

	function syncJsonFromGraph() {
		if (syncSource === "code") return;
		syncSource = "visual";
		jsonString = flowStateToJson();
		syncSource = null;
	}

	function handleJsonChange(newValue: string) {
		if (syncSource === "visual") return;
		syncSource = "code";
		const result = jsonToFlowState(newValue);
		if (result.ok) {
			jsonError = null;
			automationName = result.name;
			flowNodes = automationNodesToFlowNodes(result.nodes, result.edges, editMode, activatedNodes);
			flowEdges = automationEdgesToFlowEdges(result.edges);
			takeSnapshot();
		} else {
			console.error("Invalid automation JSON", result.error);
			jsonError = m.automation_validation_json_invalid({}, messageOptions);
		}
		syncSource = null;
	}

	function nextPositionForType(
		existingNodes: Node[],
		newType: (typeof COLUMN_ORDER)[number]
	): { x: number; y: number } {
		const presentTypes = COLUMN_ORDER.filter(
			(t) => t === newType || existingNodes.some((n) => n.type === t)
		);
		const colIndex = presentTypes.indexOf(newType);
		const existingOfType = existingNodes.filter((n) => n.type === newType).length;
		const spacing = ROW_SPACING[newType] ?? 250;
		return { x: colIndex * COLUMN_WIDTH, y: existingOfType * spacing };
	}

	function addNode(nodeType: AutomationNodeType, position?: { x: number; y: number }) {
		nodeIdCounter++;
		// Use a globally unique ID so saves from different browser sessions or
		// automations don't collide on the automation_nodes.id PRIMARY KEY.
		const tempId = `node-${crypto.randomUUID()}`;

		let config: NodeConfig;
		switch (nodeType) {
			case "trigger":
				config = defaultTriggerConfig();
				break;
			case "condition":
				config = defaultConditionConfig();
				break;
			case "operator":
				config = defaultOperatorConfig();
				break;
			case "action":
				config = defaultActionConfig();
				break;
		}

		const newNode: Node = {
			id: tempId,
			type: nodeType,
			position: position ?? nextPositionForType(flowNodes, nodeType),
			data: makeNodeData(nodeType, config, editMode, false, tempId),
		};

		flowNodes = [...flowNodes, newNode];
		takeSnapshot();
		queueMicrotask(() => flowApi?.panToNode(tempId));
	}

	function toolbarNodeLabel(nodeType: AutomationNodeType): string {
		switch (nodeType) {
			case "trigger": return m.automation_node_trigger({}, messageOptions);
			case "condition": return m.automation_node_condition({}, messageOptions);
			case "operator": return m.automation_operator_title({}, messageOptions);
			case "action": return m.automation_node_action({}, messageOptions);
		}
	}

	function startToolbarNodeDrag(nodeType: AutomationNodeType, event: PointerEvent) {
		toolbarDrag = { nodeType, x: event.clientX, y: event.clientY };
		suppressToolbarClick = true;
	}

	function moveToolbarNodeDrag(event: PointerEvent) {
		if (!toolbarDrag) return;
		toolbarDrag = { ...toolbarDrag, x: event.clientX, y: event.clientY };
	}

	function endToolbarNodeDrag(event: PointerEvent) {
		const drag = toolbarDrag;
		toolbarDrag = null;
		setTimeout(() => (suppressToolbarClick = false));
		if (!drag || !flowApi || !flowSurface) return;
		const bounds = flowSurface.getBoundingClientRect();
		if (
			event.clientX < bounds.left ||
			event.clientX > bounds.right ||
			event.clientY < bounds.top ||
			event.clientY > bounds.bottom
		) return;
		const point = flowApi.screenToFlowPosition({ x: event.clientX, y: event.clientY });
		const width = NODE_FALLBACK_DIMS[drag.nodeType]?.width ?? 256;
		addNode(drag.nodeType, { x: point.x - width / 2, y: point.y - 24 });
	}

	function cancelToolbarNodeDrag() {
		toolbarDrag = null;
		setTimeout(() => (suppressToolbarClick = false));
	}

	function addNodeFromToolbar(nodeType: AutomationNodeType) {
		if (suppressToolbarClick) return;
		addNode(nodeType);
	}

	async function openGraphContextMenu(state: GraphContextMenuState) {
		const request = ++graphContextMenuRequest;
		graphContextMenuOpen = false;
		graphContextMenuState = state;
		await tick();
		if (request === graphContextMenuRequest) graphContextMenuOpen = true;
	}

	function handleCanvasContextMenu(event: MouseEvent) {
		if (!editMode || !flowApi) return;
		event.preventDefault();
		event.stopPropagation();
		void openGraphContextMenu({
			kind: "canvas",
			x: event.clientX,
			y: event.clientY,
			position: flowApi.screenToFlowPosition({ x: event.clientX, y: event.clientY }),
		});
	}

	function handleFlowSurfaceContextMenu(event: MouseEvent) {
		if (!editMode || !flowApi) return;
		event.preventDefault();
		event.stopPropagation();
		const selectedNodeIds = flowNodes.filter((node) => node.selected).map((node) => node.id);
		if (selectedNodeIds.length > 1) {
			void openGraphContextMenu({
				kind: "selection",
				x: event.clientX,
				y: event.clientY,
				nodeIds: selectedNodeIds,
			});
			return;
		}
		handleCanvasContextMenu(event);
	}

	function addNodeFromCanvas(nodeType: AutomationNodeType) {
		const state = graphContextMenuState;
		graphContextMenuOpen = false;
		graphContextMenuState = null;
		if (state?.kind === "canvas") addNode(nodeType, state.position);
	}

	function pasteFromCanvas() {
		const state = graphContextMenuState;
		graphContextMenuOpen = false;
		graphContextMenuState = null;
		if (state?.kind === "canvas") handlePaste(state.position);
	}

	function handleNodeContextMenu(event: MouseEvent, node: Node) {
		if (!editMode && node.type !== "trigger") return;
		event.preventDefault();
		event.stopPropagation();
		const selectedNodeIds = flowNodes.filter((candidate) => candidate.selected).map((candidate) => candidate.id);
		if (editMode && node.selected && selectedNodeIds.length > 1) {
			void openGraphContextMenu({
				kind: "selection",
				x: event.clientX,
				y: event.clientY,
				nodeIds: selectedNodeIds,
			});
			return;
		}
		void openGraphContextMenu({
			kind: "node",
			x: event.clientX,
			y: event.clientY,
			nodeId: node.id,
		});
	}

	async function handleOpenGraphContextMenu(event: MouseEvent) {
		if (!graphContextMenuOpen || !flowApi || !flowSurface) return;
		event.preventDefault();
		const { clientX, clientY } = event;
		graphContextMenuOpen = false;
		await tick();

		const bounds = flowSurface.getBoundingClientRect();
		if (
			clientX < bounds.left ||
			clientX > bounds.right ||
			clientY < bounds.top ||
			clientY > bounds.bottom
		) {
			graphContextMenuState = null;
			return;
		}

		const target = document.elementFromPoint(clientX, clientY);
		const nodeElement = target?.closest<HTMLElement>(".svelte-flow__node");
		const nodeId = nodeElement?.dataset.id;
		const node = nodeId ? flowNodes.find((candidate) => candidate.id === nodeId) : undefined;
		if (node && (editMode || node.type === "trigger")) {
			const selectedNodeIds = flowNodes.filter((candidate) => candidate.selected).map((candidate) => candidate.id);
			if (editMode && node.selected && selectedNodeIds.length > 1) {
				await openGraphContextMenu({ kind: "selection", x: clientX, y: clientY, nodeIds: selectedNodeIds });
				return;
			}
			await openGraphContextMenu({ kind: "node", x: clientX, y: clientY, nodeId: node.id });
			return;
		}
		if (!editMode) {
			graphContextMenuState = null;
			return;
		}

		await openGraphContextMenu({
			kind: "canvas",
			x: clientX,
			y: clientY,
			position: flowApi.screenToFlowPosition({ x: clientX, y: clientY }),
		});
	}

	function toggleNodeLock() {
		const state = graphContextMenuState;
		graphContextMenuOpen = false;
		graphContextMenuState = null;
		if (state?.kind !== "node") return;
		const next = new Set(lockedNodeIds);
		if (next.has(state.nodeId)) next.delete(state.nodeId);
		else next.add(state.nodeId);
		lockedNodeIds = next;
		flowNodes = flowNodes.map((node) =>
			node.id === state.nodeId ? { ...node, draggable: !next.has(state.nodeId) } : node
		);
	}

	function toggleSelectionLock() {
		const state = graphContextMenuState;
		graphContextMenuOpen = false;
		graphContextMenuState = null;
		if (state?.kind !== "selection") return;
		const next = new Set(lockedNodeIds);
		const unlock = state.nodeIds.every((id) => next.has(id));
		for (const id of state.nodeIds) {
			if (unlock) next.delete(id);
			else next.add(id);
		}
		lockedNodeIds = next;
		flowNodes = flowNodes.map((node) =>
			state.nodeIds.includes(node.id) ? { ...node, draggable: !next.has(node.id) } : node
		);
	}

	function deleteNodeFromContextMenu() {
		const state = graphContextMenuState;
		graphContextMenuOpen = false;
		graphContextMenuState = null;
		if (state?.kind === "node") deleteNode(state.nodeId);
	}

	function deleteSelectionFromContextMenu() {
		const state = graphContextMenuState;
		graphContextMenuOpen = false;
		graphContextMenuState = null;
		if (state?.kind !== "selection") return;
		const deletedIds = new Set(state.nodeIds);
		flowNodes = flowNodes.filter((node) => !deletedIds.has(node.id));
		flowEdges = flowEdges.filter(
			(edge) => !deletedIds.has(edge.source) && !deletedIds.has(edge.target)
		);
		const nextLocked = new Set(lockedNodeIds);
		for (const id of state.nodeIds) nextLocked.delete(id);
		lockedNodeIds = nextLocked;
		takeSnapshot();
	}

	function copyNodeFromContextMenu() {
		const state = graphContextMenuState;
		graphContextMenuOpen = false;
		graphContextMenuState = null;
		if (state?.kind !== "node") return;
		const node = flowNodes.find((candidate) => candidate.id === state.nodeId);
		if (node) copyNodes([node]);
	}

	function fireTriggerFromContextMenu(event: MouseEvent) {
		const state = graphContextMenuState;
		graphContextMenuOpen = false;
		graphContextMenuState = null;
		if (savedAutomationEnabled && state?.kind === "node") {
			haptics.play("execute", event);
			void handleFireTrigger(state.nodeId);
		}
	}

	async function copyTriggerConditionFromContextMenu() {
		const node = graphContextMenuNode;
		graphContextMenuOpen = false;
		graphContextMenuState = null;
		if (node?.type !== "trigger") return;
		const config = (node.data as Record<string, unknown>).config as TriggerConfig;
		await navigator.clipboard.writeText(generateFilterExpr(config));
	}

	function handleConnect(_connection: Connection) {
		takeSnapshot();
	}

	function resolveTargetName(
		targetType: string,
		targetId: string,
		deviceList: Device[],
		groupList: GroupData[],
		roomList: RoomData[],
	): string {
		if (!targetId) return "";
		switch (targetType) {
			case "device":
				return deviceSourceName(deviceList.find((d) => d.id === targetId) ?? { id: targetId });
			case "group": {
				const group = groupList.find((candidate) => candidate.id === targetId);
				return group ? groupSourceName(group) : "";
			}
			case "room":
				return roomList.find((r) => r.id === targetId)?.name ?? "";
			case "scene":
				return scenes.find((s) => s.id === targetId)?.name ?? "";
			default:
				return "";
		}
	}

	// Re-attach devices / groups / rooms to every node whose UI needs them.
	// Node data is captured at makeNodeData() time with the *current* value of
	// these arrays, so nodes built before the queries resolve carry empty
	// lists and never self-update — xyflow doesn't pass new props, so we
	// rewrite data in place when the queries arrive.
	function hydrateNodesWithLookups(
		deviceList: Device[],
		groupList: GroupData[],
		roomList: RoomData[],
		sceneList: { id: string; name: string }[],
		effectList: EffectOption[],
	) {
		flowNodes = flowNodes.map((n) => {
			const data = n.data as Record<string, unknown>;
			if (n.type === "trigger") {
				const cfg = enrichTriggerConfigWithDevice(data.config as TriggerConfig);
				return { ...n, data: { ...data, devices: deviceList, rooms: roomList, config: cfg } };
			}
			if (n.type === "condition") {
				const cfg = enrichConditionConfigWithTarget(data.config as ConditionConfig);
				return {
					...n,
					data: {
						...data,
						devices: deviceList,
						groups: groupList,
						rooms: roomList,
						config: cfg,
					},
				};
			}
			if (n.type === "action") {
				const cfg = data.config as ActionConfig;
				// targetName isn't persisted; rehydrate it from the live lookups so
				// reloaded automations don't display "device:0x001...". Prefer the
				// existing in-memory name to avoid clobbering a value the user just
				// picked while lookups were resolving.
				let name = cfg.targetName;
				if (!name) {
					name = resolveTargetName(cfg.targetType, cfg.targetId, deviceList, groupList, roomList);
				}
				const nextCfg = name === cfg.targetName ? cfg : { ...cfg, targetName: name };
				return {
					...n,
					data: {
						...data,
						devices: deviceList,
						groups: groupList,
						rooms: roomList,
						scenes: sceneList,
						effects: effectList,
						config: nextCfg,
					},
				};
			}
			return n;
		});
	}

	$effect(() => {
		const deviceList = devices;
		const groupList = groups;
		const roomList = rooms;
		const sceneList = scenes;
		const effectList = effects;
		// Trigger whenever ANY lookup changes. Don't gate on .length>0; an
		// automation editor opened on an instance with zero groups/rooms still
		// needs the hydration pass to resolve targetName from devices.
		void deviceList.length;
		void groupList.length;
		void roomList.length;
		void sceneList.length;
		void effectList.length;
		untrack(() => hydrateNodesWithLookups(deviceList, groupList, roomList, sceneList, effectList));
	});

	function updateTriggerNodeEnabledState(enabled: boolean) {
		flowNodes = flowNodes.map((n) => {
			if (n.type !== "trigger") return n;
			return {
				...n,
				data: { ...n.data, automationEnabled: enabled },
			};
		});
	}

	$effect(() => {
		const enabled = automationEnabled;
		untrack(() => updateTriggerNodeEnabledState(enabled));
	});

	function edgeStyleFor(e: Edge): string {
		if (e.selected) return EDGE_STYLE_SELECTED;
		if (!editMode && activatedNodes.has(e.source)) {
			const src = flowNodes.find((n) => n.id === e.source);
			const type = src?.type ?? "";
			return EDGE_STYLE_ACTIVE_BY_TYPE[type] ?? EDGE_STYLE_ACTIVE_FALLBACK;
		}
		return EDGE_STYLE_IDLE;
	}

	function updateEdgeStyles() {
		let mutated = false;
		const next = flowEdges.map((e) => {
			const targetStyle = edgeStyleFor(e);
			if (e.style === targetStyle) return e;
			mutated = true;
			return { ...e, style: targetStyle };
		});
		if (mutated) flowEdges = next;
	}

	$effect(() => {
		// Track dependencies, then recompute imperatively so we don't race with
		// xyflow's own edge mutations.
		void activatedNodes;
		void editMode;
		void flowEdges.length;
		// Selection state lives inside each edge's `selected` field, which xyflow
		// mutates on click. Summing selections gives us a reactive dep.
		void flowEdges.reduce((acc, e) => acc + (e.selected ? 1 : 0), 0);
		untrack(updateEdgeStyles);
	});

	function refreshRuntimeState() {
		if (!client || !automationId) return;
		client
			.query<AutomationQueryResult>(AUTOMATION_QUERY, { id: automationId }, { requestPolicy: "network-only" })
			.toPromise()
			.then((res) => {
				if (!res.data?.automation) return;
				const next = new Map<string, string>(
					res.data.automation.nodes.map((n) => [n.id, n.runtimeState] as const),
				);
				flowNodes = flowNodes.map((n) => {
					const v = next.get(n.id);
					if (v === undefined) return n;
					const data = n.data as Record<string, unknown>;
					if (data.runtimeState === v) return n;
					return { ...n, data: { ...data, runtimeState: v } };
				});
			});
	}

	async function handleFireTrigger(nodeId: string) {
		if (!client || !automationId || !savedAutomationEnabled) return;
		errors.clear();
		const result = await client
			.mutation(FIRE_AUTOMATION_TRIGGER, { automationId, nodeId })
			.toPromise();
		if (result.error) {
			console.error(result.error);
			errors.setWithAutoDismiss(m.automation_editor_fire_failed({}, messageOptions));
		}
	}

	function updateNodeEditability(isEditable: boolean) {
		flowNodes = flowNodes.map((n) => ({
			...n,
			data: { ...n.data, readOnly: !isEditable },
		}));
	}

	function handleGoLive() {
		if (!editMode || liveDisabled) return;
		toggleMode();
	}

	function toggleMode() {
		editMode = !editMode;
		updateNodeEditability(editMode);
		if (editMode) {
			// Leaving Live mode: clear any in-flight activation glows so Edit
			// mode is visually quiet.
			for (const timeout of activatedNodes.values()) {
				clearTimeout(timeout);
			}
			activatedNodes = new Map();
			flowNodes = flowNodes.map((n) =>
				n.data.activated ? { ...n, data: { ...n.data, activated: false } } : n
			);
		}
	}

	async function handleSave() {
		if (!client) return;
		if (saving) return;
		saving = true;
		errors.clear();

		const result = await client
			.mutation<UpdateAutomationResult>(UPDATE_AUTOMATION, {
				id: automationId,
				input: {
					name: automationName,
					icon: automationIcon,
					enabled: automationEnabled,
					nodes: flowNodesToAutomationNodes(flowNodes),
					edges: flowEdgesToAutomationEdges(flowEdges, flowNodes),
				},
			})
			.toPromise();

		saving = false;

		if (result.error) {
			console.error(result.error);
			errors.setWithAutoDismiss(m.automation_editor_save_failed({}, messageOptions));
			return;
		}

		if (result.data) {
			const auto = result.data.updateAutomation;
			const cached = automationsStore.byId.get(auto.id);
			automationsStore.upsert({
				id: auto.id,
				name: auto.name,
				icon: auto.icon,
				enabled: auto.enabled,
				lastFiredAt: cached?.lastFiredAt ?? null,
				nodes: auto.nodes.map(({ id, type, config }) => ({ id, type, config })),
				edges: auto.edges,
				createdBy: cached?.createdBy ?? null,
			});
			savedAutomationEnabled = auto.enabled;
			automationCompilable = auto.compilable;
			const oldIds = flowNodes.map((n) => n.id);
			const newIds = auto.nodes.map((n) => n.id);
			const idsChanged = oldIds.length !== newIds.length || oldIds.some((id, i) => id !== newIds[i]);
			if (idsChanged) {
				flowNodes = automationNodesToFlowNodes(auto.nodes, auto.edges, editMode, activatedNodes);
			}
			flowEdges = automationEdgesToFlowEdges(auto.edges);
			jsonString = flowStateToJson();
			savedCursor = history.cursor;
		}
	}

	function handleToggle(enabled: boolean) {
		automationEnabled = enabled;
		takeSnapshot();
	}

	async function handleDelete() {
		if (!client) return;
		deleteLoading = true;
		errors.clear();

		try {
			await automationsStore.delete(client, automationId);
		} catch (error) {
			deleteLoading = false;
			console.error(graphqlErrorMessage(error, m.automation_editor_delete_failed({}, messageOptions)));
			errors.setWithAutoDismiss(m.automation_editor_delete_failed({}, messageOptions));
			return;
		}

		deleteLoading = false;
		goto("/automations");
	}

	onMount(() => {
		client
			.query<AutomationQueryResult>(AUTOMATION_QUERY, { id: automationId })
			.toPromise()
			.then((result) => {
				if (result.data?.automation) {
					const auto = result.data.automation;
					automationName = auto.name;
					automationIcon = auto.icon ?? null;
					automationEnabled = auto.enabled;
					savedAutomationEnabled = auto.enabled;
					automationCompilable = auto.compilable;
					flowNodes = automationNodesToFlowNodes(auto.nodes, auto.edges, editMode, activatedNodes);
					flowEdges = automationEdgesToFlowEdges(auto.edges);
					initialAutoLayoutPending = placementMode === "auto" && flowNodes.length > 0;

					let maxId = 0;
					for (const n of auto.nodes) {
						const match = n.id.match(/\d+$/);
						if (match) {
							const num = parseInt(match[0], 10);
							if (num > maxId) maxId = num;
						}
					}
					nodeIdCounter = maxId;
						jsonString = flowStateToJson();
						takeSnapshot();
					}
					loading = false;
				});

		client
			.query<EffectsQueryResult>(EFFECTS_QUERY, {})
			.toPromise()
			.then((result) => {
				if (!result.data) return;
				const timeline: EffectOption[] = result.data.effects.map((e) => ({
					kind: "timeline",
					id: e.id,
					name: e.name,
				}));
				const native: EffectOption[] = result.data.nativeEffectOptions.map((opt) => ({
					kind: "native",
					nativeName: opt.name,
					name: opt.displayName || opt.name,
				}));
				effects = [...timeline, ...native];
			});

		const { unsubscribe: unsubActivation } = client
			.subscription<AutomationNodeActivationResult>(NODE_ACTIVATED_SUBSCRIPTION, {
				automationId,
			})
			.subscribe((result) => {
				if (!result.data) return;
				if (editMode) return;
				const { nodeId, active } = result.data.automationNodeActivated;

				if (active) {
					const existing = activatedNodes.get(nodeId);
					if (existing) clearTimeout(existing);

					const node = flowNodes.find((n) => n.id === nodeId);
					const isTrigger = node?.type === "trigger";
					const cfg = node ? ((node.data as Record<string, unknown>).config as { graceMs?: number } | undefined) : undefined;
					// Triggers hold their activation for their grace window (floor 600 ms
					// so blink-short fires are still visible). Other node types get a
					// fixed visible flash — they have no persistent "active" semantics.
					const durationMs = isTrigger ? Math.max(600, cfg?.graceMs ?? 0) : 600;

					const timeout = setTimeout(() => {
						activatedNodes.delete(nodeId);
						activatedNodes = new Map(activatedNodes);
						flowNodes = flowNodes.map((n) =>
							n.id === nodeId ? { ...n, data: { ...n.data, activated: false } } : n
						);
					}, durationMs);

					activatedNodes.set(nodeId, timeout);
					activatedNodes = new Map(activatedNodes);

					flowNodes = flowNodes.map((n) =>
						n.id === nodeId ? { ...n, data: { ...n.data, activated: true } } : n
					);

					// Action nodes may have advanced persistent state (e.g. the
					// cycle_scenes index). Refetch so the "Active" chip moves
					// to the just-fired scene.
					if (node?.type === "action") {
						refreshRuntimeState();
					}
				} else {
					const existing = activatedNodes.get(nodeId);
					if (existing) clearTimeout(existing);
					activatedNodes.delete(nodeId);
					activatedNodes = new Map(activatedNodes);
					flowNodes = flowNodes.map((n) =>
						n.id === nodeId ? { ...n, data: { ...n.data, activated: false } } : n
					);
				}
			});
		unsubscribers.push(unsubActivation);
	});

	onDestroy(() => {
		for (const unsub of unsubscribers) {
			unsub();
		}
		for (const timeout of activatedNodes.values()) {
			clearTimeout(timeout);
		}
		if (autoLayoutFrame !== null) cancelAnimationFrame(autoLayoutFrame);
		if (layoutTweenFrame !== null) cancelAnimationFrame(layoutTweenFrame);
	});
</script>

<svelte:window onkeydown={handleKeydown} oncontextmenu={handleOpenGraphContextMenu} />
<UnsavedGuard dirty={isDirty} />

<div class="flex h-[calc(100vh-6rem)] flex-col">
	{#if errors.message}
		<ErrorBanner class="mb-2" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}

	<div class="flex flex-wrap items-center gap-2 pb-3">
		{#if loading}
			<div class="h-8 w-48 animate-pulse rounded-md bg-muted"></div>
		{:else}
			<IconPicker
				value={automationIcon}
				onselect={(icon) => {
					if (!editMode) return;
					automationIcon = icon;
					takeSnapshot();
				}}
			>
				<IconPickerTrigger size="sm" ariaLabel={m.automation_editor_change_icon({}, messageOptions)} disabled={!editMode}>
					<AnimatedIcon icon={automationIcon} class="size-4 text-muted-foreground">
						{#snippet fallback()}<Workflow class="size-4 text-muted-foreground" />{/snippet}
					</AnimatedIcon>
				</IconPickerTrigger>
			</IconPicker>
			<Input
				bind:value={automationName}
				oninput={() => {
					if (editMode) queueMicrotask(takeSnapshot);
				}}
				class="h-8 w-48 text-sm font-medium"
				placeholder={m.automation_editor_name_placeholder({}, messageOptions)}
				disabled={!editMode}
			/>

			<Switch
				checked={automationEnabled}
				onCheckedChange={handleToggle}
				disabled={!editMode}
			/>

			<div class="ml-auto flex items-center gap-2">
				<div class="flex items-center rounded-md border border-border dark:border-input">
					<Button
						variant={viewMode === "visual" ? "secondary" : "ghost"}
						size="sm"
						class="rounded-r-none border-0"
						onclick={() => {
							if (viewMode === "code" && !jsonError) {
								viewMode = "visual";
							}
						}}
						disabled={!editMode || (viewMode === "code" && !!jsonError)}
					>
						<LayoutGrid class="size-3.5" />
						<span class="hidden sm:inline">{m.automation_editor_visual({}, messageOptions)}</span>
					</Button>
					<Button
						variant={viewMode === "code" ? "secondary" : "ghost"}
						size="sm"
						class="rounded-l-none border-0"
						onclick={() => {
							if (viewMode === "visual") {
								syncJsonFromGraph();
								viewMode = "code";
							}
						}}
						disabled={!editMode}
					>
						<Code class="size-3.5" />
						<span class="hidden sm:inline">{m.automation_editor_code({}, messageOptions)}</span>
					</Button>
				</div>

			</div>
		{/if}
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
		</div>
		{:else if viewMode === "visual"}
		<div class="relative mt-2 flex-1 overflow-hidden rounded-lg shadow-card">
			<div class="dark absolute inset-0 bg-background">
				<div
					class="h-full w-full {initialAutoLayoutPending ? 'opacity-0' : ''}"
					bind:this={flowSurface}
					role="application"
					aria-label={m.automation_editor_graph_aria({}, messageOptions)}
					oncontextmenu={handleFlowSurfaceContextMenu}
					in:fly={{ y: -4, duration: 150 }}
				>
					<AutomationFlow
					bind:nodes={flowNodes}
					bind:edges={flowEdges}
					editable={editMode}
					nodesDraggable={editMode && placementMode === "free"}
				onconnect={handleConnect}
				onnodedragstop={takeSnapshot}
				ondelete={takeSnapshot}
				onPaneContextMenu={handleCanvasContextMenu}
						onNodeContextMenu={handleNodeContextMenu}
						onReady={(api) => (flowApi = api)}
						onNodesInitialized={applyInitialAutoLayout}
					/>
				</div>
			</div>
			<div class="absolute top-3 left-1/2 z-10 max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-lg bg-card/90 px-2 py-1.5 shadow-card backdrop-blur-sm">
				<div class="no-scrollbar flex items-center gap-1 overflow-x-auto">
				<Button variant="ghost" size="icon-sm" onclick={handleUndo} disabled={!editMode || !history.canUndo}>
					<Undo2 class="size-3.5" />
				</Button>
				<Button variant="ghost" size="icon-sm" onclick={handleRedo} disabled={!editMode || !history.canRedo}>
					<Redo2 class="size-3.5" />
				</Button>
				<div class="flex items-center rounded-md border border-border dark:border-input">
					<Button
						variant={placementMode === "free" ? "secondary" : "ghost"}
						size="sm"
						class="h-7 rounded-r-none border-0"
						disabled={!editMode}
						onclick={() => setPlacementMode("free")}
					>
						{m.automation_editor_free({}, messageOptions)}
					</Button>
					<Button
						variant={placementMode === "auto" ? "secondary" : "ghost"}
						size="sm"
						class="h-7 rounded-l-none border-0"
						disabled={!editMode}
						onclick={() => setPlacementMode("auto")}
					>
						{m.automation_editor_auto({}, messageOptions)}
					</Button>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onclick={handleSort}
					disabled={!editMode || placementMode === "auto"}
				>
					<Rows3 class="size-3.5" />
					<span class="hidden sm:inline">{m.automation_editor_sort({}, messageOptions)}</span>
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={handleCopy}
					disabled={!editMode || !anyNodeSelected}
					aria-label={m.automation_editor_copy_nodes({}, messageOptions)}
				>
					<Copy class="size-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={handlePaste}
					disabled={!editMode || !copyBuffer}
					aria-label={m.automation_editor_paste_nodes({}, messageOptions)}
				>
					<ClipboardPaste class="size-3.5" />
				</Button>
				<div class="mx-1 h-4 w-px bg-border"></div>
				{#if isMobile.current}
					<DropdownMenu>
						<DropdownMenuTrigger>
							<Button variant="ghost" size="icon-sm" disabled={!editMode} aria-label={m.automation_editor_add_node({}, messageOptions)}>
								<Plus class="size-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="center" class="min-w-[10rem]">
							<DropdownMenuItem onclick={() => addNode("trigger")}>
								<Zap class="size-3.5 text-automation-trigger" />
								{m.automation_node_trigger({}, messageOptions)}
							</DropdownMenuItem>
							<DropdownMenuItem onclick={() => addNode("condition")}>
								<ShieldCheck class="size-3.5 text-automation-condition" />
								{m.automation_node_condition({}, messageOptions)}
							</DropdownMenuItem>
							<DropdownMenuItem onclick={() => addNode("operator")}>
								<GitMerge class="size-3.5 text-automation-operator" />
								{m.automation_operator_title({}, messageOptions)}
							</DropdownMenuItem>
							<DropdownMenuItem onclick={() => addNode("action")}>
								<Play class="size-3.5 text-automation-action" />
								{m.automation_node_action({}, messageOptions)}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				{:else}
					<div
						class="cursor-grab"
						use:holdDrag={{
							disabled: !editMode,
							mouseImmediate: true,
							onstart: (event) => startToolbarNodeDrag("trigger", event),
							onmove: moveToolbarNodeDrag,
							onend: endToolbarNodeDrag,
							oncancel: cancelToolbarNodeDrag,
						}}
					>
						<Button variant="ghost" size="sm" onclick={() => addNodeFromToolbar("trigger")} disabled={!editMode}>
							<Zap class="size-3.5 text-automation-trigger" />
							<span class="hidden sm:inline">{m.automation_node_trigger({}, messageOptions)}</span>
						</Button>
					</div>
					<div
						class="cursor-grab"
						use:holdDrag={{
							disabled: !editMode,
							mouseImmediate: true,
							onstart: (event) => startToolbarNodeDrag("condition", event),
							onmove: moveToolbarNodeDrag,
							onend: endToolbarNodeDrag,
							oncancel: cancelToolbarNodeDrag,
						}}
					>
						<Button variant="ghost" size="sm" onclick={() => addNodeFromToolbar("condition")} disabled={!editMode}>
							<ShieldCheck class="size-3.5 text-automation-condition" />
							<span class="hidden sm:inline">{m.automation_node_condition({}, messageOptions)}</span>
						</Button>
					</div>
					<div
						class="cursor-grab"
						use:holdDrag={{
							disabled: !editMode,
							mouseImmediate: true,
							onstart: (event) => startToolbarNodeDrag("operator", event),
							onmove: moveToolbarNodeDrag,
							onend: endToolbarNodeDrag,
							oncancel: cancelToolbarNodeDrag,
						}}
					>
						<Button variant="ghost" size="sm" onclick={() => addNodeFromToolbar("operator")} disabled={!editMode}>
							<GitMerge class="size-3.5 text-automation-operator" />
							<span class="hidden sm:inline">{m.automation_operator_title({}, messageOptions)}</span>
						</Button>
					</div>
					<div
						class="cursor-grab"
						use:holdDrag={{
							disabled: !editMode,
							mouseImmediate: true,
							onstart: (event) => startToolbarNodeDrag("action", event),
							onmove: moveToolbarNodeDrag,
							onend: endToolbarNodeDrag,
							oncancel: cancelToolbarNodeDrag,
						}}
					>
						<Button variant="ghost" size="sm" onclick={() => addNodeFromToolbar("action")} disabled={!editMode}>
							<Play class="size-3.5 text-automation-action" />
							<span class="hidden sm:inline">{m.automation_node_action({}, messageOptions)}</span>
						</Button>
					</div>
				{/if}
				<div class="mx-1 h-4 w-px bg-border"></div>
				<div class="flex items-center rounded-md border border-border dark:border-input">
					<Button
						variant={editMode ? "secondary" : "ghost"}
						size="sm"
						class="rounded-r-none border-0 h-7"
						onclick={() => { if (!editMode) toggleMode(); }}
					>
						<Pencil class="size-3.5" />
						<span class="hidden sm:inline">{m.automation_editor_edit({}, messageOptions)}</span>
					</Button>
					<Button
						variant={!editMode ? "secondary" : "ghost"}
						size="sm"
						class="rounded-l-none border-0 h-7"
						disabled={editMode && liveDisabled}
						onclick={handleGoLive}
					>
						<Eye class="size-3.5" />
						<span class="hidden sm:inline">{m.automation_editor_live({}, messageOptions)}</span>
					</Button>
				</div>
				</div>
			</div>
			</div>

			<DropdownMenu bind:open={graphContextMenuOpen}>
				<DropdownMenuTrigger
					class="pointer-events-none fixed size-0 opacity-0"
					style="left: {graphContextMenuState?.x ?? 0}px; top: {graphContextMenuState?.y ?? 0}px;"
					aria-hidden="true"
					tabindex={-1}
				></DropdownMenuTrigger>
				<DropdownMenuContent align="start" class="min-w-[10rem]">
					{#if graphContextMenuState?.kind === "canvas"}
						<DropdownMenuItem onclick={() => addNodeFromCanvas("trigger")}>
							<Zap class="size-3.5 text-automation-trigger" />
							{m.automation_node_trigger({}, messageOptions)}
						</DropdownMenuItem>
						<DropdownMenuItem onclick={() => addNodeFromCanvas("condition")}>
							<ShieldCheck class="size-3.5 text-automation-condition" />
							{m.automation_node_condition({}, messageOptions)}
						</DropdownMenuItem>
						<DropdownMenuItem onclick={() => addNodeFromCanvas("operator")}>
							<GitMerge class="size-3.5 text-automation-operator" />
							{m.automation_operator_title({}, messageOptions)}
						</DropdownMenuItem>
						<DropdownMenuItem onclick={() => addNodeFromCanvas("action")}>
							<Play class="size-3.5 text-automation-action" />
							{m.automation_node_action({}, messageOptions)}
						</DropdownMenuItem>
						{#if copyBuffer}
							<DropdownMenuSeparator />
							<DropdownMenuItem onclick={pasteFromCanvas}>
								<ClipboardPaste class="size-3.5" />
								{m.automation_editor_paste({}, messageOptions)}
							</DropdownMenuItem>
						{/if}
					{:else if graphContextMenuState?.kind === "node"}
						{#if !editMode && graphContextMenuNode?.type === "trigger"}
							<DropdownMenuItem disabled={!savedAutomationEnabled} onclick={fireTriggerFromContextMenu}>
								<Zap class="size-3.5 text-automation-trigger" />
								{m.automation_node_trigger({}, messageOptions)}
							</DropdownMenuItem>
						{:else if editMode}
							{#if graphContextMenuNode?.type === "trigger"}
								<DropdownMenuItem onclick={copyTriggerConditionFromContextMenu}>
									<Code class="size-3.5" />
									{m.automation_editor_copy_trigger_condition({}, messageOptions)}
								</DropdownMenuItem>
							{/if}
							<DropdownMenuItem onclick={toggleNodeLock}>
								{#if lockedNodeIds.has(graphContextMenuState.nodeId)}
									<LockOpen class="size-3.5" />
									{m.automation_editor_unlock({}, messageOptions)}
								{:else}
									<Lock class="size-3.5" />
									{m.automation_editor_lock({}, messageOptions)}
								{/if}
							</DropdownMenuItem>
							<DropdownMenuItem onclick={copyNodeFromContextMenu}>
								<Copy class="size-3.5" />
								{m.common_copy({}, messageOptions)}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem variant="destructive" onclick={deleteNodeFromContextMenu}>
								<Trash2 class="size-3.5" />
								{m.common_delete({}, messageOptions)}
							</DropdownMenuItem>
						{/if}
					{:else if graphContextMenuState?.kind === "selection" && editMode}
						<DropdownMenuItem onclick={toggleSelectionLock}>
							{#if graphContextMenuSelectionAllLocked}
								<LockOpen class="size-3.5" />
								{m.automation_editor_unlock({}, messageOptions)}
							{:else}
								<Lock class="size-3.5" />
								{m.automation_editor_lock({}, messageOptions)}
							{/if}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive" onclick={deleteSelectionFromContextMenu}>
							<Trash2 class="size-3.5" />
							{m.common_delete({}, messageOptions)}
						</DropdownMenuItem>
					{/if}
				</DropdownMenuContent>
			</DropdownMenu>
		{:else}
		<div class="relative flex-1 pt-2" in:fly={{ y: -4, duration: 150 }}>
			<JsonEditor
				bind:value={jsonString}
				bind:error={jsonError}
				readonly={!editMode}
				onchange={handleJsonChange}
			/>
			{#if jsonError}
				<div
					class="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive backdrop-blur-sm"
				>
					<span class="font-medium">{m.automation_editor_invalid_config({}, messageOptions)}</span>
					<span class="font-mono">{jsonError}</span>
				</div>
			{/if}
		</div>
	{/if}

	{#if toolbarDrag}
		<div
			class="pointer-events-none fixed z-50 w-44 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 bg-card/95 shadow-card backdrop-blur-sm {toolbarDrag.nodeType === 'trigger'
				? 'border-automation-trigger/60'
				: toolbarDrag.nodeType === 'condition'
					? 'border-automation-condition/60'
					: toolbarDrag.nodeType === 'operator'
						? 'border-automation-operator/60'
						: 'border-automation-action/60'}"
			style="left: {toolbarDrag.x}px; top: {toolbarDrag.y}px;"
		>
			<div class="flex items-center gap-2 rounded-t-md px-3 py-2">
				{#if toolbarDrag.nodeType === "trigger"}
					<Zap class="size-4 text-automation-trigger" />
				{:else if toolbarDrag.nodeType === "condition"}
					<ShieldCheck class="size-4 text-automation-condition" />
				{:else if toolbarDrag.nodeType === "operator"}
					<GitMerge class="size-4 text-automation-operator" />
				{:else}
					<Play class="size-4 text-automation-action" />
				{/if}
				<span class="text-sm font-medium">{toolbarNodeLabel(toolbarDrag.nodeType)}</span>
			</div>
		</div>
	{/if}

	<ConfirmDialog
		bind:open={deleteConfirmOpen}
		title={m.automation_editor_delete_title({}, messageOptions)}
		description={m.automation_editor_delete_description({ name: localizedNamesStore.display("automation", automationId, automationName) }, messageOptions)}
		confirmLabel={m.common_delete({}, messageOptions)}
		loading={deleteLoading}
		onconfirm={handleDelete}
		oncancel={() => (deleteConfirmOpen = false)}
	/>

</div>
