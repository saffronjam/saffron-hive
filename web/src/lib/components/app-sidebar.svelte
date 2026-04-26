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
		SidebarSeparator,
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
		Users,
		LineChart,
		Sparkles,
	} from "@lucide/svelte";
	import Avatar from "$lib/components/avatar.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { me } from "$lib/stores/me.svelte";
	import { alarmsStore } from "$lib/stores/alarms.svelte";
	import { version } from "$lib/version";

	interface NavItem {
		href?: string;
		label: string;
		icon: typeof LayoutDashboard;
	}

	interface NavGroup {
		label?: string;
		items: NavItem[];
	}

	const navGroups: NavGroup[] = [
		{ items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }] },
		{
			label: "Things",
			items: [
				{ href: "/devices", label: "Devices", icon: Lightbulb },
				{ href: "/rooms", label: "Rooms", icon: DoorOpen },
				{ href: "/groups", label: "Groups", icon: Group },
			],
		},
		{
			label: "Action",
			items: [
				{ href: "/scenes", label: "Scenes", icon: Clapperboard },
				{ href: "/automations", label: "Automations", icon: Workflow },
				{ href: "/effects", label: "Effects", icon: Sparkles },
			],
		},
		{
			label: "Monitoring",
			items: [
				{ href: "/activity", label: "Activity", icon: Activity },
				{ href: "/alarms", label: "Alarms", icon: BellRing },
				{ href: "/data-viewer", label: "Data viewer", icon: LineChart },
			],
		},
	];

	const adminItems: NavItem[] = [
		{ href: "/users", label: "Users", icon: Users },
		{ href: "/logs", label: "Logs", icon: ScrollText },
		{ href: "/settings", label: "Settings", icon: Settings },
	];

	function alarmBadgeClass(): string {
		switch (alarmsStore.highestSeverity) {
			case "HIGH":
				return "bg-destructive/80 text-destructive-foreground";
			case "MEDIUM":
				return "bg-amber-500/80 text-white";
			case "LOW":
			default:
				return "bg-teal-500/80 text-white";
		}
	}

	function isActive(href: string | undefined): boolean {
		if (!href) return false;
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
		{#each navGroups as group (group.label ?? "")}
			<SidebarGroup>
				{#if group.label}
					<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
				{/if}
				<SidebarGroupContent>
					<SidebarMenu>
						{#each group.items as item (item.label)}
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={isActive(item.href)}
									tooltipContent={item.label}
								>
									{#snippet child({ props })}
										<a href={item.href ?? "#"} {...props}>
											<item.icon class="size-4" />
											<span>{item.label}</span>
											{#if item.href === "/alarms" && alarmsStore.activeCount > 0}
												<span
													class="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs leading-none font-medium tabular-nums {alarmBadgeClass()}"
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
		{/each}
	</SidebarContent>

	<SidebarFooter>
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each adminItems as item (item.label)}
						<SidebarMenuItem>
							<SidebarMenuButton
								isActive={isActive(item.href)}
								tooltipContent={item.label}
							>
								{#snippet child({ props })}
									{#if item.href}
										<a href={item.href} {...props}>
											<item.icon class="size-4" />
											<span>{item.label}</span>
										</a>
									{:else}
										<button type="button" {...props}>
											<item.icon class="size-4" />
											<span>{item.label}</span>
										</button>
									{/if}
								{/snippet}
							</SidebarMenuButton>
						</SidebarMenuItem>
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>

		<SidebarSeparator />

		{#if auth.user}
			{@const currentUser = auth.user}
			{@const profileUser = me.user ?? {
				name: currentUser.name,
				username: currentUser.username,
				avatarPath: null,
			}}
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton isActive={isActive("/profile")} tooltipContent="Profile">
						{#snippet child({ props })}
							<a href="/profile" {...props}>
								<Avatar user={profileUser} size="xs" />
								<span>Profile</span>
							</a>
						{/snippet}
					</SidebarMenuButton>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuButton tooltipContent="Signed in as {currentUser.name}">
						{#snippet child({ props })}
							<button type="button" {...props} onclick={logout}>
								<LogOut class="size-4" />
								<span class="truncate">Log out ({currentUser.name})</span>
							</button>
						{/snippet}
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		{/if}

		<div class="text-muted-foreground px-2 pt-1 text-center text-xs tabular-nums">
			{version}
		</div>
	</SidebarFooter>
</Sidebar>
