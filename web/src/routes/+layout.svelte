<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import { SidebarInset, SidebarProvider, SidebarTrigger } from "$lib/components/ui/sidebar/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { setContextClient } from "@urql/svelte";
	import { createGraphQLClient } from "$lib/graphql/client";

	setContextClient(createGraphQLClient());

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Saffron Hive</title>
</svelte:head>

<SidebarProvider>
	<AppSidebar />
	<SidebarInset>
		<header class="flex h-12 shrink-0 items-center gap-2 border-b px-4">
			<SidebarTrigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 !h-4" />
			<span class="text-sm font-medium text-muted-foreground">Saffron Hive</span>
		</header>
		<main class="flex-1 p-6">
			{@render children()}
		</main>
	</SidebarInset>
</SidebarProvider>
