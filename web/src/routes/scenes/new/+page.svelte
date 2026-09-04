<script lang="ts">
	import SceneCreate from "$lib/components/scene-create.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	$effect(() => {
		pageHeader.breadcrumbs = [
			{ label: m.scenes_title({}, locale.messageOptions()), href: "/scenes" },
			{ label: m.scene_create_breadcrumb({}, locale.messageOptions()) },
		];
		pageHeader.actions = [];
		pageHeader.viewToggle = null;
	});
</script>

<SceneCreate />
