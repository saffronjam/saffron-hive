<script lang="ts">
	import EntityCard from "$lib/components/entity-card.svelte";
	import DeviceQuickControls from "$lib/components/device-quick-controls.svelte";
	import { graphql } from "$lib/gql";
	import type { Device } from "$lib/stores/devices";
	import { APPLIANCE_TINT_COLOR } from "$lib/device-tint";
	import { getContextClient } from "@urql/svelte";
	import { deviceIcon, deviceDisplayName } from "$lib/utils";
	import { haptics } from "$lib/stores/haptics.svelte";

	interface Props {
		device: Device;
		class?: string;
	}

	let { device, class: extraClass = "" }: Props = $props();

	const SET_DEVICE_STATE = graphql(`
		mutation DashboardApplianceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
			setTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)
		}
	`);

	const client = getContextClient();
	const Icon = $derived(deviceIcon(device.type));
	const isOn = $derived(device.state?.on ?? false);
	const hasOnOff = $derived(device.capabilities.some((c) => c.name === "on_off" || c.name === "state"));

	function handleToggle(_entity: { id: string }, event: MouseEvent | KeyboardEvent) {
		if (!hasOnOff || !device.available) return;
		haptics.play("selection", event);
		void client
			.mutation(SET_DEVICE_STATE, { deviceId: device.id, state: { on: !isOn } })
			.toPromise();
	}
</script>

<EntityCard
	entity={{ id: device.id, name: deviceDisplayName(device), icon: device.icon ?? null }}
	fallbackIcon={Icon}
	tintColors={[APPLIANCE_TINT_COLOR]}
	tintStrength={1}
	tintInactive={!isOn}
	readOnly
	size="sm"
	pressFeedback
	onclick={handleToggle}
	class={extraClass}
>
	{#snippet leadingActions()}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span onclick={(e: MouseEvent) => e.stopPropagation()}>
			<DeviceQuickControls {device} showOnOff={false} />
		</span>
	{/snippet}
</EntityCard>
