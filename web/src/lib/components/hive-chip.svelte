<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import DynamicIcon from "$lib/components/icons/dynamic-icon.svelte";
	import { semanticIcon, sentenceCase } from "$lib/utils.js";
	import { ContactRole } from "$lib/gql/graphql";

	interface Props {
		type: string;
		contactRole?: ContactRole | null;
		label?: string;
		iconOverride?: string | null;
		href?: string;
		onclick?: () => void;
		active?: boolean;
		class?: string;
	}

	let {
		type,
		contactRole = null,
		label,
		iconOverride,
		href,
		onclick,
		active,
		class: className = "",
	}: Props = $props();

	function typeClass(t: string): string {
		switch (t) {
			case "light":
				return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
			case "sensor":
				return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30";
			case "climate":
				return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30";
			case "button":
				return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
			case "plug":
				return "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30";
			case "speaker":
				return "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30";
			case "hub":
				return "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30";
			case "temperature":
				return "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30";
			case "humidity":
				return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";
			case "pressure":
				return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30";
			case "illuminance":
				return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
			case "contact":
				return "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30";
			case "orientation":
				return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30";
			case "devicePosture":
				return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
			case "linkQuality":
				return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30";
			case "battery":
				return "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30";
			case "firmware":
				return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
			case "posture":
				return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
			case "storage":
				return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30";
			case "on":
			case "brightness":
				return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
			case "colorTemp":
				return "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30";
			case "power":
				return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
			case "voltage":
				return "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30";
			case "current":
				return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
			case "energy":
				return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
			case "new":
				return "bg-primary/10 text-primary border-primary/30";
			case "offline":
				return "bg-red-950/85 text-red-200 border-red-900/60";
			default:
				return "";
		}
	}

	const FallbackIcon = $derived(semanticIcon(type, contactRole));
	const displayLabel = $derived(label ?? sentenceCase(type));

	const baseClasses = $derived(
		active === false
			? "border-border/70 text-muted-foreground opacity-60"
			: typeClass(type),
	);
	const interactiveClasses = $derived(
		onclick ? "transition-colors hover:bg-muted" : "",
	);
</script>

{#snippet content()}
	{#if iconOverride}
		<DynamicIcon icon={iconOverride} class="size-3">
			{#snippet fallback()}
				{#if FallbackIcon}
					<FallbackIcon class="size-3" />
				{/if}
			{/snippet}
		</DynamicIcon>
	{:else if FallbackIcon}
		<FallbackIcon class="size-3" />
	{/if}
	{displayLabel}
{/snippet}

{#if onclick && !href}
	<button
		type="button"
		{onclick}
		aria-pressed={active}
		class="h-5 gap-1 rounded-4xl border px-2 py-0.5 text-xs font-medium inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap transition-all duration-200 {baseClasses} {interactiveClasses} {className}"
	>
		{@render content()}
	</button>
{:else}
	<Badge variant="outline" {href} class="gap-1 {baseClasses} {className}">
		{@render content()}
	</Badge>
{/if}
