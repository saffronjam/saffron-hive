<script lang="ts">
	import EntityCard from "$lib/components/entity-card.svelte";
	import DeviceQuickControls from "$lib/components/device-quick-controls.svelte";
	import { graphql } from "$lib/gql";
	import type { Device } from "$lib/stores/devices";
	import { stateSummary } from "$lib/device-state";
	import { APPLIANCE_TINT_COLOR } from "$lib/device-tint";
	import { formatTemperature } from "$lib/sensor-format";
	import { me } from "$lib/stores/me.svelte";
	import { getContextClient } from "@urql/svelte";
	import { ArrowRight, Thermometer } from "@lucide/svelte";
	import { deviceIcon } from "$lib/utils";

	interface Props {
		device: Device;
		class?: string;
	}

	let { device, class: extraClass = "" }: Props = $props();

	const SET_DEVICE_STATE = graphql(`
		mutation DashboardApplianceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
			setDeviceState(deviceId: $deviceId, state: $state) {
				id
				state {
					on
				}
			}
		}
	`);

	const client = getContextClient();
	const Icon = $derived(deviceIcon(device.type));
	const isClimate = $derived(device.type === "climate");
	const subtitle = $derived(isClimate ? "" : stateSummary(device.state, device.type));
	const isOn = $derived(device.state?.on ?? false);
	const hasOnOff = $derived(device.capabilities.some((c) => c.name === "on_off" || c.name === "state"));
	const currentTemperature = $derived(
		device.state?.temperature == null
			? null
			: formatTemperature(device.state.temperature, me.user?.temperatureUnit ?? "celsius"),
	);
	const targetTemperature = $derived(
		device.state?.targetTemperature == null
			? null
			: formatTemperature(device.state.targetTemperature, me.user?.temperatureUnit ?? "celsius"),
	);

	function handleToggle() {
		if (!hasOnOff || !device.available) return;
		void client
			.mutation(SET_DEVICE_STATE, { deviceId: device.id, state: { on: !isOn } })
			.toPromise();
	}
</script>

<EntityCard
	entity={device}
	fallbackIcon={Icon}
	{subtitle}
	tintColors={isOn ? [APPLIANCE_TINT_COLOR] : null}
	tintStrength={1}
	tintInactive={!isOn}
	readOnly
	size="sm"
	onclick={handleToggle}
	class={extraClass}
>
	{#snippet subtitleTrailing()}
		{#if isClimate}
			{#if device.state?.on === false}
				<span>Off</span>
			{:else if currentTemperature && targetTemperature}
				<span class="inline-flex items-center gap-1 tabular-nums">
					<Thermometer class="size-3.5" />
					<span>{currentTemperature.value}{currentTemperature.unit}</span>
					<ArrowRight class="size-3" />
					<span>{targetTemperature.value}{targetTemperature.unit}</span>
				</span>
			{:else if currentTemperature}
				<span class="inline-flex items-center gap-1 tabular-nums">
					<Thermometer class="size-3.5" />
					<span>{currentTemperature.value}{currentTemperature.unit}</span>
				</span>
			{:else if targetTemperature}
				<span class="inline-flex items-center gap-1 tabular-nums">
					<Thermometer class="size-3.5" />
					<ArrowRight class="size-3" />
					<span>{targetTemperature.value}{targetTemperature.unit}</span>
				</span>
			{:else if device.state?.on}
				<span>On</span>
			{:else}
				<span>No data</span>
			{/if}
		{/if}
	{/snippet}

	{#snippet leadingActions()}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span onclick={(e: MouseEvent) => e.stopPropagation()}>
			<DeviceQuickControls {device} showOnOff={false} />
		</span>
	{/snippet}
</EntityCard>
