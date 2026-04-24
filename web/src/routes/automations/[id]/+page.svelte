<script lang="ts">
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { onMount, onDestroy, untrack } from "svelte";
	import { fly } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
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
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import IconPickerTrigger from "$lib/components/icon-picker-trigger.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import { Clapperboard, Workflow } from "@lucide/svelte";
	import { deviceIcon } from "$lib/utils";
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
		X,
	} from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import { HistoryStack } from "$lib/stores/history.svelte";
	import { type Node, type Edge, type Connection } from "@xyflow/svelte";
	import type { Device } from "$lib/stores/devices";
	import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
	import {
		type TriggerConfig,
		defaultTriggerConfig,
		normalizeTriggerConfig,
		serializeTriggerConfig,
		serializeOperatorConfig,
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
		payload: string;
	}

	type NodeConfig = TriggerConfig | ConditionConfig | OperatorConfig | ActionConfig;

	interface AutomationNodeData {
		id: string;
		type: string;
		config: string;
		positionX: number;
		positionY: number;
	}

	interface AutomationEdgeData {
		id: string;
		fromNodeId: string;
		toNodeId: string;
	}

	interface AutomationData {
		id: string;
		name: string;
		icon?: string | null;
		enabled: boolean;
		nodes: AutomationNodeData[];
		edges: AutomationEdgeData[];
	}

	interface GroupData {
		id: string;
		name: string;
		members: { id: string; memberType: string; memberId: string }[];
	}

	interface AutomationQueryResult {
		automation: AutomationData | null;
	}

	interface UpdateAutomationResult {
		updateAutomation: AutomationData;
	}

	interface DeleteAutomationResult {
		deleteAutomation: boolean;
	}

	interface ToggleAutomationResult {
		toggleAutomation: AutomationData;
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
		devices: { id: string }[];
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

	const AUTOMATION_QUERY = graphql(`
		query Automation($id: ID!) {
			automation(id: $id) {
				id
				name
				icon
				enabled
				nodes {
					id
					type
					config
					positionX
					positionY
				}
				edges {
					fromNodeId
					toNodeId
				}
			}
		}
	`);

	const UPDATE_AUTOMATION = graphql(`
		mutation AutomationEditUpdate($id: ID!, $input: UpdateAutomationInput!) {
			updateAutomation(id: $id, input: $input) {
				id
				name
				icon
				enabled
				nodes {
					id
					type
					config
					positionX
					positionY
				}
				edges {
					fromNodeId
					toNodeId
				}
			}
		}
	`);

	const DELETE_AUTOMATION = graphql(`
		mutation DeleteAutomation($id: ID!) {
			deleteAutomation(id: $id)
		}
	`);

	const TOGGLE_AUTOMATION = graphql(`
		mutation ToggleAutomation($id: ID!, $enabled: Boolean!) {
			toggleAutomation(id: $id, enabled: $enabled) {
				id
				enabled
			}
		}
	`);

	const FIRE_AUTOMATION_TRIGGER = graphql(`
		mutation AutomationEditFireTrigger($automationId: ID!, $nodeId: ID!) {
			fireAutomationTrigger(automationId: $automationId, nodeId: $nodeId)
		}
	`);

	const DEVICES_QUERY = graphql(`
		query AutomationEditDevices {
			devices {
				id
				name
				type
				source
				capabilities { name type values valueMin valueMax unit access }
				available
				lastSeen
				state {
					on
					brightness
					colorTemp
					color { r g b x y }
					transition
					temperature
					humidity
					pressure
					illuminance
					battery
					power
					voltage
					current
					energy
				}
			}
		}
	`);

	const GROUPS_QUERY = graphql(`
		query AutomationEditGroups {
			groups {
				id
				name
				members {
					id
					memberType
					memberId
				}
			}
		}
	`);

	const ROOMS_QUERY = graphql(`
		query AutomationEditRooms {
			rooms {
				id
				name
				devices { id }
			}
		}
	`);

	const SCENES_QUERY = graphql(`
		query AutomationEditScenes {
			scenes {
				id
				name
			}
		}
	`);

	interface ScenesQueryResult {
		scenes: { id: string; name: string }[];
	}

	const NODE_ACTIVATED_SUBSCRIPTION = graphql(`
		subscription AutomationEditNodeActivated($automationId: ID) {
			automationNodeActivated(automationId: $automationId) {
				automationId
				nodeId
				active
			}
		}
	`);

	const automationId = $derived(page.params.id);
	const isMobile = new IsMobile();

	const client = getContextClient();

	let automationName = $state("");
	let automationIcon = $state<string | null>(null);

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Automations", href: "/automations" }, { label: "Automation" }];
	});
	onDestroy(() => pageHeader.reset());

	$effect(() => {
		if (automationName) {
			pageHeader.breadcrumbs = [{ label: "Automations", href: "/automations" }, { label: automationName }];
		}
	});

	function handleCancel() {
		goto("/automations");
	}

	$effect(() => {
		pageHeader.actions = [
			{ label: "Cancel", icon: X, variant: "outline" as const, onclick: handleCancel, hideLabelOnMobile: true },
			{
				label: "Save",
				saving,
				onclick: handleSave,
				disabled: !editMode || saving || hasValidationErrors || !isDirty,
				hideLabelOnMobile: true,
			},
			{ label: "Delete", icon: Trash2, variant: "destructive" as const, onclick: () => (deleteConfirmOpen = true), disabled: !editMode, hideLabelOnMobile: true },
		];
	});
	let automationEnabled = $state(false);
	let flowNodes = $state<Node[]>([]);
	let flowEdges = $state<Edge[]>([]);

	let editMode = $state(true);
	let viewMode = $state<"visual" | "code">("visual");
	let jsonString = $state("");
	let jsonError = $state<string | null>(null);
	let syncSource = $state<"visual" | "code" | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	const errors = new BannerError();
	let deleteConfirmOpen = $state(false);
	let deleteLoading = $state(false);

	let pickerOpen = $state(false);
	let pickerTargetNodeId = $state<string | null>(null);
	let pickerActionType = $state<string>("set_device_state");
	let devices = $state<Device[]>([]);
	let groups = $state<GroupData[]>([]);
	let rooms = $state<RoomData[]>([]);
	let scenes = $state<{ id: string; name: string }[]>([]);

	const pickerGroups = $derived.by((): DrawerGroup<"device" | "group" | "room" | "scene">[] => {
		if (pickerActionType === "activate_scene") {
			return [{ heading: "Scenes", items: scenes.map((s) => ({ type: "scene" as const, id: s.id, name: s.name, icon: Clapperboard })) }];
		}
		return [
			{ heading: "Devices", items: devices.map((d) => ({ type: "device" as const, id: d.id, name: d.name, icon: deviceIcon(d.type), searchValue: `${d.name} ${d.type}` })) },
			{ heading: "Groups", items: groups.map((g) => ({ type: "group" as const, id: g.id, name: g.name, icon: Workflow })) },
			{ heading: "Rooms", items: rooms.map((r) => ({ type: "room" as const, id: r.id, name: r.name, icon: Workflow })) },
		];
	});

	let activatedNodes = $state<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	let unsubscribers: (() => void)[] = [];

	let nodeIdCounter = $state(0);
	let flowApi: FlowApi | null = $state(null);
	// In-editor copy buffer for duplicating selected nodes. Not the OS
	// clipboard — keyboard shortcuts deliberately aren't wired.
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
			let err: { field: string; message: string } | null = null;
			if (nodeType === "trigger") err = validateTriggerConfig(config as TriggerConfig);
			else if (nodeType === "condition") err = validateConditionConfig(config as ConditionConfig);
			else if (nodeType === "action") err = validateActionConfig(config as ActionConfig);
			if (err) return true;
		}
		return false;
	});

	// Live button is disabled when a save is in flight, or when the graph has
	// unsaved changes we can't persist (validation errors). Dirty-without-errors
	// is allowed — we'll auto-save on the Live click.
	const liveDisabled = $derived(saving || (isDirty && hasValidationErrors));

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
		if (restoringSnapshot) return;
		history.push({
			name: automationName,
			icon: automationIcon,
			enabled: automationEnabled,
			nodes: cloneNodes(flowNodes),
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
			return { ...n, data: makeNodeData(nodeType, config, editMode, false, n.id) };
		}) as Node[];
		flowEdges = snap.edges;
		restoringSnapshot = false;
	}

	function handleSort() {
		flowNodes = layoutGraph(flowNodes);
		takeSnapshot();
	}

	function handleCopy() {
		const selectedNodes = flowNodes.filter((n) => n.selected);
		if (selectedNodes.length === 0) return;
		const selectedIds = new Set(selectedNodes.map((n) => n.id));
		const internalEdges = flowEdges.filter(
			(e) => selectedIds.has(e.source) && selectedIds.has(e.target)
		);
		copyBuffer = {
			nodes: cloneNodes(selectedNodes),
			edges: cloneEdges(internalEdges),
		};
	}

	function handlePaste() {
		if (!copyBuffer || copyBuffer.nodes.length === 0) return;
		const idMap = new Map<string, string>();
		for (const n of copyBuffer.nodes) {
			idMap.set(n.id, `node-${crypto.randomUUID()}`);
		}
		const offset = 48;
		const newNodes: Node[] = copyBuffer.nodes.map((n) => {
			const newId = idMap.get(n.id)!;
			const nodeType = n.type ?? "trigger";
			const config = (n.data as Record<string, unknown>).config as NodeConfig;
			return {
				...n,
				id: newId,
				position: { x: n.position.x + offset, y: n.position.y + offset },
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

	function isEditableTarget(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		const tag = target.tagName;
		if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
		return target.isContentEditable;
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
			if (d) return { ...cfg, deviceName: d.name };
		}
		if (cfg.deviceName && !cfg.deviceId) {
			const d = devices.find((x) => x.name === cfg.deviceName);
			if (d) return { ...cfg, deviceId: d.id };
		}
		return cfg;
	}

	function enrichConditionConfigWithDevice(cfg: ConditionConfig): ConditionConfig {
		// The stored expression carries only the device name (it's what expr-lang
		// looks up). On reload we re-derive deviceId so the UI dropdown can
		// pre-select the correct row. Symmetric to the trigger enrichment.
		if (cfg.mode !== "device_state" || !devices.length) return cfg;
		if (cfg.deviceName && !cfg.deviceId) {
			const d = devices.find((x) => x.name === cfg.deviceName);
			if (d) return { ...cfg, deviceId: d.id };
		}
		if (cfg.deviceId && !cfg.deviceName) {
			const d = devices.find((x) => x.id === cfg.deviceId);
			if (d) return { ...cfg, deviceName: d.name };
		}
		return cfg;
	}

	function parseConfig(nodeType: string, configJson: string): NodeConfig {
		try {
			const raw = JSON.parse(configJson) as Record<string, unknown>;
			if (nodeType === "trigger") {
				return enrichTriggerConfigWithDevice(normalizeTriggerConfig(raw));
			}
			if (nodeType === "condition") {
				return enrichConditionConfigWithDevice(normalizeConditionConfig(raw));
			}
			if (nodeType === "operator") {
				return { operator: ((raw.kind as string) ?? (raw.operator as string) ?? "AND").toUpperCase() };
			}
			if (nodeType === "action") {
				return {
					actionType: (raw.action_type as string) ?? (raw.actionType as string) ?? "set_device_state",
					targetType: (raw.target_type as string) ?? (raw.targetType as string) ?? "",
					targetId: (raw.target_id as string) ?? (raw.targetId as string) ?? "",
					targetName: (raw.target_name as string) ?? (raw.targetName as string) ?? "",
					payload: (raw.payload as string) ?? "",
				};
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
		return { actionType: "set_device_state", targetType: "", targetId: "", targetName: "", payload: "" };
	}

	function makeNodeData(
		nodeType: string,
		config: NodeConfig,
		isEditable: boolean,
		isActivated: boolean,
		nodeId: string
	): Record<string, unknown> {
		const onConfigChange = (newConfig: NodeConfig) => {
			flowNodes = flowNodes.map((n) =>
				n.id === nodeId ? { ...n, data: { ...n.data, config: newConfig } } : n
			);
			queueMicrotask(takeSnapshot);
		};

		const base = {
			config,
			editable: isEditable,
			activated: isActivated,
			onConfigChange,
		};

		if (nodeType === "trigger") {
			return {
				...base,
				devices,
				automationEnabled,
				onFireManual: () => handleFireManual(nodeId),
			};
		}

		if (nodeType === "condition") {
			return {
				...base,
				devices,
			};
		}

		if (nodeType === "action") {
			return {
				...base,
				devices,
				groups,
				rooms,
				scenes,
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

	// layoutGraph assigns left-to-right column positions to nodes, compacting
	// empty columns (e.g. if the graph has no operators, triggers sit next to
	// actions without a gap). Returns a new array with updated positions.
	function layoutGraph(nodes: Node[]): Node[] {
		const presentTypes = COLUMN_ORDER.filter((t) => nodes.some((n) => n.type === t));
		const columnIndex: Record<string, number> = {};
		presentTypes.forEach((t, i) => (columnIndex[t] = i));
		const yCounters: Record<string, number> = {};
		return nodes.map((n) => {
			const type = n.type ?? "trigger";
			const col = columnIndex[type] ?? 0;
			const row = yCounters[type] ?? 0;
			yCounters[type] = row + 1;
			const spacing = ROW_SPACING[type] ?? 250;
			return { ...n, position: { x: col * COLUMN_WIDTH, y: row * spacing } };
		});
	}

	function automationNodesToFlowNodes(
		nodes: AutomationNodeData[],
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
				data: makeNodeData(n.type, config, isEditable, activatedSet.has(n.id), n.id),
			};
		});
		return allZeroPositions ? layoutGraph(baseNodes) : baseNodes;
	}

	function automationEdgesToFlowEdges(edges: AutomationEdgeData[]): Edge[] {
		return edges.map((e) => ({
			id: e.id,
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
		}));

		const edges: AutomationEdgeData[] = (obj.edges as Record<string, unknown>[]).map((e, i) => ({
			id: `edge-${e.from}-${e.to}-${i}`,
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
			flowNodes = automationNodesToFlowNodes(result.nodes, editMode, activatedNodes);
			flowEdges = automationEdgesToFlowEdges(result.edges);
			takeSnapshot();
		} else {
			jsonError = result.error;
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

	function addNode(nodeType: "trigger" | "condition" | "operator" | "action") {
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
			position: nextPositionForType(flowNodes, nodeType),
			data: makeNodeData(nodeType, config, editMode, false, tempId),
		};

		flowNodes = [...flowNodes, newNode];
		takeSnapshot();
		queueMicrotask(() => flowApi?.panToNode(tempId));
	}

	function handleConnect(_connection: Connection) {
		takeSnapshot();
	}

	function handleNodeClick(event: { node: Node; event: MouseEvent | TouchEvent }) {
		if (!editMode || !isMobile.current) return;
		const node = event.node;
		if (node.type === "action") {
			const actionConfig = (node.data as Record<string, unknown>).config as ActionConfig;
			pickerTargetNodeId = node.id;
			pickerActionType = actionConfig.actionType || "set_device_state";
			pickerOpen = true;
		}
	}

	function handleTargetSelect(memberType: "device" | "group" | "room" | "scene", memberId: string) {
		if (!pickerTargetNodeId) return;

		const selectedDevice = devices.find((d) => d.id === memberId);
		const selectedGroup = groups.find((g) => g.id === memberId);
		const selectedRoom = rooms.find((r) => r.id === memberId);
		const selectedScene = scenes.find((s) => s.id === memberId);
		const targetName =
			selectedDevice?.name ?? selectedGroup?.name ?? selectedRoom?.name ?? selectedScene?.name ?? memberId;

		flowNodes = flowNodes.map((n) => {
			if (n.id !== pickerTargetNodeId) return n;
			const data = n.data as Record<string, unknown>;
			const config = data.config as ActionConfig;
			return {
				...n,
				data: {
					...data,
					config: { ...config, targetType: memberType, targetId: memberId, targetName },
				},
			};
		});

		pickerOpen = false;
		pickerTargetNodeId = null;
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
				return deviceList.find((d) => d.id === targetId)?.name ?? "";
			case "group":
				return groupList.find((g) => g.id === targetId)?.name ?? "";
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
	) {
		flowNodes = flowNodes.map((n) => {
			const data = n.data as Record<string, unknown>;
			if (n.type === "trigger") {
				const cfg = enrichTriggerConfigWithDevice(data.config as TriggerConfig);
				return { ...n, data: { ...data, devices: deviceList, config: cfg } };
			}
			if (n.type === "condition") {
				const cfg = enrichConditionConfigWithDevice(data.config as ConditionConfig);
				return { ...n, data: { ...data, devices: deviceList, config: cfg } };
			}
			if (n.type === "action") {
				const cfg = data.config as ActionConfig;
				// targetName isn't persisted; rehydrate it from the live lookups so
				// reloaded automations don't display "device:0x001...". Prefer the
				// existing name when set (it came from handleTargetSelect in the
				// current session and we don't want to clobber typing races).
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
		// Trigger whenever ANY lookup changes. Don't gate on .length>0; an
		// automation editor opened on an instance with zero groups/rooms still
		// needs the hydration pass to resolve targetName from devices.
		void deviceList.length;
		void groupList.length;
		void roomList.length;
		void sceneList.length;
		untrack(() => hydrateNodesWithLookups(deviceList, groupList, roomList, sceneList));
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

	async function handleFireManual(nodeId: string) {
		if (!client || !automationId) return;
		errors.clear();
		const result = await client
			.mutation(FIRE_AUTOMATION_TRIGGER, { automationId, nodeId })
			.toPromise();
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
		}
	}

	function updateNodeEditability(isEditable: boolean) {
		flowNodes = flowNodes.map((n) => ({
			...n,
			data: { ...n.data, editable: isEditable },
		}));
	}

	async function handleGoLive() {
		if (!editMode || liveDisabled) return;
		if (isDirty) {
			await handleSave();
			// If save was rejected (network error or late validation failure),
			// don't leave Edit mode.
			if (isDirty) return;
		}
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
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		if (result.data) {
			const auto = result.data.updateAutomation;
			const oldIds = flowNodes.map((n) => n.id);
			const newIds = auto.nodes.map((n) => n.id);
			const idsChanged = oldIds.length !== newIds.length || oldIds.some((id, i) => id !== newIds[i]);
			if (idsChanged) {
				flowNodes = automationNodesToFlowNodes(auto.nodes, editMode, activatedNodes);
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

		const result = await client
			.mutation<DeleteAutomationResult>(DELETE_AUTOMATION, { id: automationId })
			.toPromise();

		deleteLoading = false;

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		goto("/automations");
	}

	onMount(() => {
		client
			.query<AutomationQueryResult>(AUTOMATION_QUERY, { id: automationId })
			.toPromise()
			.then((result) => {
				loading = false;
				if (result.data?.automation) {
					const auto = result.data.automation;
					automationName = auto.name;
					automationIcon = auto.icon ?? null;
					automationEnabled = auto.enabled;
					flowNodes = automationNodesToFlowNodes(auto.nodes, editMode, activatedNodes);
					flowEdges = automationEdgesToFlowEdges(auto.edges);

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
				});

		client
			.query<DevicesQueryResult>(DEVICES_QUERY, {})
			.toPromise()
			.then((result) => {
				if (result.data) {
					devices = result.data.devices;
				}
			});

		client
			.query<GroupsQueryResult>(GROUPS_QUERY, {})
			.toPromise()
			.then((result) => {
				if (result.data) {
					groups = result.data.groups;
				}
			});

		client
			.query<RoomsQueryResult>(ROOMS_QUERY, {})
			.toPromise()
			.then((result) => {
				if (result.data) {
					rooms = result.data.rooms;
				}
			});

		client
			.query<ScenesQueryResult>(SCENES_QUERY, {})
			.toPromise()
			.then((result) => {
				if (result.data) {
					scenes = result.data.scenes;
				}
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
					// Triggers hold their activation for their grace window (floor 100 ms
					// so blink-short fires are still visible). Other node types get a
					// fixed short blink — they have no persistent "active" semantics.
					const durationMs = isTrigger ? Math.max(100, cfg?.graceMs ?? 0) : 100;

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
	});
</script>

<svelte:window onkeydown={handleKeydown} />
<UnsavedGuard dirty={isDirty} />

<div class="flex h-[calc(100vh-6rem)] flex-col">
	{#if errors.message}
		<ErrorBanner class="mb-2" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}

	<div class="flex flex-wrap items-center gap-2 border-b border-border pb-3">
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
				<IconPickerTrigger size="sm" ariaLabel="Change icon" disabled={!editMode}>
					<AnimatedIcon icon={automationIcon} class="size-4 text-muted-foreground">
						{#snippet fallback()}<Workflow class="size-4 text-muted-foreground" />{/snippet}
					</AnimatedIcon>
				</IconPickerTrigger>
			</IconPicker>
			<Input
				bind:value={automationName}
				class="h-8 w-48 text-sm font-medium"
				placeholder="Automation name"
				disabled={!editMode}
			/>

			<Switch
				checked={automationEnabled}
				onCheckedChange={handleToggle}
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
						<span class="hidden sm:inline">Visual</span>
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
						<span class="hidden sm:inline">Code</span>
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
		<div class="relative flex-1" in:fly={{ y: -4, duration: 150 }}>
			<AutomationFlow
				bind:nodes={flowNodes}
				bind:edges={flowEdges}
				editable={editMode}
				onconnect={handleConnect}
				onnodeclick={handleNodeClick}
				onnodedragstop={takeSnapshot}
				ondelete={takeSnapshot}
				onReady={(api) => (flowApi = api)}
			/>
			<div class="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-lg bg-card/90 shadow-card px-2 py-1.5 backdrop-blur-sm">
				<Button variant="ghost" size="icon-sm" onclick={handleUndo} disabled={!editMode || !history.canUndo}>
					<Undo2 class="size-3.5" />
				</Button>
				<Button variant="ghost" size="icon-sm" onclick={handleRedo} disabled={!editMode || !history.canRedo}>
					<Redo2 class="size-3.5" />
				</Button>
				<Button variant="ghost" size="sm" onclick={handleSort} disabled={!editMode}>
					<Rows3 class="size-3.5" />
					<span class="hidden sm:inline">Sort</span>
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={handleCopy}
					disabled={!editMode || !anyNodeSelected}
					aria-label="Copy selected nodes"
				>
					<Copy class="size-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={handlePaste}
					disabled={!editMode || !copyBuffer}
					aria-label="Paste copied nodes"
				>
					<ClipboardPaste class="size-3.5" />
				</Button>
				<div class="mx-1 h-4 w-px bg-border"></div>
				<Button variant="ghost" size="sm" onclick={() => addNode("trigger")} disabled={!editMode}>
					<Zap class="size-3.5 text-automation-trigger" />
					<span class="hidden sm:inline">Trigger</span>
				</Button>
				<Button variant="ghost" size="sm" onclick={() => addNode("condition")} disabled={!editMode}>
					<ShieldCheck class="size-3.5 text-automation-condition" />
					<span class="hidden sm:inline">Condition</span>
				</Button>
				<Button variant="ghost" size="sm" onclick={() => addNode("operator")} disabled={!editMode}>
					<GitMerge class="size-3.5 text-automation-operator" />
					<span class="hidden sm:inline">Operator</span>
				</Button>
				<Button variant="ghost" size="sm" onclick={() => addNode("action")} disabled={!editMode}>
					<Play class="size-3.5 text-automation-action" />
					<span class="hidden sm:inline">Action</span>
				</Button>
				<div class="mx-1 h-4 w-px bg-border"></div>
				<div class="flex items-center rounded-md border border-border dark:border-input">
					<Button
						variant={editMode ? "secondary" : "ghost"}
						size="sm"
						class="rounded-r-none border-0 h-7"
						onclick={() => { if (!editMode) toggleMode(); }}
					>
						<Pencil class="size-3.5" />
						<span class="hidden sm:inline">Edit</span>
					</Button>
					<Button
						variant={!editMode ? "secondary" : "ghost"}
						size="sm"
						class="rounded-l-none border-0 h-7"
						disabled={editMode && liveDisabled}
						onclick={handleGoLive}
					>
						<Eye class="size-3.5" />
						<span class="hidden sm:inline">Live</span>
					</Button>
				</div>
			</div>
		</div>
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
					<span class="font-medium">Invalid config:</span>
					<span class="font-mono">{jsonError}</span>
				</div>
			{/if}
		</div>
	{/if}

	<HiveDrawer
		bind:open={pickerOpen}
		title="Select Target"
		description={pickerActionType === "activate_scene" ? "Pick a scene to activate." : "Pick a device for this action."}
		groups={pickerGroups}
		onselect={handleTargetSelect}
	/>

	<ConfirmDialog
		bind:open={deleteConfirmOpen}
		title="Delete Automation"
		description='Are you sure you want to delete "{automationName}"? This action cannot be undone.'
		confirmLabel="Delete"
		loading={deleteLoading}
		onconfirm={handleDelete}
		oncancel={() => (deleteConfirmOpen = false)}
	/>

</div>
