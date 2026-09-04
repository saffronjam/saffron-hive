<script lang="ts">
	import SmoothButton from "$lib/components/smooth-button.svelte";
	import { Save, Loader2 } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		saving: boolean;
		disabled?: boolean;
		onclick: () => void;
		hideLabelOnMobile?: boolean;
	}

	let { saving, disabled = false, onclick, hideLabelOnMobile = false }: Props = $props();
</script>

<SmoothButton
	label={saving
		? m.common_saving({}, locale.messageOptions())
		: m.common_save({}, locale.messageOptions())}
	icon={saving ? Loader2 : Save}
	iconClass={saving ? "animate-spin" : ""}
	{disabled}
	{onclick}
	{hideLabelOnMobile}
/>
