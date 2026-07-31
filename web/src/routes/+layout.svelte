<script lang="ts">
	import "../app.css";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import { SidebarInset, SidebarProvider, SidebarTrigger } from "$lib/components/ui/sidebar/index.js";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import SmoothButton from "$lib/components/smooth-button.svelte";
	import SaveButton from "$lib/components/save-button.svelte";
	import ViewToggle from "$lib/components/view-toggle.svelte";
	import { setContextClient } from "@urql/svelte";
	import { createGraphQLClient } from "$lib/graphql/client";
	import { SETUP_STATUS_QUERY } from "$lib/graphql/setup-status";
	import { nextRoute } from "$lib/auth-gate";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { me } from "$lib/stores/me.svelte";
	import { alarmsStore } from "$lib/stores/alarms.svelte";
	import { deviceStore } from "$lib/stores/devices";
	import { delayedLoading } from "$lib/delayed-loading.svelte";
	import { onMount, onDestroy } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";

	const client = createGraphQLClient();
	setContextClient(client);

	let { children } = $props();

	// Routes that render full-screen without the sidebar chrome. /login takes
	// credentials; /setup creates the initial user on first run;
	// /change-password-required is the forced first-login password change form
	// (authenticated, but the user can't reach the rest of the app until done).
	const PUBLIC_ROUTES = ["/login", "/setup", "/change-password-required"];

	let ready = $state(false);
	const loader = delayedLoading(() => !ready);

	async function gate() {
		const result = await client.query(SETUP_STATUS_QUERY, {}).toPromise();
		const hasInitialUser = result.data?.setupStatus?.hasInitialUser ?? false;
		const isAuthenticated = hasInitialUser && auth.isAuthenticated();

		// Load `me` before deciding so a forced password change redirects before
		// children render — the post-ready $effect only catches up later.
		if (isAuthenticated && !me.user) await me.refresh(client);

		const target = nextRoute({
			pathname: $page.url.pathname,
			hasInitialUser,
			isAuthenticated,
			mustChangePassword: me.user?.mustChangePassword ?? false,
		});
		if (target) await goto(target, { replaceState: true });
		ready = true;
	}

	onMount(() => {
		void gate();
	});

	// Start the alarms store once we know there's an authenticated session.
	// The store handles its own hydration + subscription and is safe to
	// call multiple times — it no-ops when already started.
	$effect(() => {
		if (ready && !PUBLIC_ROUTES.some((r) => $page.url.pathname.startsWith(r)) && auth.isAuthenticated()) {
			alarmsStore.start(client);
			void deviceStore.start(client);
			if (!me.user) void me.refresh(client);
		}
	});

	onDestroy(() => {
		alarmsStore.stop();
		deviceStore.stop();
	});
</script>

<svelte:head>
	<title>{pageHeader.title}</title>
</svelte:head>

{#if !ready}
	{#if loader.visible}
		<div class="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>
	{/if}
{:else if PUBLIC_ROUTES.some((r) => $page.url.pathname.startsWith(r))}
	{@render children()}
{:else}
	<SidebarProvider>
		<AppSidebar />
		<SidebarInset class="min-w-0">
			<header class="flex h-12 shrink-0 items-center gap-2 shadow-[0_2px_6px_-2px_rgb(0_0_0/var(--header-shadow-opacity))] px-4">
				<SidebarTrigger class="-ml-1 shrink-0" />
				<div class="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
					{#each pageHeader.breadcrumbs as crumb, i}
						{#if i > 0}
							<span class="shrink-0 text-sm text-muted-foreground">/</span>
						{/if}
						{#if crumb.href}
							<a href={crumb.href} class="truncate text-sm text-muted-foreground transition-colors hover:text-foreground">{crumb.label}</a>
						{:else if crumb.onclick}
							<button type="button" onclick={crumb.onclick} class="truncate text-sm text-muted-foreground transition-colors hover:text-foreground">{crumb.label}</button>
						{:else}
							<h1 class="truncate text-sm font-semibold">{crumb.label}</h1>
						{/if}
					{/each}
				</div>
				{#if pageHeader.viewToggle || pageHeader.actions.length > 0}
					<div class="flex shrink-0 items-center gap-2">
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
									hideLabelOnMobile={action.hideLabelOnMobile ?? false}
								/>
							{:else}
								<SmoothButton
									label={action.label}
									mobileLabel={action.mobileLabel}
									icon={action.icon}
									iconClass={action.iconClass ?? ""}
									variant={action.variant ?? "default"}
									disabled={action.disabled ?? false}
									onclick={action.onclick}
									hideLabelOnMobile={action.hideLabelOnMobile ?? false}
								/>
							{/if}
						{/each}
					</div>
				{/if}
			</header>
			<main class="min-w-0 flex-1 p-6">
				{@render children()}
			</main>
		</SidebarInset>
	</SidebarProvider>
{/if}

<Toaster richColors closeButton position="bottom-right" />
