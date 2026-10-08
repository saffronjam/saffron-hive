<script lang="ts">
	import { useNodesInitialized, useSvelteFlow, type Node } from "@xyflow/svelte";
	import { onMount } from "svelte";

	export interface FlowApi {
		/**
		 * Pans a node into view when it is not already visible. `rightInset`
		 * reserves screen width on the right, such as an open side panel.
		 */
		panToNode(id: string, options?: { rightInset?: number }): void;
		screenToFlowPosition(position: { x: number; y: number }): { x: number; y: number };
		flowToScreenPosition(position: { x: number; y: number }): { x: number; y: number };
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

	function panToNode(nodeId: string, options: { rightInset?: number } = {}) {
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
		const rightInset = options.rightInset ?? 0;
		const inside =
			xMin >= margin &&
			yMin >= margin &&
			xMax <= rect.width - rightInset - margin &&
			yMax <= rect.height - margin;
		if (inside) return;
		const centerX = node.position.x + width / 2 + rightInset / 2 / vp.zoom;
		flow.setCenter(centerX, node.position.y + height / 2, {
			duration: 400,
			zoom: vp.zoom,
		});
	}

	function screenToFlowPosition(position: { x: number; y: number }) {
		return flow.screenToFlowPosition(position, { snapToGrid: false });
	}

	function flowToScreenPosition(position: { x: number; y: number }) {
		return flow.flowToScreenPosition(position);
	}

	onMount(() => {
		onReady?.({ panToNode, screenToFlowPosition, flowToScreenPosition });
	});
</script>
