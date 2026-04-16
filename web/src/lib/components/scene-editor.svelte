<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import ColorPicker from "$lib/components/color-picker.svelte";
	import { Lightbulb, Group, Package, Trash2 } from "@lucide/svelte";
	import type { Device } from "$lib/stores/devices";

	interface TargetInfo {
		id: string;
		name: string;
		type: "device" | "group";
		deviceType?: string;
	}

	interface ActionPayload {
		on?: boolean;
		brightness?: number;
		colorTemp?: number;
		color?: { r: number; g: number; b: number; x: number; y: number };
	}

	interface EditableAction {
		targetType: string;
		targetId: string;
		target: TargetInfo;
		payload: ActionPayload;
	}

	interface Props {
		actions: EditableAction[];
		onupdate: (index: number, payload: ActionPayload) => void;
		onremove: (index: number) => void;
	}

	let { actions, onupdate, onremove }: Props = $props();

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

	function targetIcon(target: TargetInfo): typeof Lightbulb {
		if (target.type === "group") return Group;
		switch (target.deviceType) {
			case "light":
				return Lightbulb;
			default:
				return Package;
		}
	}

	function brightnessPercent(val: number): string {
		return `${Math.round((val / 254) * 100)}%`;
	}
</script>

{#if actions.length === 0}
	<p class="py-6 text-center text-sm text-muted-foreground">
		No targets added yet. Click "Add target" to build this scene.
	</p>
{:else}
	<div class="space-y-4">
		{#each actions as action, index (action.targetId + "-" + index)}
			{@const Icon = targetIcon(action.target)}
			<div class="rounded-lg shadow-card bg-card p-4">
				<div class="mb-3 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Icon class="size-4 text-muted-foreground" />
						<span class="text-sm font-medium text-foreground">{action.target.name}</span>
						<Badge variant={action.target.type === "group" ? "outline" : "secondary"} class="text-xs">
							{action.target.type === "group" ? "group" : action.target.deviceType ?? "device"}
						</Badge>
					</div>
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={() => onremove(index)}
						aria-label="Remove target"
					>
						<Trash2 class="size-4" />
					</Button>
				</div>

				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Power</span>
						<Switch
							checked={action.payload.on ?? false}
							onCheckedChange={(checked) => {
								onupdate(index, { ...action.payload, on: checked });
							}}
						/>
					</div>

					<div>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Brightness</span>
							<span class="text-xs tabular-nums text-muted-foreground">
								{brightnessPercent(action.payload.brightness ?? 127)}
							</span>
						</div>
						<Slider
							type="single"
							value={action.payload.brightness ?? 127}
							min={0}
							max={254}
							step={1}
							onValueChange={(val) => {
								onupdate(index, { ...action.payload, brightness: val });
							}}
						/>
					</div>

					<div>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Color Temperature</span>
							<span class="text-xs tabular-nums text-muted-foreground">
								{action.payload.colorTemp ?? 250} mireds
							</span>
						</div>
						<Slider
							type="single"
							value={action.payload.colorTemp ?? 250}
							min={150}
							max={500}
							step={1}
							onValueChange={(val) => {
								onupdate(index, { ...action.payload, colorTemp: val });
							}}
						/>
					</div>

					<div>
						<span class="mb-1 block text-sm text-muted-foreground">Color</span>
						<ColorPicker
							r={action.payload.color?.r ?? 255}
							g={action.payload.color?.g ?? 255}
							b={action.payload.color?.b ?? 255}
							onchange={(c) => {
								const xy = rgbToXy(c.r, c.g, c.b);
								onupdate(index, {
									...action.payload,
									color: { r: c.r, g: c.g, b: c.b, x: xy.x, y: xy.y },
								});
							}}
						/>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
