<script lang="ts">
	import type { Component } from "svelte";
	import EntityCard from "$lib/components/entity-card.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { Lightbulb, Maximize2 } from "@lucide/svelte";
	import {
		groupBaseTintColors,
		brightnessToTintStrength,
	} from "$lib/device-tint";
	import type { Device } from "$lib/stores/devices";
	import { type Client } from "@urql/svelte";
	import { graphql } from "$lib/gql";

	interface Entity {
		id: string;
		name: string;
		icon?: string | null;
	}

	interface Props {
		entity: Entity;
		devices: Device[];
		isGroup: boolean;
		fallbackIcon?: Component;
		client: Client;
	}

	let { entity, devices, isGroup, fallbackIcon, client }: Props = $props();

	const SET_DEVICE_STATE = graphql(`
		mutation DashboardLightCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
			setDeviceState(deviceId: $deviceId, state: $state) {
				id
				state {
					on
					brightness
				}
			}
		}
	`);

	const onOffDevices = $derived(
		devices.filter((d) => d.capabilities.some((c) => c.name === "on_off")),
	);
	const isOn = $derived(onOffDevices.some((d) => d.state?.on));

	const tintColors = $derived(groupBaseTintColors(devices));
	const tintStrength = $derived.by(() => {
		const lit = devices.filter(
			(d) => d.type === "light" && d.state?.on && d.state?.brightness != null,
		);
		if (lit.length === 0) return 0;
		let sum = 0;
		for (const d of lit) sum += d.state!.brightness!;
		return brightnessToTintStrength(sum / lit.length);
	});

	const subtitle = $derived(isOn ? "On" : "Off");

	async function handleToggle() {
		const next = !isOn;
		await Promise.all(
			onOffDevices.map((d) =>
				client.mutation(SET_DEVICE_STATE, { deviceId: d.id, state: { on: next } }).toPromise(),
			),
		);
	}

	let popoverOpen = $state(false);

	async function setMemberState(
		device: Device,
		input: { on?: boolean; brightness?: number },
	) {
		await client.mutation(SET_DEVICE_STATE, { deviceId: device.id, state: input }).toPromise();
	}
</script>

<EntityCard
	{entity}
	fallbackIcon={fallbackIcon ?? Lightbulb}
	{subtitle}
	tintColors={tintColors.length > 0 ? tintColors : null}
	{tintStrength}
	tintInactive={!isOn}
	readOnly
	onclick={handleToggle}
>
	{#snippet leadingActions()}
		{#if isGroup && devices.length > 1}
			<Popover bind:open={popoverOpen}>
				<PopoverTrigger>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={`Show ${entity.name} members`}
						onclick={(e: MouseEvent) => e.stopPropagation()}
					>
						<Maximize2 class="size-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent class="w-80 p-3" align="end">
					<div class="space-y-3">
						{#each devices as d (d.id)}
							{@const hasOnOff = d.capabilities.some((c) => c.name === "on_off")}
							{@const hasBrightness =
								d.type === "light" && d.state?.brightness != null}
							<div class="flex flex-col gap-2 rounded-md bg-muted/30 p-2">
								<div class="flex items-center justify-between gap-2">
									<span class="truncate text-sm font-medium text-foreground">{d.name}</span>
									{#if hasOnOff}
										<Switch
											checked={d.state?.on ?? false}
											onCheckedChange={(checked) =>
												setMemberState(d, { on: checked })}
											aria-label={`Toggle ${d.name}`}
										/>
									{/if}
								</div>
								{#if hasBrightness}
									<Slider
										type="single"
										value={d.state?.brightness ?? 0}
										min={0}
										max={254}
										step={1}
										onValueChange={(val) => {
											const input: { on?: true; brightness: number } = {
												brightness: val,
											};
											if (!d.state?.on) input.on = true;
											setMemberState(d, input);
										}}
										aria-label={`${d.name} brightness`}
									/>
								{/if}
							</div>
						{/each}
					</div>
				</PopoverContent>
			</Popover>
		{/if}
	{/snippet}
</EntityCard>
