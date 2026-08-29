<script lang="ts" generics="T extends { id: string; name?: string | null; friendlyName?: string | null; icon?: string | null }">
	import { goto } from "$app/navigation";
	import { onDestroy, tick, type Snippet, type Component } from "svelte";
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
	import { tintIconGradient } from "$lib/device-tint";
	import { DoorOpen, EllipsisVertical, Pencil, Plus, Trash2 } from "@lucide/svelte";
	import { groupDisplayName } from "$lib/utils";

	interface Props {
		entity: T;
		fallbackIcon: Component;
		subtitle?: string;
		subtitleTrailing?: Snippet;
		onrename?: (entity: T, newName: string) => void;
		oniconchange?: (entity: T, icon: string | null) => void;
		iconEditable?: boolean;
		editHref?: string;
		ondelete?: (entity: T) => void;
		onAddTo?: (entity: T) => void;
		onTagRooms?: (entity: T) => void;
		editLabel?: string;
		deleteLabel?: string;
		addLabel?: string;
		tagRoomsLabel?: string;
		leadingActions?: Snippet;
		tintColors?: string[] | null;
		/**
		 * Palette used by the icon while `tintInactive` is true. This lets a card
		 * retain its configured appearance while its live tint is absent.
		 */
		inactiveTintColors?: string[] | null;
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
		/** Plays a brief neutral press pulse without changing the card's live tint. */
		pressFeedback?: boolean;
		/**
		 * Whole-card click handler. When set, the card wrapper becomes a
		 * keyboard-focusable button-like region (role="button", Enter/Space
		 * activate). Use only with `readOnly` so there are no nested
		 * interactive controls inside that would conflict.
		 */
		onclick?: (entity: T, event: MouseEvent | KeyboardEvent) => void;
		/**
		 * Fired when the pointer first reaches the card. Cards that link to an
		 * editor use it to warm that editor's query — see
		 * `$lib/actions/prefetch-detail`.
		 */
		onpointerenter?: (entity: T) => void;
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
		/**
		 * Card size variant. `"default"` (the standard p-4 / rounded-lg shape
		 * used on list pages and detail surfaces) or `"sm"` (tighter p-3 /
		 * rounded-xl shape for the dashboard bottom-drawer cards, where rows
		 * are denser and the rounder corner reads more as an interactive
		 * surface). Default: `"default"`.
		 */
		size?: "default" | "sm";
		/**
		 * Icon block size variant for the default fallback rendering (when
		 * `iconArea` is not provided). `"default"` is `size-10`/`size-5`;
		 * `"sm"` is `size-7`/`size-3.5` — used by the dashboard top-level
		 * cards to free up horizontal room. No effect when a custom `iconArea`
		 * snippet is supplied.
		 */
		iconAreaSize?: "default" | "sm";
	}

	let {
		entity,
		fallbackIcon: Fallback,
		subtitle,
		subtitleTrailing,
		onrename,
		oniconchange,
		iconEditable = true,
		editHref,
		ondelete,
		onAddTo,
		onTagRooms,
		editLabel = "Edit",
		deleteLabel = "Delete",
		addLabel = "Add…",
		tagRoomsLabel = "Tag rooms",
		leadingActions,
		tintColors = null,
		inactiveTintColors = null,
		tintStrength = 1,
		tintInactive = null,
		footer,
		readOnly = false,
		class: extraClass = "",
		pressFeedback = false,
		onclick,
		onpointerenter,
		iconArea,
		brightnessFill = null,
		dragOpts,
		size = "default",
		iconAreaSize = "default",
	}: Props = $props();

	const sizeClass = $derived(size === "sm" ? "p-3 rounded-xl" : "p-4 rounded-lg");
	const iconBlockClass = $derived(iconAreaSize === "sm" ? "size-7" : "size-10");
	const iconInnerClass = $derived(iconAreaSize === "sm" ? "size-3.5" : "size-5");
	const canEditIcon = $derived(iconEditable && !!oniconchange && !readOnly);
	const displayName = $derived(groupDisplayName(entity));
	let cardElement = $state<HTMLDivElement>();
	let retainedTintColors = $state<string[] | null>(null);
	let tintReleaseTimer: ReturnType<typeof setTimeout> | null = null;
	let actionMenuOpen = $state(false);
	const currentTintColors = $derived(
		tintInactive === true && inactiveTintColors && inactiveTintColors.length > 0
			? inactiveTintColors
			: tintColors,
	);

	$effect(() => {
		if (currentTintColors && currentTintColors.length > 0) {
			if (tintReleaseTimer) clearTimeout(tintReleaseTimer);
			tintReleaseTimer = null;
			retainedTintColors = [...currentTintColors];
			return;
		}
		if (brightnessFill != null && retainedTintColors) {
			if (tintReleaseTimer) clearTimeout(tintReleaseTimer);
			tintReleaseTimer = setTimeout(() => {
				retainedTintColors = null;
				tintReleaseTimer = null;
			}, 320);
			return;
		}
		retainedTintColors = null;
	});

	onDestroy(() => {
		if (tintReleaseTimer) clearTimeout(tintReleaseTimer);
	});

	const renderedTintColors = $derived(
		currentTintColors && currentTintColors.length > 0 ? currentTintColors : retainedTintColors,
	);

	function handleKeydown(e: KeyboardEvent) {
		if (!onclick) return;
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (!e.repeat) startPressFlash(e.target);
			onclick(entity, e);
		}
	}

	const nestedInteractiveSelector =
		'button, a, input, select, textarea, [role="button"], [role="slider"], [role="switch"]';

	function startPressFlash(target: EventTarget | null) {
		if (!pressFeedback || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
		if (!cardElement) return;
		if (target instanceof Element) {
			const interactive = target.closest(nestedInteractiveSelector);
			if (interactive && interactive !== cardElement) return;
		}
		cardElement.removeAttribute("data-press-flash");
		void cardElement.offsetWidth;
		cardElement.setAttribute("data-press-flash", "");
	}

	function handleClick(e: MouseEvent) {
		startPressFlash(e.target);
		onclick?.(entity, e);
	}

	async function openEditor() {
		if (!editHref) return;
		actionMenuOpen = false;
		await tick();
		await goto(editHref);
	}

	function handlePressAnimationEnd(e: AnimationEvent) {
		if (e.animationName === "press-flash") cardElement?.removeAttribute("data-press-flash");
	}

	const tintClass = $derived.by(() => {
		const n = renderedTintColors?.length ?? 0;
		if (n === 1) return "tint-1";
		if (n === 2) return "tint-2";
		if (n >= 3) return "tint-3";
		return "";
	});

	const fillClass = $derived.by(() => {
		const n = renderedTintColors?.length ?? 0;
		if (n >= 3) return "tint-fill-horizontal-3";
		if (n === 2) return "tint-fill-horizontal-2";
		return "tint-fill-horizontal-1";
	});

	const hasTint = $derived(!!renderedTintColors && renderedTintColors.length > 0);
	// The tint-N stops mix with white and black before mixing with the card
	// surface, so an inactive card must drop the gradient to render as pure bg-card.
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
		const parts: string[] = [`--tint-color: ${renderedTintColors![0]}`];
		if (renderedTintColors![1]) parts.push(`--tint-color-2: ${renderedTintColors![1]}`);
		if (renderedTintColors![2]) parts.push(`--tint-color-3: ${renderedTintColors![2]}`);
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
	const iconGradient = $derived(tintIconGradient(renderedTintColors ?? []));
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={cardElement}
	class="entity-list-card relative flex flex-col overflow-hidden shadow-card bg-card {dragOpts
		? 'dashboard-drag-lift select-none touch-pan-y'
		: 'transition-all'} {sizeClass} {useFill
		? fillClass
		: showTint
			? tintClass
			: ''} {onclick ? 'outline-none focus-visible:ring-2 focus-visible:ring-ring' : ''} {pressFeedback
		? 'press-flash'
		: ''} {extraClass}"
	style={tintStyle}
	role={onclick ? "button" : undefined}
	tabindex={onclick ? 0 : undefined}
	onclick={onclick ? handleClick : undefined}
	onpointerenter={onpointerenter ? () => onpointerenter(entity) : undefined}
	onanimationend={pressFeedback ? handlePressAnimationEnd : undefined}
	onkeydown={onclick ? handleKeydown : undefined}
	use:brightnessDrag={dragOpts ?? { initial: () => 0, onpreview: () => {}, oncommit: () => {}, enabled: () => false }}
>
	<div class="relative flex items-center justify-between">
		<div class="flex flex-1 min-w-0 items-center gap-3">
			{#if iconArea}
				{@render iconArea({ tintColors: renderedTintColors, tintInactive, iconGradient, iconTextClass, hasTint })}
			{:else if !canEditIcon}
				<div class="relative flex {iconBlockClass} shrink-0 items-center justify-center rounded-md bg-muted/50">
					{#if hasTint}
						<div
							class="pointer-events-none absolute inset-0 rounded-md transition-opacity duration-300 ease-out"
							style="background: {iconGradient}; opacity: {tintInactive === true ? 1 : 0}"
							aria-hidden="true"
						></div>
					{/if}
					<AnimatedIcon icon={entity.icon} class="relative {iconInnerClass} {iconTextClass}">
						{#snippet fallback()}<Fallback class="relative {iconInnerClass} {iconTextClass}" />{/snippet}
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
					<h3 class="truncate font-medium text-card-foreground">{displayName}</h3>
				{:else}
					<InlineEditName name={displayName} onsave={(newName) => onrename?.(entity, newName)} />
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
				<DropdownMenu bind:open={actionMenuOpen}>
					<DropdownMenuTrigger>
						{#snippet child({ props })}
							<Button {...props} variant="ghost" size="icon-sm" aria-label="{displayName} actions">
								<EllipsisVertical class="size-4" />
							</Button>
						{/snippet}
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" class="w-44">
						{#if editHref}
							<DropdownMenuItem onclick={openEditor}>
								<Pencil class="size-4" />
								{editLabel}
							</DropdownMenuItem>
						{/if}
						{#if onAddTo}
							<DropdownMenuItem onclick={() => onAddTo?.(entity)}>
								<Plus class="size-4" />
								{addLabel}
							</DropdownMenuItem>
						{/if}
						{#if onTagRooms}
							<DropdownMenuItem onclick={() => onTagRooms?.(entity)}>
								<DoorOpen class="size-4" />
								{tagRoomsLabel}
							</DropdownMenuItem>
						{/if}
						{#if ondelete}
							<DropdownMenuSeparator />
							<DropdownMenuItem variant="destructive" onclick={() => ondelete?.(entity)}>
								<Trash2 class="size-4" />
								{deleteLabel}
							</DropdownMenuItem>
						{/if}
					</DropdownMenuContent>
				</DropdownMenu>
			{/if}
		</div>
	</div>

	{@render footer?.()}
</div>
