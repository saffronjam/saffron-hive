<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from "$lib/components/ui/table/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import DynamicIcon from "$lib/components/icons/dynamic-icon.svelte";
	import { sceneTargetBreakdown } from "$lib/list-helpers";
	import { Clapperboard, Pencil, Play, Trash2 } from "@lucide/svelte";

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
		createdBy?: { id: string; username: string; name: string } | null;
	}

	interface Props {
		scenes: SceneData[];
		applyingId: string | null;
		onapply: (scene: SceneData) => void;
		onedit: (scene: SceneData) => void;
		ondelete: (scene: SceneData) => void;
		onrename: (scene: SceneData, newName: string) => void;
		oniconchange: (scene: SceneData, icon: string | null) => void;
	}

	let {
		scenes,
		applyingId,
		onapply,
		onedit,
		ondelete,
		onrename,
		oniconchange,
	}: Props = $props();
</script>

<div class="overflow-x-auto rounded-lg shadow-card bg-card">
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead class="w-12"></TableHead>
				<TableHead>Name</TableHead>
				<TableHead>Targets</TableHead>
				<TableHead>Breakdown</TableHead>
				<TableHead>Created by</TableHead>
				<TableHead class="w-32 text-right">Actions</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each scenes as scene (scene.id)}
				{@const noTargets = scene.actions.length === 0}
				{@const applying = applyingId === scene.id}
				<TableRow>
					<TableCell>
						<IconPicker value={scene.icon} onselect={(icon) => oniconchange(scene, icon)}>
							<button
								type="button"
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
							>
								<DynamicIcon icon={scene.icon} class="size-4.5 text-muted-foreground">
									{#snippet fallback()}
										<Clapperboard class="size-4.5 text-muted-foreground" />
									{/snippet}
								</DynamicIcon>
							</button>
						</IconPicker>
					</TableCell>
					<TableCell>
						<InlineEditName
							name={scene.name}
							onsave={(newName) => onrename(scene, newName)}
						/>
					</TableCell>
					<TableCell class="text-sm text-muted-foreground whitespace-nowrap">
						{scene.actions.length} target{scene.actions.length === 1 ? "" : "s"}
					</TableCell>
					<TableCell class="text-sm text-muted-foreground">
						{sceneTargetBreakdown(scene.actions)}
					</TableCell>
					<TableCell class="text-sm text-muted-foreground whitespace-nowrap">
						{scene.createdBy?.name ?? "—"}
					</TableCell>
					<TableCell>
						<div class="flex items-center justify-end gap-1">
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
							<Tooltip>
								<TooltipTrigger>
									<Button
										variant="ghost"
										size="icon-sm"
										onclick={() => onedit(scene)}
										aria-label="Edit scene"
									>
										<Pencil class="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Edit</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger>
									<Button
										variant="ghost"
										size="icon-sm"
										onclick={() => ondelete(scene)}
										aria-label="Delete scene"
										class="text-destructive hover:text-destructive"
									>
										<Trash2 class="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Delete</TooltipContent>
							</Tooltip>
						</div>
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
