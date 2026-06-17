<script lang="ts">
	import { useSvelteFlow, type Node } from "@xyflow/svelte";
	import { onMount } from "svelte";

	interface Props {
		nodes: Node[];
		editable: boolean;
		onnodedragstop?: () => void;
	}

	let { nodes = $bindable([]), editable, onnodedragstop }: Props = $props();

	const flow = useSvelteFlow();

	const HOLD_MS = 250;
	const MOVE_TOLERANCE = 8;

	onMount(() => {
		const pane = document.querySelector<HTMLElement>(".svelte-flow");
		if (!pane) return;

		let holdTimer: ReturnType<typeof setTimeout> | null = null;
		let activeNodeId: string | null = null;
		let dragging = false;
		let pointerId = -1;
		let captureTarget: Element | null = null;
		let startClient = { x: 0, y: 0 };
		let grabOffset = { x: 0, y: 0 };

		function reset() {
			if (holdTimer) {
				clearTimeout(holdTimer);
				holdTimer = null;
			}
			if (captureTarget && pointerId >= 0) {
				try {
					captureTarget.releasePointerCapture(pointerId);
				} catch {
					// capture may already be gone after pointerup
				}
			}
			activeNodeId = null;
			dragging = false;
			pointerId = -1;
			captureTarget = null;
		}

		function onPointerDown(e: PointerEvent) {
			if (!editable || e.pointerType === "mouse") return;
			const target = e.target as Element | null;
			if (!target) return;
			const nodeEl = target.closest(".svelte-flow__node");
			if (!nodeEl || target.closest(".nodrag")) return;
			const id = nodeEl.getAttribute("data-id");
			if (!id) return;

			// Take over the touch so xyflow's own drag never engages; we drive the
			// node position ourselves only after the hold timer arms.
			e.stopImmediatePropagation();
			e.preventDefault();

			activeNodeId = id;
			pointerId = e.pointerId;
			captureTarget = target;
			startClient = { x: e.clientX, y: e.clientY };
			try {
				target.setPointerCapture(e.pointerId);
			} catch {
				// some targets reject capture; window listeners still cover us
			}

			holdTimer = setTimeout(() => {
				holdTimer = null;
				if (activeNodeId !== id) return;
				const node = nodes.find((n) => n.id === id);
				if (!node) {
					reset();
					return;
				}
				const p = flow.screenToFlowPosition({ x: startClient.x, y: startClient.y });
				grabOffset = { x: p.x - node.position.x, y: p.y - node.position.y };
				dragging = true;
				navigator.vibrate?.(15);
			}, HOLD_MS);
		}

		function onPointerMove(e: PointerEvent) {
			if (activeNodeId === null || e.pointerId !== pointerId) return;
			if (!dragging) {
				const dx = e.clientX - startClient.x;
				const dy = e.clientY - startClient.y;
				if (dx * dx + dy * dy > MOVE_TOLERANCE * MOVE_TOLERANCE) reset();
				return;
			}
			e.preventDefault();
			const p = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
			const nextX = p.x - grabOffset.x;
			const nextY = p.y - grabOffset.y;
			nodes = nodes.map((n) =>
				n.id === activeNodeId ? { ...n, position: { x: nextX, y: nextY } } : n,
			);
		}

		function onPointerUp(e: PointerEvent) {
			if (e.pointerId !== pointerId) return;
			const didDrag = dragging;
			reset();
			if (didDrag) onnodedragstop?.();
		}

		pane.addEventListener("pointerdown", onPointerDown, true);
		window.addEventListener("pointermove", onPointerMove, { passive: false });
		window.addEventListener("pointerup", onPointerUp, true);
		window.addEventListener("pointercancel", onPointerUp, true);

		return () => {
			pane.removeEventListener("pointerdown", onPointerDown, true);
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerUp, true);
			window.removeEventListener("pointercancel", onPointerUp, true);
			reset();
		};
	});
</script>
