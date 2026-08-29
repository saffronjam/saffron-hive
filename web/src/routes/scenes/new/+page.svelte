<script lang="ts">
	import { onMount } from "svelte";
	import SceneCreate from "$lib/components/scene-create.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Scenes", href: "/scenes" }, { label: "Create" }];
		pageHeader.actions = [];
		pageHeader.viewToggle = null;
	});
</script>

<SceneCreate />
