<script lang="ts" generics="G extends { id: string; name: string; icon?: string | null; members: { memberType: string }[] }">
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
	import { groupMemberBreakdown } from "$lib/list-helpers";
	import { Group as GroupIcon, Pencil, Trash2 } from "@lucide/svelte";

	interface Props {
		groups: G[];
		onedit: (group: G) => void;
		ondelete: (group: G) => void;
		onrename: (group: G, newName: string) => void;
		oniconchange: (group: G, icon: string | null) => void;
	}

	let { groups, onedit, ondelete, onrename, oniconchange }: Props = $props();
</script>

<div class="overflow-x-auto rounded-lg shadow-card bg-card">
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead class="w-12"></TableHead>
				<TableHead>Name</TableHead>
				<TableHead>Members</TableHead>
				<TableHead>Breakdown</TableHead>
				<TableHead class="w-24 text-right">Actions</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each groups as group (group.id)}
				<TableRow>
					<TableCell>
						<IconPicker value={group.icon} onselect={(icon) => oniconchange(group, icon)}>
							<button
								type="button"
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
							>
								<DynamicIcon icon={group.icon} class="size-4.5 text-muted-foreground">
									{#snippet fallback()}
										<GroupIcon class="size-4.5 text-muted-foreground" />
									{/snippet}
								</DynamicIcon>
							</button>
						</IconPicker>
					</TableCell>
					<TableCell>
						<InlineEditName
							name={group.name}
							onsave={(newName) => onrename(group, newName)}
						/>
					</TableCell>
					<TableCell class="text-sm text-muted-foreground whitespace-nowrap">
						{group.members.length} member{group.members.length === 1 ? "" : "s"}
					</TableCell>
					<TableCell class="text-sm text-muted-foreground">
						{#if group.members.length === 0}
							<span>—</span>
						{:else}
							{groupMemberBreakdown(group.members)}
						{/if}
					</TableCell>
					<TableCell>
						<div class="flex items-center justify-end gap-1">
							<Tooltip>
								<TooltipTrigger>
									<Button
										variant="ghost"
										size="icon-sm"
										onclick={() => onedit(group)}
										aria-label="Edit group"
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
										onclick={() => ondelete(group)}
										aria-label="Delete group"
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
