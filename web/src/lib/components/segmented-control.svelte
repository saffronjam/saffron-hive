<script lang="ts" generics="T extends string">
	import type { Component } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";

	interface Option {
		value: T;
		label: string;
		icon?: Component;
		/** Hide the text label below the sm breakpoint (keep icon only). */
		hideLabelOnMobile?: boolean;
		disabled?: boolean;
		ariaLabel?: string;
	}

	interface Props {
		value: T;
		onchange: (next: T) => void;
		options: Option[];
		size?: "sm" | "default";
		class?: string;
	}

	let { value, onchange, options, size = "sm", class: klass = "" }: Props = $props();
</script>

<div
	class="inline-flex items-center rounded-md border border-border dark:border-input {klass}"
	role="group"
>
	{#each options as opt, i (opt.value)}
		{@const isFirst = i === 0}
		{@const isLast = i === options.length - 1}
		{@const isActive = value === opt.value}
		<Button
			variant={isActive ? "secondary" : "ghost"}
			{size}
			class="border-0 {isFirst ? '' : 'rounded-l-none'} {isLast ? '' : 'rounded-r-none'}"
			aria-label={opt.ariaLabel ?? opt.label}
			aria-pressed={isActive}
			disabled={opt.disabled}
			onclick={() => {
				if (!isActive && !opt.disabled) onchange(opt.value);
			}}
		>
			{#if opt.icon}
				{@const Icon = opt.icon}
				<Icon class="size-3.5" />
			{/if}
			<span class={opt.hideLabelOnMobile ? "hidden sm:inline" : ""}>{opt.label}</span>
		</Button>
	{/each}
</div>
