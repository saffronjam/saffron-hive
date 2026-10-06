<script lang="ts">
	import type { Capability, DeviceAttributeValue } from "$lib/stores/devices";
	import {
		configurationEntry,
		groupConfigurationCapabilities,
		writableConfigurationCapabilities,
		type ConfigurationSection,
	} from "$lib/device-configuration";
	import FlagsSetting from "$lib/components/flags-setting.svelte";
	import { sentenceCase } from "$lib/utils";
	import { historyFieldLabel } from "$lib/i18n/vocabulary";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import NumberInput from "$lib/components/number-input.svelte";
	import {
		Tooltip,
		TooltipContent,
		TooltipTrigger,
	} from "$lib/components/ui/tooltip/index.js";
	import { Info, X } from "@lucide/svelte";
	import CapabilityOptionRow from "$lib/components/graph/capability-option-row.svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		capabilities: Capability[];
		values: DeviceAttributeValue[];
		defaults?: DeviceAttributeValue[];
		onchange: (values: DeviceAttributeValue[]) => void;
		disabled?: boolean;
		selectable?: boolean;
		compact?: boolean;
	}

	let {
		capabilities,
		values,
		defaults = [],
		onchange,
		disabled = false,
		selectable = false,
		compact = false,
	}: Props = $props();

	const settings = $derived(writableConfigurationCapabilities(capabilities));
	const byName = $derived(new Map(settings.map((capability) => [capability.name, capability])));
	const selectedNames = $derived(new Set(values.map((value) => value.capability)));
	const visibleSettings = $derived(
		selectable
			? values
					.map((value) => byName.get(value.capability))
					.filter((capability): capability is Capability => capability !== undefined)
			: settings,
	);
	/** Sections are shown on the full editor only, and only when there is more than one. */
	const groups = $derived.by(() => {
		const grouped = groupConfigurationCapabilities(visibleSettings);
		if (compact || selectable || grouped.length < 2) {
			return [{ section: null, capabilities: visibleSettings }];
		}
		return grouped;
	});

	function sectionTitle(section: ConfigurationSection): string {
		const options = locale.messageOptions();
		switch (section) {
			case "presence":
				return m.device_config_section_presence({}, options);
			case "climate":
				return m.device_config_section_climate({}, options);
			case "light":
				return m.device_config_section_light({}, options);
			case "indicator":
				return m.device_config_section_indicator({}, options);
			case "other":
				return m.device_config_section_other({}, options);
		}
	}

	const availableSettings = $derived(
		settings.filter((capability) => !selectedNames.has(capability.name)),
	);

	function existing(capability: Capability): DeviceAttributeValue | undefined {
		return values.find((value) => value.capability === capability.name);
	}

	function displayValue(capability: Capability): DeviceAttributeValue {
		return configurationEntry(capability, existing(capability));
	}

	function replace(next: DeviceAttributeValue) {
		const remaining = values.filter((value) => value.capability !== next.capability);
		onchange([...remaining, next].sort((a, b) => a.capability.localeCompare(b.capability)));
	}

	function updateBoolean(capability: Capability, value: boolean) {
		replace({
			capability: capability.name,
			booleanValue: value,
			numberValue: null,
			stringValue: null,
		});
	}

	function updateNumber(capability: Capability, value: number | null) {
		if (value === null) return;
		replace({
			capability: capability.name,
			booleanValue: null,
			numberValue: value,
			stringValue: null,
		});
	}

	function updateString(capability: Capability, value: string) {
		replace({
			capability: capability.name,
			booleanValue: null,
			numberValue: null,
			stringValue: value,
		});
	}

	function addSetting(name: string | undefined) {
		if (!name) return;
		const capability = byName.get(name);
		if (!capability) return;
		replace(
			configurationEntry(
				capability,
				defaults.find((value) => value.capability === capability.name),
			),
		);
	}

	function removeSetting(name: string) {
		onchange(values.filter((value) => value.capability !== name));
	}

	function label(capability: Capability): string {
		return historyFieldLabel(capability.name, capability.label);
	}
</script>

{#snippet settingRow(capability: Capability)}
	{@const current = displayValue(capability)}
	<div class={compact ? "px-2 py-1" : "space-y-1.5"}>
		<div class="flex items-center justify-between gap-3">
			<div class="flex min-w-0 items-center gap-1.5">
				<p class={compact ? "text-xs font-medium" : "text-sm font-medium"}>{label(capability)}</p>
				{#if !compact && capability.description}
					<Tooltip>
						<TooltipTrigger
							class="shrink-0 text-muted-foreground"
							aria-label={m.device_config_about(
								{ name: label(capability) },
								locale.messageOptions(),
							)}
						>
							<Info class="size-3.5" />
						</TooltipTrigger>
						<TooltipContent>{capability.description}</TooltipContent>
					</Tooltip>
				{/if}
			</div>
			<div class="flex shrink-0 items-center gap-1.5">
				{#if capability.type === "flags"}
					<!-- Rendered full width below the label row. -->
				{:else if capability.type === "binary"}
					<Switch
						checked={current.booleanValue ?? false}
						onCheckedChange={(value) => updateBoolean(capability, value)}
						{disabled}
						aria-label={label(capability)}
					/>
				{:else if capability.type === "numeric"}
					<div class="flex items-center gap-1.5">
						<NumberInput
							value={current.numberValue ?? capability.valueMin ?? 0}
							min={capability.valueMin ?? undefined}
							max={capability.valueMax ?? undefined}
							allowDecimal
							allowNegative={(capability.valueMin ?? 0) < 0}
							onValueChange={(value) => updateNumber(capability, value)}
							class={compact ? "h-8 w-20 text-xs" : "w-28"}
							{disabled}
							ariaLabel={label(capability)}
						/>
						{#if capability.unit}<span class="text-xs text-muted-foreground">{capability.unit}</span>{/if}
					</div>
				{:else if capability.type === "enum" && (capability.values?.length ?? 0) > 0}
					<Select
						type="single"
						value={current.stringValue ?? ""}
						onValueChange={(value) => value && updateString(capability, value)}
						{disabled}
					>
						<SelectTrigger class={compact ? "h-8 w-28 text-xs" : "w-auto max-w-60 min-w-40"}>
							{current.stringValue
								? sentenceCase(current.stringValue)
								: m.common_select({}, locale.messageOptions())}
						</SelectTrigger>
						<SelectContent>
							{#each capability.values ?? [] as option (option)}
								<SelectItem value={option}>{sentenceCase(option)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				{:else}
					<Input
						value={current.stringValue ?? ""}
						oninput={(event) => updateString(capability, event.currentTarget.value)}
						class={compact ? "h-8 w-28 text-xs" : "w-40"}
						{disabled}
						aria-label={label(capability)}
					/>
				{/if}
				{#if selectable}
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						class="size-7"
						onclick={() => removeSetting(capability.name)}
						{disabled}
						aria-label={m.device_config_remove(
							{ name: label(capability) },
							locale.messageOptions(),
						)}
					>
						<X class="size-3.5" />
					</Button>
				{/if}
			</div>
		</div>
		{#if capability.type === "flags"}
			<div class={compact ? "pt-1" : ""}>
				<FlagsSetting
					flags={capability.values ?? []}
					value={current.numberValue ?? 0}
					onchange={(mask) => updateNumber(capability, mask)}
					label={label(capability)}
					{disabled}
				/>
			</div>
		{/if}
	</div>
{/snippet}


<div class={compact ? "space-y-2" : "space-y-4"}>
	{#if selectable && availableSettings.length > 0}
		<Select type="single" value="" onValueChange={addSetting} disabled={disabled}>
			<SelectTrigger class="w-full text-xs">
				{m.device_config_add_setting({}, locale.messageOptions())}
			</SelectTrigger>
			<SelectContent>
				{#each availableSettings as capability (capability.name)}
					<SelectItem value={capability.name}>
						<CapabilityOptionRow
							type={capability.name}
							label={label(capability)}
							unit={capability.unit}
						/>
					</SelectItem>
				{/each}
			</SelectContent>
		</Select>
	{/if}

	{#if visibleSettings.length > 0}
		<div class={compact ? "space-y-2" : "space-y-6"}>
		{#each groups as group (group.section ?? "all")}
			<div class="space-y-3">
			{#if group.section}
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					{sectionTitle(group.section)}
				</p>
			{/if}
			<div class={compact ? "divide-y divide-border rounded-md border border-input" : "space-y-4"}>
			{#each group.capabilities as capability (capability.name)}
				{@render settingRow(capability)}
			{/each}
			</div>
			</div>
		{/each}
		</div>
	{/if}

	{#if selectable && visibleSettings.length === 0}
		<p class="text-[11px] text-muted-foreground">
			{m.device_config_add_one({}, locale.messageOptions())}
		</p>
	{/if}
</div>
