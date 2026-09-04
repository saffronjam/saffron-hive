<script lang="ts">
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button/index.js";
	import { ArrowLeft } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	const status = $derived(page.status);
	const isNotFound = $derived(status === 404);
	const heading = $derived(
		isNotFound
			? m.error_not_found_title({}, locale.messageOptions())
			: m.error_page_title({}, locale.messageOptions()),
	);
	const detail = $derived(
		isNotFound
			? m.error_not_found_detail({}, locale.messageOptions())
			: m.error_page_detail({}, locale.messageOptions()),
	);

	function goBack() {
		// A deep link opened in a fresh tab has no history to return to.
		if (typeof history !== "undefined" && history.length > 1) {
			history.back();
			return;
		}
		void goto("/");
	}
</script>

<div class="flex min-h-[60vh] items-center justify-center">
	<div class="w-full max-w-md rounded-lg shadow-card bg-card p-8 text-center">
		<p class="text-5xl font-semibold text-muted-foreground/50">{status}</p>
		<h1 class="mt-2 text-xl font-semibold text-card-foreground">{heading}</h1>
		<p class="mt-2 text-sm text-muted-foreground">{detail}</p>
		<Button class="mt-6" variant="outline" onclick={goBack}>
			<ArrowLeft class="size-4" />
			<span>{m.error_go_back({}, locale.messageOptions())}</span>
		</Button>
	</div>
</div>
