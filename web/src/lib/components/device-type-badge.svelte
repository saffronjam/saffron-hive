<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { sentenceCase } from "$lib/utils.js";
	import { Lightbulb, Gauge, MousePointerClick, Plug, Speaker } from "@lucide/svelte";

	interface Props {
		type: string;
		class?: string;
	}

	let { type, class: className = "" }: Props = $props();

	function typeClass(t: string): string {
		switch (t) {
			case "light":
				return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
			case "sensor":
				return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30";
			case "button":
				return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
			case "plug":
				return "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30";
			case "speaker":
				return "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30";
			default:
				return "";
		}
	}

	function typeIcon(t: string) {
		switch (t) {
			case "light":
				return Lightbulb;
			case "sensor":
				return Gauge;
			case "button":
				return MousePointerClick;
			case "plug":
				return Plug;
			case "speaker":
				return Speaker;
			default:
				return null;
		}
	}

	const Icon = $derived(typeIcon(type));
</script>

<Badge variant="outline" class="gap-1 {typeClass(type)} {className}">
	{#if Icon}
		<Icon class="size-3" />
	{/if}
	{sentenceCase(type)}
</Badge>
