<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { AlertTriangle, AlertCircle, Info } from "@lucide/svelte";
	import type { AlarmSeverity } from "$lib/gql/graphql";

	interface Props {
		severity: AlarmSeverity;
		class?: string;
		hideLabelOnMobile?: boolean;
	}

	let { severity, class: className = "", hideLabelOnMobile = false }: Props = $props();

	function severityClass(s: AlarmSeverity): string {
		switch (s) {
			case "HIGH":
				return "bg-destructive/10 text-destructive border-destructive/40";
			case "MEDIUM":
				return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
			case "LOW":
			default:
				return "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30";
		}
	}

	function severityIcon(s: AlarmSeverity) {
		switch (s) {
			case "HIGH":
				return AlertCircle;
			case "MEDIUM":
				return AlertTriangle;
			case "LOW":
			default:
				return Info;
		}
	}

	function severityLabel(s: AlarmSeverity): string {
		switch (s) {
			case "HIGH":
				return "High";
			case "MEDIUM":
				return "Medium";
			case "LOW":
			default:
				return "Low";
		}
	}

	const Icon = $derived(severityIcon(severity));
</script>

<Badge variant="outline" class="gap-1 {severityClass(severity)} {className}">
	<Icon class="size-3" />
	<span class={hideLabelOnMobile ? "hidden sm:inline" : ""}>{severityLabel(severity)}</span>
</Badge>
