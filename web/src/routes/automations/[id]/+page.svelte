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
	import MemberPicker from "$lib/components/member-picker.svelte";
	import AutomationFlow from "$lib/components/graph/automation-flow.svelte";
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
	} from "@lucide/svelte";
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
	let automationEnabled = $state(false);
	let cooldownSeconds = $state(60);
	let flowNodes = $state<Node[]>([]);
	let flowEdges = $state<Edge[]>([]);

	let editMode = $state(true);
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
			flowNodes = automationNodesToFlowNodes(auto.nodes, editMode, activatedNodes);
			flowEdges = automationEdgesToFlowEdges(auto.edges);
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

<div class="flex h-[calc(100vh-5rem)] flex-col">
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
		<Button variant="ghost" size="icon-sm" onclick={() => goto("/automations")} aria-label="Back">
			<ArrowLeft class="size-4" />
		</Button>

		{#if loading}
			<div class="h-8 w-48 animate-pulse rounded-md bg-muted"></div>
		{:else}
			{#if editMode}
				<Input
					bind:value={automationName}
					class="h-8 w-48 text-sm font-medium"
					placeholder="Automation name"
				/>
			{:else}
				<h1 class="text-lg font-semibold">{automationName}</h1>
			{/if}

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

			{#if editMode}
				<div class="flex items-center gap-1">
					<Input
						type="number"
						bind:value={cooldownSeconds}
						class="h-8 w-20 text-xs"
						min={0}
					/>
					<span class="text-xs text-muted-foreground">s cooldown</span>
				</div>
			{:else}
				<Badge variant="secondary" class="text-xs">{cooldownSeconds}s cooldown</Badge>
			{/if}

			<div class="ml-auto flex items-center gap-2">
				{#if editMode}
					<div class="hidden items-center gap-1 sm:flex">
						<Button variant="outline" size="sm" onclick={() => addNode("trigger")}>
							<Zap class="size-3.5 text-blue-500" />
							<span class="hidden lg:inline">Trigger</span>
						</Button>
						<Button variant="outline" size="sm" onclick={() => addNode("operator")}>
							<GitMerge class="size-3.5 text-yellow-500" />
							<span class="hidden lg:inline">Operator</span>
						</Button>
						<Button variant="outline" size="sm" onclick={() => addNode("action")}>
							<Play class="size-3.5 text-green-500" />
							<span class="hidden lg:inline">Action</span>
						</Button>
					</div>
				{/if}

				<Button
					variant="outline"
					size="sm"
					onclick={toggleMode}
					aria-label={editMode ? "Switch to live mode" : "Switch to edit mode"}
				>
					{#if editMode}
						<Eye class="size-3.5" />
						<span class="hidden sm:inline">Live</span>
					{:else}
						<Pencil class="size-3.5" />
						<span class="hidden sm:inline">Edit</span>
					{/if}
				</Button>

				{#if editMode}
					<Button size="sm" onclick={handleSave} disabled={saving}>
						<Save class="size-3.5" />
						<span class="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
					</Button>

					<Button
						variant="destructive"
						size="sm"
						onclick={() => (deleteConfirmOpen = true)}
					>
						<Trash2 class="size-3.5" />
					</Button>
				{/if}
			</div>
		{/if}
	</div>

	{#if editMode && isMobile.current}
		<div class="flex gap-1 border-b border-border py-2">
			<Button variant="outline" size="sm" onclick={() => addNode("trigger")}>
				<Zap class="size-3.5 text-blue-500" />
				Trigger
			</Button>
			<Button variant="outline" size="sm" onclick={() => addNode("operator")}>
				<GitMerge class="size-3.5 text-yellow-500" />
				Operator
			</Button>
			<Button variant="outline" size="sm" onclick={() => addNode("action")}>
				<Play class="size-3.5 text-green-500" />
				Action
			</Button>
		</div>
	{/if}

	{#if loading}
		<div class="flex flex-1 items-center justify-center">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
		</div>
	{:else}
		<div class="flex-1">
			<AutomationFlow
				bind:nodes={flowNodes}
				bind:edges={flowEdges}
				editable={editMode}
				onconnect={handleConnect}
				onnodeclick={handleNodeClick}
			/>
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
