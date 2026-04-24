<script lang="ts">
	import { slide } from "svelte/transition";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import HiveIcon from "$lib/components/hive-icon.svelte";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import { ChevronDown, ChevronRight, Eye, Palette, Pencil, Plus, Trash2 } from "@lucide/svelte";
	import { deviceSceneCapabilities, isSceneTarget, type Device, type DeviceState } from "$lib/stores/devices";
	import {
		defaultScenePayload,
		type ActionPayload,
		type DevicePayloadMap,
		type EditableTarget,
	} from "$lib/scene-editable";
	import { resolveTargetDevices, type GroupLite, type RoomLite } from "$lib/target-resolve";

	interface Props {
		targets: EditableTarget[];
		payloadsByDevice: DevicePayloadMap;
		devicesById: Map<string, Device>;
		groupsLite: GroupLite[];
		roomsLite: RoomLite[];
		onupdatedevicepayload: (deviceId: string, payload: ActionPayload) => void;
		onsendcommand: (deviceId: string, payload: ActionPayload) => void;
		onremovetarget: (index: number) => void;
		onaddtarget: () => void;
	}

	let {
		targets,
		payloadsByDevice,
		devicesById,
		groupsLite,
		roomsLite,
		onupdatedevicepayload,
		onsendcommand,
		onremovetarget,
		onaddtarget,
	}: Props = $props();

	let mode = $state<"edit" | "live">("edit");
	let expanded = $state<Set<string>>(new Set());

	const allDevices = $derived(Array.from(devicesById.values()));

	interface TreeNode {
		key: string;
		target: EditableTarget;
		targetIndex: number;
		devices: Device[];
		expandable: boolean;
	}

	const tree = $derived.by<TreeNode[]>(() => {
		return targets.map((t, index) => {
			const resolved = resolveTargetDevices({ type: t.type, id: t.id }, allDevices, groupsLite, roomsLite);
			const devices = resolved.filter(isSceneTarget);
			return {
				key: `${t.type}:${t.id}:${index}`,
				target: t,
				targetIndex: index,
				devices,
				expandable: t.type !== "device",
			};
		});
	});

	const reachableDevices = $derived.by<Device[]>(() => {
		const seen = new Set<string>();
		const result: Device[] = [];
		for (const node of tree) {
			for (const d of node.devices) {
				if (!seen.has(d.id)) {
					seen.add(d.id);
					result.push(d);
				}
			}
		}
		return result;
	});

	function toggleExpanded(key: string) {
		const next = new Set(expanded);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		expanded = next;
	}

	function isExpanded(key: string): boolean {
		return expanded.has(key);
	}

	function payloadFor(device: Device): ActionPayload {
		return payloadsByDevice.get(device.id) ?? defaultScenePayload(device);
	}

	function liveValueFor(device: Device): ActionPayload {
		const s = device.state;
		return {
			on: s?.on ?? undefined,
			brightness: s?.brightness ?? undefined,
			colorTemp: s?.colorTemp ?? undefined,
			color: s?.color ?? undefined,
		};
	}

	function displayValueFor(device: Device): ActionPayload {
		return mode === "live" ? liveValueFor(device) : payloadFor(device);
	}

	function rgbToXy(r: number, g: number, b: number): { x: number; y: number } {
		let rn = r / 255;
		let gn = g / 255;
		let bn = b / 255;
		rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
		gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
		bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;
		const X = rn * 0.4124 + gn * 0.3576 + bn * 0.1805;
		const Y = rn * 0.2126 + gn * 0.7152 + bn * 0.0722;
		const Z = rn * 0.0193 + gn * 0.1192 + bn * 0.9505;
		const sum = X + Y + Z;
		if (sum === 0) return { x: 0, y: 0 };
		return {
			x: Math.round((X / sum) * 10000) / 10000,
			y: Math.round((Y / sum) * 10000) / 10000,
		};
	}

	function colorsEqual(
		a: ActionPayload["color"] | null | undefined,
		b: ActionPayload["color"] | null | undefined,
	): boolean {
		if (a == null && b == null) return true;
		if (a == null || b == null) return false;
		return a.r === b.r && a.g === b.g && a.b === b.b;
	}

	function mergePayload(base: ActionPayload, patch: Partial<ActionPayload>): ActionPayload {
		const next: ActionPayload = { ...base, ...patch };
		if (patch.color !== undefined) delete next.colorTemp;
		if (patch.colorTemp !== undefined) delete next.color;
		return next;
	}

	function applyChange(device: Device, patch: Partial<ActionPayload>) {
		if (mode === "live") {
			onsendcommand(device.id, mergePayload(liveValueFor(device), patch));
		} else {
			onupdatedevicepayload(device.id, mergePayload(payloadFor(device), patch));
		}
	}

	function setDeviceOn(device: Device, on: boolean) {
		applyChange(device, { on });
	}

	$effect(() => {
		if (mode !== "live") return;
		for (const device of reachableDevices) {
			const state = device.state;
			if (!state) continue;
			const current = payloadFor(device);
			const next: ActionPayload = {
				...current,
				on: state.on ?? current.on,
				brightness: state.brightness ?? current.brightness,
				colorTemp: state.colorTemp ?? current.colorTemp,
				color: state.color ?? current.color,
			};
			if (
				next.on === current.on &&
				next.brightness === current.brightness &&
				next.colorTemp === current.colorTemp &&
				colorsEqual(next.color, current.color)
			)
				continue;
			onupdatedevicepayload(device.id, next);
		}
	});

	function brightnessPercent(state: DeviceState | null | undefined): string {
		if (!state || state.brightness == null) return "";
		return `${Math.round((state.brightness / 254) * 100)}%`;
	}

	function colorCss(color: { r: number; g: number; b: number } | null | undefined): string | null {
		if (!color) return null;
		return `rgb(${color.r}, ${color.g}, ${color.b})`;
	}

	function miredToRgb(mireds: number): { r: number; g: number; b: number } {
		const temp = 10000 / mireds;
		let r: number;
		let g: number;
		let b: number;
		if (temp <= 66) {
			r = 255;
			g = 99.4708025861 * Math.log(temp) - 161.1195681661;
			b = temp <= 19 ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
		} else {
			r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
			g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
			b = 255;
		}
		const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
		return { r: clamp(r), g: clamp(g), b: clamp(b) };
	}

	function previewColorCss(
		payload: ActionPayload,
		caps: { hasColor: boolean; hasColorTemp: boolean },
	): string | null {
		if (caps.hasColor && payload.color) return colorCss(payload.color);
		if (caps.hasColorTemp && payload.colorTemp != null) return colorCss(miredToRgb(payload.colorTemp));
		return null;
	}
</script>

{#snippet adjustTrigger(device: Device, caps: { hasColor: boolean; hasColorTemp: boolean; hasBrightness: boolean })}
	{@const p = displayValueFor(device)}
	{@const hasDot = caps.hasColor || caps.hasColorTemp}
	{@const dotCss = hasDot ? previewColorCss(p, caps) : null}
	<Popover>
		<PopoverTrigger>
			<Button variant="ghost" size="icon-sm" aria-label={`Adjust ${device.name}`}>
				{#if hasDot}
					<div
						class="h-4 w-4 rounded-full border border-border transition-colors duration-200"
						style:background-color={dotCss ?? "transparent"}
					></div>
				{:else}
					<Palette class="size-4" />
				{/if}
			</Button>
		</PopoverTrigger>
		<PopoverContent class="w-72 space-y-4 p-3" align="end">
			<LightColorPicker
				color={p.color ?? null}
				colorTemp={p.colorTemp ?? null}
				brightness={p.brightness ?? null}
				hasColor={caps.hasColor}
				hasColorTemp={caps.hasColorTemp}
				hasBrightness={caps.hasBrightness}
				oncolorchange={(c) => {
					const xy = rgbToXy(c.r, c.g, c.b);
					applyChange(device, { color: { r: c.r, g: c.g, b: c.b, x: xy.x, y: xy.y } });
				}}
				ontempchange={(t) => applyChange(device, { colorTemp: t })}
				onbrightnesschange={(v) => applyChange(device, { brightness: v })}
			/>
		</PopoverContent>
	</Popover>
{/snippet}

{#snippet liveIndicators(device: Device)}
	{@const state = device.state}
	{#if state?.on != null}
		<span class="flex items-center gap-1.5 text-xs text-muted-foreground">
			<span
				class="h-2 w-2 rounded-full {state.on ? 'bg-status-online' : 'bg-muted-foreground/50'}"
			></span>
			{state.on ? "On" : "Off"}
		</span>
	{:else}
		<Badge variant="outline" class="text-xs">
			{device.available ? "Online" : "Offline"}
		</Badge>
	{/if}
	{#if state?.brightness != null}
		<Badge variant="secondary" class="text-xs">{brightnessPercent(state)}</Badge>
	{/if}
{/snippet}

<div class="flex flex-col gap-3 rounded-lg shadow-card bg-card p-3">
	<div class="flex items-center justify-between gap-2">
		<h2 class="text-sm font-medium text-foreground">Targets</h2>
		<div class="flex items-center gap-2">
			<div class="flex items-center rounded-md border border-border dark:border-input">
				<Button
					variant={mode === "edit" ? "secondary" : "ghost"}
					size="sm"
					class="rounded-r-none border-0"
					onclick={() => (mode = "edit")}
					aria-pressed={mode === "edit"}
				>
					<Pencil class="size-3.5" />
					<span class="hidden sm:inline">Edit</span>
				</Button>
				<Button
					variant={mode === "live" ? "secondary" : "ghost"}
					size="sm"
					class="rounded-l-none border-0"
					onclick={() => (mode = "live")}
					aria-pressed={mode === "live"}
				>
					<Eye class="size-3.5" />
					<span class="hidden sm:inline">Live</span>
				</Button>
			</div>
			<Button variant="outline" size="sm" onclick={onaddtarget}>
				<Plus class="size-3.5" />
				<span class="hidden sm:inline">Add</span>
			</Button>
		</div>
	</div>

	<div>
		{#if tree.length === 0}
			<p class="px-1 py-2 text-sm text-muted-foreground">No targets yet.</p>
		{:else}
			<div class="flex flex-col gap-1">
				{#each tree as node (node.key)}
					{@const isDeviceRow = node.target.type === "device"}
					{@const deviceForRow = isDeviceRow ? devicesById.get(node.target.id) : null}
					{@const rowCaps = deviceForRow ? deviceSceneCapabilities(deviceForRow) : null}
					{@const rowHasRich = rowCaps
						? rowCaps.hasBrightness || rowCaps.hasColor || rowCaps.hasColorTemp
						: false}
					<div class="flex flex-col" transition:slide={{ duration: 200 }}>
						<div
							class="flex items-center gap-1 rounded-md p-2 transition-colors hover:bg-muted/60"
							role="button"
							tabindex={0}
							onclick={() => (isDeviceRow ? undefined : toggleExpanded(node.key))}
							onkeydown={(e) => {
								if ((e.key === "Enter" || e.key === " ") && !isDeviceRow) {
									e.preventDefault();
									toggleExpanded(node.key);
								}
							}}
						>
							{#if node.expandable}
								{#if isExpanded(node.key)}
									<ChevronDown class="size-4 shrink-0 text-muted-foreground" />
								{:else}
									<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
								{/if}
							{:else}
								<span class="w-4 shrink-0"></span>
							{/if}

							{#if isDeviceRow}
								<HiveIcon
									type={node.target.deviceType ?? "device"}
									class="size-4 shrink-0 text-muted-foreground"
								/>
							{:else}
								<HiveIcon
									type={node.target.type}
									iconOverride={node.target.icon}
									class="size-4 shrink-0 text-muted-foreground"
								/>
							{/if}
							<span class="truncate text-sm font-medium">{node.target.name}</span>
							{#if !isDeviceRow}
								<span class="shrink-0 text-xs text-muted-foreground">
									{node.devices.length}
								</span>
							{/if}

							<span class="flex-1"></span>

							<div
								class="flex items-center gap-2"
								onclick={(e) => e.stopPropagation()}
								role="presentation"
							>
								{#if mode === "live" && deviceForRow}
									{@render liveIndicators(deviceForRow)}
								{/if}
								{#if deviceForRow && rowHasRich && rowCaps}
									{@render adjustTrigger(deviceForRow, rowCaps)}
								{/if}
								{#if deviceForRow}
									<Switch
										checked={displayValueFor(deviceForRow).on ?? false}
										onCheckedChange={(c) => setDeviceOn(deviceForRow, c)}
										aria-label={`Toggle ${deviceForRow.name}`}
									/>
								{/if}
								<Button
									variant="ghost"
									size="icon-sm"
									onclick={(e) => {
										e.stopPropagation();
										onremovetarget(node.targetIndex);
									}}
									aria-label="Remove target"
								>
									<Trash2 class="size-4" />
								</Button>
							</div>
						</div>

						{#if node.expandable && isExpanded(node.key)}
							<div class="flex flex-col gap-1 pb-1 pl-6" transition:slide={{ duration: 200 }}>
								{#each node.devices as device (device.id)}
									{@const leafCaps = deviceSceneCapabilities(device)}
									{@const leafHasRich =
										leafCaps.hasBrightness || leafCaps.hasColor || leafCaps.hasColorTemp}
									<div
										class="flex items-center gap-1 rounded-md p-1.5 transition-colors hover:bg-muted/60"
									>
										<HiveIcon type={device.type} class="size-4 shrink-0 text-muted-foreground" />
										<span class="truncate text-sm">{device.name}</span>
										<span class="flex-1"></span>
										<div
											class="flex items-center gap-2"
											onclick={(e) => e.stopPropagation()}
											role="presentation"
										>
											{#if mode === "live"}
												{@render liveIndicators(device)}
											{/if}
											{#if leafHasRich}
												{@render adjustTrigger(device, leafCaps)}
											{/if}
											<Switch
												checked={displayValueFor(device).on ?? false}
												onCheckedChange={(c) => setDeviceOn(device, c)}
												aria-label={`Toggle ${device.name}`}
											/>
										</div>
									</div>
								{/each}
								{#if node.devices.length === 0}
									<p class="px-2 py-1 text-xs text-muted-foreground">
										No devices in this target.
									</p>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
