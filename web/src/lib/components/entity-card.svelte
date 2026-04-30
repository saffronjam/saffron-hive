<script lang="ts" generics="T extends { id: string; name: string; icon?: string | null }">
	import type { Snippet, Component } from "svelte";
	import { brightnessDrag, type BrightnessDragOpts } from "$lib/actions/brightness-drag";
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
		 * 0..1 multiplier on the tint gradient's mix percentage. `1` keeps the
		 * full default mix (vibrant); `0` resolves the gradient stops to
		 * `var(--card)` (plain card colour). Drives the `--tint-strength` CSS
		 * variable, which is registered with `@property` so changes transition
		 * smoothly. Used by room/group/device cards to convey light brightness
		 * as gradient opacity rather than as RGB darkening.
		 */
		tintStrength?: number;
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
		/**
		 * Extra utility classes appended to the card wrapper. Use to give
		 * collection cards (rooms, groups) a uniform `h-full min-h-…`
		 * footprint so they line up in a grid regardless of footer content.
		 */
		class?: string;
		/**
		 * Whole-card click handler. When set, the card wrapper becomes a
		 * keyboard-focusable button-like region (role="button", Enter/Space
		 * activate). Use only with `readOnly` so there are no nested
		 * interactive controls inside that would conflict.
		 */
		onclick?: (entity: T) => void;
		/**
		 * Replaces the default icon block (IconPicker / static icon) entirely.
		 * Consumers render their own icon UI here — typically a button wrapped
		 * in a Popover. The snippet receives helpers for the standard tinted
		 * icon visual so consumers can mirror it inside their own button.
		 */
		iconArea?: Snippet<
			[
				{
					tintColors: string[] | null;
					tintInactive: boolean | null;
					iconGradient: string;
					iconTextClass: string;
					hasTint: boolean;
				},
			]
		>;
		/**
		 * 0..1 horizontal brightness fill. When set with `tintColors`, the
		 * card's background switches from the radial tint gradient to a
		 * left → right linear fill at this percentage. `null` keeps the
		 * existing radial tint.
		 */
		brightnessFill?: number | null;
		/**
		 * Press-and-drag horizontal brightness control wired on the card
		 * wrapper. Tap (no drag) falls through to `onclick`. See
		 * `$lib/actions/brightness-drag` for full semantics.
		 */
		dragOpts?: BrightnessDragOpts;
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
		tintStrength = 1,
		tintInactive = null,
		footer,
		readOnly = false,
		class: extraClass = "",
		onclick,
		iconArea,
		brightnessFill = null,
		dragOpts,
	}: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (!onclick) return;
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onclick(entity);
		}
	}

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
	// Horizontal fill mode is opt-in (brightnessFill prop set) and stays
	// applied even when tintInactive flips to true — that lets the fill
	// animate down to 0% smoothly when the user toggles off, instead of
	// the class dropping mid-transition and snapping.
	const useFill = $derived(hasTint && brightnessFill != null);
	const fillPct = $derived.by(() => {
		if (brightnessFill == null) return 0;
		return Math.max(0, Math.min(1, brightnessFill)) * 100;
	});
	const tintStyle = $derived.by(() => {
		if (!showTint && !useFill) return "";
		const parts: string[] = [`--tint-color: ${tintColors![0]}`];
		if (tintColors![1]) parts.push(`--tint-color-2: ${tintColors![1]}`);
		if (tintColors![2]) parts.push(`--tint-color-3: ${tintColors![2]}`);
		parts.push(`--tint-strength: ${tintStrength}`);
		if (useFill) parts.push(`--brightness-fill: ${fillPct}%`);
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

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="relative flex flex-col overflow-hidden rounded-lg shadow-card bg-card p-4 transition-all {useFill
		? 'tint-fill-horizontal'
		: showTint
			? tintClass
			: ''} {onclick ? 'outline-none focus-visible:ring-2 focus-visible:ring-ring' : ''} {dragOpts
		? 'select-none touch-none'
		: ''} {extraClass}"
	style={tintStyle}
	role={onclick ? "button" : undefined}
	tabindex={onclick ? 0 : undefined}
	onclick={onclick ? () => onclick(entity) : undefined}
	onkeydown={onclick ? handleKeydown : undefined}
	use:brightnessDrag={dragOpts ?? { initial: () => 0, onpreview: () => {}, oncommit: () => {}, enabled: () => false }}
>
	<div class="relative flex items-center justify-between">
		<div class="flex flex-1 min-w-0 items-center gap-3">
			{#if iconArea}
				{@render iconArea({ tintColors, tintInactive, iconGradient, iconTextClass, hasTint })}
			{:else if readOnly}
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
					<DropdownMenuContent align="end" class="w-44">
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
