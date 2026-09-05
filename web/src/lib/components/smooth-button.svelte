<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
	import { untrack, type Component } from "svelte";

	interface Props {
		label: string;
		icon?: Component;
		iconClass?: string;
		variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
		size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
		disabled?: boolean;
		onclick?: () => void;
		href?: string;
		target?: "_blank" | "_self";
		minDisplayMs?: number;
		hideLabelOnMobile?: boolean;
		mobileLabel?: string;
	}

	let {
		label,
		icon: Icon,
		iconClass = "",
		variant = "default",
		size = "sm",
		disabled = false,
		onclick,
		href,
		target,
		minDisplayMs = 600,
		hideLabelOnMobile = false,
		mobileLabel,
	}: Props = $props();

	const isMobile = new IsMobile();
	const effectiveLabel = $derived(mobileLabel && isMobile.current ? mobileLabel : label);

	let displayedLabel = $state(untrack(() => effectiveLabel));
	let pendingLabel = $state<string | null>(null);
	let showTime = $state(Date.now());
	let timer: ReturnType<typeof setTimeout> | null = null;
	let resizeFrame: number | null = null;
	let measurer: HTMLSpanElement | null = null;
	let contentWidth = $state<number | null>(null);
	let resizingWithoutTransition = $state(false);

	function commitLabel(newLabel: string, measuredWidth: number | null) {
		displayedLabel = newLabel;
		showTime = Date.now();
		pendingLabel = null;
		if (measuredWidth !== null) contentWidth = measuredWidth;
	}

	function labelWidth(text: string): number | null {
		if (!measurer) return null;
		measurer.textContent = text;
		return Math.ceil(measurer.getBoundingClientRect().width) + 2;
	}

	function applyLabel(newLabel: string) {
		const measuredWidth = labelWidth(newLabel);
		if (
			measuredWidth !== null &&
			contentWidth !== null &&
			measuredWidth > contentWidth
		) {
			resizingWithoutTransition = true;
			contentWidth = measuredWidth;
			if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
			resizeFrame = requestAnimationFrame(() => {
				resizeFrame = null;
				if (effectiveLabel === newLabel) commitLabel(newLabel, measuredWidth);
				resizingWithoutTransition = false;
			});
			return;
		}
		commitLabel(newLabel, measuredWidth);
	}

	$effect(() => {
		if (effectiveLabel === displayedLabel) {
			pendingLabel = null;
			return;
		}

		const now = Date.now();
		const elapsed = now - showTime;
		const remaining = Math.max(0, minDisplayMs - elapsed);

		if (remaining === 0) {
			applyLabel(effectiveLabel);
		} else {
			pendingLabel = effectiveLabel;
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				if (pendingLabel !== null) {
					applyLabel(pendingLabel);
				}
				timer = null;
			}, remaining);
		}
	});

	$effect(() => {
		if (measurer && contentWidth === null) {
			contentWidth = labelWidth(displayedLabel);
		}
	});

	$effect(() => {
		return () => {
			if (timer) clearTimeout(timer);
			if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
		};
	});
</script>

<Button
	{variant}
	{size}
	{disabled}
	{onclick}
	{href}
	{target}
	rel={target === "_blank" ? "noreferrer" : undefined}
	aria-label={label}
>
	{#if Icon}
		<Icon class="size-4 {iconClass}" />
	{/if}
	<span class="relative overflow-hidden {hideLabelOnMobile ? 'hidden sm:inline-flex' : 'inline-flex'}">
		<span
			bind:this={measurer}
			class="invisible absolute whitespace-nowrap"
			aria-hidden="true"
		>{displayedLabel}</span>
		<span
			class="inline-block overflow-hidden whitespace-nowrap {resizingWithoutTransition
				? 'transition-none'
				: 'transition-[width] duration-200 ease-in-out'}"
			style={contentWidth !== null ? `width: ${contentWidth}px` : undefined}
		>
			{#key displayedLabel}
				<span class="inline-block animate-fade-in">
					{displayedLabel}
				</span>
			{/key}
		</span>
	</span>
</Button>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.animate-fade-in) {
		animation: fade-in 150ms ease-out;
	}
</style>
