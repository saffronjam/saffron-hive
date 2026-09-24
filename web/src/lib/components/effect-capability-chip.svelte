<script lang="ts">
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { effectCapabilityLabel } from "$lib/effect-display";

	let { capability }: { capability: string } = $props();
	const type = $derived(capability === "on_off" ? "on" : capability === "color_temp" ? "colorTemp" : capability);
</script>

<HiveChip {type} label={effectCapabilityLabel(capability)} iconOverride={capability === "color" ? "lucide:palette" : null} />
