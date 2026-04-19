<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { sentenceCase } from "$lib/utils.js";

	interface Props {
		type: string;
		class?: string;
	}

	let { type, class: className = "" }: Props = $props();

	function badgeVariant(t: string): "default" | "secondary" | "outline" {
		switch (t) {
			case "light":
				return "default";
			case "sensor":
				return "secondary";
			case "switch":
				return "outline";
			default:
				return "secondary";
		}
	}
</script>

<Badge variant={badgeVariant(type)} class={className}>{sentenceCase(type)}</Badge>
