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
	import HiveChip from "$lib/components/hive-chip.svelte";
	import HiveSelectAutocomplete from "$lib/components/hive-select-autocomplete.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { ShieldCheck, Trash2 } from "@lucide/svelte";
	import { sentenceCase } from "$lib/utils.js";
	import type { Device, Capability } from "$lib/stores/devices";
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import {
		type ConditionConfig,
		type ConditionMode,
		type ConditionTargetType,
		generateConditionExpr,
		validateConditionConfig,
	} from "./condition-expr";
	import type { GroupLite, RoomLite } from "$lib/target-resolve";

	interface ConditionNodeData extends Record<string, unknown> {
		config: ConditionConfig;
		editable: boolean;
		activated: boolean;
		devices: Device[];
		groups?: (GroupLite & { name: string })[];
		rooms?: (RoomLite & { name: string })[];
		onConfigChange?: (config: ConditionConfig) => void;
		onDelete?: () => void;
	}

	interface TargetItem {
		kind: ConditionTargetType;
		id: string;
		name: string;
		deviceType?: string;
	}

	function targetKey(t: TargetItem): string {
		return `${t.kind}:${t.id}`;
	}

	const ON_OFF_CAPABILITY: Capability = {
		name: "on_off",
		type: "binary",
		access: 1,
		values: null,
		valueMin: null,
		valueMax: null,
		unit: null,
	};

	interface Props {
		data: ConditionNodeData;
		id: string;
		selected?: boolean;
	}

	let { data, id, selected = false }: Props = $props();

	const modes: { value: ConditionMode; label: string }[] = [
		{ value: "time_window", label: "Time window" },
		{ value: "weekday", label: "Weekday" },
		{ value: "device_state", label: "Device state" },
		{ value: "custom", label: "Custom" },
	];

	const comparators = [
		{ value: "==", label: "=" },
		{ value: "!=", label: "\u2260" },
		{ value: ">", label: ">" },
		{ value: "<", label: "<" },
		{ value: ">=", label: "\u2265" },
		{ value: "<=", label: "\u2264" },
	];

	const weekdayFullNames = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday",
	];
	const weekdayShort = ["M", "T", "W", "T", "F", "S", "S"];

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

	function update(patch: Partial<ConditionConfig>) {
		if (!data.onConfigChange) return;
		data.onConfigChange({ ...data.config, ...patch });
	}

	function handleModeChange(value: string | undefined) {
		if (!value || !data.onConfigChange) return;
		data.onConfigChange({ mode: value as ConditionMode });
	}

	function toggleWeekday(day: string) {
		const current = data.config.weekdays ?? [];
		const next = current.includes(day)
			? current.filter((d) => d !== day)
			: [...current, day];
		update({ weekdays: next });
	}

	function capabilityToExprProperty(capName: string): string {
		return capName === "on_off" ? "on" : capName;
	}

	function handleTargetChange(value: string | undefined) {
		if (!value) return;
		const [kind, ...idParts] = value.split(":");
		const id = idParts.join(":");
		const item = targetItems.find((t) => t.kind === kind && t.id === id);
		if (!item) return;
		update({
			targetType: kind as ConditionTargetType,
			targetId: id,
			targetName: item.name,
			property: undefined,
			comparator: undefined,
			value: undefined,
		});
	}

	function handlePropertyChange(value: string | undefined) {
		if (!value) return;
		const cap = availableCapabilities.find(
			(c) => capabilityToExprProperty(c.name) === value
		);
		let defaultComparator = "==";
		let defaultValue: string | undefined;
		if (cap?.type === "binary") defaultValue = "true";
		else if (cap?.type === "numeric") {
			defaultComparator = ">";
			defaultValue = cap.valueMin !== null && cap.valueMin !== undefined ? String(cap.valueMin) : "";
		}
		update({ property: value, comparator: defaultComparator, value: defaultValue });
	}

	const targetItems = $derived.by<TargetItem[]>(() => {
		const items: TargetItem[] = [];
		for (const d of data.devices ?? []) {
			items.push({ kind: "device", id: d.id, name: d.name, deviceType: d.type });
		}
		for (const g of data.groups ?? []) {
			items.push({ kind: "group", id: g.id, name: g.name });
		}
		for (const r of data.rooms ?? []) {
			items.push({ kind: "room", id: r.id, name: r.name });
		}
		return items;
	});

	const selectedTargetKey = $derived(
		data.config.targetId ? `${data.config.targetType ?? "device"}:${data.config.targetId}` : "",
	);

	const selectedDevice = $derived.by<Device | undefined>(() => {
		if (data.config.targetType !== "device" && data.config.targetType !== undefined) return undefined;
		return (data.devices ?? []).find((d) => d.id === data.config.targetId);
	});

	// Devices expose every readable capability; groups/rooms expose only the
	// binary `on_off` capability since aggregating non-binary capabilities
	// (max? mean? any?) across a target's members has no clear semantics.
	const availableCapabilities = $derived.by((): Capability[] => {
		if (data.config.targetType === "group" || data.config.targetType === "room") {
			return [ON_OFF_CAPABILITY];
		}
		if (!selectedDevice) return [];
		return selectedDevice.capabilities.filter((c) => (c.access & 1) !== 0);
	});

	const selectedCapability = $derived.by((): Capability | undefined => {
		if (!data.config.property) return undefined;
		return availableCapabilities.find(
			(c) => capabilityToExprProperty(c.name) === data.config.property
		);
	});

	const generatedExpr = $derived(generateConditionExpr(data.config));
	const validationError = $derived(validateConditionConfig(data.config));
	const INVALID_CLS = "border-destructive ring-2 ring-destructive/40";

	const modeLabel = $derived(
		modes.find((m) => m.value === data.config.mode)?.label ?? "Custom"
	);

	function readableSummary(): string {
		switch (data.config.mode) {
			case "time_window": {
				const parts: string[] = [];
				const fmt = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
				if (data.config.afterHour !== undefined) {
					parts.push(`after ${fmt(data.config.afterHour, data.config.afterMinute ?? 0)}`);
				}
				if (data.config.beforeHour !== undefined) {
					parts.push(`before ${fmt(data.config.beforeHour, data.config.beforeMinute ?? 0)}`);
				}
				return parts.length > 0 ? parts.join(" & ") : "Any time";
			}
			case "weekday": {
				const days = data.config.weekdays ?? [];
				if (days.length === 0) return "Any day";
				return days.map((d) => d.slice(0, 3)).join(", ");
			}
			case "device_state": {
				const bits: string[] = [];
				if (data.config.targetName) bits.push(data.config.targetName);
				if (data.config.property) {
					bits.push(`${data.config.property} ${data.config.comparator ?? "=="} ${data.config.value ?? ""}`);
				}
				return bits.join(": ") || "No condition set";
			}
			case "custom":
				return data.config.customExpr || "true";
		}
	}
</script>

<div
	class="w-64 rounded-lg border-2 bg-card shadow-md transition-all {data.activated
		? 'border-automation-condition shadow-automation-condition/50 shadow-lg'
		: selected
			? 'border-automation-condition ring-2 ring-automation-condition/30'
			: 'border-automation-condition/40'}"
	data-nodeid={id}
>
	<Handle type="target" position={Position.Left} class="!bg-automation-condition !border-automation-condition !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />

	<div class="flex items-center gap-2 rounded-t-md bg-automation-condition/15 px-3 py-2">
		<ShieldCheck class="size-4 text-automation-condition" />
		<span class="text-sm font-medium text-automation-condition">Condition</span>
		{#if !data.editable}
			<Badge
				variant="outline"
				class="ml-auto text-[10px] border-automation-condition/30 bg-automation-condition/10 text-automation-condition"
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
				aria-label="Delete condition node"
			>
				<Trash2 class="size-3.5" />
			</Button>
		{/if}
	</div>

	<div class="space-y-2 p-3 nodrag">
		{#if data.editable}
			<Select type="single" value={data.config.mode} onValueChange={handleModeChange}>
				<SelectTrigger class="w-full text-xs">{modeLabel}</SelectTrigger>
				<SelectContent>
					{#each modes as m (m.value)}
						<SelectItem value={m.value}>{m.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>

			{#if data.config.mode === "time_window"}
				<div class="grid gap-1.5">
					<span class="text-[10px] text-muted-foreground">After</span>
					<div class="flex gap-1">
						<NumberInput
							value={data.config.afterHour ?? null}
							onValueChange={(v) => update({ afterHour: v ?? undefined })}
							min={0}
							max={23}
							placeholder="HH"
							class="text-xs"
							ariaLabel="After hour"
						/>
						<span class="flex items-center text-xs text-muted-foreground">:</span>
						<NumberInput
							value={data.config.afterMinute ?? null}
							onValueChange={(v) => update({ afterMinute: v ?? undefined })}
							min={0}
							max={59}
							placeholder="MM"
							class="text-xs"
							ariaLabel="After minute"
						/>
					</div>
				</div>
				<div class="grid gap-1.5">
					<span class="text-[10px] text-muted-foreground">Before</span>
					<div class="flex gap-1">
						<NumberInput
							value={data.config.beforeHour ?? null}
							onValueChange={(v) => update({ beforeHour: v ?? undefined })}
							min={0}
							max={23}
							placeholder="HH"
							class="text-xs"
							ariaLabel="Before hour"
						/>
						<span class="flex items-center text-xs text-muted-foreground">:</span>
						<NumberInput
							value={data.config.beforeMinute ?? null}
							onValueChange={(v) => update({ beforeMinute: v ?? undefined })}
							min={0}
							max={59}
							placeholder="MM"
							class="text-xs"
							ariaLabel="Before minute"
						/>
					</div>
				</div>
			{:else if data.config.mode === "weekday"}
				<div class="flex gap-0.5">
					{#each weekdayFullNames as day, i (day)}
						<button
							type="button"
							class="flex-1 rounded px-0 py-0.5 text-[10px] font-medium transition-colors {(data.config.weekdays ?? []).includes(day)
								? 'bg-automation-condition text-primary-foreground'
								: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
							onclick={() => toggleWeekday(day)}
						>
							{weekdayShort[i]}
						</button>
					{/each}
				</div>
			{:else if data.config.mode === "device_state"}
				<HiveSelectAutocomplete
					items={targetItems}
					value={selectedTargetKey}
					getValue={targetKey}
					getLabel={(t) => t.name}
					placeholder="Select target"
					size="sm"
					class={validationError?.field === "target" ? `text-xs ${INVALID_CLS}` : "text-xs"}
					onchange={(v) => handleTargetChange(v)}
				>
					{#snippet renderSelected(t: TargetItem)}
						<span class="truncate">{t.name}</span>
						{#if t.kind === "device" && t.deviceType}
							<HiveChip type={t.deviceType} class="text-[10px] py-0 shrink-0" />
						{:else}
							<Badge variant="secondary" class="text-[10px] py-0 shrink-0">{t.kind}</Badge>
						{/if}
					{/snippet}
					{#snippet item(t: TargetItem)}
						<span class="flex w-full items-center gap-1.5 overflow-hidden">
							<span class="truncate">{t.name}</span>
							{#if t.kind === "device" && t.deviceType}
								<HiveChip type={t.deviceType} class="text-[10px] py-0 shrink-0 ml-auto" />
							{:else}
								<Badge variant="secondary" class="text-[10px] py-0 shrink-0 ml-auto">{t.kind}</Badge>
							{/if}
						</span>
					{/snippet}
				</HiveSelectAutocomplete>

				{#if data.config.targetId}
					<HiveSelectAutocomplete
						items={availableCapabilities}
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
								{#if c.unit}<span class="text-muted-foreground">({c.unit})</span>{/if}
							</span>
						{/snippet}
					</HiveSelectAutocomplete>
				{/if}

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
								placeholder="value"
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
									const t = e.target as HTMLInputElement;
									update({ value: t.value });
								}}
								placeholder="value"
								class="text-xs"
								aria-invalid={validationError?.field === "value" ? "true" : undefined}
							/>
						</div>
					{/if}
				{/if}
			{:else if data.config.mode === "custom"}
				<Input
					value={data.config.customExpr ?? ""}
					oninput={(e) => {
						const t = e.target as HTMLInputElement;
						update({ customExpr: t.value });
					}}
					placeholder="Expression, e.g. time.hour >= 21"
					class="text-xs font-mono"
					aria-invalid={validationError?.field === "customExpr" ? "true" : undefined}
				/>
			{/if}

			<p class="truncate text-[10px] font-mono text-muted-foreground" title={generatedExpr}>
				{generatedExpr}
			</p>
		{:else}
			<p class="text-xs text-foreground">{readableSummary()}</p>
			{#if generatedExpr !== "true"}
				<p class="truncate text-[10px] font-mono text-muted-foreground" title={generatedExpr}>
					{generatedExpr}
				</p>
			{/if}
		{/if}
		{#if validationError && data.editable}
			<p class="text-[10px] text-destructive">{validationError.message}</p>
		{/if}
	</div>

	<Handle type="source" position={Position.Right} class="!bg-automation-condition !border-automation-condition !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />
</div>
