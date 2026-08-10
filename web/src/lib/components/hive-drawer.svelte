<script lang="ts" generics="T extends string">
	import {
		CommandGroup,
		CommandItem,
	} from "$lib/components/ui/command/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import EntitySelector from "$lib/components/entity-selector.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import type { DrawerGroup, DrawerItem } from "$lib/components/hive-drawer";
	import { createHoldDrag } from "$lib/actions/hold-drag";

	type Selection = { type: T; id: string };

	interface Props {
		open: boolean;
		title?: string;
		description?: string;
		multiple?: boolean;
		groups: DrawerGroup<T>[];
		onselect: (type: T, id: string) => void;
		/**
		 * Hold-drag handoff: pressing and holding a row (immediately with a
		 * mouse) calls this with the row's item and the initiating pointerdown
		 * event, then closes the sheet so the caller can drive the rest of the
		 * pointer gesture.
		 */
		ondragout?: (item: DrawerItem<T>, e: PointerEvent) => void;
	}

	let {
		open = $bindable(false),
		title = "Select",
		description = "Pick an item.",
		multiple = false,
		groups,
		onselect,
		ondragout,
	}: Props = $props();

	let selected = $state<Selection[]>([]);

	let dragItem: DrawerItem<T> | null = null;
	const dragMachine = createHoldDrag({
		onstart(e) {
			const item = dragItem;
			dragItem = null;
			if (item && ondragout) {
				ondragout(item, e);
				open = false;
			}
		},
		onmove() {},
		onend() {
			dragItem = null;
		},
		oncancel() {
			dragItem = null;
		},
		mouseImmediate: true,
	});

	function handleRowPointerDown(item: DrawerItem<T>, e: PointerEvent) {
		if (!ondragout || item.disabled) return;
		dragItem = item;
		dragMachine.pointerdown(e);
	}

	function isSelected(type: T, id: string): boolean {
		return selected.some((s) => s.type === type && s.id === id);
	}

	function handleSelect(item: DrawerItem<T>) {
		if (item.disabled) return;
		if (!multiple) {
			onselect(item.type, item.id);
			return;
		}

		if (isSelected(item.type, item.id)) {
			selected = selected.filter((s) => !(s.type === item.type && s.id === item.id));
		} else {
			selected = [...selected, { type: item.type, id: item.id }];
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

<svelte:window
	onpointermove={dragMachine.pointermove}
	onpointerup={dragMachine.pointerup}
	onpointercancel={dragMachine.pointercancel}
/>

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
						disabled={item.disabled}
						class="data-[disabled=true]:opacity-60"
						onSelect={() => handleSelect(item)}
						onpointerdown={(e: PointerEvent) => handleRowPointerDown(item, e)}
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
