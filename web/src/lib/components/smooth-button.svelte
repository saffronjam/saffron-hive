<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { untrack, type Component } from "svelte";

	interface Props {
		label: string;
		icon?: Component;
		iconClass?: string;
		variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
		size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
		disabled?: boolean;
		onclick: () => void;
		minDisplayMs?: number;
	}

	let {
		label,
		icon: Icon,
		iconClass = "",
		variant = "default",
		size = "sm",
		disabled = false,
		onclick,
		minDisplayMs = 600,
	}: Props = $props();

	let displayedLabel = $state(untrack(() => label));
	let pendingLabel = $state<string | null>(null);
	let showTime = $state(Date.now());
	let timer: ReturnType<typeof setTimeout> | null = null;
	let measurer: HTMLSpanElement | null = null;
	let contentWidth = $state<number | null>(null);

	function applyLabel(newLabel: string) {
		displayedLabel = newLabel;
		showTime = Date.now();
		pendingLabel = null;
		measureWidth(newLabel);
	}

	function measureWidth(text: string) {
		if (!measurer) return;
		measurer.textContent = text;
		requestAnimationFrame(() => {
			if (measurer) {
				contentWidth = measurer.offsetWidth;
			}
		});
	}

	$effect(() => {
		if (label === displayedLabel) {
			pendingLabel = null;
			return;
		}

		const now = Date.now();
		const elapsed = now - showTime;
		const remaining = Math.max(0, minDisplayMs - elapsed);

		if (remaining === 0) {
			applyLabel(label);
		} else {
			pendingLabel = label;
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
			measureWidth(displayedLabel);
		}
	});

	$effect(() => {
		return () => {
			if (timer) clearTimeout(timer);
		};
	});
</script>

<Button {variant} {size} {disabled} {onclick}>
	{#if Icon}
		<Icon class="size-4 {iconClass}" />
	{/if}
	<span class="relative inline-flex overflow-hidden">
		<span
			bind:this={measurer}
			class="invisible absolute whitespace-nowrap"
			aria-hidden="true"
		>{displayedLabel}</span>
		<span
			class="inline-block whitespace-nowrap transition-[width] duration-200 ease-in-out overflow-hidden"
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
