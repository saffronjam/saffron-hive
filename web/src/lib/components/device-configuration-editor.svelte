<script lang="ts">
	import type { Capability, DeviceConfigurationEntry } from "$lib/stores/devices";
	import {
		configurationEntry,
		writableConfigurationCapabilities,
	} from "$lib/device-configuration";
	import { sentenceCase } from "$lib/utils";
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

	interface Props {
		capabilities: Capability[];
		values: DeviceConfigurationEntry[];
		defaults?: DeviceConfigurationEntry[];
		onchange: (values: DeviceConfigurationEntry[]) => void;
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
	const availableSettings = $derived(
		settings.filter((capability) => !selectedNames.has(capability.name)),
	);

	function existing(capability: Capability): DeviceConfigurationEntry | undefined {
		return values.find((value) => value.capability === capability.name);
	}

	function displayValue(capability: Capability): DeviceConfigurationEntry {
		return configurationEntry(capability, existing(capability));
	}

	function replace(next: DeviceConfigurationEntry) {
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
		return capability.label || sentenceCase(capability.name);
	}
</script>

<div class={compact ? "space-y-2" : "space-y-4"}>
	{#if selectable && availableSettings.length > 0}
		<Select type="single" value="" onValueChange={addSetting} disabled={disabled}>
			<SelectTrigger class="w-full text-xs">Add setting</SelectTrigger>
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
		<div class={compact ? "divide-y divide-border rounded-md border border-input" : "space-y-4"}>
		{#each visibleSettings as capability (capability.name)}
			{@const current = displayValue(capability)}
			<div class={compact ? "px-2 py-1" : "space-y-1.5"}>
			<div class="flex items-center justify-between gap-3">
				<div class="flex min-w-0 items-center gap-1.5">
					<p class={compact ? "text-xs font-medium" : "text-sm font-medium"}>{label(capability)}</p>
					{#if !compact && capability.description}
						<Tooltip>
							<TooltipTrigger
								class="shrink-0 text-muted-foreground"
								aria-label={`About ${label(capability)}`}
							>
								<Info class="size-3.5" />
							</TooltipTrigger>
							<TooltipContent>{capability.description}</TooltipContent>
						</Tooltip>
					{/if}
				</div>
				<div class="flex shrink-0 items-center gap-1.5">
					{#if capability.type === "binary"}
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
							<SelectTrigger class={compact ? "h-8 w-28 text-xs" : "w-40"}>
								{current.stringValue ? sentenceCase(current.stringValue) : "Select"}
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
							aria-label={`Remove ${label(capability)}`}
						>
							<X class="size-3.5" />
						</Button>
					{/if}
				</div>
			</div>
			</div>
		{/each}
		</div>
	{/if}

	{#if selectable && visibleSettings.length === 0}
		<p class="text-[11px] text-muted-foreground">Add at least one setting.</p>
	{/if}
</div>
