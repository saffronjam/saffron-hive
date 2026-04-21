<script lang="ts">
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import {
		Sidebar,
		SidebarContent,
		SidebarFooter,
		SidebarGroup,
		SidebarGroupContent,
		SidebarGroupLabel,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem,
	} from "$lib/components/ui/sidebar/index.js";
	import HiveLogo from "$lib/components/icons/hive-logo.svelte";
	import {
		LayoutDashboard,
		Lightbulb,
		Clapperboard,
		Workflow,
		Group,
		DoorOpen,
		ScrollText,
		Settings,
		LogOut,
		Activity,
		BellRing,
	} from "@lucide/svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { alarmsStore } from "$lib/stores/alarms.svelte";

	interface NavItem {
		href: string;
		label: string;
		icon: typeof LayoutDashboard;
	}

	const navItems: NavItem[] = [
		{ href: "/", label: "Dashboard", icon: LayoutDashboard },
		{ href: "/devices", label: "Devices", icon: Lightbulb },
		{ href: "/scenes", label: "Scenes", icon: Clapperboard },
		{ href: "/automations", label: "Automations", icon: Workflow },
		{ href: "/rooms", label: "Rooms", icon: DoorOpen },
		{ href: "/groups", label: "Groups", icon: Group },
		{ href: "/activity", label: "Activity", icon: Activity },
		{ href: "/alarms", label: "Alarms", icon: BellRing },
	];

	function alarmBadgeClass(): string {
		switch (alarmsStore.highestSeverity) {
			case "HIGH":
				return "bg-destructive text-destructive-foreground";
			case "MEDIUM":
				return "bg-amber-500 text-white";
			case "LOW":
			default:
				return "bg-teal-500 text-white";
		}
	}

	const footerItems: NavItem[] = [
		{ href: "/logs", label: "Logs", icon: ScrollText },
		{ href: "/settings", label: "Settings", icon: Settings },
	];

	function isActive(href: string): boolean {
		if (href === "/") return page.url.pathname === "/";
		return page.url.pathname.startsWith(href);
	}

	function logout() {
		auth.clearToken();
		void goto("/login", { replaceState: true });
	}
</script>

<Sidebar>
	<SidebarHeader>
		<a href="/" class="flex items-center gap-2 px-2 py-1">
			<HiveLogo class="size-6" />
			<span class="text-lg font-bold">Hive</span>
		</a>
	</SidebarHeader>

	<SidebarContent>
		<SidebarGroup>
			<SidebarGroupLabel>Navigation</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each navItems as item (item.href)}
						<SidebarMenuItem>
							<SidebarMenuButton isActive={isActive(item.href)} tooltipContent={item.label}>
								{#snippet child({ props })}
									<a href={item.href} {...props}>
										<item.icon class="size-4" />
										<span>{item.label}</span>
										{#if item.href === "/alarms" && alarmsStore.activeCount > 0}
											<span
												class="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-medium {alarmBadgeClass()}"
												aria-label="{alarmsStore.activeCount} active alarms"
											>
												{alarmsStore.activeCount}
											</span>
										{/if}
									</a>
								{/snippet}
							</SidebarMenuButton>
						</SidebarMenuItem>
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	</SidebarContent>

	<SidebarFooter>
		<SidebarMenu>
			{#each footerItems as item (item.href)}
				<SidebarMenuItem>
					<SidebarMenuButton isActive={isActive(item.href)} tooltipContent={item.label}>
						{#snippet child({ props })}
							<a href={item.href} {...props}>
								<item.icon class="size-4" />
								<span>{item.label}</span>
							</a>
						{/snippet}
					</SidebarMenuButton>
				</SidebarMenuItem>
			{/each}
			{#if auth.user}
				{@const signedInAs = auth.user.name}
				<SidebarMenuItem>
					<SidebarMenuButton tooltipContent="Signed in as {signedInAs}">
						{#snippet child({ props })}
							<button type="button" onclick={logout} {...props}>
								<LogOut class="size-4" />
								<span class="truncate">Log out ({signedInAs})</span>
							</button>
						{/snippet}
					</SidebarMenuButton>
				</SidebarMenuItem>
			{/if}
		</SidebarMenu>
	</SidebarFooter>
</Sidebar>
