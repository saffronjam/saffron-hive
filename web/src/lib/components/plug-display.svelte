<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Plug } from "@lucide/svelte";
	import type { DeviceState } from "$lib/stores/devices";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { formatMeasurement } from "$lib/i18n/format";

	interface Props {
		state: DeviceState;
		oncommand: (state: { on: boolean }) => void;
	}

	let { state, oncommand }: Props = $props();

	function toggle(next: boolean) {
		oncommand({ on: next });
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>{m.plug_status({}, locale.messageOptions())}</CardTitle>
	</CardHeader>
	<CardContent>
		<div class="flex items-center gap-4">
			<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
				<Plug class="size-6 text-muted-foreground" />
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex items-center justify-between gap-4">
					<span class="text-sm text-muted-foreground">
						{m.device_power({}, locale.messageOptions())}
					</span>
					<Switch
						checked={state.on === true}
						onCheckedChange={toggle}
						aria-label={m.plug_toggle({}, locale.messageOptions())}
					/>
				</div>
				{#if state.power != null || state.voltage != null || state.current != null || state.energy != null}
					<dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
						{#if state.power != null}
							<dt>{m.device_power({}, locale.messageOptions())}</dt>
							<dd class="text-right text-foreground">
								{formatMeasurement(state.power, "W", {
									minimumFractionDigits: 1,
									maximumFractionDigits: 1,
								})}
							</dd>
						{/if}
						{#if state.voltage != null}
							<dt>{m.plug_voltage({}, locale.messageOptions())}</dt>
							<dd class="text-right text-foreground">
								{formatMeasurement(state.voltage, "V", {
									minimumFractionDigits: 1,
									maximumFractionDigits: 1,
								})}
							</dd>
						{/if}
						{#if state.current != null}
							<dt>{m.plug_current({}, locale.messageOptions())}</dt>
							<dd class="text-right text-foreground">
								{formatMeasurement(state.current, "A", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</dd>
						{/if}
						{#if state.energy != null}
							<dt>{m.plug_energy({}, locale.messageOptions())}</dt>
							<dd class="text-right text-foreground">
								{formatMeasurement(state.energy, "kWh", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</dd>
						{/if}
					</dl>
				{/if}
			</div>
		</div>
	</CardContent>
</Card>
