<script lang="ts">
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import ColorPicker from "$lib/components/color-picker.svelte";
	import TempWheel from "$lib/components/temp-wheel.svelte";
	import { capabilityUnionForTarget, hasCapability, type GroupLite, type RoomLite, type TargetKind } from "$lib/target-resolve";
	import type { Capability, Device } from "$lib/gql/graphql";
	import { X } from "@lucide/svelte";

	interface Props {
		target: { type: TargetKind; id: string } | null;
		value: string; // JSON payload, may be empty/invalid
		onchange: (payload: string) => void;
		devices: Device[];
		groups: GroupLite[];
		rooms: RoomLite[];
		disabled?: boolean;
	}

	let { target, value, onchange, devices, groups, rooms, disabled = false }: Props = $props();

	interface Payload {
		on?: boolean;
		brightness?: number;
		color_temp?: number;
		color?: { r: number; g: number; b: number };
	}

	function parsePayload(raw: string): Payload {
		try {
			const v = JSON.parse(raw);
			return typeof v === "object" && v !== null ? (v as Payload) : {};
		} catch {
			return {};
		}
	}

	function emit(next: Payload) {
		// Strip undefined keys before serializing — JSON.stringify already does this
		// but we want to normalize and trim trailing commas.
		const clean: Payload = {};
		if (next.on !== undefined) clean.on = next.on;
		if (next.brightness !== undefined) clean.brightness = next.brightness;
		if (next.color_temp !== undefined) clean.color_temp = next.color_temp;
		if (next.color !== undefined) clean.color = next.color;
		onchange(JSON.stringify(clean));
	}

	const parsed = $derived(parsePayload(value));
	const caps = $derived<Capability[]>(
		target ? capabilityUnionForTarget(target, devices, groups, rooms) : [],
	);

	const showOn = $derived(hasCapability(caps, "on_off"));
	const showBrightness = $derived(hasCapability(caps, "brightness"));
	const showColorTemp = $derived(hasCapability(caps, "color_temp"));
	const showColor = $derived(hasCapability(caps, "color"));

	const brightnessCap = $derived(caps.find((c) => c.name === "brightness"));
	const colorTempCap = $derived(caps.find((c) => c.name === "color_temp"));

	const brightnessMin = $derived(brightnessCap?.valueMin ?? 0);
	const brightnessMax = $derived(brightnessCap?.valueMax ?? 254);
	const colorTempMin = $derived(colorTempCap?.valueMin ?? 150);
	const colorTempMax = $derived(colorTempCap?.valueMax ?? 500);

	const onSet = $derived(parsed.on !== undefined);
	const brightnessSet = $derived(parsed.brightness !== undefined);
	const colorTempSet = $derived(parsed.color_temp !== undefined);
	const colorSet = $derived(parsed.color !== undefined);

	function toggleOnActive() {
		emit(onSet ? { ...parsed, on: undefined } : { ...parsed, on: false });
	}
	function setOnValue(v: boolean) {
		emit({ ...parsed, on: v });
	}
	function toggleBrightnessActive() {
		emit(brightnessSet ? { ...parsed, brightness: undefined } : { ...parsed, brightness: Math.round((brightnessMin + brightnessMax) / 2) });
	}
	function setBrightnessValue(v: number) {
		emit({ ...parsed, brightness: v });
	}
	function toggleColorTempActive() {
		emit(colorTempSet ? { ...parsed, color_temp: undefined } : { ...parsed, color_temp: Math.round((colorTempMin + colorTempMax) / 2) });
	}
	function setColorTempValue(v: number) {
		emit({ ...parsed, color_temp: v });
	}
	function toggleColorActive() {
		emit(colorSet ? { ...parsed, color: undefined } : { ...parsed, color: { r: 255, g: 255, b: 255 } });
	}
	function setColorValue(c: { r: number; g: number; b: number }) {
		emit({ ...parsed, color: c });
	}

	const anyFieldAvailable = $derived(showOn || showBrightness || showColorTemp || showColor);
</script>

{#if !target}
	<p class="text-[11px] text-muted-foreground">Pick a target to configure state.</p>
{:else if !anyFieldAvailable}
	<p class="text-[11px] text-muted-foreground">Target has no settable state capabilities.</p>
{:else}
	<div class="space-y-2">
		{#if showOn}
			<div class="flex items-center justify-between gap-2 rounded-md border border-input px-2 py-1.5">
				<span class="text-xs font-medium">Power</span>
				<div class="flex items-center gap-2">
					{#if onSet}
						<Switch
							checked={parsed.on ?? false}
							onCheckedChange={setOnValue}
							{disabled}
						/>
						<Button variant="ghost" size="icon-sm" onclick={toggleOnActive} {disabled} aria-label="Clear power">
							<X class="size-3" />
						</Button>
					{:else}
						<Button variant="outline" size="sm" onclick={toggleOnActive} {disabled}>Set</Button>
					{/if}
				</div>
			</div>
		{/if}

		{#if showBrightness}
			<div class="rounded-md border border-input px-2 py-1.5 space-y-1.5">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium">Brightness</span>
					{#if brightnessSet}
						<div class="flex items-center gap-1">
							<span class="text-[10px] tabular-nums text-muted-foreground">{parsed.brightness}</span>
							<Button variant="ghost" size="icon-sm" onclick={toggleBrightnessActive} {disabled} aria-label="Clear brightness">
								<X class="size-3" />
							</Button>
						</div>
					{:else}
						<Button variant="outline" size="sm" onclick={toggleBrightnessActive} {disabled}>Set</Button>
					{/if}
				</div>
				{#if brightnessSet}
					<Slider
						type="single"
						value={parsed.brightness ?? brightnessMin}
						min={brightnessMin}
						max={brightnessMax}
						step={1}
						onValueChange={setBrightnessValue}
						{disabled}
					/>
				{/if}
			</div>
		{/if}

		{#if showColorTemp}
			<div class="rounded-md border border-input px-2 py-1.5 space-y-1.5">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium">Color temp</span>
					{#if colorTempSet}
						<div class="flex items-center gap-1">
							<span class="text-[10px] tabular-nums text-muted-foreground">{parsed.color_temp}</span>
							<Button variant="ghost" size="icon-sm" onclick={toggleColorTempActive} {disabled} aria-label="Clear color temp">
								<X class="size-3" />
							</Button>
						</div>
					{:else}
						<Button variant="outline" size="sm" onclick={toggleColorTempActive} {disabled}>Set</Button>
					{/if}
				</div>
				{#if colorTempSet}
					<TempWheel
						value={parsed.color_temp ?? null}
						min={colorTempMin}
						max={colorTempMax}
						onchange={setColorTempValue}
						{disabled}
					/>
				{/if}
			</div>
		{/if}

		{#if showColor}
			<div class="rounded-md border border-input px-2 py-1.5 space-y-1.5">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium">Color</span>
					{#if colorSet}
						<Button variant="ghost" size="icon-sm" onclick={toggleColorActive} {disabled} aria-label="Clear color">
							<X class="size-3" />
						</Button>
					{:else}
						<Button variant="outline" size="sm" onclick={toggleColorActive} {disabled}>Set</Button>
					{/if}
				</div>
				{#if colorSet && parsed.color}
					<ColorPicker
						r={parsed.color.r}
						g={parsed.color.g}
						b={parsed.color.b}
						onchange={setColorValue}
						{disabled}
					/>
				{/if}
			</div>
		{/if}
	</div>
{/if}
