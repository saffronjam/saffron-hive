<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import NumberInput from "$lib/components/number-input.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import HiveSelectAutocomplete from "$lib/components/hive-select-autocomplete.svelte";
	import { Zap, Trash2 } from "@lucide/svelte";
	import { sentenceCase } from "$lib/utils.js";
	import type { Device, Capability } from "$lib/stores/devices";
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import {
		type TriggerConfig,
		type TriggerMode,
		type ScheduleSubmode,
		generateFilterExpr,
		generateCronExpr,
		humanizeCron,
		eventTypeForMode,
		capabilityToExprProperty,
		validateTriggerConfig,
		TIMING_PRESETS,
	} from "./trigger-expr";
	import { ChevronDown, ChevronRight } from "@lucide/svelte";

	interface TriggerNodeData extends Record<string, unknown> {
		config: TriggerConfig;
		editable: boolean;
		activated: boolean;
		devices: Device[];
		automationEnabled?: boolean;
		onConfigChange?: (config: TriggerConfig) => void;
		onFireManual?: () => void;
		onDelete?: () => void;
	}

	interface Props {
		data: TriggerNodeData;
		id: string;
		selected?: boolean;
	}

	let { data, id, selected = false }: Props = $props();

	const modes: { value: TriggerMode; label: string }[] = [
		{ value: "device_state", label: "Device State" },
		{ value: "button_action", label: "Button Action" },
		{ value: "availability", label: "Availability" },
		{ value: "schedule", label: "Schedule" },
		{ value: "manual", label: "Manual" },
		{ value: "custom", label: "Custom" },
	];

	const scheduleSubmodes: { value: ScheduleSubmode; label: string }[] = [
		{ value: "at", label: "At time" },
		{ value: "every", label: "Every" },
		{ value: "custom", label: "Custom cron" },
	];

	const scheduleWeekdayCodes = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
	const scheduleWeekdayShort = ["M", "T", "W", "T", "F", "S", "S"];

	const intervalUnits = [
		{ value: "seconds", label: "seconds" },
		{ value: "minutes", label: "minutes" },
		{ value: "hours", label: "hours" },
	];

	const comparators = [
		{ value: "==", label: "=" },
		{ value: "!=", label: "\u2260" },
		{ value: ">", label: ">" },
		{ value: "<", label: "<" },
		{ value: ">=", label: "\u2265" },
		{ value: "<=", label: "\u2264" },
	];

	const eventTypes = [
		{ value: "device.state_changed", label: "State Changed" },
		{ value: "device.availability_changed", label: "Availability" },
		{ value: "device.added", label: "Device Added" },
		{ value: "device.removed", label: "Device Removed" },
	];

	const deviceTypeOptions = [
		{ value: "light", label: "Light" },
		{ value: "sensor", label: "Sensor" },
		{ value: "switch", label: "Switch" },
	];

	const deviceChipConfigs: ChipConfig[] = [
		{
			keyword: "type",
			label: "Type",
			variant: "secondary",
			options: (q: string) => {
				const lower = q.toLowerCase();
				return deviceTypeOptions.filter(
					(o) => !lower || o.value.includes(lower) || o.label.toLowerCase().includes(lower),
				);
			},
		},
	];

	const deviceChipMatchers: Record<string, (d: Device, v: string) => boolean> = {
		type: (d, v) => d.type === v,
	};

	function update(patch: Partial<TriggerConfig>) {
		if (!data.onConfigChange) return;
		data.onConfigChange({ ...data.config, ...patch });
	}

	function handleModeChange(value: string | undefined) {
		if (!value || !data.onConfigChange) return;
		const mode = value as TriggerMode;
		data.onConfigChange({
			mode,
			eventType: eventTypeForMode(mode),
		});
	}

	function handleDeviceChange(value: string | undefined) {
		if (!value) return;
		const dev = (data.devices ?? []).find((d) => d.id === value);
		if (!dev) return;
		update({
			deviceId: dev.id,
			deviceName: dev.name,
			property: undefined,
			comparator: undefined,
			value: undefined,
			actionValue: undefined,
		});
	}

	function handlePropertyChange(value: string | undefined) {
		if (!value) return;
		const cap = selectedDeviceCapabilities.find((c) => capabilityToExprProperty(c.name) === value);
		let defaultComparator = "==";
		let defaultValue: string | undefined;
		if (cap?.type === "binary") {
			defaultValue = "true";
		} else if (cap?.type === "numeric") {
			defaultComparator = ">";
			defaultValue = cap.valueMin !== null && cap.valueMin !== undefined ? String(cap.valueMin) : "";
		}
		update({ property: value, comparator: defaultComparator, value: defaultValue });
	}

	const selectedDevice = $derived(
		(data.devices ?? []).find((d) => d.id === data.config.deviceId)
	);

	const selectedDeviceCapabilities = $derived.by((): Capability[] => {
		if (!selectedDevice) return [];
		return selectedDevice.capabilities.filter((c) => (c.access & 1) !== 0);
	});

	const selectedCapability = $derived.by((): Capability | undefined => {
		if (!data.config.property || !selectedDevice) return undefined;
		return selectedDevice.capabilities.find(
			(c) => capabilityToExprProperty(c.name) === data.config.property
		);
	});

	const actionCapability = $derived.by((): Capability | undefined => {
		if (!selectedDevice) return undefined;
		return selectedDevice.capabilities.find((c) => c.name === "action");
	});

	const devicesForMode = $derived.by((): Device[] => {
		const devs = data.devices ?? [];
		if (data.config.mode === "button_action") {
			return devs.filter((d) => d.capabilities.some((c) => c.name === "action"));
		}
		return devs;
	});

	const generatedExpr = $derived(generateFilterExpr(data.config));
	const generatedCron = $derived(generateCronExpr(data.config));
	const humanSchedule = $derived(humanizeCron(generatedCron));
	const validationError = $derived(validateTriggerConfig(data.config));
	const INVALID_CLS = "border-destructive ring-2 ring-destructive/40";

	function updateScheduleSubmode(value: ScheduleSubmode) {
		// When switching submode, clear fields that don't apply to the new submode
		// so leftover state doesn't leak into the saved cron expression.
		const patch: Partial<TriggerConfig> = { scheduleSubmode: value };
		if (value !== "every") {
			patch.scheduleIntervalValue = undefined;
			patch.scheduleIntervalUnit = undefined;
		}
		if (value !== "at") {
			// intentionally keep hour/minute/second/weekdays — user may toggle back
		}
		update(patch);
	}

	function toggleScheduleWeekday(code: string) {
		const current = data.config.scheduleWeekdays ?? [];
		const next = current.includes(code)
			? current.filter((d) => d !== code)
			: [...current, code];
		update({ scheduleWeekdays: next });
	}

	const modeLabel = $derived(
		modes.find((m) => m.value === data.config.mode)?.label ?? "Custom"
	);

	let advancedOpen = $state(false);
	const graceMs = $derived(data.config.graceMs ?? 0);
	const cooldownMs = $derived(data.config.cooldownMs ?? 0);

	function formatTimingValue(ms: number): string {
		const preset = TIMING_PRESETS.find((p) => p.value === ms);
		if (preset) return preset.label;
		if (ms <= 0) return "Immediate";
		if (ms < 1000) return `${ms} ms`;
		return `${+(ms / 1000).toFixed(3)} s`;
	}

	function setGraceMs(next: number) {
		update({ graceMs: next });
	}

	function setCooldownMs(next: number) {
		update({ cooldownMs: next });
	}

	function readableSummary(): string {
		switch (data.config.mode) {
			case "device_state": {
				const parts: string[] = [];
				if (data.config.deviceName) parts.push(data.config.deviceName);
				if (data.config.property) {
					const cmp = data.config.comparator ?? "==";
					const val = data.config.value ?? "";
					parts.push(`${data.config.property} ${cmp} ${val}`);
				}
				return parts.join(": ") || "No condition set";
			}
			case "button_action": {
				const parts: string[] = [];
				if (data.config.deviceName) parts.push(data.config.deviceName);
				if (data.config.actionValue) parts.push(data.config.actionValue);
				return parts.join(": ") || "No action set";
			}
			case "availability":
				return data.config.deviceName ?? "No device set";
			case "schedule":
				return humanSchedule;
			case "manual":
				return "Manual trigger";
			case "custom":
				return data.config.customExpr || "true";
			default:
				return "Unknown";
		}
	}
</script>

<div
	class="w-64 rounded-lg border-2 bg-card shadow-md transition-all {data.activated
		? 'border-automation-trigger shadow-automation-trigger/50 shadow-lg'
		: selected
			? 'border-automation-trigger ring-2 ring-automation-trigger/30'
			: 'border-automation-trigger/40'}"
	data-nodeid={id}
>
	<div class="flex items-center gap-2 rounded-t-md bg-automation-trigger/15 px-3 py-2">
		<Zap class="size-4 text-automation-trigger" />
		<span class="text-sm font-medium text-automation-trigger">Trigger</span>
		{#if !data.editable}
			<Badge
				variant="outline"
				class="ml-auto text-[10px] border-automation-trigger/30 bg-automation-trigger/10 text-automation-trigger"
			>{modeLabel}</Badge>
		{:else}
			<Button
				variant="ghost"
				size="icon-sm"
				class="nodrag ml-auto size-6 text-white hover:bg-destructive/15 hover:text-white transition-opacity duration-200 {selected ? 'opacity-100' : 'pointer-events-none opacity-0'}"
				onclick={(e) => {
					e.stopPropagation();
					data.onDelete?.();
				}}
				aria-label="Delete trigger node"
			>
				<Trash2 class="size-3.5" />
			</Button>
		{/if}
	</div>

	<div class="space-y-2 p-3 nodrag">
		{#if data.editable}
			<Select
				type="single"
				value={data.config.mode}
				onValueChange={handleModeChange}
			>
				<SelectTrigger class="w-full text-xs">
					{modeLabel}
				</SelectTrigger>
				<SelectContent>
					{#each modes as mode (mode.value)}
						<SelectItem value={mode.value}>{mode.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>

			{#if data.config.mode === "device_state" || data.config.mode === "button_action" || data.config.mode === "availability"}
				<HiveSelectAutocomplete
					items={devicesForMode}
					value={data.config.deviceId ?? ""}
					getValue={(d) => d.id}
					getLabel={(d) => d.name}
					chipConfigs={deviceChipConfigs}
					chipMatchers={deviceChipMatchers}
					placeholder="Select device"
					size="sm"
					class={validationError?.field === "device" ? `text-xs ${INVALID_CLS}` : "text-xs"}
					onchange={(v) => handleDeviceChange(v)}
				>
					{#snippet renderSelected(d: Device)}
						<span class="truncate">{d.name}</span>
						<HiveChip type={d.type} class="text-[10px] py-0 shrink-0" />
					{/snippet}
					{#snippet item(d: Device)}
						<span class="flex w-full items-center gap-1.5 overflow-hidden">
							<span class="truncate">{d.name}</span>
							<HiveChip type={d.type} class="text-[10px] py-0 shrink-0 ml-auto" />
						</span>
					{/snippet}
				</HiveSelectAutocomplete>
			{/if}

			{#if data.config.mode === "device_state" && data.config.deviceId}
				<HiveSelectAutocomplete
					items={selectedDeviceCapabilities}
					value={data.config.property ?? ""}
					getValue={(c) => capabilityToExprProperty(c.name)}
					getLabel={(c) => sentenceCase(capabilityToExprProperty(c.name))}
					placeholder="Select property"
					size="sm"
					class={validationError?.field === "property" ? `text-xs ${INVALID_CLS}` : "text-xs"}
					onchange={(v) => handlePropertyChange(v)}
				>
					{#snippet item(c: Capability)}
						<span class="flex items-center gap-1.5">
							<span>{sentenceCase(capabilityToExprProperty(c.name))}</span>
							{#if c.unit}
								<span class="text-muted-foreground">({c.unit})</span>
							{/if}
						</span>
					{/snippet}
				</HiveSelectAutocomplete>

				{#if data.config.property && selectedCapability}
					{#if selectedCapability.type === "binary"}
						<Select
							type="single"
							value={data.config.value ?? "true"}
							onValueChange={(v) => v && update({ comparator: "==", value: v })}
						>
							<SelectTrigger class="w-full text-xs">
								{data.config.value === "false" ? "Off" : "On"}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="true">On</SelectItem>
								<SelectItem value="false">Off</SelectItem>
							</SelectContent>
						</Select>
					{:else if selectedCapability.type === "numeric"}
						<div class="flex gap-1">
							<Select
								type="single"
								value={data.config.comparator ?? "=="}
								onValueChange={(v) => v && update({ comparator: v })}
							>
								<SelectTrigger class="w-14 shrink-0 text-xs">
									{comparators.find((c) => c.value === data.config.comparator)?.label ?? "="}
								</SelectTrigger>
								<SelectContent>
									{#each comparators as cmp (cmp.value)}
										<SelectItem value={cmp.value}>{cmp.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
							<NumberInput
								allowDecimal
								allowNegative
								nullable
								value={data.config.value !== undefined && data.config.value !== "" ? Number(data.config.value) : null}
								onValueChange={(v) => update({ value: v === null ? "" : String(v) })}
								min={selectedCapability.valueMin ?? undefined}
								max={selectedCapability.valueMax ?? undefined}
								placeholder={selectedCapability.unit ?? "value"}
								class="text-xs"
								ariaInvalid={validationError?.field === "value" ? "true" : undefined}
							/>
						</div>
					{:else if selectedCapability.type === "enum" && selectedCapability.values}
						<HiveSelectAutocomplete
							items={selectedCapability.values}
							value={data.config.value ?? ""}
							getValue={(v) => v}
							getLabel={(v) => sentenceCase(v)}
							placeholder="Select value"
							size="sm"
							class={validationError?.field === "value" ? `text-xs ${INVALID_CLS}` : "text-xs"}
							onchange={(v) => v && update({ comparator: "==", value: v })}
						/>
					{:else}
						<div class="flex gap-1">
							<Select
								type="single"
								value={data.config.comparator ?? "=="}
								onValueChange={(v) => v && update({ comparator: v })}
							>
								<SelectTrigger class="w-14 shrink-0 text-xs">
									{comparators.find((c) => c.value === data.config.comparator)?.label ?? "="}
								</SelectTrigger>
								<SelectContent>
									{#each comparators as cmp (cmp.value)}
										<SelectItem value={cmp.value}>{cmp.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
							<Input
								value={data.config.value ?? ""}
								oninput={(e) => {
									const target = e.target as HTMLInputElement;
									update({ value: target.value });
								}}
								placeholder="value"
								class="text-xs"
								aria-invalid={validationError?.field === "value" ? "true" : undefined}
							/>
						</div>
					{/if}
				{/if}
			{/if}

			{#if data.config.mode === "button_action" && data.config.deviceId && actionCapability}
				{#if actionCapability.values && actionCapability.values.length > 0}
					<HiveSelectAutocomplete
						items={actionCapability.values}
						value={data.config.actionValue ?? ""}
						getValue={(v) => v}
						getLabel={(v) => sentenceCase(v)}
						placeholder="Select action"
						size="sm"
						class={validationError?.field === "actionValue"
							? `text-xs ${INVALID_CLS}`
							: "text-xs"}
						onchange={(v) => v && update({ actionValue: v })}
					/>
				{:else}
					<Input
						value={data.config.actionValue ?? ""}
						oninput={(e) => {
							const target = e.target as HTMLInputElement;
							update({ actionValue: target.value });
						}}
						placeholder="Action value (e.g. single)"
						class="text-xs"
						aria-invalid={validationError?.field === "actionValue" ? "true" : undefined}
					/>
				{/if}
			{/if}

			{#if data.config.mode === "schedule"}
				<Select
					type="single"
					value={data.config.scheduleSubmode ?? "at"}
					onValueChange={(v) => v && updateScheduleSubmode(v as ScheduleSubmode)}
				>
					<SelectTrigger class="w-full text-xs">
						{scheduleSubmodes.find((s) => s.value === (data.config.scheduleSubmode ?? "at"))?.label}
					</SelectTrigger>
					<SelectContent>
						{#each scheduleSubmodes as sm (sm.value)}
							<SelectItem value={sm.value}>{sm.label}</SelectItem>
						{/each}
					</SelectContent>
				</Select>

				{#if (data.config.scheduleSubmode ?? "at") === "at"}
					<div class="flex gap-1">
						<NumberInput
							value={data.config.scheduleHour ?? null}
							onValueChange={(v) => update({ scheduleHour: v ?? undefined })}
							min={0}
							max={23}
							placeholder="HH"
							class="text-xs"
							ariaLabel="Schedule hour"
						/>
						<span class="flex items-center text-xs text-muted-foreground">:</span>
						<NumberInput
							value={data.config.scheduleMinute ?? null}
							onValueChange={(v) => update({ scheduleMinute: v ?? undefined })}
							min={0}
							max={59}
							placeholder="MM"
							class="text-xs"
							ariaLabel="Schedule minute"
						/>
						<span class="flex items-center text-xs text-muted-foreground">:</span>
						<NumberInput
							value={data.config.scheduleSecond ?? null}
							onValueChange={(v) => update({ scheduleSecond: v ?? undefined })}
							min={0}
							max={59}
							placeholder="SS"
							class="text-xs"
							ariaLabel="Schedule second"
						/>
					</div>
					<div class="flex gap-0.5">
						{#each scheduleWeekdayCodes as code, i (code)}
							<button
								type="button"
								class="flex-1 rounded px-0 py-0.5 text-[10px] font-medium transition-colors {(data.config.scheduleWeekdays ?? []).includes(code)
									? 'bg-automation-trigger text-primary-foreground'
									: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
								onclick={() => toggleScheduleWeekday(code)}
							>
								{scheduleWeekdayShort[i]}
							</button>
						{/each}
					</div>
				{:else if data.config.scheduleSubmode === "every"}
					<div class="flex gap-1">
						<NumberInput
							value={data.config.scheduleIntervalValue ?? null}
							onValueChange={(v) => update({ scheduleIntervalValue: v ?? undefined })}
							min={1}
							placeholder="N"
							class="text-xs w-16"
							ariaInvalid={validationError?.field === "interval" ? "true" : undefined}
							ariaLabel="Schedule interval"
						/>
						<Select
							type="single"
							value={data.config.scheduleIntervalUnit ?? "seconds"}
							onValueChange={(v) => v && update({ scheduleIntervalUnit: v as "seconds" | "minutes" | "hours" })}
						>
							<SelectTrigger class="flex-1 text-xs">
								{intervalUnits.find((u) => u.value === (data.config.scheduleIntervalUnit ?? "seconds"))?.label}
							</SelectTrigger>
							<SelectContent>
								{#each intervalUnits as u (u.value)}
									<SelectItem value={u.value}>{u.label}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>
				{:else}
					<Input
						value={data.config.cronExpr ?? ""}
						oninput={(e) => {
							const t = e.target as HTMLInputElement;
							update({ cronExpr: t.value });
						}}
						placeholder="* * * * * *  (sec min hr dom mon dow)"
						class="text-xs font-mono"
						aria-invalid={validationError?.field === "cronExpr" ? "true" : undefined}
					/>
				{/if}

				<p class="text-[10px] text-muted-foreground">{humanSchedule}</p>
			{/if}

			{#if data.config.mode === "manual"}
				<p class="text-[10px] text-muted-foreground">Fires from Live mode only.</p>
			{/if}

			{#if data.config.mode === "custom"}
				<Select
					type="single"
					value={data.config.eventType}
					onValueChange={(v) => v && update({ eventType: v })}
				>
					<SelectTrigger class="w-full text-xs">
						{eventTypes.find((t) => t.value === data.config.eventType)?.label ?? "Select event"}
					</SelectTrigger>
					<SelectContent>
						{#each eventTypes as et (et.value)}
							<SelectItem value={et.value}>{et.label}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
				<Input
					value={data.config.customExpr ?? ""}
					oninput={(e) => {
						const target = e.target as HTMLInputElement;
						update({ customExpr: target.value });
					}}
					placeholder="Condition expression"
					class="text-xs font-mono"
					aria-invalid={validationError?.field === "customExpr" ? "true" : undefined}
				/>
			{/if}

			{#if data.config.mode === "schedule"}
				<p class="truncate text-[10px] font-mono text-muted-foreground" title={generatedCron}>
					{generatedCron || "(not set)"}
				</p>
			{:else if data.config.mode !== "manual"}
				<p class="truncate text-[10px] font-mono text-muted-foreground" title={generatedExpr}>
					{generatedExpr}
				</p>
			{/if}
		{:else}
			{#if data.config.mode === "manual"}
				{@const canFire = data.automationEnabled ?? false}
				<Button
					type="button"
					size="sm"
					class="w-full text-xs"
					disabled={!canFire}
					onclick={() => data.onFireManual?.()}
					title={canFire ? "Fire this trigger now" : "Enable the automation to fire the trigger"}
				>
					<Zap class="size-3.5" />
					Trigger
				</Button>
			{:else}
				<p class="text-xs text-foreground">{readableSummary()}</p>
			{/if}
			{#if data.config.mode === "schedule"}
				<p class="truncate text-[10px] font-mono text-muted-foreground" title={generatedCron}>
					{generatedCron}
				</p>
			{:else if data.config.mode !== "manual" && generatedExpr !== "true"}
				<p class="truncate text-[10px] font-mono text-muted-foreground" title={generatedExpr}>
					{generatedExpr}
				</p>
			{/if}
		{/if}
		{#if validationError && data.editable}
			<p class="text-[10px] text-destructive">{validationError.message}</p>
		{/if}

		{#if data.editable}
			<div class="-mx-3 -mb-3 border-t border-automation-trigger/20">
				<button
					type="button"
					class="flex w-full items-center gap-1 px-3 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
					onclick={() => (advancedOpen = !advancedOpen)}
				>
					{#if advancedOpen}
						<ChevronDown class="size-3" />
					{:else}
						<ChevronRight class="size-3" />
					{/if}
					Advanced
					{#if !advancedOpen && (graceMs > 0 || cooldownMs > 0)}
						<span class="ml-auto text-[10px] text-muted-foreground">
							{#if graceMs > 0}G:{formatTimingValue(graceMs)}{/if}{#if graceMs > 0 && cooldownMs > 0}&nbsp;·&nbsp;{/if}{#if cooldownMs > 0}C:{formatTimingValue(cooldownMs)}{/if}
						</span>
					{/if}
				</button>
				{#if advancedOpen}
					<div class="space-y-2 px-3 pb-3 pt-1">
						<div class="grid grid-cols-[auto_1fr] items-center gap-2">
							<label for="trigger-{id}-grace" class="text-[10px] text-muted-foreground">Grace</label>
							<Select
								type="single"
								value={String(graceMs)}
								onValueChange={(v) => v !== undefined && setGraceMs(Number(v))}
							>
								<SelectTrigger id="trigger-{id}-grace" class="h-7 w-full text-xs">
									{formatTimingValue(graceMs)}
								</SelectTrigger>
								<SelectContent>
									{#each TIMING_PRESETS as p (p.value)}
										<SelectItem value={String(p.value)}>{p.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
							<label for="trigger-{id}-cooldown" class="text-[10px] text-muted-foreground">Cooldown</label>
							<Select
								type="single"
								value={String(cooldownMs)}
								onValueChange={(v) => v !== undefined && setCooldownMs(Number(v))}
							>
								<SelectTrigger id="trigger-{id}-cooldown" class="h-7 w-full text-xs">
									{formatTimingValue(cooldownMs)}
								</SelectTrigger>
								<SelectContent>
									{#each TIMING_PRESETS as p (p.value)}
										<SelectItem value={String(p.value)}>{p.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</div>
						<p class="text-[10px] text-muted-foreground">
							Grace keeps this trigger active after it fires so AND/OR can combine it with later events. Cooldown suppresses re-matches inside the window.
						</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<Handle type="source" position={Position.Right} class="!bg-automation-trigger !border-automation-trigger !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />
</div>
