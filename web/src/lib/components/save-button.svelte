<script lang="ts">
	import SmoothButton from "$lib/components/smooth-button.svelte";
	import { Save, Loader2 } from "@lucide/svelte";

	interface Props {
		saving: boolean;
		disabled?: boolean;
		onclick: () => void;
		hideLabelOnMobile?: boolean;
	}

	let { saving, disabled = false, onclick, hideLabelOnMobile = false }: Props = $props();
</script>

<SmoothButton
	label="Save"
	icon={saving ? Loader2 : Save}
	iconClass={saving ? "animate-spin" : ""}
	{disabled}
	{onclick}
	{hideLabelOnMobile}
/>
