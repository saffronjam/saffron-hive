<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import DeviceTypeBadge from "$lib/components/device-type-badge.svelte";
	import HiveSelectAutocomplete from "$lib/components/hive-select-autocomplete.svelte";
	import { ShieldCheck } from "@lucide/svelte";
	import { sentenceCase } from "$lib/utils.js";
	import type { Device, Capability } from "$lib/stores/devices";
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import {
		type ConditionConfig,
		type ConditionMode,
		generateConditionExpr,
		validateConditionConfig,
	} from "./condition-expr";

	interface ConditionNodeData extends Record<string, unknown> {
		config: ConditionConfig;
		editable: boolean;
		activated: boolean;
		devices: Device[];
		onConfigChange?: (config: ConditionConfig) => void;
	}

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
		});
	}

	function handlePropertyChange(value: string | undefined) {
		if (!value) return;
		const cap = selectedDeviceCapabilities.find(
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
				if (data.config.deviceName) bits.push(data.config.deviceName);
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
		? 'border-teal-400 shadow-teal-400/50 shadow-lg'
		: selected
			? 'border-teal-400 ring-2 ring-teal-400/30'
			: 'border-teal-500/40'}"
	data-nodeid={id}
>
	<Handle type="target" position={Position.Left} class="!bg-teal-500 !border-teal-300 !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />

	<div class="flex items-center gap-2 rounded-t-md bg-teal-500/15 px-3 py-2">
		<ShieldCheck class="size-4 text-teal-500" />
		<span class="text-sm font-medium text-teal-600 dark:text-teal-400">Condition</span>
		{#if !data.editable}
			<Badge variant="secondary" class="ml-auto text-[10px]">{modeLabel}</Badge>
		{/if}
	</div>

	<div class="space-y-2 p-3">
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
						<Input
							type="number"
							value={data.config.afterHour ?? ""}
							oninput={(e) => {
								const t = e.target as HTMLInputElement;
								update({ afterHour: t.value !== "" ? Number(t.value) : undefined });
							}}
							min={0}
							max={23}
							placeholder="HH"
							class="text-xs"
						/>
						<span class="flex items-center text-xs text-muted-foreground">:</span>
						<Input
							type="number"
							value={data.config.afterMinute ?? ""}
							oninput={(e) => {
								const t = e.target as HTMLInputElement;
								update({ afterMinute: t.value !== "" ? Number(t.value) : undefined });
							}}
							min={0}
							max={59}
							placeholder="MM"
							class="text-xs"
						/>
					</div>
				</div>
				<div class="grid gap-1.5">
					<span class="text-[10px] text-muted-foreground">Before</span>
					<div class="flex gap-1">
						<Input
							type="number"
							value={data.config.beforeHour ?? ""}
							oninput={(e) => {
								const t = e.target as HTMLInputElement;
								update({ beforeHour: t.value !== "" ? Number(t.value) : undefined });
							}}
							min={0}
							max={23}
							placeholder="HH"
							class="text-xs"
						/>
						<span class="flex items-center text-xs text-muted-foreground">:</span>
						<Input
							type="number"
							value={data.config.beforeMinute ?? ""}
							oninput={(e) => {
								const t = e.target as HTMLInputElement;
								update({ beforeMinute: t.value !== "" ? Number(t.value) : undefined });
							}}
							min={0}
							max={59}
							placeholder="MM"
							class="text-xs"
						/>
					</div>
				</div>
			{:else if data.config.mode === "weekday"}
				<div class="flex gap-0.5">
					{#each weekdayFullNames as day, i (day)}
						<button
							type="button"
							class="flex-1 rounded px-0 py-0.5 text-[10px] font-medium transition-colors {(data.config.weekdays ?? []).includes(day)
								? 'bg-teal-500 text-white'
								: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
							onclick={() => toggleWeekday(day)}
						>
							{weekdayShort[i]}
						</button>
					{/each}
				</div>
			{:else if data.config.mode === "device_state"}
				<HiveSelectAutocomplete
					items={data.devices ?? []}
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
						<DeviceTypeBadge type={d.type} class="text-[10px] py-0 shrink-0" />
					{/snippet}
					{#snippet item(d: Device)}
						<span class="flex w-full items-center gap-1.5 overflow-hidden">
							<span class="truncate">{d.name}</span>
							<DeviceTypeBadge type={d.type} class="text-[10px] py-0 shrink-0 ml-auto" />
						</span>
					{/snippet}
				</HiveSelectAutocomplete>

				{#if data.config.deviceId}
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
							<Input
								type="number"
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

	<Handle type="source" position={Position.Right} class="!bg-teal-500 !border-teal-300 !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />
</div>
