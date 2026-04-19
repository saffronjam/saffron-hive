<script lang="ts">
	import { page } from "$app/state";
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
	} from "@lucide/svelte";

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
	];

	const footerItems: NavItem[] = [
		{ href: "/logs", label: "Logs", icon: ScrollText },
		{ href: "/settings", label: "Settings", icon: Settings },
	];

	function isActive(href: string): boolean {
		if (href === "/") return page.url.pathname === "/";
		return page.url.pathname.startsWith(href);
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
		</SidebarMenu>
	</SidebarFooter>
</Sidebar>
