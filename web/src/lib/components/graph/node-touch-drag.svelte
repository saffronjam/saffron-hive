<script lang="ts">
	import { useSvelteFlow, type Node } from "@xyflow/svelte";
	import { onMount } from "svelte";
	import { createHoldDrag } from "$lib/actions/hold-drag";

	interface Props {
		nodes: Node[];
		editable: boolean;
		onnodedragstop?: () => void;
	}

	let { nodes = $bindable([]), editable, onnodedragstop }: Props = $props();

	const flow = useSvelteFlow();

	onMount(() => {
		const pane = document.querySelector<HTMLElement>(".svelte-flow");
		if (!pane) return;

		let activeNodeId: string | null = null;
		let pointerId = -1;
		let captureTarget: Element | null = null;
		let grabOffset = { x: 0, y: 0 };

		function releaseCapture() {
			if (captureTarget && pointerId >= 0) {
				try {
					captureTarget.releasePointerCapture(pointerId);
				} catch {
					// capture may already be gone after pointerup
				}
			}
			activeNodeId = null;
			pointerId = -1;
			captureTarget = null;
		}

		const machine = createHoldDrag({
			onstart(e) {
				const node = nodes.find((n) => n.id === activeNodeId);
				if (!node || node.draggable === false) {
					machine.reset();
					releaseCapture();
					return;
				}
				const p = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
				grabOffset = { x: p.x - node.position.x, y: p.y - node.position.y };
			},
			onmove(e) {
				if (activeNodeId === null) return;
				const p = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
				const nextX = p.x - grabOffset.x;
				const nextY = p.y - grabOffset.y;
				nodes = nodes.map((n) =>
					n.id === activeNodeId ? { ...n, position: { x: nextX, y: nextY } } : n,
				);
			},
			onend() {
				releaseCapture();
				onnodedragstop?.();
			},
			oncancel() {
				releaseCapture();
				onnodedragstop?.();
			},
		});

		function onPointerDown(e: PointerEvent) {
			if (!editable || e.pointerType === "mouse") return;
			const target = e.target as Element | null;
			if (!target) return;
			const nodeEl = target.closest(".svelte-flow__node");
			if (!nodeEl || target.closest(".nodrag")) return;
			const id = nodeEl.getAttribute("data-id");
			if (!id) return;
			const node = nodes.find((candidate) => candidate.id === id);
			if (!node || node.draggable === false) return;

			// Take over the touch so xyflow's own drag never engages; the hold-drag
			// machine drives the node position only after the hold arms.
			e.stopImmediatePropagation();
			e.preventDefault();

			machine.reset();
			releaseCapture();
			activeNodeId = id;
			pointerId = e.pointerId;
			captureTarget = target;
			try {
				target.setPointerCapture(e.pointerId);
			} catch {
				// some targets reject capture; window listeners still cover us
			}
			machine.pointerdown(e);
		}

		function onPointerMove(e: PointerEvent) {
			machine.pointermove(e);
			if (e.pointerId === pointerId && machine.state === "idle") releaseCapture();
		}

		function onPointerUp(e: PointerEvent) {
			if (e.pointerId !== pointerId) return;
			machine.pointerup(e);
			releaseCapture();
		}

		function onPointerCancel(e: PointerEvent) {
			if (e.pointerId !== pointerId) return;
			machine.pointercancel(e);
			releaseCapture();
		}

		pane.addEventListener("pointerdown", onPointerDown, true);
		window.addEventListener("pointermove", onPointerMove, { passive: false });
		window.addEventListener("pointerup", onPointerUp, true);
		window.addEventListener("pointercancel", onPointerCancel, true);

		return () => {
			pane.removeEventListener("pointerdown", onPointerDown, true);
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerUp, true);
			window.removeEventListener("pointercancel", onPointerCancel, true);
			machine.reset();
			releaseCapture();
		};
	});
</script>
