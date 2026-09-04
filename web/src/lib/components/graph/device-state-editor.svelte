<script lang="ts">
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import ColorPicker from "$lib/components/color-picker.svelte";
	import NumberInput from "$lib/components/number-input.svelte";
	import TempWheel from "$lib/components/temp-wheel.svelte";
	import { capabilityUnionForTarget, hasCapability, type GroupLite, type RoomLite, type TargetKind } from "$lib/target-resolve";
	import type { Capability, Device } from "$lib/gql/graphql";
	import { identifierLabel } from "$lib/i18n/vocabulary";
	import { X } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { formatShortDuration } from "$lib/i18n/format";

	interface Props {
		target: { type: TargetKind; id: string } | null;
		value: string; // JSON payload, may be empty/invalid
		onchange: (payload: string) => void;
		devices: Device[];
		groups: GroupLite[];
		rooms: RoomLite[];
		// capabilities overrides the target-derived capability union; used when
		// the target is an expression resolving to a device set.
		capabilities?: Capability[];
		disabled?: boolean;
		compact?: boolean;
	}

	let { target, value, onchange, devices, groups, rooms, capabilities, disabled = false, compact = false }: Props = $props();

	interface Payload {
		on?: boolean;
		brightness?: number;
		colorTemp?: number;
		targetTemperature?: number;
		hvacMode?: string;
		fanMode?: string;
		swing?: string;
		color?: { r: number; g: number; b: number };
		transition?: number;
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
		if (next.colorTemp !== undefined) clean.colorTemp = next.colorTemp;
		if (next.targetTemperature !== undefined) clean.targetTemperature = next.targetTemperature;
		if (next.hvacMode !== undefined) clean.hvacMode = next.hvacMode;
		if (next.fanMode !== undefined) clean.fanMode = next.fanMode;
		if (next.swing !== undefined) clean.swing = next.swing;
		if (next.color !== undefined) clean.color = next.color;
		if (next.transition !== undefined) clean.transition = next.transition;
		onchange(JSON.stringify(clean));
	}

	const parsed = $derived(parsePayload(value));
	const caps = $derived<Capability[]>(
		capabilities ??
			(target
				? capabilityUnionForTarget(target, devices, groups, rooms)
				: []),
	);

	const showOn = $derived(hasCapability(caps, "on_off"));
	const showBrightness = $derived(hasCapability(caps, "brightness"));
	const showColorTemp = $derived(hasCapability(caps, "color_temp"));
	const showColor = $derived(hasCapability(caps, "color"));
	const showTargetTemperature = $derived(hasCapability(caps, "target_temperature"));
	const showHvacMode = $derived(hasCapability(caps, "hvac_mode"));
	const showFanMode = $derived(hasCapability(caps, "fan_mode"));
	const showSwing = $derived(hasCapability(caps, "swing"));

	const brightnessCap = $derived(caps.find((c) => c.name === "brightness"));
	const colorTempCap = $derived(caps.find((c) => c.name === "color_temp"));
	const targetTemperatureCap = $derived(caps.find((c) => c.name === "target_temperature"));
	const hvacModeCap = $derived(caps.find((c) => c.name === "hvac_mode"));
	const fanModeCap = $derived(caps.find((c) => c.name === "fan_mode"));
	const swingCap = $derived(caps.find((c) => c.name === "swing"));
	const hvacModeValues = $derived(hvacModeCap?.values ?? []);
	const fanModeValues = $derived(fanModeCap?.values ?? []);
	const swingValues = $derived(swingCap?.values && swingCap.values.length > 0 ? swingCap.values : ["off", "on"]);

	const brightnessMin = $derived(brightnessCap?.valueMin ?? 0);
	const brightnessMax = $derived(brightnessCap?.valueMax ?? 254);
	const colorTempMin = $derived(colorTempCap?.valueMin ?? 150);
	const colorTempMax = $derived(colorTempCap?.valueMax ?? 500);
	const targetTemperatureMin = $derived(targetTemperatureCap?.valueMin ?? 16);
	const targetTemperatureMax = $derived(targetTemperatureCap?.valueMax ?? 31);

	const onSet = $derived(parsed.on !== undefined);
	const brightnessSet = $derived(parsed.brightness !== undefined);
	const colorTempSet = $derived(parsed.colorTemp !== undefined);
	const colorSet = $derived(parsed.color !== undefined);
	const targetTemperatureSet = $derived(parsed.targetTemperature !== undefined);
	const hvacModeSet = $derived(parsed.hvacMode !== undefined);
	const fanModeSet = $derived(parsed.fanMode !== undefined);
	const swingSet = $derived(parsed.swing !== undefined);
	const transitionSet = $derived(parsed.transition !== undefined);

	const showTransition = $derived(showBrightness || showColorTemp || showColor);

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
		emit(colorTempSet ? { ...parsed, colorTemp: undefined } : { ...parsed, colorTemp: Math.round((colorTempMin + colorTempMax) / 2) });
	}
	function setColorTempValue(v: number) {
		emit({ ...parsed, colorTemp: v });
	}
	function toggleColorActive() {
		emit(colorSet ? { ...parsed, color: undefined } : { ...parsed, color: { r: 255, g: 255, b: 255 } });
	}
	function setColorValue(c: { r: number; g: number; b: number }) {
		emit({ ...parsed, color: c });
	}
	function toggleTargetTemperatureActive() {
		emit(targetTemperatureSet ? { ...parsed, targetTemperature: undefined } : { ...parsed, targetTemperature: Math.round((targetTemperatureMin + targetTemperatureMax) / 2) });
	}
	function setTargetTemperatureValue(v: number | null) {
		if (v == null) return;
		emit({ ...parsed, targetTemperature: v });
	}
	function toggleHvacModeActive() {
		const first = hvacModeValues[0] ?? "";
		emit(hvacModeSet ? { ...parsed, hvacMode: undefined } : { ...parsed, hvacMode: first });
	}
	function setHvacModeValue(v: string | undefined) {
		if (!v) return;
		emit({ ...parsed, hvacMode: v });
	}
	function toggleFanModeActive() {
		const first = fanModeValues[0] ?? "";
		emit(fanModeSet ? { ...parsed, fanMode: undefined } : { ...parsed, fanMode: first });
	}
	function setFanModeValue(v: string | undefined) {
		if (!v) return;
		emit({ ...parsed, fanMode: v });
	}
	function toggleSwingActive() {
		const first = swingValues[0] ?? "on";
		emit(swingSet ? { ...parsed, swing: undefined } : { ...parsed, swing: first });
	}
	function setSwingValue(v: string | undefined) {
		if (!v) return;
		emit({ ...parsed, swing: v });
	}
	function toggleTransitionActive() {
		emit(transitionSet ? { ...parsed, transition: undefined } : { ...parsed, transition: 1 });
	}
	function setTransitionValue(v: number | null) {
		if (v == null) return;
		emit({ ...parsed, transition: v });
	}

	const anyFieldAvailable = $derived(showOn || showBrightness || showColorTemp || showColor || showTargetTemperature || showHvacMode || showFanMode || showSwing);
	const fieldBox = $derived(
		compact
			? "flex items-center justify-between gap-1.5 px-2 py-1"
			: "flex items-center justify-between gap-2 rounded-md border border-input px-2 py-1.5",
	);
	const expandedFieldBox = $derived(
		compact
			? "space-y-1 px-2 py-1"
			: "space-y-1.5 rounded-md border border-input px-2 py-1.5",
	);
	const fieldLabel = $derived(compact ? "text-[11px] font-medium" : "text-xs font-medium");
</script>

{#if !anyFieldAvailable}
	{#if target || capabilities !== undefined}
		<p class="text-[11px] text-muted-foreground">{m.automation_state_no_capabilities({}, locale.messageOptions())}</p>
	{/if}
{:else}
	<div
		class="{compact ? 'divide-y divide-border rounded-md border border-input' : 'space-y-2'} {disabled
			? 'opacity-50 [&_[data-disabled]]:opacity-100 [&_:disabled]:opacity-100'
			: ''}"
	>
		{#if showOn}
			<div class={fieldBox}>
				<span class={fieldLabel}>{m.automation_state_power({}, locale.messageOptions())}</span>
				<div class="flex items-center gap-2">
					{#if onSet}
						<Switch
							checked={parsed.on ?? false}
							onCheckedChange={setOnValue}
							{disabled}
						/>
						<Button variant="ghost" size={compact ? "icon-xs" : "icon-sm"} onclick={toggleOnActive} {disabled} aria-label={m.automation_state_clear_power({}, locale.messageOptions())}>
							<X class="size-3" />
						</Button>
					{:else}
						<Button variant="outline" size={compact ? "xs" : "sm"} onclick={toggleOnActive} {disabled}>{m.automation_state_set({}, locale.messageOptions())}</Button>
					{/if}
				</div>
			</div>
		{/if}

		{#if showBrightness}
			<div class={expandedFieldBox}>
				<div class="flex items-center justify-between">
					<span class={fieldLabel}>{m.scene_editor_brightness({}, locale.messageOptions())}</span>
					{#if brightnessSet}
						<div class="flex items-center gap-1">
							<span class="text-[10px] tabular-nums text-muted-foreground">{parsed.brightness}</span>
							<Button variant="ghost" size={compact ? "icon-xs" : "icon-sm"} onclick={toggleBrightnessActive} {disabled} aria-label={m.automation_state_clear_brightness({}, locale.messageOptions())}>
								<X class="size-3" />
							</Button>
						</div>
					{:else}
						<Button variant="outline" size={compact ? "xs" : "sm"} onclick={toggleBrightnessActive} {disabled}>{m.automation_state_set({}, locale.messageOptions())}</Button>
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
			<div class={expandedFieldBox}>
				<div class="flex items-center justify-between">
					<span class={fieldLabel}>{m.automation_state_color_temperature({}, locale.messageOptions())}</span>
					{#if colorTempSet}
						<div class="flex items-center gap-1">
							<span class="text-[10px] tabular-nums text-muted-foreground">{parsed.colorTemp}</span>
							<Button variant="ghost" size={compact ? "icon-xs" : "icon-sm"} onclick={toggleColorTempActive} {disabled} aria-label={m.automation_state_clear_color_temperature({}, locale.messageOptions())}>
								<X class="size-3" />
							</Button>
						</div>
					{:else}
						<Button variant="outline" size={compact ? "xs" : "sm"} onclick={toggleColorTempActive} {disabled}>{m.automation_state_set({}, locale.messageOptions())}</Button>
					{/if}
				</div>
				{#if colorTempSet}
					<TempWheel
						value={parsed.colorTemp ?? null}
						min={colorTempMin}
						max={colorTempMax}
						onchange={setColorTempValue}
						{disabled}
					/>
				{/if}
			</div>
		{/if}

		{#if showColor}
			<div class={expandedFieldBox}>
				<div class="flex items-center justify-between">
					<span class={fieldLabel}>{m.scene_editor_color({}, locale.messageOptions())}</span>
					{#if colorSet}
						<Button variant="ghost" size={compact ? "icon-xs" : "icon-sm"} onclick={toggleColorActive} {disabled} aria-label={m.automation_state_clear_color({}, locale.messageOptions())}>
							<X class="size-3" />
						</Button>
					{:else}
						<Button variant="outline" size={compact ? "xs" : "sm"} onclick={toggleColorActive} {disabled}>{m.automation_state_set({}, locale.messageOptions())}</Button>
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

		{#if showTargetTemperature}
			<div class={expandedFieldBox}>
				<div class="flex items-center justify-between">
					<span class={fieldLabel}>{m.automation_state_target_temperature({}, locale.messageOptions())}</span>
					{#if targetTemperatureSet}
						<div class="flex items-center gap-1">
							<span class="text-[10px] tabular-nums text-muted-foreground">{parsed.targetTemperature}</span>
							<Button variant="ghost" size={compact ? "icon-xs" : "icon-sm"} onclick={toggleTargetTemperatureActive} {disabled} aria-label={m.automation_state_clear_target_temperature({}, locale.messageOptions())}>
								<X class="size-3" />
							</Button>
						</div>
					{:else}
						<Button variant="outline" size={compact ? "xs" : "sm"} onclick={toggleTargetTemperatureActive} {disabled}>{m.automation_state_set({}, locale.messageOptions())}</Button>
					{/if}
				</div>
				{#if targetTemperatureSet}
					<NumberInput
						value={parsed.targetTemperature ?? null}
						min={targetTemperatureMin}
						max={targetTemperatureMax}
						allowDecimal
						ariaLabel={m.automation_state_target_temperature({}, locale.messageOptions())}
						{disabled}
						onValueChange={setTargetTemperatureValue}
					/>
				{/if}
			</div>
		{/if}

		{#if showHvacMode && hvacModeCap && hvacModeValues.length > 0}
			<div class={expandedFieldBox}>
				<div class="flex items-center justify-between">
					<span class={fieldLabel}>{m.automation_state_mode({}, locale.messageOptions())}</span>
					{#if hvacModeSet}
						<Button variant="ghost" size={compact ? "icon-xs" : "icon-sm"} onclick={toggleHvacModeActive} {disabled} aria-label={m.automation_state_clear_mode({}, locale.messageOptions())}>
							<X class="size-3" />
						</Button>
					{:else}
						<Button variant="outline" size={compact ? "xs" : "sm"} onclick={toggleHvacModeActive} {disabled}>{m.automation_state_set({}, locale.messageOptions())}</Button>
					{/if}
				</div>
				{#if hvacModeSet}
					<Select type="single" value={parsed.hvacMode ?? ""} onValueChange={setHvacModeValue} {disabled}>
						<SelectTrigger class="w-full text-xs">{parsed.hvacMode ? identifierLabel(parsed.hvacMode) : m.automation_state_select_mode({}, locale.messageOptions())}</SelectTrigger>
						<SelectContent>
							{#each hvacModeValues as v (v)}
								<SelectItem value={v}>{identifierLabel(v)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				{/if}
			</div>
		{/if}

		{#if showFanMode && fanModeCap && fanModeValues.length > 0}
			<div class={expandedFieldBox}>
				<div class="flex items-center justify-between">
					<span class={fieldLabel}>{m.automation_state_fan({}, locale.messageOptions())}</span>
					{#if fanModeSet}
						<Button variant="ghost" size={compact ? "icon-xs" : "icon-sm"} onclick={toggleFanModeActive} {disabled} aria-label={m.automation_state_clear_fan({}, locale.messageOptions())}>
							<X class="size-3" />
						</Button>
					{:else}
						<Button variant="outline" size={compact ? "xs" : "sm"} onclick={toggleFanModeActive} {disabled}>{m.automation_state_set({}, locale.messageOptions())}</Button>
					{/if}
				</div>
				{#if fanModeSet}
					<Select type="single" value={parsed.fanMode ?? ""} onValueChange={setFanModeValue} {disabled}>
						<SelectTrigger class="w-full text-xs">{parsed.fanMode ? identifierLabel(parsed.fanMode) : m.automation_state_select_fan({}, locale.messageOptions())}</SelectTrigger>
						<SelectContent>
							{#each fanModeValues as v (v)}
								<SelectItem value={v}>{identifierLabel(v)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				{/if}
			</div>
		{/if}

		{#if showSwing && swingCap}
			<div class={expandedFieldBox}>
				<div class="flex items-center justify-between">
					<span class={fieldLabel}>{m.automation_state_swing({}, locale.messageOptions())}</span>
					{#if swingSet}
						<Button variant="ghost" size={compact ? "icon-xs" : "icon-sm"} onclick={toggleSwingActive} {disabled} aria-label={m.automation_state_clear_swing({}, locale.messageOptions())}>
							<X class="size-3" />
						</Button>
					{:else}
						<Button variant="outline" size={compact ? "xs" : "sm"} onclick={toggleSwingActive} {disabled}>{m.automation_state_set({}, locale.messageOptions())}</Button>
					{/if}
				</div>
				{#if swingSet}
					<Select type="single" value={parsed.swing ?? ""} onValueChange={setSwingValue} {disabled}>
						<SelectTrigger class="w-full text-xs">{parsed.swing ? identifierLabel(parsed.swing) : m.automation_state_select_swing({}, locale.messageOptions())}</SelectTrigger>
						<SelectContent>
							{#each swingValues as v (v)}
								<SelectItem value={v}>{identifierLabel(v)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				{/if}
			</div>
		{/if}

		{#if showTransition}
			<div class={expandedFieldBox}>
				<div class="flex items-center justify-between">
					<span class={fieldLabel}>{m.automation_state_transition({}, locale.messageOptions())}</span>
					{#if transitionSet}
						<div class="flex items-center gap-1">
							<span class="text-[10px] tabular-nums text-muted-foreground">{formatShortDuration(parsed.transition ?? 0, "second", locale.currentLanguage)}</span>
							<Button variant="ghost" size={compact ? "icon-xs" : "icon-sm"} onclick={toggleTransitionActive} {disabled} aria-label={m.automation_state_clear_transition({}, locale.messageOptions())}>
								<X class="size-3" />
							</Button>
						</div>
					{:else}
						<Button variant="outline" size={compact ? "xs" : "sm"} onclick={toggleTransitionActive} {disabled}>{m.automation_state_set({}, locale.messageOptions())}</Button>
					{/if}
				</div>
				{#if transitionSet}
					<NumberInput
						value={parsed.transition ?? null}
						min={0}
						allowDecimal
						ariaLabel={m.automation_state_transition_seconds({}, locale.messageOptions())}
						{disabled}
						onValueChange={setTransitionValue}
					/>
				{/if}
			</div>
		{/if}
	</div>
{/if}
