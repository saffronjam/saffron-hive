<script lang="ts">
	import { untrack } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import NumberInput from "$lib/components/number-input.svelte";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu/index.js";
	import {
		ArrowLeft,
		ArrowRight,
		Hourglass,
		Lightbulb,
		Palette,
		Plus,
		Sparkles,
		Sun,
		Thermometer,
		Trash2,
	} from "@lucide/svelte";
	import {
		MIN_WAIT_MS,
		computeRequiredCapabilities,
		newEditableStep,
		newTrailingWait,
		type EditableStep,
		type StepKind,
	} from "$lib/effect-editable";

	interface Props {
		steps: EditableStep[];
		loop: boolean;
		disabled?: boolean;
		activeStepIndex?: number | null;
	}

	let {
		steps = $bindable(),
		loop = $bindable(),
		disabled = false,
		activeStepIndex = null,
	}: Props = $props();

	$effect(() => {
		const isLoop = loop;
		untrack(() => {
			const last = steps.at(-1);
			if (isLoop) {
				if (!last || !last.trailing) {
					steps = [...steps, newTrailingWait()];
				}
			} else if (steps.some((s) => s.trailing)) {
				steps = steps.filter((s) => !s.trailing);
			}
		});
	});

	const stepTypes: { kind: StepKind; label: string }[] = [
		{ kind: "wait", label: "Wait" },
		{ kind: "set_on_off", label: "On / Off" },
		{ kind: "set_brightness", label: "Brightness" },
		{ kind: "set_color_rgb", label: "Color (RGB)" },
		{ kind: "set_color_temp", label: "Color temp" },
	];

	const requiredCaps = $derived(computeRequiredCapabilities(steps));

	function insertStep(index: number, kind: StepKind) {
		const next = newEditableStep(kind);
		steps = [...steps.slice(0, index), next, ...steps.slice(index)];
	}

	function removeStep(index: number) {
		const s = steps[index];
		if (!s || s.trailing) return;
		steps = steps.filter((_, i) => i !== index);
	}

	function moveStep(from: number, to: number) {
		if (to < 0 || to >= steps.length) return;
		const fromStep = steps[from];
		const toStep = steps[to];
		if (!fromStep || !toStep || fromStep.trailing || toStep.trailing) return;
		const next = steps.slice();
		next[from] = toStep;
		next[to] = fromStep;
		steps = next;
	}

	function updateStep(index: number, mut: (s: EditableStep) => EditableStep) {
		steps = steps.map((s, i) => (i === index ? mut(s) : s));
	}

	function rgbToHex(r: number, g: number, b: number): string {
		const h = (n: number) => n.toString(16).padStart(2, "0");
		return `#${h(r)}${h(g)}${h(b)}`;
	}

	function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
		const m = hex.trim().match(/^#?([0-9a-fA-F]{6})$/);
		if (!m) return null;
		const v = parseInt(m[1], 16);
		return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
	}

	function capLabel(cap: string): string {
		switch (cap) {
			case "on_off":
				return "On/Off";
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

	function stepIcon(kind: StepKind) {
		switch (kind) {
			case "wait":
				return Hourglass;
			case "set_on_off":
				return Lightbulb;
			case "set_brightness":
				return Sun;
			case "set_color_rgb":
				return Palette;
			case "set_color_temp":
				return Thermometer;
		}
	}
</script>

<div class="flex flex-col gap-3 rounded-lg shadow-card bg-card p-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h2 class="text-sm font-medium text-foreground">Timeline</h2>
		<label class="flex items-center gap-2 text-sm text-muted-foreground">
			<span>Loop</span>
			<Switch bind:checked={loop} aria-label="Loop effect" />
		</label>
	</div>

	{#if requiredCaps.length > 0}
		<div class="flex flex-wrap items-center gap-1.5">
			<span class="text-xs text-muted-foreground">Required:</span>
			{#each requiredCaps as cap (cap)}
				<HiveChip type={capChipType(cap)} label={capLabel(cap)} iconOverride={capChipIcon(cap)} />
			{/each}
		</div>
	{/if}

	<div class="flex flex-wrap items-stretch gap-2">
		{@render insertSlot(0)}
		{#each steps as step, index (step.uid)}
			{@const Icon = stepIcon(step.step.kind)}
			{@const isActive = activeStepIndex === index}
			<div
				class="relative flex w-56 shrink-0 flex-col gap-2 rounded-md border bg-background p-3 transition-all duration-200 {isActive
					? 'border-primary ring-2 ring-primary/40 shadow-md'
					: 'border-border'}"
				data-step-index={index}
				data-active={isActive ? "true" : "false"}
			>
				<div class="flex items-center gap-1.5">
					<Icon class="size-3.5 text-muted-foreground" />
					<span class="text-xs font-medium">
						{stepTypes.find((s) => s.kind === step.step.kind)?.label ?? step.step.kind}
					</span>
					{#if step.trailing}
						<Badge variant="secondary" class="text-[9px]">loop tail</Badge>
					{/if}
					<span class="flex-1"></span>
					{#if !step.trailing}
						<Button
							variant="ghost"
							size="icon-sm"
							class="size-6"
							{disabled}
							onclick={() => moveStep(index, index - 1)}
							aria-label="Move step left"
						>
							<ArrowLeft class="size-3" />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							class="size-6"
							{disabled}
							onclick={() => moveStep(index, index + 1)}
							aria-label="Move step right"
						>
							<ArrowRight class="size-3" />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							class="size-6"
							{disabled}
							onclick={() => removeStep(index)}
							aria-label="Remove step"
						>
							<Trash2 class="size-3" />
						</Button>
					{/if}
				</div>

				{#if step.step.kind === "wait"}
					<label class="flex flex-col gap-1 text-[11px] text-muted-foreground">
						Duration (ms)
						<NumberInput
							bind:value={step.step.config.duration_ms}
							min={MIN_WAIT_MS}
							{disabled}
							ariaLabel="Duration in milliseconds"
						/>
					</label>
				{:else if step.step.kind === "set_on_off"}
					<div class="flex items-center justify-between text-[11px]">
						<span class="text-muted-foreground">State</span>
						<Switch
							checked={step.step.config.value}
							{disabled}
							onCheckedChange={(c) =>
								updateStep(index, (s) =>
									s.step.kind === "set_on_off"
										? { ...s, step: { kind: "set_on_off", config: { ...s.step.config, value: c } } }
										: s,
								)}
						/>
					</div>
					{@render transitionInput(index)}
				{:else if step.step.kind === "set_brightness"}
					<label class="flex flex-col gap-1 text-[11px] text-muted-foreground">
						Brightness ({step.step.config.value})
						<input
							type="range"
							min={0}
							max={254}
							value={step.step.config.value}
							{disabled}
							oninput={(e: Event) => {
								const v = parseInt((e.currentTarget as HTMLInputElement).value, 10) || 0;
								updateStep(index, (s) =>
									s.step.kind === "set_brightness"
										? {
												...s,
												step: { kind: "set_brightness", config: { ...s.step.config, value: v } },
											}
										: s,
								);
							}}
						/>
					</label>
					{@render transitionInput(index)}
				{:else if step.step.kind === "set_color_rgb"}
					<div class="flex items-center gap-2">
						<input
							type="color"
							value={rgbToHex(
								step.step.config.r,
								step.step.config.g,
								step.step.config.b,
							)}
							{disabled}
							class="h-8 w-10 cursor-pointer rounded border border-border"
							oninput={(e: Event) => {
								const rgb = hexToRgb((e.currentTarget as HTMLInputElement).value);
								if (!rgb) return;
								updateStep(index, (s) =>
									s.step.kind === "set_color_rgb"
										? {
												...s,
												step: {
													kind: "set_color_rgb",
													config: { ...s.step.config, ...rgb },
												},
											}
										: s,
								);
							}}
						/>
						<Input
							value={rgbToHex(
								step.step.config.r,
								step.step.config.g,
								step.step.config.b,
							)}
							{disabled}
							class="text-xs font-mono"
							oninput={(e: Event) => {
								const rgb = hexToRgb((e.currentTarget as HTMLInputElement).value);
								if (!rgb) return;
								updateStep(index, (s) =>
									s.step.kind === "set_color_rgb"
										? {
												...s,
												step: {
													kind: "set_color_rgb",
													config: { ...s.step.config, ...rgb },
												},
											}
										: s,
								);
							}}
						/>
					</div>
					{@render transitionInput(index)}
				{:else if step.step.kind === "set_color_temp"}
					<label class="flex flex-col gap-1 text-[11px] text-muted-foreground">
						Mireds ({step.step.config.mireds})
						<input
							type="range"
							min={150}
							max={500}
							value={step.step.config.mireds}
							{disabled}
							oninput={(e: Event) => {
								const v = parseInt((e.currentTarget as HTMLInputElement).value, 10) || 0;
								updateStep(index, (s) =>
									s.step.kind === "set_color_temp"
										? {
												...s,
												step: { kind: "set_color_temp", config: { ...s.step.config, mireds: v } },
											}
										: s,
								);
							}}
						/>
					</label>
					{@render transitionInput(index)}
				{/if}
			</div>

			{#if index !== steps.length - 1 || !step.trailing}
				{@render insertSlot(index + 1)}
			{/if}
		{/each}

		{#if steps.length === 0}
			<p class="px-1 py-2 text-sm text-muted-foreground">No steps yet. Add one to start.</p>
		{/if}
	</div>
</div>

{#snippet transitionInput(index: number)}
	{@const step = steps[index]}
	{#if step && step.step.kind !== "wait"}
		<label class="flex flex-col gap-1 text-[11px] text-muted-foreground">
			Transition (ms)
			<NumberInput
				bind:value={step.step.config.transition_ms}
				min={0}
				{disabled}
				ariaLabel="Transition in milliseconds"
			/>
		</label>
	{/if}
{/snippet}

{#snippet insertSlot(index: number)}
	<div class="flex items-center self-stretch">
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button
					variant="ghost"
					size="icon-sm"
					class="size-7"
					{disabled}
					aria-label="Insert step"
				>
					<Plus class="size-3.5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				{#each stepTypes as t (t.kind)}
					{@const Icon = stepIcon(t.kind)}
					<DropdownMenuItem onclick={() => insertStep(index, t.kind)}>
						<Icon class="size-3.5" />
						{t.label}
					</DropdownMenuItem>
				{/each}
			</DropdownMenuContent>
		</DropdownMenu>
	</div>
{/snippet}
