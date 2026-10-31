<script lang="ts">
	import { page } from "$app/state";
	import { afterNavigate, beforeNavigate } from "$app/navigation";
	import { onDestroy } from "svelte";
	import { mobilePrimaryItems, routeIsActive } from "$lib/app-navigation";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	const tabs = $derived(mobilePrimaryItems());
	let desiredPath = $state<string | null>(null);
	let requestId = 0;
	const selectedPath = $derived(desiredPath ?? page.url.pathname);
	const section = $derived(tabs.find((tab) => routeIsActive(selectedPath, tab.href))?.href ?? "/menu");
	function selectTab(event: MouseEvent, href: string) {
		if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		desiredPath = href;
		requestId++;
	}

	beforeNavigate(({ to, type, complete }) => {
		if (type === "popstate") {
			desiredPath = null;
			requestId++;
			return;
		}
		if (!desiredPath || to?.url.pathname !== desiredPath) return;
		const id = requestId;
		const settle = () => {
			if (id === requestId) desiredPath = null;
		};
		void complete.then(settle, settle);
	});

	afterNavigate(({ to, type }) => {
		if (type === "popstate" || desiredPath === to?.url.pathname) {
			desiredPath = null;
			requestId++;
		}
	});

	onDestroy(() => { requestId++; });
</script>

<nav aria-label={m.shared_sidebar({}, locale.messageOptions())} class="mobile-navigation fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 rounded-t-[calc(var(--radius-lg)+0.25rem)] text-sidebar-foreground md:hidden">
	{#each tabs as tab (tab.href)}
		<a href={tab.href} onclick={(event) => selectTab(event, tab.href)} aria-current={section === tab.href ? (page.url.pathname === tab.href ? "page" : "location") : undefined} class="mx-1 my-1 flex h-14 touch-manipulation select-none min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-center text-xs leading-3.5 focus-visible:outline-2 focus-visible:outline-ring {section === tab.href ? 'font-semibold text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent'}">
			<tab.icon class="size-5 shrink-0" aria-hidden="true" />
			<span>{tab.label}</span>
		</a>
	{/each}
</nav>

<style>
	.mobile-navigation {
		background-color: color-mix(in srgb, var(--sidebar) 97%, var(--sidebar-foreground));
		box-shadow: inset 0 1px 0 var(--sidebar-border), var(--card-shadow);
	}

	.mobile-navigation a[aria-current] {
		background-color: color-mix(in srgb, var(--sidebar-accent) 95%, var(--sidebar-foreground));
	}
</style>
