<script lang="ts">
	import {
		SvelteFlow,
		Controls,
		Background,
		type Node,
		type Edge,
		type Connection,
		type NodeTypes,
		type IsValidConnection,
	} from "@xyflow/svelte";
	import "@xyflow/svelte/dist/style.css";
	import FlowBridge, { type FlowApi } from "./flow-bridge.svelte";
	import NodeTouchDrag from "./node-touch-drag.svelte";
	import TriggerNode from "./trigger-node.svelte";
	import ConditionNode from "./condition-node.svelte";
	import OperatorNode from "./operator-node.svelte";
	import ActionNode from "./action-node.svelte";

	interface Props {
		nodes: Node[];
		edges: Edge[];
		editable: boolean;
		nodesDraggable?: boolean;
		onnodeschange?: (nodes: Node[]) => void;
		onedgeschange?: (edges: Edge[]) => void;
		onconnect?: (connection: Connection) => void;
		onnodedragstop?: () => void;
		ondelete?: () => void;
		onPaneContextMenu?: (event: MouseEvent) => void;
		onNodeContextMenu?: (event: MouseEvent, node: Node) => void;
		onReady?: (api: FlowApi) => void;
		onNodesInitialized?: () => void;
	}

	let {
		nodes = $bindable([]),
		edges = $bindable([]),
		editable,
		nodesDraggable = editable,
		onconnect,
		onnodedragstop,
		ondelete,
		onPaneContextMenu,
		onNodeContextMenu,
		onReady,
		onNodesInitialized,
	}: Props = $props();

	const nodeTypes: NodeTypes = {
		trigger: TriggerNode as NodeTypes[string],
		condition: ConditionNode as NodeTypes[string],
		operator: OperatorNode as NodeTypes[string],
		action: ActionNode as NodeTypes[string],
	};

	function wouldCreateCycle(
		sourceId: string,
		targetId: string,
		currentEdges: Edge[]
	): boolean {
		const adjacency = new Map<string, string[]>();
		for (const edge of currentEdges) {
			const neighbors = adjacency.get(edge.source) ?? [];
			neighbors.push(edge.target);
			adjacency.set(edge.source, neighbors);
		}

		const visited = new Set<string>();
		const stack = [targetId];

		while (stack.length > 0) {
			const current = stack.pop()!;
			if (current === sourceId) return true;
			if (visited.has(current)) continue;
			visited.add(current);
			const neighbors = adjacency.get(current) ?? [];
			stack.push(...neighbors);
		}

		return false;
	}

	const isValidConnection: IsValidConnection = (connection) => {
		if (connection.source === connection.target) return false;
		return !wouldCreateCycle(connection.source, connection.target, edges);
	};

	function handleConnect(connection: Connection) {
		onconnect?.(connection);
	}
</script>

<div class="h-full w-full [--background-color:var(--background)] [--xy-background-color:var(--background)]">
	<SvelteFlow
		bind:nodes
		bind:edges
		{nodeTypes}
		{isValidConnection}
		onconnect={handleConnect}
		onnodedragstop={() => onnodedragstop?.()}
		ondelete={() => ondelete?.()}
		onpanecontextmenu={({ event }) => onPaneContextMenu?.(event)}
		onnodecontextmenu={({ event, node }) => onNodeContextMenu?.(event, node)}
		{nodesDraggable}
		nodesConnectable={editable}
		elementsSelectable={editable}
		fitView
		fitViewOptions={{ maxZoom: 1, padding: 0.3 }}
		colorMode="dark"
		zoomOnDoubleClick={false}
		deleteKey={editable ? ["Backspace", "Delete"] : null}
		defaultEdgeOptions={{
			animated: true,
			style: "stroke: var(--color-muted-foreground); stroke-width: 1px; opacity: 0.5;",
		}}
		proOptions={{ hideAttribution: true }}
	>
		<Controls />
		<Background bgColor="var(--background)" />
		<FlowBridge {nodes} {onReady} {onNodesInitialized} />
		<NodeTouchDrag bind:nodes editable={nodesDraggable} {onnodedragstop} />
	</SvelteFlow>
</div>
