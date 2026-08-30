<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils";

	interface Props {
		size?: "sm" | "md" | "lg";
		disabled?: boolean;
		ariaLabel?: string;
		class?: string;
		children: Snippet;
		onclick?: () => void;
	}

	let {
		size = "md",
		disabled = false,
		ariaLabel,
		class: className,
		children,
		onclick,
	}: Props = $props();

	const sizeClass = $derived(size === "sm" ? "h-8 w-8" : size === "lg" ? "h-10 w-10" : "h-9 w-9");
</script>

<button
	type="button"
	{disabled}
	{onclick}
	aria-label={ariaLabel}
	class={cn(
		"relative flex shrink-0 items-center justify-center overflow-hidden rounded-icon bg-muted transition-colors",
		sizeClass,
		disabled ? "opacity-70" : "hover:bg-muted/80",
		className,
	)}
>
	{@render children()}
</button>
