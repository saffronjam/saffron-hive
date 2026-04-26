<script lang="ts">
	import { onMount, untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import ColorPicker from "$lib/components/color-picker.svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import NumberInput from "$lib/components/number-input.svelte";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu/index.js";
	import {
		Lightbulb,
		Maximize2,
		Minus,
		Palette,
		Plus,
		Sun,
		Thermometer,
		Trash2,
		Zap,
	} from "@lucide/svelte";
	import {
		MIN_CLIP_VISUAL_PX,
		computeRequiredCapabilities,
		findFreeStartOnTrack,
		maxClipEnd,
		newEditableClip,
		newEditableTrack,
		type ClipKind,
		type EditableClip,
		type EditableTrack,
	} from "$lib/effect-editable";

	interface Props {
		tracks: EditableTrack[];
		loop: boolean;
		durationMs: number;
		disabled?: boolean;
	}

	let {
		tracks = $bindable(),
		loop = $bindable(),
		durationMs = $bindable(),
		disabled = false,
	}: Props = $props();

	const TRACK_HEIGHT = 56;
	const HEADER_WIDTH = 160;
	const RULER_HEIGHT = 32;

	const MIN_PX_PER_MS = 0.005;
	const MAX_PX_PER_MS = 4;

	const SNAP_PX = 6;

	let pxPerMs = $state(0.05);
	let viewportEl = $state<HTMLDivElement | null>(null);
	let viewportWidth = $state(800);
	let activeClipUid = $state<string | null>(null);
	let randomMap = $state<Record<string, boolean>>({});
	let initialized = $state(false);

	type ContextMenuState = {
		trackUid: string;
		startMs: number;
		x: number;
		y: number;
	};
	let contextMenuOpen = $state(false);
	let contextMenuState = $state<ContextMenuState | null>(null);

	const clipTypes: { kind: ClipKind; label: string }[] = [
		{ kind: "set_on_off", label: "On / off" },
		{ kind: "set_brightness", label: "Brightness" },
		{ kind: "set_color_rgb", label: "Color rgb" },
		{ kind: "set_color_temp", label: "Color temp" },
		{ kind: "native_effect", label: "Native effect" },
	];

	const requiredCaps = $derived(computeRequiredCapabilities(tracks));

	const lastClipEndMs = $derived(maxClipEnd(tracks));

	const effectiveDurationMs = $derived(loop ? durationMs : Math.max(durationMs, lastClipEndMs));

	const minDurationMsAllowed = $derived(loop ? lastClipEndMs : 0);

	$effect(() => {
		const want = lastClipEndMs;
		untrack(() => {
			if (!loop && durationMs !== want) {
				durationMs = want;
			}
			if (loop && durationMs < lastClipEndMs) {
				durationMs = lastClipEndMs;
			}
		});
	});

	$effect(() => {
		const isLoop = loop;
		untrack(() => {
			if (isLoop && durationMs === 0) {
				durationMs = Math.max(lastClipEndMs + 200, 1000);
			}
		});
	});

	function fitToViewport() {
		const span = Math.max(effectiveDurationMs, 1000);
		const usable = Math.max(viewportWidth - 32, 200);
		const next = (usable * 0.9) / span;
		pxPerMs = clamp(next, MIN_PX_PER_MS, MAX_PX_PER_MS);
	}

	onMount(() => {
		if (typeof ResizeObserver !== "undefined" && viewportEl) {
			const ro = new ResizeObserver((entries) => {
				for (const entry of entries) {
					viewportWidth = entry.contentRect.width;
				}
				if (!initialized) {
					initialized = true;
					fitToViewport();
				}
			});
			ro.observe(viewportEl);
			return () => ro.disconnect();
		}
		if (viewportEl) {
			viewportWidth = viewportEl.clientWidth;
		}
		initialized = true;
		fitToViewport();
	});

	function clamp(v: number, lo: number, hi: number): number {
		if (v < lo) return lo;
		if (v > hi) return hi;
		return v;
	}

	function clipIcon(kind: ClipKind) {
		switch (kind) {
			case "set_on_off":
				return Lightbulb;
			case "set_brightness":
				return Sun;
			case "set_color_rgb":
				return Palette;
			case "set_color_temp":
				return Thermometer;
			case "native_effect":
				return Zap;
		}
	}

	function clipColor(kind: ClipKind): string {
		switch (kind) {
			case "set_on_off":
				return "bg-yellow-500/20 border-yellow-500/60 text-yellow-900 dark:text-yellow-100";
			case "set_brightness":
				return "bg-amber-500/20 border-amber-500/60 text-amber-900 dark:text-amber-100";
			case "set_color_rgb":
				return "bg-fuchsia-500/20 border-fuchsia-500/60 text-fuchsia-900 dark:text-fuchsia-100";
			case "set_color_temp":
				return "bg-teal-500/20 border-teal-500/60 text-teal-900 dark:text-teal-100";
			case "native_effect":
				return "bg-purple-500/20 border-purple-500/60 text-purple-900 dark:text-purple-100";
		}
	}

	function clipKindLabel(kind: ClipKind): string {
		switch (kind) {
			case "set_on_off":
				return "On / off";
			case "set_brightness":
				return "Brightness";
			case "set_color_rgb":
				return "Color rgb";
			case "set_color_temp":
				return "Color temp";
			case "native_effect":
				return "Native effect";
		}
	}

	function clipSummaryLabel(c: EditableClip): string {
		switch (c.config.kind) {
			case "set_on_off":
				return c.config.config.value ? "On" : "Off";
			case "set_brightness":
				return `Bri ${c.config.config.value}`;
			case "set_color_rgb": {
				const { r, g, b } = c.config.config;
				return `RGB ${r},${g},${b}`;
			}
			case "set_color_temp":
				return `${c.config.config.mireds} mired`;
			case "native_effect":
				return c.config.config.name || "(native)";
		}
	}

	function capLabel(cap: string): string {
		switch (cap) {
			case "on_off":
				return "On/off";
			case "color_temp":
				return "Color temp";
			case "brightness":
				return "Brightness";
			case "color":
				return "Color";
			default:
				return cap;
		}
	}

	function capChipType(cap: string): string {
		switch (cap) {
			case "on_off":
				return "on";
			case "color_temp":
				return "colorTemp";
			case "brightness":
				return "brightness";
			case "color":
				return "color";
			default:
				return cap;
		}
	}

	function capChipIcon(cap: string): string | null {
		switch (cap) {
			case "color":
				return "lucide:palette";
			default:
				return null;
		}
	}

	function clipWidthPx(clip: EditableClip): number {
		return Math.max(MIN_CLIP_VISUAL_PX, clip.transitionMaxMs * pxPerMs);
	}

	function clipLeftPx(clip: EditableClip): number {
		return clip.startMs * pxPerMs;
	}

	function chooseTickIntervalMs(): number {
		const candidates = [10, 25, 50, 100, 250, 500, 1000, 2000, 5000, 10000, 30000, 60000];
		const targetTicks = 10;
		const usable = Math.max(viewportWidth - 32, 200);
		const ms = usable / pxPerMs;
		const want = ms / targetTicks;
		for (const c of candidates) {
			if (c >= want) return c;
		}
		return candidates[candidates.length - 1];
	}

	function visibleEndMs(): number {
		const usable = Math.max(viewportWidth - 32, 200);
		const fromZoom = usable / pxPerMs;
		return Math.max(fromZoom, effectiveDurationMs + 1000);
	}

	const tickIntervalMs = $derived.by(() => {
		void pxPerMs;
		void viewportWidth;
		return chooseTickIntervalMs();
	});

	const ticks = $derived.by(() => {
		const interval = tickIntervalMs;
		const end = visibleEndMs();
		const out: { ms: number; major: boolean }[] = [];
		const labelEvery = interval < 100 ? 2 : 1;
		let i = 0;
		for (let ms = 0; ms <= end; ms += interval) {
			out.push({ ms, major: i % labelEvery === 0 });
			i++;
		}
		return out;
	});

	function formatMs(ms: number): string {
		if (ms < 1000) return `${ms}ms`;
		const s = ms / 1000;
		return `${Number.isInteger(s) ? s : s.toFixed(1)}s`;
	}

	function addTrack() {
		tracks = [...tracks, newEditableTrack()];
	}

	function removeTrack(uid: string) {
		tracks = tracks.filter((t) => t.uid !== uid);
	}

	function renameTrack(uid: string, newName: string) {
		updateTrack(uid, (t) => ({ ...t, name: newName }));
	}

	function addClipToTrackAt(trackUid: string, kind: ClipKind, desiredStartMs: number) {
		const track = tracks.find((t) => t.uid === trackUid);
		if (!track) return;
		const probe = newEditableClip(kind, 0);
		const interval = tickIntervalMs;
		const snapped = Math.max(0, Math.round(desiredStartMs / interval) * interval);
		const start = findFreeStartOnTrack(track, snapped, probe.transitionMaxMs);
		if (start === null) {
			toast.error("No free space on this track for the new clip");
			return;
		}
		probe.startMs = start;
		updateTrack(trackUid, (t) => ({ ...t, clips: [...t.clips, probe] }));
	}

	function updateTrack(uid: string, mut: (t: EditableTrack) => EditableTrack) {
		tracks = tracks.map((t) => (t.uid === uid ? mut(t) : t));
	}

	function updateClip(trackUid: string, clipUid: string, mut: (c: EditableClip) => EditableClip) {
		updateTrack(trackUid, (t) => ({
			...t,
			clips: t.clips.map((c) => (c.uid === clipUid ? mut(c) : c)),
		}));
	}

	function removeClip(trackUid: string, clipUid: string) {
		updateTrack(trackUid, (t) => ({ ...t, clips: t.clips.filter((c) => c.uid !== clipUid) }));
	}

	function moveClipBetweenTracks(fromUid: string, toUid: string, clipUid: string) {
		const fromTrack = tracks.find((t) => t.uid === fromUid);
		const clip = fromTrack?.clips.find((c) => c.uid === clipUid);
		if (!fromTrack || !clip) return;
		tracks = tracks.map((t) => {
			if (t.uid === fromUid) {
				return { ...t, clips: t.clips.filter((c) => c.uid !== clipUid) };
			}
			if (t.uid === toUid) {
				return { ...t, clips: [...t.clips, clip] };
			}
			return t;
		});
	}

	function clipsOverlap(a: { startMs: number; transitionMaxMs: number }, b: EditableClip): boolean {
		const aEnd = a.startMs + Math.max(a.transitionMaxMs, 0);
		const bEnd = b.startMs + Math.max(b.transitionMaxMs, 0);
		return a.startMs < bEnd && b.startMs < aEnd;
	}

	function trackHasOverlap(
		track: EditableTrack,
		ignoreUid: string,
		candidate: { startMs: number; transitionMaxMs: number },
	): boolean {
		for (const c of track.clips) {
			if (c.uid === ignoreUid) continue;
			if (clipsOverlap(candidate, c)) return true;
		}
		return false;
	}

	function snapMs(candidate: number, ignoreUid: string, ownTrack: EditableTrack): number {
		const candidates: number[] = [];
		const interval = tickIntervalMs;
		const tick = Math.round(candidate / interval) * interval;
		candidates.push(tick);
		for (const c of ownTrack.clips) {
			if (c.uid === ignoreUid) continue;
			candidates.push(c.startMs);
			candidates.push(c.startMs + Math.max(c.transitionMaxMs, 0));
		}
		if (loop) candidates.push(durationMs);
		const px = candidate * pxPerMs;
		let best = candidate;
		let bestDelta = Infinity;
		for (const cand of candidates) {
			const delta = Math.abs(cand * pxPerMs - px);
			if (delta < SNAP_PX && delta < bestDelta) {
				bestDelta = delta;
				best = cand;
			}
		}
		return Math.max(0, Math.round(best));
	}

	function startClipDrag(
		evt: PointerEvent,
		trackUid: string,
		clip: EditableClip,
		mode: "move" | "resize",
	) {
		if (disabled) return;
		const target = evt.currentTarget as HTMLElement;
		const startX = evt.clientX;
		const startY = evt.clientY;
		const initialStart = clip.startMs;
		const initialMax = clip.transitionMaxMs;
		const initialMin = clip.transitionMinMs;
		const isRandom = randomMap[clip.uid] ?? clip.transitionMinMs !== clip.transitionMaxMs;
		let lastTrackUid = trackUid;
		let dragHappened = false;
		let pointerCaptured = false;

		function handleMove(e: PointerEvent) {
			const dx = e.clientX - startX;
			const dy = e.clientY - startY;
			if (!dragHappened && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
				dragHappened = true;
				target.setPointerCapture?.(e.pointerId);
				pointerCaptured = true;
			}
			if (!dragHappened) return;
			if (mode === "move") {
				const ownTrack = tracks.find((t) => t.uid === lastTrackUid);
				if (!ownTrack) return;
				const dms = dx / pxPerMs;
				let proposed = Math.max(0, initialStart + dms);
				proposed = snapMs(proposed, clip.uid, ownTrack);
				if (loop && proposed + Math.max(clip.transitionMaxMs, 0) > durationMs) {
					proposed = Math.max(0, durationMs - Math.max(clip.transitionMaxMs, 0));
				}
				const candidate = { startMs: proposed, transitionMaxMs: clip.transitionMaxMs };
				if (trackHasOverlap(ownTrack, clip.uid, candidate)) return;

				const targetUid = trackUidAtClientY(e.clientY);
				if (targetUid && targetUid !== lastTrackUid) {
					const targetTrack = tracks.find((t) => t.uid === targetUid);
					if (targetTrack && !trackHasOverlap(targetTrack, clip.uid, candidate)) {
						moveClipBetweenTracks(lastTrackUid, targetUid, clip.uid);
						lastTrackUid = targetUid;
					}
				}
				updateClip(lastTrackUid, clip.uid, (c) => ({ ...c, startMs: proposed }));
			} else {
				const ownTrack = tracks.find((t) => t.uid === lastTrackUid);
				if (!ownTrack) return;
				const dms = dx / pxPerMs;
				let proposedMax = Math.max(0, initialMax + dms);
				const snapTarget = snapMs(initialStart + proposedMax, clip.uid, ownTrack) - initialStart;
				if (snapTarget >= 0 && Math.abs(snapTarget * pxPerMs - proposedMax * pxPerMs) < SNAP_PX) {
					proposedMax = snapTarget;
				}
				if (loop && initialStart + proposedMax > durationMs) {
					proposedMax = Math.max(0, durationMs - initialStart);
				}
				const candidate = { startMs: initialStart, transitionMaxMs: proposedMax };
				if (trackHasOverlap(ownTrack, clip.uid, candidate)) return;
				const newMin = isRandom ? Math.min(initialMin, proposedMax) : proposedMax;
				updateClip(lastTrackUid, clip.uid, (c) => ({
					...c,
					transitionMaxMs: Math.max(0, Math.round(proposedMax)),
					transitionMinMs: Math.max(0, Math.round(newMin)),
				}));
			}
		}

		function handleUp(e: PointerEvent) {
			window.removeEventListener("pointermove", handleMove);
			window.removeEventListener("pointerup", handleUp);
			if (pointerCaptured) target.releasePointerCapture?.(e.pointerId);
			if (dragHappened) {
				const suppress = (ev: Event) => {
					ev.stopPropagation();
					ev.preventDefault();
					window.removeEventListener("click", suppress, true);
				};
				window.addEventListener("click", suppress, true);
				setTimeout(() => window.removeEventListener("click", suppress, true), 0);
			}
		}

		window.addEventListener("pointermove", handleMove);
		window.addEventListener("pointerup", handleUp);
	}

	function trackUidAtClientY(clientY: number): string | null {
		if (!viewportEl) return null;
		const rect = viewportEl.getBoundingClientRect();
		const y = clientY - rect.top - RULER_HEIGHT;
		const idx = Math.floor(y / TRACK_HEIGHT);
		if (idx < 0 || idx >= tracks.length) return null;
		return tracks[idx].uid;
	}

	function startEndLineDrag(evt: PointerEvent) {
		if (disabled || !loop) return;
		evt.preventDefault();
		const target = evt.currentTarget as HTMLElement;
		target.setPointerCapture(evt.pointerId);
		const startX = evt.clientX;
		const initial = durationMs;

		function handleMove(e: PointerEvent) {
			const dx = e.clientX - startX;
			const dms = dx / pxPerMs;
			let proposed = Math.max(minDurationMsAllowed, initial + dms);
			proposed = Math.round(proposed);
			const interval = tickIntervalMs;
			const tickSnap = Math.round(proposed / interval) * interval;
			if (Math.abs(tickSnap * pxPerMs - proposed * pxPerMs) < SNAP_PX && tickSnap >= minDurationMsAllowed) {
				proposed = tickSnap;
			}
			durationMs = proposed;
		}

		function handleUp(e: PointerEvent) {
			window.removeEventListener("pointermove", handleMove);
			window.removeEventListener("pointerup", handleUp);
			target.releasePointerCapture?.(e.pointerId);
		}

		window.addEventListener("pointermove", handleMove);
		window.addEventListener("pointerup", handleUp);
	}

	function openTrackContextMenu(evt: MouseEvent, trackUid: string) {
		if (disabled) return;
		evt.preventDefault();
		evt.stopPropagation();
		if (!viewportEl) return;
		const rect = viewportEl.getBoundingClientRect();
		const xInGrid = evt.clientX - rect.left + viewportEl.scrollLeft;
		const desiredMs = Math.max(0, xInGrid / pxPerMs);
		contextMenuState = {
			trackUid,
			startMs: desiredMs,
			x: evt.clientX,
			y: evt.clientY,
		};
		contextMenuOpen = true;
	}

	function handleContextMenuPick(kind: ClipKind) {
		const state = contextMenuState;
		contextMenuOpen = false;
		contextMenuState = null;
		if (!state) return;
		addClipToTrackAt(state.trackUid, kind, state.startMs);
	}

	function handleWheel(e: WheelEvent) {
		if (!e.ctrlKey && !e.metaKey) return;
		e.preventDefault();
		if (!viewportEl) return;
		const rect = viewportEl.getBoundingClientRect();
		const cursorViewportX = e.clientX - rect.left;
		const cursorGridX = cursorViewportX + viewportEl.scrollLeft;
		const cursorMs = cursorGridX / pxPerMs;
		const factor = e.deltaY > 0 ? 0.9 : 1.1;
		pxPerMs = clamp(pxPerMs * factor, MIN_PX_PER_MS, MAX_PX_PER_MS);
		viewportEl.scrollLeft = cursorMs * pxPerMs - cursorViewportX;
	}

	function zoomBy(factor: number) {
		pxPerMs = clamp(pxPerMs * factor, MIN_PX_PER_MS, MAX_PX_PER_MS);
	}

	const totalGridWidth = $derived(visibleEndMs() * pxPerMs + 64);

	const endLineGapMs = $derived(loop ? Math.max(0, durationMs - lastClipEndMs) : 0);

	function setRandom(uid: string, on: boolean) {
		randomMap = { ...randomMap, [uid]: on };
		if (!on) {
			for (const t of tracks) {
				const c = t.clips.find((c) => c.uid === uid);
				if (c) {
					updateClip(t.uid, uid, (cc) => ({ ...cc, transitionMinMs: cc.transitionMaxMs }));
					break;
				}
			}
		}
	}

	function setClipStart(trackUid: string, clipUid: string, v: number | null) {
		const value = v ?? 0;
		updateClip(trackUid, clipUid, (c) => ({ ...c, startMs: Math.max(0, value) }));
	}

	function setClipTransitionMin(trackUid: string, clipUid: string, v: number | null) {
		const value = v ?? 0;
		updateClip(trackUid, clipUid, (c) => ({
			...c,
			transitionMinMs: Math.max(0, Math.min(value, c.transitionMaxMs)),
		}));
	}

	function setClipTransitionMax(trackUid: string, clipUid: string, v: number | null) {
		const value = v ?? 0;
		updateClip(trackUid, clipUid, (c) => ({
			...c,
			transitionMaxMs: Math.max(value, c.transitionMinMs),
		}));
	}

	function setClipTransition(trackUid: string, clipUid: string, v: number | null) {
		const value = v ?? 0;
		updateClip(trackUid, clipUid, (c) => ({
			...c,
			transitionMaxMs: Math.max(0, value),
			transitionMinMs: Math.max(0, value),
		}));
	}

	const totalClips = $derived(tracks.reduce((sum, t) => sum + t.clips.length, 0));
</script>

<div class="flex flex-col gap-3 rounded-lg shadow-card bg-card p-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h2 class="text-sm font-medium text-foreground">Timeline</h2>
		<div class="flex items-center gap-3">
			<div class="flex items-center gap-1">
				<Button
					variant="ghost"
					size="icon-sm"
					{disabled}
					aria-label="Zoom out"
					onclick={() => zoomBy(0.8)}
				>
					<Minus class="size-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					{disabled}
					aria-label="Fit to viewport"
					onclick={fitToViewport}
				>
					<Maximize2 class="size-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					{disabled}
					aria-label="Zoom in"
					onclick={() => zoomBy(1.25)}
				>
					<Plus class="size-3.5" />
				</Button>
			</div>
			<label class="flex items-center gap-2 text-sm text-muted-foreground">
				<span>Loop</span>
				<Switch bind:checked={loop} aria-label="Loop effect" />
			</label>
		</div>
	</div>

	{#if requiredCaps.length > 0}
		<div class="flex flex-wrap items-center gap-1.5">
			<span class="text-xs text-muted-foreground">Required:</span>
			{#each requiredCaps as cap (cap)}
				<HiveChip type={capChipType(cap)} label={capLabel(cap)} iconOverride={capChipIcon(cap)} />
			{/each}
		</div>
	{/if}

	<div class="flex w-full max-w-full overflow-hidden rounded-md bg-background">
		<div
			class="flex shrink-0 flex-col border-r border-border bg-background"
			style="width: {HEADER_WIDTH}px;"
		>
			<div
				class="flex items-end px-2 pb-1 text-[11px] font-medium text-muted-foreground"
				style="height: {RULER_HEIGHT}px;"
			>
				Tracks
			</div>
			{#each tracks as track, trackIndex (track.uid)}
				<div
					class="flex items-center justify-between gap-1 border-t border-border/50 px-2"
					style="height: {TRACK_HEIGHT}px;"
				>
					<InlineEditName
						class="flex-1 text-sm"
						name={track.name === "" ? `Track ${trackIndex + 1}` : track.name}
						onsave={(newName) => renameTrack(track.uid, newName)}
					/>
					<Button
						variant="ghost"
						size="icon-sm"
						{disabled}
						onclick={() => removeTrack(track.uid)}
						aria-label="Remove track"
					>
						<Trash2 class="size-3" />
					</Button>
				</div>
			{/each}
			{#if tracks.length === 0}
				<div
					class="border-t border-border/50 px-2 text-[11px] text-muted-foreground"
					style="height: {TRACK_HEIGHT}px; line-height: {TRACK_HEIGHT}px;"
				>
					&nbsp;
				</div>
			{/if}
		</div>

		<div
			bind:this={viewportEl}
			class="relative min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
			onwheel={handleWheel}
			role="region"
			aria-label="Effect timeline"
		>
			<div
				class="relative"
				style="width: {totalGridWidth}px; height: {RULER_HEIGHT +
					Math.max(tracks.length, 1) * TRACK_HEIGHT}px;"
			>
				<div
					class="relative border-b border-border"
					style="height: {RULER_HEIGHT}px;"
				>
					{#each ticks as tick (tick.ms)}
						<div class="absolute top-0 h-full" style="left: {tick.ms * pxPerMs}px;">
							<div class="h-3 w-px bg-border"></div>
							{#if tick.major}
								<div
									class="absolute left-1 top-3 text-[10px] text-muted-foreground whitespace-nowrap"
								>
									{formatMs(tick.ms)}
								</div>
							{/if}
						</div>
					{/each}
				</div>

				{#each tracks as track (track.uid)}
					<div
						class="relative border-t border-border/50 bg-muted/30"
						style="height: {TRACK_HEIGHT}px;"
						data-track-uid={track.uid}
						oncontextmenu={(e: MouseEvent) => openTrackContextMenu(e, track.uid)}
						ondblclick={(e: MouseEvent) => openTrackContextMenu(e, track.uid)}
						role="presentation"
					>
						{#each ticks as tick (tick.ms)}
							<div
								class="absolute top-0 h-full w-px bg-border/40"
								style="left: {tick.ms * pxPerMs}px;"
							></div>
						{/each}

						{#each track.clips as clip (clip.uid)}
							{@const Icon = clipIcon(clip.kind)}
							{@const isActive = activeClipUid === clip.uid}
							<Popover
								open={isActive}
								onOpenChange={(o) => {
									if (o) activeClipUid = clip.uid;
									else if (activeClipUid === clip.uid) activeClipUid = null;
								}}
							>
								<PopoverTrigger
									class="absolute top-1.5 flex h-[calc(100%-12px)] items-center gap-1 rounded border-2 px-2 transition-colors duration-200 {clipColor(
										clip.kind,
									)} {isActive ? 'ring-2 ring-primary' : ''}"
									style="left: {clipLeftPx(clip)}px; width: {clipWidthPx(clip)}px;"
									onpointerdown={(e: PointerEvent) =>
										startClipDrag(e, track.uid, clip, "move")}
									oncontextmenu={(e: MouseEvent) => {
										e.preventDefault();
										e.stopPropagation();
									}}
									ondblclick={(e: MouseEvent) => e.stopPropagation()}
									aria-label="Edit clip"
								>
									<Icon class="size-3 shrink-0" />
									<span class="truncate text-[10px] font-medium">
										{clipSummaryLabel(clip)}
									</span>
									<div
										role="separator"
										aria-label="Resize clip"
										class="absolute right-0 top-0 h-full w-1.5 bg-primary/30 hover:bg-primary/60 transition-colors duration-200"
										onpointerdown={(e: PointerEvent) => {
											e.stopPropagation();
											startClipDrag(e, track.uid, clip, "resize");
										}}
									></div>
								</PopoverTrigger>
								<PopoverContent class="w-72 p-3">
									{@render clipEditor(track.uid, clip)}
								</PopoverContent>
							</Popover>
						{/each}
					</div>
				{/each}

				{#if tracks.length === 0}
					<div
						class="flex items-center justify-center border-t border-border/50 bg-muted/30 text-sm text-muted-foreground"
						style="height: {TRACK_HEIGHT}px;"
					>
						No tracks yet. Add a track to start.
					</div>
				{/if}

				{#if loop}
					<div
						role="separator"
						aria-label="Drag to set loop end"
						class="absolute top-0 z-20 w-1 -ml-0.5 bg-primary/70 hover:bg-primary transition-colors duration-200"
						style="left: {durationMs * pxPerMs}px; height: {RULER_HEIGHT +
							Math.max(tracks.length, 1) * TRACK_HEIGHT}px;"
						onpointerdown={(e) => startEndLineDrag(e)}
					>
						<div
							class="absolute left-2 top-1 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground whitespace-nowrap"
						>
							End {formatMs(durationMs)} (gap {formatMs(endLineGapMs)})
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<DropdownMenu
		bind:open={contextMenuOpen}
		onOpenChange={(o) => {
			if (!o) contextMenuState = null;
		}}
	>
		<DropdownMenuTrigger
			class="pointer-events-none fixed size-0 opacity-0"
			style="left: {contextMenuState?.x ?? 0}px; top: {contextMenuState?.y ?? 0}px;"
			aria-hidden="true"
			tabindex={-1}
		></DropdownMenuTrigger>
		<DropdownMenuContent align="start">
			{#each clipTypes as ct (ct.kind)}
				{@const ItemIcon = clipIcon(ct.kind)}
				<DropdownMenuItem onclick={() => handleContextMenuPick(ct.kind)}>
					<ItemIcon class="size-3.5" />
					{ct.label}
				</DropdownMenuItem>
			{/each}
		</DropdownMenuContent>
	</DropdownMenu>

	<div class="flex flex-wrap items-center justify-between gap-2">
		<Button variant="outline" size="sm" {disabled} onclick={addTrack}>
			<Plus class="size-4" />
			Add track
		</Button>
		<div class="flex items-center gap-2 text-xs text-muted-foreground">
			<span>Duration {formatMs(effectiveDurationMs)}</span>
			<span>·</span>
			<span>{tracks.length} track{tracks.length === 1 ? "" : "s"}</span>
			<span>·</span>
			<span>{totalClips} clip{totalClips === 1 ? "" : "s"}</span>
		</div>
	</div>
</div>

{#snippet clipEditor(trackUid: string, clip: EditableClip)}
	{@const isRandom = randomMap[clip.uid] ?? clip.transitionMinMs !== clip.transitionMaxMs}
	<div class="flex flex-col gap-3">
		<div class="flex items-center justify-between gap-2">
			<span class="text-sm font-medium">{clipKindLabel(clip.kind)}</span>
			<Button
				variant="ghost"
				size="icon-sm"
				{disabled}
				onclick={() => {
					removeClip(trackUid, clip.uid);
					activeClipUid = null;
				}}
				aria-label="Remove clip"
			>
				<Trash2 class="size-3.5" />
			</Button>
		</div>

		<label class="flex flex-col gap-1 text-[11px] text-muted-foreground">
			Start (ms)
			<NumberInput
				value={clip.startMs}
				min={0}
				{disabled}
				ariaLabel="Start in milliseconds"
				onValueChange={(v) => setClipStart(trackUid, clip.uid, v)}
			/>
		</label>

		{#if clip.kind === "set_on_off" && clip.config.kind === "set_on_off"}
			<div class="flex items-center justify-between text-[11px]">
				<span class="text-muted-foreground">State</span>
				<Switch
					checked={clip.config.config.value}
					{disabled}
					onCheckedChange={(c) =>
						updateClip(trackUid, clip.uid, (cc) =>
							cc.config.kind === "set_on_off"
								? { ...cc, config: { kind: "set_on_off", config: { value: c } } }
								: cc,
						)}
				/>
			</div>
		{:else if clip.kind === "set_brightness" && clip.config.kind === "set_brightness"}
			<label class="flex flex-col gap-1 text-[11px] text-muted-foreground">
				Brightness ({clip.config.config.value})
				<input
					type="range"
					min={0}
					max={254}
					value={clip.config.config.value}
					{disabled}
					oninput={(e: Event) => {
						const v = parseInt((e.currentTarget as HTMLInputElement).value, 10) || 0;
						updateClip(trackUid, clip.uid, (cc) =>
							cc.config.kind === "set_brightness"
								? { ...cc, config: { kind: "set_brightness", config: { value: v } } }
								: cc,
						);
					}}
				/>
			</label>
		{:else if clip.kind === "set_color_rgb" && clip.config.kind === "set_color_rgb"}
			<ColorPicker
				r={clip.config.config.r}
				g={clip.config.config.g}
				b={clip.config.config.b}
				{disabled}
				onchange={(rgb) => {
					updateClip(trackUid, clip.uid, (cc) =>
						cc.config.kind === "set_color_rgb"
							? {
									...cc,
									config: { kind: "set_color_rgb", config: { ...cc.config.config, ...rgb } },
								}
							: cc,
					);
				}}
			/>
		{:else if clip.kind === "set_color_temp" && clip.config.kind === "set_color_temp"}
			<label class="flex flex-col gap-1 text-[11px] text-muted-foreground">
				Mireds ({clip.config.config.mireds})
				<input
					type="range"
					min={150}
					max={500}
					value={clip.config.config.mireds}
					{disabled}
					oninput={(e: Event) => {
						const v = parseInt((e.currentTarget as HTMLInputElement).value, 10) || 0;
						updateClip(trackUid, clip.uid, (cc) =>
							cc.config.kind === "set_color_temp"
								? { ...cc, config: { kind: "set_color_temp", config: { mireds: v } } }
								: cc,
						);
					}}
				/>
			</label>
		{:else if clip.kind === "native_effect" && clip.config.kind === "native_effect"}
			<label class="flex flex-col gap-1 text-[11px] text-muted-foreground">
				Native effect name
				<Input
					value={clip.config.config.name}
					{disabled}
					placeholder="e.g. fireplace"
					oninput={(e: Event) => {
						const v = (e.currentTarget as HTMLInputElement).value;
						updateClip(trackUid, clip.uid, (cc) =>
							cc.config.kind === "native_effect"
								? { ...cc, config: { kind: "native_effect", config: { name: v } } }
								: cc,
						);
					}}
				/>
			</label>
		{/if}

		<div class="flex items-center justify-between text-[11px]">
			<span class="text-muted-foreground">Random transition</span>
			<Switch
				checked={isRandom}
				{disabled}
				onCheckedChange={(v) => setRandom(clip.uid, v)}
			/>
		</div>

		{#if isRandom}
			<label class="flex flex-col gap-1 text-[11px] text-muted-foreground">
				Transition min (ms)
				<NumberInput
					value={clip.transitionMinMs}
					min={0}
					{disabled}
					ariaLabel="Transition min in milliseconds"
					onValueChange={(v) => setClipTransitionMin(trackUid, clip.uid, v)}
				/>
			</label>
			<label class="flex flex-col gap-1 text-[11px] text-muted-foreground">
				Transition max (ms)
				<NumberInput
					value={clip.transitionMaxMs}
					min={clip.transitionMinMs}
					{disabled}
					ariaLabel="Transition max in milliseconds"
					onValueChange={(v) => setClipTransitionMax(trackUid, clip.uid, v)}
				/>
			</label>
		{:else}
			<label class="flex flex-col gap-1 text-[11px] text-muted-foreground">
				Transition (ms)
				<NumberInput
					value={clip.transitionMaxMs}
					min={0}
					{disabled}
					ariaLabel="Transition in milliseconds"
					onValueChange={(v) => setClipTransition(trackUid, clip.uid, v)}
				/>
			</label>
		{/if}
	</div>
{/snippet}
