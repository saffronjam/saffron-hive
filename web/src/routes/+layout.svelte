<script lang="ts">
	import "../app.css";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import { SidebarInset, SidebarProvider, SidebarTrigger } from "$lib/components/ui/sidebar/index.js";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import SmoothButton from "$lib/components/smooth-button.svelte";
	import SaveButton from "$lib/components/save-button.svelte";
	import ViewToggle from "$lib/components/view-toggle.svelte";
	import { setContextClient } from "@urql/svelte";
	import { createGraphQLConnection } from "$lib/graphql/client";
	import { installAppRecovery, setGraphQLConnectionContext } from "$lib/graphql/app-recovery";
	import { waitForSetupStatus } from "$lib/graphql/setup-status";
	import { nextRoute } from "$lib/auth-gate";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { me } from "$lib/stores/me.svelte";
	import { alarmsStore } from "$lib/stores/alarms.svelte";
	import { maintenanceStore } from "$lib/stores/maintenance.svelte";
	import { deviceStore } from "$lib/stores/devices";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { scenesStore } from "$lib/stores/scenes.svelte";
	import { automationsStore } from "$lib/stores/automations.svelte";
	import { effectsStore } from "$lib/stores/effects.svelte";
	import { webhooksStore } from "$lib/stores/webhooks.svelte";
	import { floorplanStore } from "$lib/stores/floorplan.svelte";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";
	import { delayedLoading } from "$lib/delayed-loading.svelte";
	import { prefetchIconPacks } from "$lib/components/icons/icon-utils.js";
	import { onMount, onDestroy } from "svelte";
	import { afterNavigate, goto, onNavigate } from "$app/navigation";
	import DevicesPage from "$lib/components/devices-page.svelte";
	import DashboardPage from "$lib/components/dashboard-page.svelte";
	import GuestSessionGuard from "$lib/components/guest-session-guard.svelte";
	import RoomsPage from "$lib/components/rooms-page.svelte";
	import GroupsPage from "$lib/components/groups-page.svelte";
	import ScenesPage from "$lib/components/scenes-page.svelte";
	import AutomationsPage from "$lib/components/automations-page.svelte";
	import EffectsPage from "$lib/components/effects-page.svelte";
	import WebhooksPage from "$lib/components/webhooks-page.svelte";
	import MapPage from "$lib/components/map-page.svelte";
	import AlarmsPage from "$lib/components/alarms-page.svelte";
	import MaintenancePage from "$lib/components/maintenance-page.svelte";
	import { page } from "$app/stores";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { graphql } from "$lib/gql";
	import { sessionTeardown } from "$lib/session";
	import { LogOut } from "@lucide/svelte";

	const CURRENT_GUEST = graphql(`
		query LayoutCurrentGuest {
			currentGuest {
				id
			}
		}
	`);

	let reconciliationRunning = false;
	let reconciliationQueued = false;

	async function reconcileAppState() {
		if (!auth.isAuthenticated()) return;
		if (reconciliationRunning) {
			reconciliationQueued = true;
			return;
		}

		reconciliationRunning = true;
		try {
			do {
				reconciliationQueued = false;
				const dashboardRefreshes = [
					deviceStore.refresh(client),
					roomsStore.refresh(client),
					groupsStore.refresh(client),
					scenesStore.refresh(client),
					auth.isGuest()
						? localizedNamesStore.refreshDashboard(client)
						: localizedNamesStore.refresh(client),
				];
				await Promise.allSettled(
					auth.isGuest()
						? dashboardRefreshes
						: [
								...dashboardRefreshes,
								automationsStore.refresh(client),
								effectsStore.refresh(client),
								webhooksStore.refresh(client),
								floorplanStore.refresh(client),
								alarmsStore.refresh(client),
								maintenanceStore.refresh(),
							],
				);
			} while (reconciliationQueued && auth.isAuthenticated());
		} finally {
			reconciliationRunning = false;
		}
	}

	const connection = createGraphQLConnection();
	const client = connection.client;
	setContextClient(client);
	setGraphQLConnectionContext(connection);
	const stopRecoveryReconciliation = connection.onRecovered(() => {
		void reconcileAppState();
	});

	let { children } = $props();

	// Routes that render full-screen without the sidebar chrome. /login takes
	// credentials; /setup creates the initial user on first run;
	// /change-password-required is the forced first-login password change form
	// (authenticated, but the user can't reach the rest of the app until done).
	const PUBLIC_ROUTES = ["/login", "/setup", "/change-password-required"];

	let ready = $state(false);
	let gateError = $state(false);
	let gateRunning = $state(false);
	const loader = delayedLoading(() => !ready);
	const gateAbortController = new AbortController();

	// The main pages stay mounted (hidden) after their first visit, so a
	// return costs no rebuild. Each mounts on first visit, not at boot, so
	// landing anywhere pays only for that page. Two pages are deliberately
	// absent: the data-viewer writes its filters into the browser URL, which a
	// hidden page must never do. Activity owns a mode-specific live subscription
	// and restores its bounded event list from a tab snapshot instead.
	const KEPT_PAGES = [
		{ path: "/", component: DashboardPage },
		{ path: "/map", component: MapPage },
		{ path: "/devices", component: DevicesPage },
		{ path: "/rooms", component: RoomsPage },
		{ path: "/groups", component: GroupsPage },
		{ path: "/scenes", component: ScenesPage },
		{ path: "/automations", component: AutomationsPage },
		{ path: "/webhooks", component: WebhooksPage },
		{ path: "/effects", component: EffectsPage },
		{ path: "/alarms", component: AlarmsPage },
		{ path: "/maintenance", component: MaintenancePage },
	];
	const activePath = $derived($page.url.pathname);
	let visitedPaths = $state<Record<string, boolean>>({});
	$effect(() => {
		if (KEPT_PAGES.some((k) => k.path === activePath)) {
			visitedPaths[activePath] = true;
		}
	});

	onNavigate(({ from, to }) => {
		if (from?.url.pathname !== to?.url.pathname) pageHeader.reset();
	});

	async function gate() {
		if (gateRunning) return;
		gateRunning = true;
		gateError = false;
		try {
			const { hasInitialUser } = await waitForSetupStatus(client, {
				signal: gateAbortController.signal,
			});
			const isAuthenticated = hasInitialUser && auth.isAuthenticated();

			// Load `me` before deciding so a forced password change redirects before
			// children render — the post-ready $effect only catches up later.
			if (isAuthenticated && auth.isGuest()) {
				const result = await client
					.query(CURRENT_GUEST, {}, { requestPolicy: "network-only" })
					.toPromise();
				if (!result.data?.currentGuest) {
					sessionTeardown();
					await goto("/login?mode=guest&reason=unavailable", { replaceState: true });
					ready = true;
					return;
				}
			} else if (isAuthenticated && !me.user) {
				await me.refresh(client);
			}

			const target = nextRoute({
				pathname: $page.url.pathname,
				hasInitialUser,
				isAuthenticated,
				isGuest: auth.isGuest(),
				mustChangePassword: me.user?.mustChangePassword ?? false,
			});
			if (target) await goto(target, { replaceState: true });
			ready = true;
		} catch {
			if (!gateAbortController.signal.aborted) gateError = true;
		} finally {
			gateRunning = false;
		}
	}

	let uninstallAppRecovery: (() => void) | null = null;

	onMount(() => {
		uninstallAppRecovery = installAppRecovery(
			connection,
			() => ready && auth.isAuthenticated() && !PUBLIC_ROUTES.some((r) => $page.url.pathname.startsWith(r)),
			() => {
				void reconcileAppState();
			},
		);
		void gate();
		prefetchIconPacks();
	});

	$effect(() => {
		if (ready && !PUBLIC_ROUTES.some((r) => $page.url.pathname.startsWith(r)) && auth.isAuthenticated()) {
			void deviceStore.start(client);
			void roomsStore.start(client);
			void groupsStore.start(client);
			void scenesStore.start(client);
			if (auth.isGuest()) {
				void localizedNamesStore.refreshDashboard(client);
			} else {
				alarmsStore.start(client);
				maintenanceStore.start(client);
				void automationsStore.start(client);
				void webhooksStore.start(client);
				void effectsStore.start(client);
				void floorplanStore.start(client);
				void localizedNamesStore.refresh(client);
				if (!me.user) void me.refresh(client);
			}
		}
	});

	afterNavigate(() => {
		const pathname = $page.url.pathname;
		if (
			!ready ||
			PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
			auth.isAuthenticated()
		) {
			return;
		}
		void goto(auth.isGuest() ? "/login?mode=guest&reason=unavailable" : "/login", {
			replaceState: true,
		});
	});

	async function guestLogout() {
		sessionTeardown();
		await goto("/login?mode=guest", { replaceState: true });
	}

	onDestroy(() => {
		gateAbortController.abort();
		uninstallAppRecovery?.();
		stopRecoveryReconciliation();
		alarmsStore.stop();
		maintenanceStore.stop();
		deviceStore.stop();
		roomsStore.stop();
		groupsStore.stop();
		scenesStore.stop();
		automationsStore.stop();
		webhooksStore.stop();
		effectsStore.stop();
		floorplanStore.stop();
		localizedNamesStore.clear();
	});
</script>

<svelte:head>
	<title>{pageHeader.title}</title>
</svelte:head>

{#if !ready}
	{#if gateError}
		<div class="flex h-screen flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
			<span>{m.common_error_server_unreachable({}, locale.messageOptions())}</span>
			<SmoothButton
				label={m.common_try_again({}, locale.messageOptions())}
				variant="outline"
				size="sm"
				onclick={gate}
			/>
		</div>
	{:else if loader.visible}
		<div class="flex h-screen items-center justify-center text-muted-foreground">
			{m.common_loading({}, locale.messageOptions())}
		</div>
	{/if}
{:else if PUBLIC_ROUTES.some((r) => $page.url.pathname.startsWith(r))}
	{@render children()}
{:else if !auth.isAuthenticated()}
	<div class="min-h-screen bg-background"></div>
{:else if auth.isGuest()}
	<GuestSessionGuard />
	<div class="flex min-h-screen flex-col bg-background">
		<main class="min-w-0 flex-1 p-6">
			<DashboardPage visible={true} guest={true} />
			<div class="mx-auto mt-6 flex max-w-3xl justify-center">
				<SmoothButton
					label={m.guest_logout({}, locale.messageOptions())}
					icon={LogOut}
					variant="ghost"
					size="sm"
					onclick={guestLogout}
				/>
			</div>
		</main>
	</div>
{:else}
	<SidebarProvider>
		<AppSidebar />
		<SidebarInset class="min-w-0">
			<header class="flex h-12 shrink-0 items-center gap-2 px-4">
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
									href={action.href}
									target={action.target}
									hideLabelOnMobile={action.hideLabelOnMobile ?? false}
								/>
							{/if}
						{/each}
					</div>
				{/if}
			</header>
			<main class="min-w-0 flex-1 p-6">
				{#each KEPT_PAGES as kept (kept.path)}
					{#if visitedPaths[kept.path]}
						<div hidden={activePath !== kept.path}>
							<kept.component visible={activePath === kept.path} />
						</div>
					{/if}
				{/each}
				{@render children()}
			</main>
		</SidebarInset>
	</SidebarProvider>
{/if}

<Toaster richColors closeButton position="bottom-right" />
