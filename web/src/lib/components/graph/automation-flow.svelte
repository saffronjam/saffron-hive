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
	import TriggerNode from "./trigger-node.svelte";
	import OperatorNode from "./operator-node.svelte";
	import ActionNode from "./action-node.svelte";

	interface Props {
		nodes: Node[];
		edges: Edge[];
		editable: boolean;
		onnodeschange?: (nodes: Node[]) => void;
		onedgeschange?: (edges: Edge[]) => void;
		onconnect?: (connection: Connection) => void;
		onnodeclick?: (event: { node: Node; event: MouseEvent | TouchEvent }) => void;
	}

	let {
		nodes = $bindable([]),
		edges = $bindable([]),
		editable,
		onconnect,
		onnodeclick,
	}: Props = $props();

	const nodeTypes: NodeTypes = {
		trigger: TriggerNode as NodeTypes[string],
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

<div class="h-full w-full">
	<SvelteFlow
		bind:nodes
		bind:edges
		{nodeTypes}
		{isValidConnection}
		onconnect={handleConnect}
		onnodeclick={onnodeclick}
		nodesDraggable={editable}
		nodesConnectable={editable}
		elementsSelectable={editable}
		fitView
		colorMode="system"
		deleteKey={editable ? "Backspace" : null}
		proOptions={{ hideAttribution: true }}
	>
		<Controls />
		<Background />
	</SvelteFlow>
</div>
