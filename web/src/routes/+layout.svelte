<script lang="ts">
	import "../app.css";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import { SidebarInset, SidebarProvider, SidebarTrigger } from "$lib/components/ui/sidebar/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { setContextClient } from "@urql/svelte";
	import { createGraphQLClient } from "$lib/graphql/client";
	import { pageHeader } from "$lib/stores/page-header.svelte";

	setContextClient(createGraphQLClient());

	let { children } = $props();
</script>

<svelte:head>
	<title>{pageHeader.title}</title>
</svelte:head>

<SidebarProvider>
	<AppSidebar />
	<SidebarInset>
		<header class="flex h-12 shrink-0 items-center gap-2 shadow-[0_2px_6px_-2px_rgb(0_0_0/var(--header-shadow-opacity))] px-4">
			<SidebarTrigger class="-ml-1" />
			{#each pageHeader.breadcrumbs as crumb, i}
				{#if i > 0}
					<span class="text-sm text-muted-foreground">/</span>
				{/if}
				{#if crumb.href}
					<a href={crumb.href} class="text-sm text-muted-foreground transition-colors hover:text-foreground">{crumb.label}</a>
				{:else if crumb.onclick}
					<button type="button" onclick={crumb.onclick} class="text-sm text-muted-foreground transition-colors hover:text-foreground">{crumb.label}</button>
				{:else}
					<h1 class="text-sm font-semibold">{crumb.label}</h1>
				{/if}
			{/each}
			{#if pageHeader.actions.length > 0}
				<div class="ml-auto flex items-center gap-2">
					{#each pageHeader.actions as action}
						{@const Icon = action.icon}
						<Button size="sm" variant={action.variant ?? "default"} disabled={action.disabled ?? false} onclick={action.onclick}>
							{#if Icon}
								<Icon class="size-4" />
							{/if}
							<span>{action.label}</span>
						</Button>
					{/each}
				</div>
			{/if}
		</header>
		<main class="flex-1 p-6">
			{@render children()}
		</main>
	</SidebarInset>
</SidebarProvider>
