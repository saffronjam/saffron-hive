<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import { deviceDisplayName, entityDisplayName } from "$lib/utils";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import NumberInput from "$lib/components/number-input.svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import HiveSelectAutocomplete from "$lib/components/hive-select-autocomplete.svelte";
	import NodeTypeSelect from "./node-type-select.svelte";
	import DeviceOptionRow from "./device-option-row.svelte";
	import CapabilityOptionRow from "./capability-option-row.svelte";
	import WebhookFilterEditor from "./webhook-filter-editor.svelte";
	import { triggerOptions } from "./automation-node-options";
	import { automationValidationMessage } from "$lib/i18n/automation-validation";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { formatShortDuration } from "$lib/i18n/format";
	import { chipLabel, historyFieldLabel, identifierLabel } from "$lib/i18n/vocabulary";
	import { webhooksStore } from "$lib/stores/webhooks.svelte";
	import { roomLabelsByDevice } from "$lib/memberships";
	import {
		Tooltip,
		TooltipContent,
		TooltipTrigger,
	} from "$lib/components/ui/tooltip/index.js";
	import { ChevronDown, ChevronRight, Info, Zap } from "@lucide/svelte";
	import type { Device, Capability } from "$lib/stores/devices";
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import type { RoomLite } from "$lib/target-resolve";
	import {
		type TriggerConfig,
		type TriggerMode,
		type ScheduleSubmode,
		generateCronExpr,
		humanizeCron,
		eventTypeForMode,
		capabilityToExprProperty,
		supportsDeviceEvents,
		validateTriggerConfig,
		timingPresets,
		weekdayLabel,
	} from "./trigger-expr";

	interface TriggerNodeData extends Record<string, unknown> {
		config: TriggerConfig;
		readOnly: boolean;
		activated: boolean;
		devices: Device[];
		rooms?: RoomLite[];
		onConfigChange?: (config: TriggerConfig) => void;
	}

	interface Props {
		data: TriggerNodeData;
		id: string;
	}

	let { data, id }: Props = $props();

	const modes = $derived.by(() => triggerOptions());
	const messageOptions = $derived(locale.messageOptions());
	const webhookEndpoints = $derived(webhooksStore.items);

	const scheduleSubmodes = $derived.by<{ value: ScheduleSubmode; label: string }[]>(() => [
		{ value: "at", label: m.automation_node_schedule_at({}, messageOptions) },
		{ value: "every", label: m.automation_node_schedule_every({}, messageOptions) },
		{ value: "custom", label: m.automation_node_schedule_custom({}, messageOptions) },
	]);

	const scheduleWeekdayCodes = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
	const scheduleWeekdayShort = $derived(
		scheduleWeekdayCodes.map((code) => weekdayLabel(code, "narrow")),
	);

	const intervalUnits = $derived.by(() => [
		{ value: "seconds", label: m.automation_node_seconds({}, messageOptions) },
		{ value: "minutes", label: m.automation_node_minutes({}, messageOptions) },
		{ value: "hours", label: m.automation_node_hours({}, messageOptions) },
	]);

	const comparators = [
		{ value: "==", label: "=" },
		{ value: "!=", label: "\u2260" },
		{ value: ">", label: ">" },
		{ value: "<", label: "<" },
		{ value: ">=", label: "\u2265" },
		{ value: "<=", label: "\u2264" },
	];

	const eventTypes = $derived.by(() => [
		{ value: "device.state_changed", label: m.automation_node_event_state_changed({}, messageOptions) },
		{ value: "device.availability_changed", label: m.automation_node_event_availability({}, messageOptions) },
		{ value: "device.added", label: m.automation_node_event_device_added({}, messageOptions) },
		{ value: "device.removed", label: m.automation_node_event_device_removed({}, messageOptions) },
	]);

	const deviceTypeOptions = $derived.by(() =>
		["light", "sensor", "switch"].map((value) => ({ value, label: chipLabel(value) })),
	);

	const deviceChipConfigs = $derived.by<ChipConfig[]>(() => [
		{
			keyword: "type",
			label: m.automation_node_filter_type({}, messageOptions),
			variant: "secondary",
			options: (q: string) => {
				const lower = q.toLowerCase();
				return deviceTypeOptions.filter(
					(o) => !lower || o.value.includes(lower) || o.label.toLowerCase().includes(lower),
				);
			},
		},
	]);

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
			deviceName: deviceDisplayName(dev),
			property: undefined,
			comparator: undefined,
			value: undefined,
			eventValue: undefined,
		});
	}

	function handleWebhookChange(value: string | undefined) {
		if (!value) return;
		update({ endpointId: value });
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
		return selectedDevice.capabilities.filter((c) => c.reportsValue);
	});

	const selectedCapability = $derived.by((): Capability | undefined => {
		if (!data.config.property || !selectedDevice) return undefined;
		return selectedDevice.capabilities.find(
			(c) => capabilityToExprProperty(c.name) === data.config.property
		);
	});

	const eventCapability = $derived.by((): Capability | undefined => {
		if (!selectedDevice) return undefined;
		return selectedDevice.capabilities.find((c) => c.name === "action");
	});

	const devicesForMode = $derived.by((): Device[] => {
		const devs = data.devices ?? [];
		if (data.config.mode === "device_event") {
			return devs.filter(supportsDeviceEvents);
		}
		return devs;
	});
	const deviceRoomLabels = $derived(roomLabelsByDevice(data.rooms ?? []));

	const generatedCron = $derived(generateCronExpr(data.config));
	const humanSchedule = $derived(humanizeCron(generatedCron));
	const validationError = $derived(validateTriggerConfig(data.config));
	const timingOptions = $derived.by(() => timingPresets());
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

	let advancedOpen = $state(false);
	const graceMs = $derived(data.config.graceMs ?? 0);
	const cooldownMs = $derived(data.config.cooldownMs ?? 0);

	function formatTimingValue(ms: number): string {
		const preset = timingOptions.find((p) => p.value === ms);
		if (preset) return preset.label;
		if (ms <= 0) return m.automation_timing_immediate({}, messageOptions);
		if (ms < 1000) return formatShortDuration(ms, "millisecond", locale.currentLanguage);
		return formatShortDuration(ms / 1000, "second", locale.currentLanguage, {
			maximumFractionDigits: 3,
		});
	}

	function setGraceMs(next: number) {
		update({ graceMs: next });
	}

	function setCooldownMs(next: number) {
		update({ cooldownMs: next });
	}

</script>

<div
	class="{data.config.mode === 'webhook' && data.config.endpointId ? 'w-[20.8rem]' : 'w-64'} rounded-lg border-2 bg-card shadow-md transition-all {data.activated
		? 'border-automation-trigger shadow-automation-trigger/50 shadow-lg'
		: 'border-automation-trigger/40'}"
	data-nodeid={id}
>
	<div class="flex items-center gap-2 rounded-t-md bg-automation-trigger/15 px-3 py-2">
		<Zap class="size-4 text-automation-trigger" />
		<span class="text-sm font-medium text-automation-trigger">{m.automation_node_trigger({}, messageOptions)}</span>
	</div>

	<div class="min-w-0 p-3 nodrag">
		<fieldset disabled={data.readOnly} inert={data.readOnly} class="space-y-2 border-0 p-0">
			<NodeTypeSelect
				value={data.config.mode}
				placeholder={m.automation_node_select_trigger({}, messageOptions)}
				options={modes}
				disabled={data.readOnly}
				invalid={validationError?.field === "mode"}
				onchange={handleModeChange}
			/>

			{#if data.config.mode === "device_state" || data.config.mode === "device_event" || data.config.mode === "availability"}
				<HiveSelectAutocomplete
					items={devicesForMode}
					value={data.config.deviceId ?? ""}
					getValue={(d) => d.id}
					getLabel={(d) => deviceDisplayName(d)}
					chipConfigs={deviceChipConfigs}
					chipMatchers={deviceChipMatchers}
					placeholder={m.automation_node_select_device({}, messageOptions)}
					size="sm"
					separatedItems
					disabled={data.readOnly}
					class={validationError?.field === "device" ? `text-xs ${INVALID_CLS}` : "text-xs"}
					onchange={(v) => handleDeviceChange(v)}
				>
					{#snippet renderSelected(d: Device)}
						<span class="truncate">{deviceDisplayName(d)}</span>
						<HiveChip type={d.type} class="text-[10px] py-0 shrink-0" />
					{/snippet}
					{#snippet item(d: Device)}
						<DeviceOptionRow
							name={deviceDisplayName(d)}
							deviceType={d.type}
							roomLabel={deviceRoomLabels.get(d.id)}
						/>
					{/snippet}
				</HiveSelectAutocomplete>
			{/if}

			{#if data.config.mode === "webhook"}
				<HiveSelectAutocomplete
					items={webhookEndpoints}
					value={data.config.endpointId ?? ""}
					getValue={(endpoint) => endpoint.id}
					getLabel={(endpoint) => entityDisplayName("webhook", endpoint)}
					placeholder={m.automation_node_select_webhook({}, messageOptions)}
					size="sm"
					separatedItems
					disabled={data.readOnly}
					class={validationError?.field === "endpoint" ? `text-xs ${INVALID_CLS}` : "text-xs"}
					onchange={handleWebhookChange}
				>
					{#snippet item(endpoint)}
						<div class="min-w-0 py-0.5">
							<div class="truncate text-xs">{entityDisplayName("webhook", endpoint)}</div>
							<div class="truncate text-[10px] text-muted-foreground">
								{endpoint.enabled ? m.automation_node_webhook_enabled({}, messageOptions) : m.automation_node_webhook_disabled({}, messageOptions)}
							</div>
						</div>
					{/snippet}
				</HiveSelectAutocomplete>
				{#if data.config.endpointId}
					<WebhookFilterEditor
						rules={data.config.webhookFilters ?? []}
						disabled={data.readOnly}
						invalid={validationError?.field === "webhookFilter"}
						onchange={(webhookFilters) => update({ webhookFilters })}
					/>
				{/if}
			{/if}

			{#if data.config.mode === "device_state" && data.config.deviceId}
				<HiveSelectAutocomplete
					items={selectedDeviceCapabilities}
					value={data.config.property ?? ""}
					getValue={(c) => capabilityToExprProperty(c.name)}
					getLabel={(c) => historyFieldLabel(capabilityToExprProperty(c.name))}
					placeholder={m.automation_node_select_property({}, messageOptions)}
					size="sm"
					separatedItems
					disabled={data.readOnly}
					class={validationError?.field === "property" ? `text-xs ${INVALID_CLS}` : "text-xs"}
					onchange={(v) => handlePropertyChange(v)}
				>
					{#snippet item(c: Capability)}
						<CapabilityOptionRow
							type={capabilityToExprProperty(c.name)}
							label={historyFieldLabel(capabilityToExprProperty(c.name))}
							unit={c.unit}
						/>
					{/snippet}
				</HiveSelectAutocomplete>

				{#if data.config.property && selectedCapability}
					{#if selectedCapability.type === "binary"}
						<Select
							type="single"
							value={data.config.value ?? "true"}
							disabled={data.readOnly}
							onValueChange={(v) => v && update({ comparator: "==", value: v })}
						>
							<SelectTrigger size="sm" class="w-full text-xs">
								{data.config.value === "false" ? m.state_off({}, messageOptions) : m.state_on({}, messageOptions)}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="true">{m.state_on({}, messageOptions)}</SelectItem>
								<SelectItem value="false">{m.state_off({}, messageOptions)}</SelectItem>
							</SelectContent>
						</Select>
					{:else if selectedCapability.type === "numeric"}
						<div class="flex gap-1">
							<Select
								type="single"
								value={data.config.comparator ?? "=="}
								disabled={data.readOnly}
								onValueChange={(v) => v && update({ comparator: v })}
							>
								<SelectTrigger size="sm" class="w-14 shrink-0 text-xs">
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
								placeholder={selectedCapability.unit ?? m.automation_node_value_placeholder({}, messageOptions)}
								class="text-xs"
								ariaInvalid={validationError?.field === "value" ? "true" : undefined}
							/>
						</div>
					{:else if selectedCapability.type === "enum" && selectedCapability.values}
						<HiveSelectAutocomplete
							items={selectedCapability.values}
							value={data.config.value ?? ""}
							getValue={(v) => v}
							getLabel={(v) => identifierLabel(v)}
							placeholder={m.automation_node_select_value({}, messageOptions)}
							size="sm"
							disabled={data.readOnly}
							class={validationError?.field === "value" ? `text-xs ${INVALID_CLS}` : "text-xs"}
							onchange={(v) => v && update({ comparator: "==", value: v })}
						/>
					{:else}
						<div class="flex gap-1">
							<Select
								type="single"
								value={data.config.comparator ?? "=="}
								disabled={data.readOnly}
								onValueChange={(v) => v && update({ comparator: v })}
							>
								<SelectTrigger size="sm" class="w-14 shrink-0 text-xs">
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
								placeholder={m.automation_node_value_placeholder({}, messageOptions)}
								class="text-xs"
								aria-invalid={validationError?.field === "value" ? "true" : undefined}
							/>
						</div>
					{/if}
				{/if}
			{/if}

			{#if data.config.mode === "device_event" && data.config.deviceId && eventCapability}
				{#if eventCapability.values && eventCapability.values.length > 0}
					<HiveSelectAutocomplete
						items={eventCapability.values}
						value={data.config.eventValue ?? ""}
						getValue={(v) => v}
						getLabel={(v) => identifierLabel(v)}
						placeholder={m.automation_node_select_event({}, messageOptions)}
						size="sm"
						disabled={data.readOnly}
						class={validationError?.field === "eventValue"
							? `text-xs ${INVALID_CLS}`
							: "text-xs"}
						onchange={(v) => v && update({ eventValue: v })}
					/>
				{:else}
					<Input
						value={data.config.eventValue ?? ""}
						oninput={(e) => {
							const target = e.target as HTMLInputElement;
							update({ eventValue: target.value });
						}}
						placeholder={m.automation_node_event_value_placeholder({}, messageOptions)}
						class="text-xs"
						aria-invalid={validationError?.field === "eventValue" ? "true" : undefined}
					/>
				{/if}
			{/if}

			{#if data.config.mode === "schedule"}
				<Select
					type="single"
					value={data.config.scheduleSubmode ?? "at"}
					disabled={data.readOnly}
					onValueChange={(v) => v && updateScheduleSubmode(v as ScheduleSubmode)}
				>
					<SelectTrigger size="sm" class="w-full text-xs">
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
							placeholder={m.common_time_hour_placeholder({}, messageOptions)}
							class="text-xs"
							ariaLabel={m.automation_node_schedule_hour({}, messageOptions)}
						/>
						<span class="flex items-center text-xs text-muted-foreground">:</span>
						<NumberInput
							value={data.config.scheduleMinute ?? null}
							onValueChange={(v) => update({ scheduleMinute: v ?? undefined })}
							min={0}
							max={59}
							placeholder={m.common_time_minute_placeholder({}, messageOptions)}
							class="text-xs"
							ariaLabel={m.automation_node_schedule_minute({}, messageOptions)}
						/>
						<span class="flex items-center text-xs text-muted-foreground">:</span>
						<NumberInput
							value={data.config.scheduleSecond ?? null}
							onValueChange={(v) => update({ scheduleSecond: v ?? undefined })}
							min={0}
							max={59}
							placeholder={m.common_time_second_placeholder({}, messageOptions)}
							class="text-xs"
							ariaLabel={m.automation_node_schedule_second({}, messageOptions)}
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
							ariaLabel={m.automation_node_schedule_interval({}, messageOptions)}
						/>
						<Select
							type="single"
							value={data.config.scheduleIntervalUnit ?? "seconds"}
							disabled={data.readOnly}
							onValueChange={(v) => v && update({ scheduleIntervalUnit: v as "seconds" | "minutes" | "hours" })}
						>
							<SelectTrigger size="sm" class="flex-1 text-xs">
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
						placeholder={m.automation_node_cron_placeholder({}, messageOptions)}
						class="text-xs font-mono"
						aria-invalid={validationError?.field === "cronExpr" ? "true" : undefined}
					/>
				{/if}

				<p class="text-[10px] text-muted-foreground">{humanSchedule}</p>
			{/if}

			{#if data.config.mode === "custom"}
				<Select
					type="single"
					value={data.config.eventType}
					disabled={data.readOnly}
					onValueChange={(v) => v && update({ eventType: v })}
				>
					<SelectTrigger size="sm" class="w-full text-xs">
						{eventTypes.find((t) => t.value === data.config.eventType)?.label ?? m.automation_node_select_event({}, messageOptions)}
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
					placeholder={m.automation_node_condition_expression({}, messageOptions)}
					class="text-xs font-mono"
					aria-invalid={validationError?.field === "customExpr" ? "true" : undefined}
				/>
			{/if}

		{#if validationError && !data.readOnly}
			<p class="text-[10px] text-destructive">{automationValidationMessage(validationError.code)}</p>
		{/if}
		</fieldset>

		<div class="-mx-3 -mb-3 mt-2 border-t border-automation-trigger/20 pt-1">
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
					{m.automation_node_advanced({}, messageOptions)}
					{#if !advancedOpen && (graceMs > 0 || cooldownMs > 0)}
						<span class="ml-auto text-[10px] text-muted-foreground">
							{#if graceMs > 0}{m.automation_node_grace_short({ duration: formatTimingValue(graceMs) }, messageOptions)}{/if}{#if graceMs > 0 && cooldownMs > 0}&nbsp;·&nbsp;{/if}{#if cooldownMs > 0}{m.automation_node_cooldown_short({ duration: formatTimingValue(cooldownMs) }, messageOptions)}{/if}
						</span>
					{/if}
				</button>
				{#if advancedOpen}
					<fieldset disabled={data.readOnly} class="space-y-2 border-0 px-3 pb-3 pt-1">
						<div class="grid grid-cols-[auto_1fr] items-center gap-2">
							<div class="flex items-center gap-1">
								<label for="trigger-{id}-grace" class="text-[10px] text-muted-foreground">{m.automation_node_grace({}, messageOptions)}</label>
								<Tooltip>
									<TooltipTrigger class="text-muted-foreground" aria-label={m.automation_node_grace_about({}, messageOptions)}>
										<Info class="size-3" />
									</TooltipTrigger>
									<TooltipContent>{m.automation_node_grace_help({}, messageOptions)}</TooltipContent>
								</Tooltip>
							</div>
							<Select
								type="single"
								value={String(graceMs)}
								disabled={data.readOnly}
								onValueChange={(v) => v !== undefined && setGraceMs(Number(v))}
							>
								<SelectTrigger size="sm" id="trigger-{id}-grace" class="h-7 w-full text-xs">
									{formatTimingValue(graceMs)}
								</SelectTrigger>
								<SelectContent>
									{#each timingOptions as p (p.value)}
										<SelectItem value={String(p.value)}>{p.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
							<div class="flex items-center gap-1">
								<label for="trigger-{id}-cooldown" class="text-[10px] text-muted-foreground">{m.automation_node_cooldown({}, messageOptions)}</label>
								<Tooltip>
									<TooltipTrigger class="text-muted-foreground" aria-label={m.automation_node_cooldown_about({}, messageOptions)}>
										<Info class="size-3" />
									</TooltipTrigger>
									<TooltipContent>{m.automation_node_cooldown_help({}, messageOptions)}</TooltipContent>
								</Tooltip>
							</div>
							<Select
								type="single"
								value={String(cooldownMs)}
								disabled={data.readOnly}
								onValueChange={(v) => v !== undefined && setCooldownMs(Number(v))}
							>
								<SelectTrigger size="sm" id="trigger-{id}-cooldown" class="h-7 w-full text-xs">
									{formatTimingValue(cooldownMs)}
								</SelectTrigger>
								<SelectContent>
									{#each timingOptions as p (p.value)}
										<SelectItem value={String(p.value)}>{p.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</div>
					</fieldset>
				{/if}
		</div>
	</div>

	<Handle type="source" position={Position.Right} class="!bg-automation-trigger !border-automation-trigger !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />
</div>
