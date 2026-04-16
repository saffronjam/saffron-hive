<script lang="ts">
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";
	import { createGraphQLClient } from "$lib/graphql/client";
	import { gql } from "@urql/svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetDescription,
	} from "$lib/components/ui/sheet/index.js";
	import {
		Tabs,
		TabsContent,
		TabsList,
		TabsTrigger,
	} from "$lib/components/ui/tabs/index.js";
	import MemberPicker from "$lib/components/member-picker.svelte";
	import AutomationFlow from "$lib/components/graph/automation-flow.svelte";
	import JsonEditor from "$lib/components/json-editor.svelte";
	import {
		ArrowLeft,
		Save,
		Trash2,
		Zap,
		GitMerge,
		Play,
		X,
		Eye,
		Pencil,
		Code,
		LayoutGrid,
	} from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { type Node, type Edge, type Connection } from "@xyflow/svelte";
	import type { Device } from "$lib/stores/devices";
	import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";

	interface TriggerConfig {
		eventType: string;
		deviceFilter: string;
		condition: string;
	}

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

	type NodeConfig = TriggerConfig | OperatorConfig | ActionConfig;

	interface AutomationNodeData {
		id: string;
		type: string;
		config: string;
	}

	interface AutomationEdgeData {
		id: string;
		fromNodeId: string;
		toNodeId: string;
	}

	interface AutomationData {
		id: string;
		name: string;
		enabled: boolean;
		cooldownSeconds: number;
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

	interface AutomationNodeActivationResult {
		automationNodeActivated: {
			automationId: string;
			nodeId: string;
			active: boolean;
		};
	}

	const AUTOMATION_QUERY = gql`
		query Automation($id: ID!) {
			automation(id: $id) {
				id
				name
				enabled
				cooldownSeconds
				nodes {
					id
					type
					config
				}
				edges {
					id
					fromNodeId
					toNodeId
				}
			}
		}
	`;

	const UPDATE_AUTOMATION = gql`
		mutation UpdateAutomation($id: ID!, $input: UpdateAutomationInput!) {
			updateAutomation(id: $id, input: $input) {
				id
				name
				enabled
				cooldownSeconds
				nodes {
					id
					type
					config
				}
				edges {
					id
					fromNodeId
					toNodeId
				}
			}
		}
	`;

	const DELETE_AUTOMATION = gql`
		mutation DeleteAutomation($id: ID!) {
			deleteAutomation(id: $id)
		}
	`;

	const TOGGLE_AUTOMATION = gql`
		mutation ToggleAutomation($id: ID!, $enabled: Boolean!) {
			toggleAutomation(id: $id, enabled: $enabled) {
				id
				enabled
			}
		}
	`;

	const DEVICES_QUERY = gql`
		query Devices {
			devices {
				id
				name
				type
				source
				available
				lastSeen
				state {
					... on LightState {
						on
						brightness
						colorTemp
						transition
					}
					... on SensorState {
						temperature
						humidity
						battery
						pressure
						illuminance
					}
					... on SwitchState {
						action
					}
				}
			}
		}
	`;

	const GROUPS_QUERY = gql`
		query Groups {
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
	`;

	const NODE_ACTIVATED_SUBSCRIPTION = gql`
		subscription AutomationNodeActivated($automationId: ID) {
			automationNodeActivated(automationId: $automationId) {
				automationId
				nodeId
				active
			}
		}
	`;

	const automationId = $derived(page.params.id);
	const isMobile = new IsMobile();

	let client = $state<ReturnType<typeof createGraphQLClient> | null>(null);

	let automationName = $state("");

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Automations", href: "/automations" }, { label: "Automation" }];
	});
	onDestroy(() => pageHeader.reset());

	$effect(() => {
		if (automationName) {
			pageHeader.breadcrumbs = [{ label: "Automations", href: "/automations" }, { label: automationName }];
		}
	});

	$effect(() => {
		pageHeader.actions = [
			{ label: saving ? "Saving..." : "Save", icon: Save, onclick: handleSave, disabled: !editMode || saving },
			{ label: "Delete", icon: Trash2, variant: "destructive" as const, onclick: () => (deleteConfirmOpen = true), disabled: !editMode },
		];
	});
	let automationEnabled = $state(false);
	let cooldownSeconds = $state(60);
	let flowNodes = $state<Node[]>([]);
	let flowEdges = $state<Edge[]>([]);

	let editMode = $state(true);
	let viewMode = $state<"visual" | "code">("visual");
	let jsonString = $state("");
	let jsonError = $state<string | null>(null);
	let syncSource = $state<"visual" | "code" | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let errorMessage = $state<string | null>(null);
	let deleteConfirmOpen = $state(false);
	let deleteLoading = $state(false);

	let pickerOpen = $state(false);
	let pickerTargetNodeId = $state<string | null>(null);
	let devices = $state<Device[]>([]);
	let groups = $state<GroupData[]>([]);

	let activatedNodes = $state<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	let unsubscribers: (() => void)[] = [];

	let nodeIdCounter = $state(0);

	function clearError() {
		errorMessage = null;
	}

	function dismissErrorAfterDelay() {
		setTimeout(clearError, 5000);
	}

	function parseConfig(configJson: string): NodeConfig {
		try {
			return JSON.parse(configJson) as NodeConfig;
		} catch {
			return { eventType: "", deviceFilter: "", condition: "" };
		}
	}

	function defaultTriggerConfig(): TriggerConfig {
		return { eventType: "device.state_changed", deviceFilter: "", condition: "" };
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
		};

		const base = {
			config,
			editable: isEditable,
			activated: isActivated,
			onConfigChange,
		};

		if (nodeType === "action") {
			return {
				...base,
				onPickTarget: () => {
					pickerTargetNodeId = nodeId;
					pickerOpen = true;
				},
			};
		}

		return base;
	}

	function automationNodesToFlowNodes(
		nodes: AutomationNodeData[],
		isEditable: boolean,
		activatedSet: Map<string, ReturnType<typeof setTimeout>>
	): Node[] {
		const xPositions: Record<string, number> = { trigger: 0, operator: 350, action: 700 };
		const yCounters: Record<string, number> = { trigger: 0, operator: 0, action: 0 };

		return nodes.map((n) => {
			const config = parseConfig(n.config);
			const xPos = xPositions[n.type] ?? 0;
			const yPos = yCounters[n.type] * 180;
			yCounters[n.type] = (yCounters[n.type] ?? 0) + 1;

			return {
				id: n.id,
				type: n.type,
				position: { x: xPos, y: yPos },
				data: makeNodeData(n.type, config, isEditable, activatedSet.has(n.id), n.id),
			};
		});
	}

	function automationEdgesToFlowEdges(edges: AutomationEdgeData[]): Edge[] {
		return edges.map((e) => ({
			id: e.id,
			source: e.fromNodeId,
			target: e.toNodeId,
			animated: true,
		}));
	}

	function flowNodesToAutomationNodes(nodes: Node[]): { id: string; type: string; config: string }[] {
		return nodes.map((n) => ({
			id: n.id,
			type: n.type ?? "trigger",
			config: JSON.stringify((n.data as Record<string, unknown>).config),
		}));
	}

	function flowEdgesToAutomationEdges(edges: Edge[]): { fromNodeId: string; toNodeId: string }[] {
		return edges.map((e) => ({
			fromNodeId: e.source,
			toNodeId: e.target,
		}));
	}

	interface AutomationJson {
		name: string;
		cooldownSeconds: number;
		nodes: { id: string; type: string; config: Record<string, unknown> }[];
		edges: { from: string; to: string }[];
	}

	function flowStateToJson(): string {
		const obj: AutomationJson = {
			name: automationName,
			cooldownSeconds,
			nodes: flowNodes.map((n) => ({
				id: n.id,
				type: n.type ?? "trigger",
				config: (n.data as Record<string, unknown>).config as Record<string, unknown>,
			})),
			edges: flowEdges.map((e) => ({
				from: e.source,
				to: e.target,
			})),
		};
		return JSON.stringify(obj, null, 2);
	}

	function jsonToFlowState(jsonStr: string): { ok: true; name: string; cooldownSeconds: number; nodes: AutomationNodeData[]; edges: AutomationEdgeData[] } | { ok: false; error: string } {
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
		if (typeof obj.cooldownSeconds !== "number") {
			return { ok: false, error: "\"cooldownSeconds\" must be a number" };
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
		}));

		const edges: AutomationEdgeData[] = (obj.edges as Record<string, unknown>[]).map((e, i) => ({
			id: `edge-${e.from}-${e.to}-${i}`,
			fromNodeId: e.from as string,
			toNodeId: e.to as string,
		}));

		return { ok: true, name: obj.name, cooldownSeconds: obj.cooldownSeconds as number, nodes, edges };
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
			cooldownSeconds = result.cooldownSeconds;
			flowNodes = automationNodesToFlowNodes(result.nodes, editMode, activatedNodes);
			flowEdges = automationEdgesToFlowEdges(result.edges);
		} else {
			jsonError = result.error;
		}
		syncSource = null;
	}

	function addNode(nodeType: "trigger" | "operator" | "action") {
		nodeIdCounter++;
		const tempId = `new-${nodeType}-${nodeIdCounter}`;
		const xPositions: Record<string, number> = { trigger: 0, operator: 350, action: 700 };
		const existingOfType = flowNodes.filter((n) => n.type === nodeType).length;

		let config: NodeConfig;
		switch (nodeType) {
			case "trigger":
				config = defaultTriggerConfig();
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
			position: { x: xPositions[nodeType] ?? 0, y: existingOfType * 180 },
			data: makeNodeData(nodeType, config, editMode, false, tempId),
		};

		flowNodes = [...flowNodes, newNode];
	}

	function handleConnect(connection: Connection) {
		const newEdge: Edge = {
			id: `edge-${connection.source}-${connection.target}`,
			source: connection.source,
			target: connection.target,
			animated: true,
		};
		flowEdges = [...flowEdges, newEdge];
	}

	function handleNodeClick(event: { node: Node; event: MouseEvent | TouchEvent }) {
		if (!editMode || !isMobile.current) return;
		const node = event.node;
		if (node.type === "action") {
			pickerTargetNodeId = node.id;
			pickerOpen = true;
		}
	}

	function handleTargetSelect(memberType: "device" | "group", memberId: string) {
		if (!pickerTargetNodeId) return;

		const selectedDevice = devices.find((d) => d.id === memberId);
		const selectedGroup = groups.find((g) => g.id === memberId);
		const targetName = selectedDevice?.name ?? selectedGroup?.name ?? memberId;

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
	}

	function updateNodeEditability(isEditable: boolean) {
		flowNodes = flowNodes.map((n) => ({
			...n,
			data: { ...n.data, editable: isEditable },
		}));
	}

	function toggleMode() {
		editMode = !editMode;
		updateNodeEditability(editMode);
	}

	async function handleSave() {
		if (!client) return;
		saving = true;
		clearError();

		const result = await client
			.mutation<UpdateAutomationResult>(UPDATE_AUTOMATION, {
				id: automationId,
				input: {
					name: automationName,
					cooldownSeconds,
					nodes: flowNodesToAutomationNodes(flowNodes),
					edges: flowEdgesToAutomationEdges(flowEdges),
				},
			})
			.toPromise();

		saving = false;

		if (result.error) {
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
			return;
		}

		if (result.data) {
			const auto = result.data.updateAutomation;
			const oldIds = flowNodes.map((n) => n.id);
			const newIds = auto.nodes.map((n) => n.id);
			const idsChanged = oldIds.length !== newIds.length || oldIds.some((id, i) => id !== newIds[i]);
			if (idsChanged) {
				flowNodes = automationNodesToFlowNodes(auto.nodes, editMode, activatedNodes);
				flowEdges = automationEdgesToFlowEdges(auto.edges);
			}
			jsonString = flowStateToJson();
		}
	}

	async function handleToggle(enabled: boolean) {
		if (!client) return;
		clearError();

		const result = await client
			.mutation<ToggleAutomationResult>(TOGGLE_AUTOMATION, {
				id: automationId,
				enabled,
			})
			.toPromise();

		if (result.error) {
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
			return;
		}

		automationEnabled = enabled;
	}

	async function handleDelete() {
		if (!client) return;
		deleteLoading = true;
		clearError();

		const result = await client
			.mutation<DeleteAutomationResult>(DELETE_AUTOMATION, { id: automationId })
			.toPromise();

		deleteLoading = false;

		if (result.error) {
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
			return;
		}

		goto("/automations");
	}

	onMount(() => {
		client = createGraphQLClient();

		client
			.query<AutomationQueryResult>(AUTOMATION_QUERY, { id: automationId })
			.toPromise()
			.then((result) => {
				loading = false;
				if (result.data?.automation) {
					const auto = result.data.automation;
					automationName = auto.name;
					automationEnabled = auto.enabled;
					cooldownSeconds = auto.cooldownSeconds;
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

		const { unsubscribe: unsubActivation } = client
			.subscription<AutomationNodeActivationResult>(NODE_ACTIVATED_SUBSCRIPTION, {
				automationId,
			})
			.subscribe((result) => {
				if (!result.data) return;
				const { nodeId, active } = result.data.automationNodeActivated;

				if (active) {
					const existing = activatedNodes.get(nodeId);
					if (existing) clearTimeout(existing);

					const timeout = setTimeout(() => {
						activatedNodes.delete(nodeId);
						activatedNodes = new Map(activatedNodes);
						flowNodes = flowNodes.map((n) =>
							n.id === nodeId ? { ...n, data: { ...n.data, activated: false } } : n
						);
					}, 3000);

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

<div class="flex h-[calc(100vh-6rem)] flex-col">
	{#if errorMessage}
		<div
			class="mb-2 flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			<span>{errorMessage}</span>
			<button type="button" onclick={clearError} class="ml-2 shrink-0">
				<X class="size-4" />
			</button>
		</div>
	{/if}

	<div class="flex flex-wrap items-center gap-2 border-b border-border pb-3">
		{#if loading}
			<div class="h-8 w-48 animate-pulse rounded-md bg-muted"></div>
		{:else}
			<Input
				bind:value={automationName}
				class="h-8 w-48 text-sm font-medium"
				placeholder="Automation name"
				disabled={!editMode}
			/>

			<div class="flex items-center gap-1.5">
				<Switch
					checked={automationEnabled}
					onCheckedChange={handleToggle}
					size="sm"
				/>
				<span class="text-xs text-muted-foreground">
					{automationEnabled ? "Enabled" : "Disabled"}
				</span>
			</div>

			<div class="flex items-center gap-1">
				<Input
					type="number"
					bind:value={cooldownSeconds}
					class="h-8 w-20 text-xs"
					min={0}
					disabled={!editMode}
				/>
				<span class="text-xs text-muted-foreground">s cooldown</span>
			</div>

			<div class="ml-auto flex items-center gap-2">
				<div class="hidden items-center gap-1 sm:flex">
						<Button variant="outline" size="sm" onclick={() => addNode("trigger")} disabled={!editMode || viewMode === "code"}>
							<Zap class="size-3.5 text-blue-500" />
							<span class="hidden lg:inline">Trigger</span>
						</Button>
						<Button variant="outline" size="sm" onclick={() => addNode("operator")} disabled={!editMode || viewMode === "code"}>
							<GitMerge class="size-3.5 text-yellow-500" />
							<span class="hidden lg:inline">Operator</span>
						</Button>
						<Button variant="outline" size="sm" onclick={() => addNode("action")} disabled={!editMode || viewMode === "code"}>
							<Play class="size-3.5 text-green-500" />
							<span class="hidden lg:inline">Action</span>
						</Button>
				</div>

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

				<div class="flex items-center rounded-md border border-border dark:border-input">
					<Button
						variant={editMode ? "secondary" : "ghost"}
						size="sm"
						class="rounded-r-none border-0"
						onclick={() => { if (!editMode) toggleMode(); }}
						disabled={viewMode === "code"}
					>
						<Pencil class="size-3.5" />
						<span class="hidden sm:inline">Edit</span>
					</Button>
					<Button
						variant={!editMode ? "secondary" : "ghost"}
						size="sm"
						class="rounded-l-none border-0"
						onclick={() => { if (editMode) toggleMode(); }}
						disabled={viewMode === "code"}
					>
						<Eye class="size-3.5" />
						<span class="hidden sm:inline">Live</span>
					</Button>
				</div>

			</div>
		{/if}
	</div>

	{#if isMobile.current}
		<div class="flex gap-1 border-b border-border py-2">
			<Button variant="outline" size="sm" onclick={() => addNode("trigger")} disabled={!editMode || viewMode === "code"}>
				<Zap class="size-3.5 text-blue-500" />
				Trigger
			</Button>
			<Button variant="outline" size="sm" onclick={() => addNode("operator")} disabled={!editMode || viewMode === "code"}>
				<GitMerge class="size-3.5 text-yellow-500" />
				Operator
			</Button>
			<Button variant="outline" size="sm" onclick={() => addNode("action")} disabled={!editMode || viewMode === "code"}>
				<Play class="size-3.5 text-green-500" />
				Action
			</Button>
		</div>
	{/if}

	{#if loading}
		<div class="flex flex-1 items-center justify-center">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
		</div>
	{:else if viewMode === "visual"}
		<div class="flex-1">
			<AutomationFlow
				bind:nodes={flowNodes}
				bind:edges={flowEdges}
				editable={editMode}
				onconnect={handleConnect}
				onnodeclick={handleNodeClick}
			/>
		</div>
	{:else}
		<div class="relative flex-1 pt-2">
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

	<Sheet bind:open={pickerOpen}>
		<SheetContent side="right" class="w-full sm:max-w-md">
			<SheetHeader>
				<SheetTitle>Select Target</SheetTitle>
				<SheetDescription>Pick a device or group for this action.</SheetDescription>
			</SheetHeader>
			<div class="mt-4">
				<MemberPicker
					{devices}
					{groups}
					onselect={handleTargetSelect}
				/>
			</div>
		</SheetContent>
	</Sheet>

	<Dialog bind:open={deleteConfirmOpen}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Delete Automation</DialogTitle>
				<DialogDescription>
					Are you sure you want to delete "{automationName}"? This action cannot be undone.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter>
				<Button variant="outline" onclick={() => (deleteConfirmOpen = false)}>
					Cancel
				</Button>
				<Button variant="destructive" onclick={handleDelete} disabled={deleteLoading}>
					{deleteLoading ? "Deleting..." : "Delete"}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</div>
