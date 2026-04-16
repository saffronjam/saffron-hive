<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu/index.js";
	import { Clapperboard, Ellipsis, Pencil, Play, Trash2 } from "@lucide/svelte";

	interface SceneAction {
		id: string;
		targetType: string;
		targetId: string;
		payload: string;
	}

	interface SceneData {
		id: string;
		name: string;
		actions: SceneAction[];
	}

	interface Props {
		scene: SceneData;
		applying: boolean;
		onapply: (scene: SceneData) => void;
		onedit: (scene: SceneData) => void;
		ondelete: (scene: SceneData) => void;
	}

	let { scene, applying, onapply, onedit, ondelete }: Props = $props();

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

<div class="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50">
	<div class="flex items-start justify-between">
		<button
			type="button"
			class="flex flex-1 items-center gap-3 text-left"
			onclick={() => onedit(scene)}
		>
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
				<Clapperboard class="size-5 text-muted-foreground" />
			</div>
			<div class="min-w-0 flex-1">
				<h3 class="truncate font-medium text-card-foreground">{scene.name}</h3>
				<p class="text-xs text-muted-foreground">
					{scene.actions.length} target{scene.actions.length === 1 ? "" : "s"}
					{#if scene.actions.length > 0}
						&middot; {targetSummary(deviceCount, groupCount)}
					{/if}
				</p>
			</div>
		</button>

		<div class="flex items-center gap-1">
			<Button
				variant="outline"
				size="sm"
				onclick={() => onapply(scene)}
				disabled={applying || scene.actions.length === 0}
			>
				<Play class="size-4" />
				<span>{applying ? "Applying..." : "Apply"}</span>
			</Button>

			<DropdownMenu>
				<DropdownMenuTrigger>
					{#snippet child({ props })}
						<Button variant="ghost" size="icon-sm" {...props} aria-label="Scene actions">
							<Ellipsis class="size-4" />
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onclick={() => onedit(scene)}>
						<Pencil class="size-4" />
						<span>Edit</span>
					</DropdownMenuItem>
					<DropdownMenuItem
						class="text-destructive"
						onclick={() => ondelete(scene)}
					>
						<Trash2 class="size-4" />
						<span>Delete</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	</div>
</div>
