<script lang="ts" generics="T extends string">
	import {
		CommandGroup,
		CommandItem,
	} from "$lib/components/ui/command/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import EntitySelector from "$lib/components/entity-selector.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import type { DrawerGroup, DrawerItem } from "$lib/components/hive-drawer";
	import { createHoldDrag } from "$lib/actions/hold-drag";
	import { haptics, type HapticIntent, type HapticPointerType } from "$lib/stores/haptics.svelte";
	import { Loader2 } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	type Selection = { type: T; id: string };

	interface Props {
		open: boolean;
		title?: string;
		description?: string;
		multiple?: boolean;
		groups: DrawerGroup<T>[];
		onselect: (type: T, id: string) => void;
		disabled?: boolean;
		pendingItem?: Selection | null;
		/**
		 * Hold-drag handoff: pressing and holding a row (immediately with a
		 * mouse) calls this with the row's item and the initiating pointerdown
		 * event, then closes the sheet so the caller can drive the rest of the
		 * pointer gesture.
		 */
		ondragout?: (item: DrawerItem<T>, e: PointerEvent) => void;
		hapticOnSelect?: HapticIntent;
	}

	let {
		open = $bindable(false),
		title,
		description,
		multiple = false,
		groups,
		onselect,
		disabled = false,
		pendingItem,
		ondragout,
		hapticOnSelect,
	}: Props = $props();

	const resolvedTitle = $derived(title ?? m.common_select({}, locale.messageOptions()));
	const resolvedDescription = $derived(
		description ?? m.shared_pick_item({}, locale.messageOptions()),
	);

	let selected = $state<Selection[]>([]);
	let selectionPointerType: HapticPointerType | null = null;

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
		selectionPointerType = e.pointerType === "touch" || e.pointerType === "pen" ? e.pointerType : null;
		if (disabled || !ondragout || item.disabled) return;
		dragItem = item;
		dragMachine.pointerdown(e);
	}

	function isSelected(type: T, id: string): boolean {
		return selected.some((s) => s.type === type && s.id === id);
	}

	function handleSelect(item: DrawerItem<T>) {
		if (disabled || item.disabled) return;
		if (!multiple) {
			if (hapticOnSelect) haptics.play(hapticOnSelect, selectionPointerType);
			selectionPointerType = null;
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
		if (disabled) return;
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
	title={resolvedTitle}
	description={resolvedDescription}
	placeholder={m.common_search({}, locale.messageOptions())}
>
	<div class:pl-5={pendingItem !== undefined}>
		{#each groups as group (group.heading)}
			{#if group.items.length > 0}
				<CommandGroup
					heading={group.heading}
					class={pendingItem !== undefined ? "overflow-visible!" : undefined}
				>
					{#each group.items as item (item.id)}
						{@const Icon = item.icon}
						{@const checked = isSelected(item.type, item.id)}
						{@const pending = pendingItem?.type === item.type && pendingItem.id === item.id}
						<CommandItem
							value={`${item.type}:${item.id} ${item.searchValue ?? item.name}`}
							disabled={disabled || item.disabled}
							class="data-[disabled=true]:opacity-60 data-[pending=true]:bg-muted data-[pending=true]:opacity-100"
							onSelect={() => handleSelect(item)}
							onpointerdown={(e: PointerEvent) => handleRowPointerDown(item, e)}
							data-checked={checked}
							data-pending={pending}
							aria-busy={pending}
						>
							{#if pending}
								<Loader2
									class="pointer-events-none absolute top-1/2 -left-5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
									aria-hidden="true"
								/>
							{/if}
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
							{#if item.badgeType}
								<HiveChip type={item.badgeType} class="ml-auto" />
							{:else if item.badge}
								<Badge variant="outline" class="ml-auto">{item.badge}</Badge>
							{/if}
						</CommandItem>
					{/each}
				</CommandGroup>
			{/if}
		{/each}
	</div>

	{#if multiple && selected.length > 0}
		<div class="sticky bottom-0 border-t bg-popover p-2">
			<Button class="w-full" onclick={handleConfirm} {disabled}>
				{m.shared_add_items({ count: selected.length }, locale.messageOptions())}
			</Button>
		</div>
	{/if}
</EntitySelector>
