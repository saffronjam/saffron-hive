<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu/index.js";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import { Clapperboard, EllipsisVertical, Pencil, Play, Trash2 } from "@lucide/svelte";

	interface SceneAction {
		id: string;
		targetType: string;
		targetId: string;
		payload: string;
	}

	interface SceneData {
		id: string;
		name: string;
		icon?: string | null;
		actions: SceneAction[];
	}

	interface Props {
		scene: SceneData;
		applying: boolean;
		onapply: (scene: SceneData) => void;
		onedit: (scene: SceneData) => void;
		ondelete: (scene: SceneData) => void;
		onrename: (scene: SceneData, newName: string) => void;
		oniconchange: (scene: SceneData, icon: string | null) => void;
	}

	let { scene, applying, onapply, onedit, ondelete, onrename, oniconchange }: Props = $props();

	const noTargets = $derived(scene.actions.length === 0);
	const deviceCount = $derived(scene.actions.filter((a) => a.targetType === "device").length);
	const groupCount = $derived(scene.actions.filter((a) => a.targetType === "group").length);

	function targetSummary(dc: number, gc: number): string {
		const parts: string[] = [];
		if (dc > 0) parts.push(`${dc} device${dc === 1 ? "" : "s"}`);
		if (gc > 0) parts.push(`${gc} group${gc === 1 ? "" : "s"}`);
		if (parts.length === 0) return "No targets";
		return parts.join(", ");
	}
</script>

<div class="rounded-lg shadow-card bg-card p-4">
	<div class="flex items-center justify-between">
		<div class="flex flex-1 min-w-0 items-center gap-3">
			<IconPicker value={scene.icon} onselect={(icon) => oniconchange(scene, icon)}>
				<button type="button" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors">
					<AnimatedIcon icon={scene.icon} class="size-5 text-muted-foreground">
						{#snippet fallback()}<Clapperboard class="size-5 text-muted-foreground" />{/snippet}
					</AnimatedIcon>
				</button>
			</IconPicker>
			<div class="min-w-0 flex-1">
				<InlineEditName name={scene.name} onsave={(newName) => onrename(scene, newName)} />
				<p class="text-xs text-muted-foreground">
					{scene.actions.length} target{scene.actions.length === 1 ? "" : "s"}
					{#if scene.actions.length > 0}
						&middot; {targetSummary(deviceCount, groupCount)}
					{/if}
				</p>
			</div>
		</div>

		<div class="flex items-center gap-1">
			<Tooltip>
				<TooltipTrigger>
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={() => onapply(scene)}
						disabled={applying || noTargets}
						aria-label="Apply scene"
					>
						<Play class="size-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					{#if noTargets}
						Add a target to activate scene
					{:else if applying}
						Applying...
					{:else}
						Apply scene
					{/if}
				</TooltipContent>
			</Tooltip>
			<DropdownMenu>
				<DropdownMenuTrigger>
					<Button variant="ghost" size="icon-sm" aria-label="Scene actions">
						<EllipsisVertical class="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onclick={() => onedit(scene)}>
						<Pencil class="size-4" />
						Edit
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem variant="destructive" onclick={() => ondelete(scene)}>
						<Trash2 class="size-4" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	</div>
</div>
