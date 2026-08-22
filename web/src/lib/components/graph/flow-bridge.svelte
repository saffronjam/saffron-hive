<script lang="ts">
	import { useNodesInitialized, useSvelteFlow, type Node } from "@xyflow/svelte";
	import { onMount } from "svelte";

	export interface FlowApi {
		panToNode(id: string): void;
		screenToFlowPosition(position: { x: number; y: number }): { x: number; y: number };
	}

	interface Props {
		nodes: Node[];
		onReady?: (api: FlowApi) => void;
		onNodesInitialized?: () => void;
	}

	let { nodes, onReady, onNodesInitialized }: Props = $props();

	const flow = useSvelteFlow();
	const nodesInitialized = useNodesInitialized();
	let initializationReported = false;

	$effect(() => {
		if (!nodesInitialized.current) {
			initializationReported = false;
			return;
		}
		if (initializationReported) return;
		initializationReported = true;
		onNodesInitialized?.();
	});

	function panToNode(nodeId: string) {
		const node = nodes.find((n) => n.id === nodeId);
		if (!node) return;
		const measured = (node as { measured?: { width?: number; height?: number } }).measured;
		const width = measured?.width ?? (node as { width?: number }).width ?? 256;
		const height = measured?.height ?? (node as { height?: number }).height ?? 120;
		const vp = flow.getViewport();
		const xMin = node.position.x * vp.zoom + vp.x;
		const yMin = node.position.y * vp.zoom + vp.y;
		const xMax = xMin + width * vp.zoom;
		const yMax = yMin + height * vp.zoom;
		const container = document.querySelector(".svelte-flow");
		const rect = container?.getBoundingClientRect();
		if (!rect) return;
		const margin = 40;
		const inside =
			xMin >= margin &&
			yMin >= margin &&
			xMax <= rect.width - margin &&
			yMax <= rect.height - margin;
		if (inside) return;
		flow.setCenter(node.position.x + width / 2, node.position.y + height / 2, {
			duration: 400,
			zoom: vp.zoom,
		});
	}

	function screenToFlowPosition(position: { x: number; y: number }) {
		return flow.screenToFlowPosition(position, { snapToGrid: false });
	}

	onMount(() => {
		onReady?.({ panToNode, screenToFlowPosition });
	});
</script>
