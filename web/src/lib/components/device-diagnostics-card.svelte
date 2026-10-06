<script lang="ts">
	import type { Capability, DeviceAttributeValue, DeviceState } from "$lib/stores/devices";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { diagnosticCapabilities } from "$lib/device-configuration";
	import { historyFieldLabel, identifierLabel } from "$lib/i18n/vocabulary";
	import { formatNumber } from "$lib/i18n/format";
	import { capabilityToExprProperty } from "$lib/components/graph/trigger-expr";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		capabilities: Capability[];
		attributes: DeviceAttributeValue[];
		state: DeviceState | null | undefined;
	}

	let { capabilities, attributes, state }: Props = $props();

	/** Battery and link quality already headline the device information card. */
	const SHOWN_ELSEWHERE = new Set(["battery", "link_quality"]);

	interface Row {
		name: string;
		label: string;
		value: string;
		unit: string;
	}

	function format(value: unknown): string | null {
		if (typeof value === "number") return formatNumber(value, { maximumFractionDigits: 2 });
		if (typeof value === "boolean") {
			return value
				? m.state_on({}, locale.messageOptions())
				: m.state_off({}, locale.messageOptions());
		}
		if (typeof value === "string" && value !== "") return identifierLabel(value);
		return null;
	}

	/**
	 * Diagnostic readings from the generic attribute channel, plus diagnostic
	 * capabilities Hive also models as typed state (such as voltage).
	 */
	const rows = $derived.by((): Row[] => {
		const byCapability = new Map(attributes.map((value) => [value.capability, value]));
		const typed = (state ?? {}) as Record<string, unknown>;
		return diagnosticCapabilities(capabilities).flatMap((capability) => {
			if (SHOWN_ELSEWHERE.has(capability.name)) return [];
			const attribute = byCapability.get(capability.name);
			const raw = attribute
				? (attribute.numberValue ?? attribute.booleanValue ?? attribute.stringValue)
				: typed[capabilityToExprProperty(capability.name)];
			const value = format(raw);
			if (value === null) return [];
			return [
				{
					name: capability.name,
					label: historyFieldLabel(capability.name, capability.label),
					value,
					unit: capability.unit ?? "",
				},
			];
		});
	});
</script>

{#if rows.length > 0}
	<Card>
		<CardHeader>
			<CardTitle>{m.device_diagnostics({}, locale.messageOptions())}</CardTitle>
		</CardHeader>
		<CardContent>
			<dl class="space-y-3">
				{#each rows as row, index (row.name)}
					{#if index > 0}<Separator />{/if}
					<div class="flex items-center justify-between gap-4">
						<dt class="text-sm text-muted-foreground">{row.label}</dt>
						<dd class="text-sm text-foreground tabular-nums">
							{row.value}{#if row.unit}<span class="ml-0.5 text-muted-foreground">{row.unit}</span>{/if}
						</dd>
					</div>
				{/each}
			</dl>
		</CardContent>
	</Card>
{/if}
