<script lang="ts" generics="T extends string">
	import {
		CommandGroup,
		CommandItem,
	} from "$lib/components/ui/command/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import EntitySelector from "$lib/components/entity-selector.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";

	type Selection = { type: T; id: string };

	interface Props {
		open: boolean;
		title?: string;
		description?: string;
		multiple?: boolean;
		groups: DrawerGroup<T>[];
		onselect: (type: T, id: string) => void;
	}

	let {
		open = $bindable(false),
		title = "Select",
		description = "Pick an item.",
		multiple = false,
		groups,
		onselect,
	}: Props = $props();

	let selected = $state<Selection[]>([]);

	function isSelected(type: T, id: string): boolean {
		return selected.some((s) => s.type === type && s.id === id);
	}

	function handleSelect(type: T, id: string) {
		if (!multiple) {
			onselect(type, id);
			return;
		}

		if (isSelected(type, id)) {
			selected = selected.filter((s) => !(s.type === type && s.id === id));
		} else {
			selected = [...selected, { type, id }];
		}
	}

	function handleConfirm() {
		for (const s of selected) {
			onselect(s.type, s.id);
		}
		selected = [];
		open = false;
	}

	$effect(() => {
		if (!open) {
			selected = [];
		}
	});
</script>

<EntitySelector
	bind:open
	{title}
	{description}
	placeholder="Search..."
>
	{#each groups as group (group.heading)}
		{#if group.items.length > 0}
			<CommandGroup heading={group.heading}>
				{#each group.items as item (item.id)}
					{@const Icon = item.icon}
					{@const checked = isSelected(item.type, item.id)}
					<CommandItem
						value={`${item.type}:${item.id} ${item.searchValue ?? item.name}`}
						onSelect={() => handleSelect(item.type, item.id)}
						data-checked={checked}
					>
						{#if item.iconRef || Icon}
							<AnimatedIcon icon={item.iconRef ?? null} class="size-4 text-muted-foreground">
								{#snippet fallback()}
									{#if Icon}
										<Icon class="size-4 text-muted-foreground" />
									{/if}
								{/snippet}
							</AnimatedIcon>
						{/if}
						<span class="flex-1 truncate">{item.name}</span>
						{#if item.badge}
							<Badge variant="outline" class="ml-auto">{item.badge}</Badge>
						{/if}
					</CommandItem>
				{/each}
			</CommandGroup>
		{/if}
	{/each}

	{#if multiple && selected.length > 0}
		<div class="sticky bottom-0 border-t bg-popover p-2">
			<Button class="w-full" onclick={handleConfirm}>
				Add {selected.length} {selected.length === 1 ? "item" : "items"}
			</Button>
		</div>
	{/if}
</EntitySelector>
