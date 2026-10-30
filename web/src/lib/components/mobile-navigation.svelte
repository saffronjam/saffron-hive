<script lang="ts">
	import { page } from "$app/state";
	import { Menu } from "@lucide/svelte";
	import { navigationGroups, routeIsActive } from "$lib/app-navigation";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	const tabs = $derived([
		navigationGroups()[0].items[0],
		navigationGroups()[1].items[0],
		{ href: "/menu", label: m.nav_menu({}, locale.messageOptions()), icon: Menu },
	]);
	const section = $derived(page.url.pathname === "/" ? "/" : routeIsActive(page.url.pathname, "/devices") ? "/devices" : "/menu");
</script>

<nav aria-label={m.shared_sidebar({}, locale.messageOptions())} class="mobile-navigation fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 bg-sidebar text-sidebar-foreground shadow-card md:hidden">
	{#each tabs as tab (tab.href)}
		<a href={tab.href} aria-current={section === tab.href ? (page.url.pathname === tab.href ? "page" : "location") : undefined} class="mx-1 my-1 flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-center text-xs leading-3.5 focus-visible:outline-2 focus-visible:outline-ring {section === tab.href ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent'}">
			<tab.icon class="size-5 shrink-0" aria-hidden="true" />
			<span>{tab.label}</span>
		</a>
	{/each}
</nav>
