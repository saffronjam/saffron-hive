<script lang="ts">
	import { goto } from "$app/navigation";
	import { ChevronRight, LogOut } from "@lucide/svelte";
	import { mobilePrimaryItems, navigationGroups, systemItems } from "$lib/app-navigation";
	import Avatar from "$lib/components/avatar.svelte";
	import NavigationBadge from "$lib/components/navigation-badge.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { auth } from "$lib/stores/auth.svelte";
	import { me, cachedAvatarPath } from "$lib/stores/me.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { sessionTeardown } from "$lib/session";
	import { version } from "$lib/version";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	const primaryPaths = $derived(new Set(mobilePrimaryItems().map(item => item.href)));
	const groups = $derived([
		...navigationGroups().map(group => ({ ...group, items: group.items.filter(item => !primaryPaths.has(item.href)) })),
		{ label: m.nav_system({}, locale.messageOptions()), items: systemItems() },
	]);
	const user = $derived(me.user ?? (auth.user ? { ...auth.user, avatarPath: cachedAvatarPath() } : null));
	$effect(() => { pageHeader.breadcrumbs = [{ label: m.nav_menu({}, locale.messageOptions()) }]; });
	function logout() {
		sessionTeardown();
		void goto("/login", { replaceState: true });
	}
</script>

<div class="flex min-h-[calc(100dvh-3rem-var(--mobile-nav-height,0px)-2rem)] flex-col gap-6">
	{#if user}
		<a href="/profile" class="flex min-h-16 items-center gap-3 rounded-lg bg-card p-3 shadow-card transition-colors duration-200 motion-reduce:transition-none hover:bg-accent">
			<Avatar {user} size="md" class="shrink-0" />
			<div class="min-w-0 flex-1">
				<div class="truncate font-semibold">{user.name}</div>
				<div class="text-sm text-muted-foreground">{m.nav_profile({}, locale.messageOptions())}</div>
			</div>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
		</a>
	{/if}
	<nav aria-label={m.nav_menu({}, locale.messageOptions())} class="space-y-5">
		{#each groups as group (group.label ?? "")}
			<div>
				{#if group.label}<h2 class="mb-1 px-3 text-xs font-medium text-muted-foreground">{group.label}</h2>{/if}
				{#each group.items as item (item.href)}
					<a href={item.href} class="flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 motion-reduce:transition-none hover:bg-accent">
						<item.icon class="size-5 shrink-0" aria-hidden="true" />
						<span class="flex-1">{item.label}</span>
						<NavigationBadge href={item.href} />
						<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
					</a>
				{/each}
			</div>
		{/each}
	</nav>
	<footer class="mt-auto space-y-3 pt-4">
		<Button variant="ghost" class="min-h-12 w-full justify-start gap-3 px-3" onclick={logout}>
			<LogOut class="size-5 shrink-0" />
			<span class="truncate">{m.nav_log_out({ name: user?.name ?? "" }, locale.messageOptions())}</span>
		</Button>
		<div class="text-center text-xs text-muted-foreground">{version}</div>
	</footer>
</div>
