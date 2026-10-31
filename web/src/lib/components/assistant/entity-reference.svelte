<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { DoorOpen, Group, Lightbulb, Clapperboard, Workflow, Sparkles, Play, Square } from "@lucide/svelte";
	import type { AssistantEntityReference } from "$lib/assistant-entities";
	import EntityCard from "$lib/components/entity-card.svelte";
	import DeviceQuickControls from "$lib/components/device-quick-controls.svelte";
	import BulkBrightnessSlider from "$lib/components/bulk-brightness-slider.svelte";
	import EffectRunTargetDrawer from "$lib/components/effect-run-target-drawer.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Switch } from "$lib/components/ui/switch";
	import { deviceStore, isRuntimeEnabledDevice, isLightControlDevice } from "$lib/stores/devices";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { scenesStore } from "$lib/stores/scenes.svelte";
	import { automationsStore } from "$lib/stores/automations.svelte";
	import { effectsStore } from "$lib/stores/effects.svelte";
	import { me } from "$lib/stores/me.svelte";
	import { resolveTargetDevices } from "$lib/target-resolve";
	import { commitGroupToggle, commitGroupBrightness } from "$lib/group-commands";
	import { aggregateSensorReadings, aggregateLightAppearance } from "$lib/device-tint";
	import { controlIntents } from "$lib/stores/control-intents.svelte";
	import { deviceIcon, deviceDisplayName, entityDisplayName, groupDisplayName } from "$lib/utils";
	import { EffectKind } from "$lib/gql/graphql";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	let { reference, label }: { reference: AssistantEntityReference; label: string } = $props();
	const client = getContextClient();
	const options = $derived(locale.messageOptions());
	const device = $derived(reference.kind === "device" ? $deviceStore[reference.id] : undefined);
	const room = $derived(reference.kind === "room" ? roomsStore.byId.get(reference.id) : undefined);
	const group = $derived(reference.kind === "group" ? groupsStore.byId.get(reference.id) : undefined);
	const scene = $derived(reference.kind === "scene" ? scenesStore.byId.get(reference.id) : undefined);
	const automation = $derived(reference.kind === "automation" ? automationsStore.byId.get(reference.id) : undefined);
	const effect = $derived(reference.kind === "effect" ? effectsStore.byId.get(reference.id) : undefined);
	const entity = $derived(device ?? room ?? group ?? scene ?? automation ?? effect);
	const displayName = $derived(device ? deviceDisplayName(device) : group ? groupDisplayName(group) : entity ? entityDisplayName(reference.kind, entity) : label);
	const fallbackIcon = $derived(device ? deviceIcon(device.type, device.roles.contact) : room ? DoorOpen : group ? Group : scene ? Clapperboard : automation ? Workflow : effect ? Sparkles : Lightbulb);
	const devices = $derived(device ? [device] : room || group ? resolveTargetDevices({ type: reference.kind as "room" | "group", id: reference.id }, Object.values($deviceStore), groupsStore.items, roomsStore.items) : []);
	const commandable = $derived(devices.filter(isRuntimeEnabledDevice));
	const lights = $derived(commandable.filter(isLightControlDevice));
	const readings = $derived(aggregateSensorReadings(devices, me.user?.temperatureUnit ?? "celsius", { includeGeneralContact: true }));
	const appearance = $derived(aggregateLightAppearance(controlIntents.devices(commandable)));
	const hasBrightness = $derived(commandable.some(d => d.type === "light" && d.state?.brightness != null));
	const subtitle = $derived(device ? device.deleted ? m.field_deleted({}, options) : device.disabled ? m.field_disabled({}, options) : !device.available ? m.devices_offline({}, options) : device.state?.on != null ? device.state.on ? m.state_on({}, options) : m.state_off({}, options) : m.state_available({}, options) : automation ? automation.enabled ? m.field_enabled({}, options) : m.field_disabled({}, options) : scene ? scene.activatedAt ? m.state_active({}, options) : m.state_inactive({}, options) : room ? m.nav_rooms({}, options) : group ? m.nav_groups({}, options) : m.nav_effects({}, options));
	let busy = $state(false);
	let error = $state("");
	let runOpen = $state(false);
	async function perform(action: () => Promise<unknown>, lock = true) {
		if (lock && busy) return;
		if (lock) busy = true;
		error = "";
		try { await action(); }
		catch (e) { error = graphqlErrorMessage(e, m.assistant_error({}, options)); }
		finally { if (lock) busy = false; }
	}
</script>

<div class="min-w-0 max-w-lg leading-normal" data-entity-kind={reference.kind} data-entity-id={reference.id}>
	{#if entity}
		<EntityCard {entity} entityType={reference.kind} {fallbackIcon} nameHref={reference.href} {subtitle} readOnly size="sm" iconAreaSize="sm" tintColors={appearance.colors} tintStrength={appearance.tintStrength}>
			{#snippet leadingActions()}
				{#if device && isRuntimeEnabledDevice(device)}
					<DeviceQuickControls {device} />
				{:else if (room || group) && lights.length}
					<Switch checked={controlIntents.devices(lights).some(d => d.state?.on)} disabled={busy} aria-label={m.device_toggle_named({ name: displayName }, options)} onCheckedChange={on => void perform(() => commitGroupToggle(client, commandable, on))} />
				{:else if scene}
					<Button variant="ghost" size="icon-sm" disabled={busy} aria-label={scene.activatedAt ? m.scene_action_stop({}, options) : m.scene_action_apply({}, options)} onclick={() => void perform(() => scene.activatedAt ? scenesStore.deactivate(client, scene.id) : scenesStore.apply(client, scene.id))}>
						{#if scene.activatedAt}<Square class="size-4" />{:else}<Play class="size-4" />{/if}
					</Button>
				{:else if automation}
					<Switch checked={automation.enabled} disabled={busy} aria-label={m.device_toggle_named({ name: displayName }, options)} onCheckedChange={on => void perform(() => automationsStore.toggle(client, automation.id, on))} />
				{:else if effect}
					<Button variant="ghost" size="icon-sm" aria-label={m.effects_run({}, options)} onclick={() => runOpen = true}><Play class="size-4" /></Button>
				{/if}
			{/snippet}
			{#snippet footer()}
				{#if readings.length || hasBrightness}
					<div class="space-y-3 pt-3">
						{#if readings.length}<div class="flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-muted-foreground">{#each readings as reading (reading.label)}<span class="flex items-center gap-1" title={reading.label}><reading.icon class="size-3.5" />{reading.value} {reading.unit}</span>{/each}</div>{/if}
						{#if hasBrightness}<BulkBrightnessSlider devices={commandable} disabled={busy || (device && !device.available)} onbrightness={brightness => void perform(() => commitGroupBrightness(client, commandable, brightness), false)} />{/if}
					</div>
				{/if}
			{/snippet}
		</EntityCard>
	{:else}
		<a href={reference.href} class="text-primary hover:underline">{label}</a>
	{/if}
	{#if error}<p class="mt-2 text-sm text-destructive" role="alert">{error}</p>{/if}
</div>
{#if effect && runOpen}
	{#if effect.kind === EffectKind.Native && effect.nativeName}
		<EffectRunTargetDrawer open mode="native" nativeName={effect.nativeName} requiredCapabilities={effect.requiredCapabilities} onclose={() => runOpen = false} />
	{:else}
		<EffectRunTargetDrawer open mode="timeline" effectId={effect.id} requiredCapabilities={effect.requiredCapabilities} onclose={() => runOpen = false} />
	{/if}
{/if}
