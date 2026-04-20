<script lang="ts">
	import "../app.css";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import { SidebarInset, SidebarProvider, SidebarTrigger } from "$lib/components/ui/sidebar/index.js";
	import SmoothButton from "$lib/components/smooth-button.svelte";
	import SaveButton from "$lib/components/save-button.svelte";
	import ViewToggle from "$lib/components/view-toggle.svelte";
	import { setContextClient, gql } from "@urql/svelte";
	import { createGraphQLClient } from "$lib/graphql/client";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";

	const client = createGraphQLClient();
	setContextClient(client);

	let { children } = $props();

	// Routes that deliberately bypass the auth gate. /login is where the user
	// enters credentials; /setup is the first-run flow that creates the initial
	// user and configures MQTT before any login is possible.
	const PUBLIC_ROUTES = ["/login", "/setup"];

	let ready = $state(false);

	const SETUP_STATUS_QUERY = gql`
		query setupStatus {
			setupStatus {
				hasInitialUser
				mqttConfigured
			}
		}
	`;

	async function gate() {
		const pathname = $page.url.pathname;
		const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

		// Fetch the unauthenticated setup status first — if the system has no
		// initial user yet, the user must be sent to /setup regardless of any
		// stale token they might still have in localStorage.
		const result = await client.query(SETUP_STATUS_QUERY, {}).toPromise();
		const setup = result.data?.setupStatus;
		const setupComplete = setup?.hasInitialUser && setup?.mqttConfigured;

		if (!setupComplete) {
			if (pathname !== "/setup") {
				await goto("/setup", { replaceState: true });
			}
			ready = true;
			return;
		}

		if (isPublic) {
			// Setup is complete and we're on /login or /setup — stay put unless
			// already authenticated on /login, in which case bounce to /.
			if (pathname === "/login" && auth.isAuthenticated()) {
				await goto("/", { replaceState: true });
			}
			if (pathname === "/setup") {
				await goto("/", { replaceState: true });
			}
			ready = true;
			return;
		}

		if (!auth.isAuthenticated()) {
			await goto("/login", { replaceState: true });
		}
		ready = true;
	}

	onMount(() => {
		void gate();
	});
</script>

<svelte:head>
	<title>{pageHeader.title}</title>
</svelte:head>

{#if !ready}
	<div class="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>
{:else if PUBLIC_ROUTES.some((r) => $page.url.pathname.startsWith(r))}
	{@render children()}
{:else}
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
				{#if pageHeader.viewToggle || pageHeader.actions.length > 0}
					<div class="ml-auto flex items-center gap-2">
						{#if pageHeader.viewToggle}
							<ViewToggle
								value={pageHeader.viewToggle.value}
								onchange={pageHeader.viewToggle.onchange}
							/>
						{/if}
						{#each pageHeader.actions as action (action.label)}
							{#if action.saving !== undefined}
								<SaveButton
									saving={action.saving}
									disabled={action.disabled ?? false}
									onclick={action.onclick}
								/>
							{:else}
								<SmoothButton
									label={action.label}
									icon={action.icon}
									iconClass={action.iconClass ?? ""}
									variant={action.variant ?? "default"}
									disabled={action.disabled ?? false}
									onclick={action.onclick}
								/>
							{/if}
						{/each}
					</div>
				{/if}
			</header>
			<main class="flex-1 p-6">
				{@render children()}
			</main>
		</SidebarInset>
	</SidebarProvider>
{/if}
