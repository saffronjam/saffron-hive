<script lang="ts" generics="T extends { id: string; name: string; icon?: string | null }">
	import type { Snippet, Component } from "svelte";
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
	import IconPickerTrigger from "$lib/components/icon-picker-trigger.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import { EllipsisVertical, Pencil, Plus, Trash2 } from "@lucide/svelte";

	interface Props {
		entity: T;
		fallbackIcon: Component;
		subtitle?: string;
		subtitleTrailing?: Snippet;
		onrename?: (entity: T, newName: string) => void;
		oniconchange?: (entity: T, icon: string | null) => void;
		onedit?: (entity: T) => void;
		ondelete?: (entity: T) => void;
		onAddTo?: (entity: T) => void;
		editLabel?: string;
		deleteLabel?: string;
		addLabel?: string;
		leadingActions?: Snippet;
		tintColors?: string[] | null;
		/**
		 * Scene-style active/inactive indicator. `null` → no active concept, the
		 * full-card gradient is always visible (existing behaviour for non-scene
		 * cards). `false` → active, full-card gradient visible. `true` → inactive,
		 * the full-card gradient fades to the neutral card background and only
		 * the icon square carries the scene's first tint colour. Transitions
		 * smoothly between active and inactive.
		 */
		tintInactive?: boolean | null;
		footer?: Snippet;
		/**
		 * Read-only mode. The dropdown menu (edit / add / delete) is hidden,
		 * the icon picker is replaced with a static icon, and the name renders
		 * as plain text without inline rename. `leadingActions` and `footer`
		 * snippets still render so a Play button or badge remains visible.
		 */
		readOnly?: boolean;
	}

	let {
		entity,
		fallbackIcon: Fallback,
		subtitle,
		subtitleTrailing,
		onrename,
		oniconchange,
		onedit,
		ondelete,
		onAddTo,
		editLabel = "Edit",
		deleteLabel = "Delete",
		addLabel = "Add…",
		leadingActions,
		tintColors = null,
		tintInactive = null,
		footer,
		readOnly = false,
	}: Props = $props();

	const tintClass = $derived.by(() => {
		const n = tintColors?.length ?? 0;
		if (n === 1) return "tint-1";
		if (n === 2) return "tint-2";
		if (n >= 3) return "tint-3";
		return "";
	});

	const hasTint = $derived(!!tintColors && tintColors.length > 0);
	// The tint-N gradient only renders when the card is active. When the card
	// is inactive the class is dropped entirely and bg-card shows through.
	// We tried flattening via CSS vars but tint-1's stops mix with white/black
	// before card, so var(--card) for the tint still leaves a light → dark
	// banding visible. Dropping the class is the only way to get pure bg-card.
	const showTint = $derived(hasTint && tintInactive !== true);
	const tintStyle = $derived.by(() => {
		if (!showTint) return "";
		const parts: string[] = [`--tint-color: ${tintColors![0]}`];
		if (tintColors![1]) parts.push(`--tint-color-2: ${tintColors![1]}`);
		if (tintColors![2]) parts.push(`--tint-color-3: ${tintColors![2]}`);
		return parts.join("; ");
	});

	// Body text picks contrast from the card background: tinted when the full
	// gradient is showing, muted when the card has faded to neutral.
	const bodyTextClass = $derived(
		hasTint && tintInactive !== true ? "text-foreground/70" : "text-muted-foreground",
	);
	// The icon always sits on a tinted square (whole-card gradient when active,
	// tinted icon overlay when inactive), so it uses the tinted-contrast text
	// treatment whenever the card has any tint at all.
	const iconTextClass = $derived(hasTint ? "text-foreground/70" : "text-muted-foreground");
	// Mirror tint-N's linear-gradient across the icon square so the icon's
	// tinted state matches the card's visual language. tint-1 goes light → mid
	// → dark of the single colour; tint-2 / tint-3 span the 2–3 hue palette.
	const iconGradient = $derived.by(() => {
		if (!tintColors || tintColors.length === 0) return "";
		if (tintColors.length === 1) {
			const c = tintColors[0];
			return `linear-gradient(135deg, color-mix(in srgb, color-mix(in srgb, ${c} 70%, white) 50%, var(--card)), color-mix(in srgb, ${c} 50%, var(--card)), color-mix(in srgb, color-mix(in srgb, ${c} 65%, black) 50%, var(--card)))`;
		}
		const stops = tintColors
			.slice(0, 3)
			.map((c) => `color-mix(in srgb, ${c} 50%, var(--card))`)
			.join(", ");
		return `linear-gradient(135deg, ${stops})`;
	});
</script>

<div
	class="relative overflow-hidden rounded-lg shadow-card bg-card p-4 transition-all {showTint
		? tintClass
		: ''}"
	style={tintStyle}
>
	<div class="relative flex items-center justify-between">
		<div class="flex flex-1 min-w-0 items-center gap-3">
			{#if readOnly}
				<div class="relative flex size-10 shrink-0 items-center justify-center rounded-md bg-muted/50">
					{#if hasTint}
						<div
							class="pointer-events-none absolute inset-0 rounded-md transition-opacity duration-300 ease-out"
							style="background: {iconGradient}; opacity: {tintInactive === true ? 1 : 0}"
							aria-hidden="true"
						></div>
					{/if}
					<AnimatedIcon icon={entity.icon} class="relative size-5 {iconTextClass}">
						{#snippet fallback()}<Fallback class="relative size-5 {iconTextClass}" />{/snippet}
					</AnimatedIcon>
				</div>
			{:else}
				<IconPicker value={entity.icon} onselect={(icon) => oniconchange?.(entity, icon)}>
					<IconPickerTrigger size="lg">
						{#if hasTint}
							<div
								class="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
								style="background: {iconGradient}; opacity: {tintInactive === true ? 1 : 0}"
								aria-hidden="true"
							></div>
						{/if}
						<AnimatedIcon icon={entity.icon} class="relative size-5 {iconTextClass}">
							{#snippet fallback()}<Fallback class="relative size-5 {iconTextClass}" />{/snippet}
						</AnimatedIcon>
					</IconPickerTrigger>
				</IconPicker>
			{/if}
			<div class="min-w-0 flex-1">
				{#if readOnly}
					<h3 class="truncate font-medium text-card-foreground">{entity.name}</h3>
				{:else}
					<InlineEditName name={entity.name} onsave={(newName) => onrename?.(entity, newName)} />
				{/if}
				{#if subtitle || subtitleTrailing}
					<p class="text-xs {bodyTextClass}">
						{#if subtitle}{subtitle}{/if}
						{@render subtitleTrailing?.()}
					</p>
				{/if}
			</div>
		</div>

		<div class="flex items-center gap-1">
			{@render leadingActions?.()}
			{#if !readOnly}
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="ghost" size="icon-sm" aria-label="{entity.name} actions">
							<EllipsisVertical class="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onclick={() => onedit?.(entity)}>
							<Pencil class="size-4" />
							{editLabel}
						</DropdownMenuItem>
						{#if onAddTo}
							<DropdownMenuItem onclick={() => onAddTo?.(entity)}>
								<Plus class="size-4" />
								{addLabel}
							</DropdownMenuItem>
						{/if}
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive" onclick={() => ondelete?.(entity)}>
							<Trash2 class="size-4" />
							{deleteLabel}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			{/if}
		</div>
	</div>

	{@render footer?.()}
</div>
