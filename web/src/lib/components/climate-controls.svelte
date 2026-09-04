<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { Minus, Plus } from "@lucide/svelte";
	import { hasCapability } from "$lib/target-resolve";
	import type { Capability, DeviceState } from "$lib/stores/devices";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { identifierLabel } from "$lib/i18n/vocabulary";

	interface CommandInput {
		on?: boolean;
		targetTemperature?: number;
		hvacMode?: string;
		fanMode?: string;
		swing?: string;
	}

	interface Props {
		deviceState: DeviceState;
		capabilities: Capability[];
		oncommand: (input: CommandInput) => void;
	}

	let { deviceState, capabilities, oncommand }: Props = $props();

	const tempCap = $derived(capabilities.find((c) => c.name === "target_temperature"));
	const hvacCap = $derived(capabilities.find((c) => c.name === "hvac_mode"));
	const fanCap = $derived(capabilities.find((c) => c.name === "fan_mode"));

	const showTemp = $derived(hasCapability(capabilities, "target_temperature"));
	const showHvac = $derived(hasCapability(capabilities, "hvac_mode"));
	const showFan = $derived(hasCapability(capabilities, "fan_mode"));
	const showSwing = $derived(hasCapability(capabilities, "swing"));

	const tempMin = $derived(tempCap?.valueMin ?? 16);
	const tempMax = $derived(tempCap?.valueMax ?? 30);
	const tempUnit = $derived(tempCap?.unit || "°C");

	const hvacModes = $derived(hvacCap?.values ?? []);
	// Fan enum is often not exposed by the cloud; fall back to common values and
	// always include the current value so it stays selectable.
	const fanModes = $derived.by(() => {
		const base = fanCap?.values && fanCap.values.length > 0 ? fanCap.values : ["low", "mid", "high", "auto"];
		const cur = deviceState.fanMode;
		return cur && !base.includes(cur) ? [cur, ...base] : base;
	});

	const target = $derived(deviceState.targetTemperature ?? tempMin);

	let tempTimer: ReturnType<typeof setTimeout> | null = $state(null);

	function commitTemp(v: number) {
		const clamped = Math.min(tempMax, Math.max(tempMin, v));
		if (tempTimer) clearTimeout(tempTimer);
		tempTimer = setTimeout(() => {
			tempTimer = null;
			oncommand({ targetTemperature: clamped });
		}, 300);
	}
</script>

<div class="space-y-4">
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<CardTitle>{m.device_power({}, locale.messageOptions())}</CardTitle>
				<Switch checked={deviceState.on ?? false} onCheckedChange={(c) => oncommand({ on: c })} />
			</div>
		</CardHeader>
	</Card>

	{#if showTemp}
		<Card>
			<CardHeader>
				<CardTitle>{m.device_target_temperature({}, locale.messageOptions())}</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="flex items-center justify-between">
					<Button
						variant="outline"
						size="icon"
						onclick={() => commitTemp(target - 1)}
						aria-label={m.device_temperature_lower({}, locale.messageOptions())}
					>
						<Minus class="size-4" />
					</Button>
					<span class="text-2xl font-medium tabular-nums">{target}{tempUnit}</span>
					<Button
						variant="outline"
						size="icon"
						onclick={() => commitTemp(target + 1)}
						aria-label={m.device_temperature_raise({}, locale.messageOptions())}
					>
						<Plus class="size-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	{/if}

	{#if showHvac && hvacModes.length > 0}
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between gap-4">
					<CardTitle>{m.device_mode({}, locale.messageOptions())}</CardTitle>
					<Select type="single" value={deviceState.hvacMode ?? ""} onValueChange={(v) => oncommand({ hvacMode: v })}>
						<SelectTrigger class="w-40 text-sm">
							{deviceState.hvacMode
								? identifierLabel(deviceState.hvacMode)
								: m.device_select_mode({}, locale.messageOptions())}
						</SelectTrigger>
						<SelectContent>
							{#each hvacModes as m (m)}
								<SelectItem value={m}>{identifierLabel(m)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
		</Card>
	{/if}

	{#if showFan}
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between gap-4">
					<CardTitle>{m.device_fan({}, locale.messageOptions())}</CardTitle>
					<Select type="single" value={deviceState.fanMode ?? ""} onValueChange={(v) => oncommand({ fanMode: v })}>
						<SelectTrigger class="w-40 text-sm">
							{deviceState.fanMode
								? identifierLabel(deviceState.fanMode)
								: m.device_select_speed({}, locale.messageOptions())}
						</SelectTrigger>
						<SelectContent>
							{#each fanModes as f (f)}
								<SelectItem value={f}>{identifierLabel(f)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
		</Card>
	{/if}

	{#if showSwing}
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>{m.device_swing({}, locale.messageOptions())}</CardTitle>
					<Switch
						checked={deviceState.swing === "on"}
						onCheckedChange={(c) => oncommand({ swing: c ? "on" : "off" })}
					/>
				</div>
			</CardHeader>
		</Card>
	{/if}
</div>
