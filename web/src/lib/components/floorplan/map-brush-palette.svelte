<script lang="ts" module>
	/** The value the brush paints: a colour, a white temperature, or on/off. */
	export type ArmedBrush =
		| { kind: "color"; color: { r: number; g: number; b: number } }
		| { kind: "temp"; mireds: number }
		| { kind: "power"; on: boolean };
</script>

<script lang="ts">
	import { Minus, Palette, Plus, Power, PowerOff } from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import HiveColorSwatch from "$lib/components/hive-color-swatch.svelte";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import {
		MAX_BRUSH_RADIUS_PX,
		MIN_BRUSH_RADIUS_PX,
		stepBrushRadius,
	} from "$lib/floorplan/brush";
	import { miredToRgb } from "$lib/device-tint";
	import { dropPointerFocus } from "$lib/pointer-focus";
	import { markPopoverDismissed } from "$lib/popover-guard";
	import { m } from "$lib/i18n/messages";

	interface Props {
		/** Union capabilities of the placed devices gate the swatch groups. */
		hasColor: boolean;
		hasColorTemp: boolean;
		/** Any placed device that can be switched, gating the on/off brushes. */
		hasSwitchable: boolean;
		armed: ArmedBrush | null;
		onarm: (brush: ArmedBrush | null) => void;
		/** Brush cursor radius in screen pixels, stepped by these controls. */
		radiusPx: number;
		onradiuschange: (px: number) => void;
	}

	let { hasColor, hasColorTemp, hasSwitchable, armed, onarm, radiusPx, onradiuschange }: Props =
		$props();

	const DIVIDER = "mx-1 h-4 w-px shrink-0 bg-border";

	const COLOR_PRESETS: { r: number; g: number; b: number }[] = [
		{ r: 239, g: 68, b: 68 },
		{ r: 249, g: 115, b: 22 },
		{ r: 234, g: 179, b: 8 },
		{ r: 34, g: 197, b: 94 },
		{ r: 59, g: 130, b: 246 },
		{ r: 168, g: 85, b: 247 },
	];
	const TEMP_PRESETS = [500, 370, 250, 150];

	function css(c: { r: number; g: number; b: number }): string {
		return `rgb(${c.r}, ${c.g}, ${c.b})`;
	}

	function colorArmed(c: { r: number; g: number; b: number }): boolean {
		return (
			armed?.kind === "color" && armed.color.r === c.r && armed.color.g === c.g && armed.color.b === c.b
		);
	}

	function tempArmed(mireds: number): boolean {
		return armed?.kind === "temp" && armed.mireds === mireds;
	}

	function armColor(c: { r: number; g: number; b: number }) {
		onarm(colorArmed(c) ? null : { kind: "color", color: c });
	}

	function armTemp(mireds: number) {
		onarm(tempArmed(mireds) ? null : { kind: "temp", mireds });
	}

	function powerArmed(on: boolean): boolean {
		return armed?.kind === "power" && armed.on === on;
	}

	function armPower(on: boolean) {
		onarm(powerArmed(on) ? null : { kind: "power", on });
	}

	/** The armed value as a colour, for the preview swatch. Null for on/off. */
	const armedCss = $derived.by(() => {
		if (armed?.kind === "color") return css(armed.color);
		if (armed?.kind === "temp") return css(miredToRgb(armed.mireds));
		return null;
	});
	const customArmed = $derived(armed?.kind === "color" || armed?.kind === "temp");

	let customOpen = $state(false);
	const customColor = $derived(armed?.kind === "color" ? armed.color : null);
	const customTemp = $derived(armed?.kind === "temp" ? armed.mireds : null);
	// A group whose devices are not on the map has nothing to paint, so it goes
	// rather than sitting there greyed out.
	const showCustom = $derived(hasColor || hasColorTemp);
	const beforeTemps = $derived(hasColor);
	const beforePower = $derived(hasColor || hasColorTemp);
	const beforeSize = $derived(hasColor || hasColorTemp || hasSwitchable);

	const swatchLabel = $derived(
		armed?.kind === "power"
			? armed.on
				? m.map_brush_turns_on()
				: m.map_brush_turns_off()
			: armedCss
				? m.map_brush_paints({ value: armedCss })
				: m.map_brush_none(),
	);
</script>

<!-- The box is width-bounded and stays put; the row inside it scrolls, so a
     palette too wide for a phone stays reachable without resizing itself. -->
<div
	class="absolute top-14 left-1/2 -translate-x-1/2 z-10 max-w-[calc(100%-1.5rem)] rounded-lg bg-card/90 shadow-card px-2 py-1.5 backdrop-blur-sm"
>
	<div class="no-scrollbar flex items-center gap-1 overflow-x-auto">
		<!-- A swatch says what it paints, so none of these need words. -->
		{#if hasColor}
			{#each COLOR_PRESETS as c (css(c))}
				<Button
					variant={colorArmed(c) ? "secondary" : "ghost"}
					size="icon-sm"
					class="shrink-0"
					onclick={(e) => {
						dropPointerFocus(e);
						armColor(c);
					}}
					aria-label={m.map_paint_color({ value: css(c) })}
				>
					<HiveColorSwatch color={css(c)} class="h-4 w-4" />
				</Button>
			{/each}
		{/if}
		{#if hasColorTemp}
			{#if beforeTemps}
				<div class={DIVIDER}></div>
			{/if}
			{#each TEMP_PRESETS as mireds (mireds)}
				<Button
					variant={tempArmed(mireds) ? "secondary" : "ghost"}
					size="icon-sm"
					class="shrink-0"
					onclick={(e) => {
						dropPointerFocus(e);
						armTemp(mireds);
					}}
					aria-label={m.map_paint_temperature({ value: mireds })}
				>
					<HiveColorSwatch color={css(miredToRgb(mireds))} class="h-4 w-4" />
				</Button>
			{/each}
		{/if}
		{#if hasSwitchable}
			{#if beforePower}
				<div class={DIVIDER}></div>
			{/if}
			<Button
				variant={powerArmed(true) ? "secondary" : "ghost"}
				size="icon-sm"
				class="shrink-0"
				onclick={(e) => { dropPointerFocus(e); armPower(true); }}
				aria-label={m.map_paint_lights_on()}
			>
				<Power class="size-3.5" />
			</Button>
			<Button
				variant={powerArmed(false) ? "secondary" : "ghost"}
				size="icon-sm"
				class="shrink-0"
				onclick={(e) => { dropPointerFocus(e); armPower(false); }}
				aria-label={m.map_paint_lights_off()}
			>
				<PowerOff class="size-3.5" />
			</Button>
		{/if}
		{#if beforeSize}
			<div class={DIVIDER}></div>
		{/if}
		<Button
			variant="ghost"
			size="icon-sm"
			class="shrink-0"
			disabled={radiusPx <= MIN_BRUSH_RADIUS_PX}
			onclick={(e) => {
				dropPointerFocus(e);
				onradiuschange(stepBrushRadius(radiusPx, -1));
			}}
			aria-label={m.map_brush_smaller()}
		>
			<Minus class="size-3.5" />
		</Button>
		<div class="w-9 shrink-0 text-center text-xs tabular-nums text-muted-foreground">{radiusPx}</div>
		<Button
			variant="ghost"
			size="icon-sm"
			class="shrink-0"
			disabled={radiusPx >= MAX_BRUSH_RADIUS_PX}
			onclick={(e) => {
				dropPointerFocus(e);
				onradiuschange(stepBrushRadius(radiusPx, 1));
			}}
			aria-label={m.map_brush_larger()}
		>
			<Plus class="size-3.5" />
		</Button>
		{#if showCustom}
			<div class={DIVIDER}></div>
			<Popover
				bind:open={customOpen}
				onOpenChange={(open) => {
					if (!open) markPopoverDismissed();
				}}
			>
				<PopoverTrigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant={customArmed ? "secondary" : "ghost"}
							size="icon-sm"
							class="shrink-0"
							aria-label={m.map_brush_custom()}
						>
							<Palette class="size-3.5" />
						</Button>
					{/snippet}
				</PopoverTrigger>
				<PopoverContent class="w-72 p-3" align="center">
					<LightColorPicker
						color={customColor}
						colorTemp={customTemp}
						{hasColor}
						{hasColorTemp}
						hasBrightness={false}
						oncolorchange={(c) => onarm({ kind: "color", color: { r: c.r, g: c.g, b: c.b } })}
						ontempchange={(mireds) => onarm({ kind: "temp", mireds })}
					/>
				</PopoverContent>
			</Popover>
		{/if}
		<div
			class="ml-1 flex shrink-0 items-center transition-opacity duration-300 ease-out"
			style="opacity: {armed ? 1 : 0.35}"
			title={swatchLabel}
		>
			{#if armed?.kind === "power"}
				{#if armed.on}
					<Power class="size-4 text-muted-foreground" />
				{:else}
					<PowerOff class="size-4 text-muted-foreground" />
				{/if}
			{:else}
				<HiveColorSwatch color={armedCss} class="h-4 w-4" />
			{/if}
		</div>
	</div>
</div>
