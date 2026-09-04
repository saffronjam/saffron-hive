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
		useSidebar,
	} from "$lib/components/ui/sidebar/index.js";
	import { Collapsible } from "bits-ui";
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
		Wrench,
		ChevronUp,
		PlugZap,
		Map as MapIcon,
		CircleCheck,
		Webhook,
	} from "@lucide/svelte";
	import Avatar from "$lib/components/avatar.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { sessionTeardown } from "$lib/session";
	import { me, cachedAvatarPath } from "$lib/stores/me.svelte";
	import { alarmsStore } from "$lib/stores/alarms.svelte";
	import { maintenanceStore } from "$lib/stores/maintenance.svelte";
	import { version } from "$lib/version";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface NavItem {
		href?: string;
		label: string;
		icon: typeof LayoutDashboard;
	}

	interface NavGroup {
		label?: string;
		items: NavItem[];
	}

	const navGroups = $derived.by<NavGroup[]>(() => {
		const options = locale.messageOptions();
		return [
			{
				items: [
					{ href: "/", label: m.nav_dashboard({}, options), icon: LayoutDashboard },
					{ href: "/map", label: m.nav_map({}, options), icon: MapIcon },
				],
			},
			{
				label: m.nav_things({}, options),
				items: [
					{ href: "/devices", label: m.nav_devices({}, options), icon: Lightbulb },
					{ href: "/rooms", label: m.nav_rooms({}, options), icon: DoorOpen },
					{ href: "/groups", label: m.nav_groups({}, options), icon: Group },
				],
			},
			{
				label: m.nav_action({}, options),
				items: [
					{ href: "/scenes", label: m.nav_scenes({}, options), icon: Clapperboard },
					{ href: "/automations", label: m.nav_automations({}, options), icon: Workflow },
					{ href: "/webhooks", label: m.nav_webhooks({}, options), icon: Webhook },
					{ href: "/effects", label: m.nav_effects({}, options), icon: Sparkles },
				],
			},
			{
				label: m.nav_monitoring({}, options),
				items: [
					{ href: "/activity", label: m.nav_activity({}, options), icon: Activity },
					{ href: "/alarms", label: m.nav_alarms({}, options), icon: BellRing },
					{
						href: "/maintenance",
						label: m.nav_maintenance({}, options),
						icon: CircleCheck,
					},
					{ href: "/data-viewer", label: m.nav_data_viewer({}, options), icon: LineChart },
				],
			},
		];
	});

	const adminItems = $derived.by<NavItem[]>(() => {
		const options = locale.messageOptions();
		return [
			{ href: "/integrations", label: m.nav_integrations({}, options), icon: PlugZap },
			{ href: "/users", label: m.nav_users({}, options), icon: Users },
			{ href: "/logs", label: m.nav_logs({}, options), icon: ScrollText },
			{ href: "/settings", label: m.nav_settings({}, options), icon: Settings },
		];
	});

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

	const sidebar = useSidebar();
	let systemOpen = $state(false);

	function handleNav() {
		if (sidebar.isMobile) sidebar.setOpenMobile(false);
	}

	function logout() {
		handleNav();
		sessionTeardown();
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
										<a href={item.href ?? "#"} {...props} onclick={handleNav}>
											<item.icon class="size-4" />
											<span>{item.label}</span>
											{#if item.href === "/alarms" && alarmsStore.activeCount > 0}
												<span
													class="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs leading-none font-medium tabular-nums {alarmBadgeClass()}"
											aria-label={m.nav_active_alarms(
												{ count: alarmsStore.activeCount },
												locale.messageOptions(),
											)}
												>
													{alarmsStore.activeCount}
												</span>
											{/if}
											{#if item.href === "/maintenance" && maintenanceStore.actionableCount > 0}
												<span
													class="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs leading-none font-medium tabular-nums text-muted-foreground"
											aria-label={m.nav_maintenance_tasks(
												{ count: maintenanceStore.actionableCount },
												locale.messageOptions(),
											)}
												>
													{maintenanceStore.actionableCount}
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
		<Collapsible.Root bind:open={systemOpen} class="group/system">
			<Collapsible.Content>
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
												<a href={item.href} {...props} onclick={handleNav}>
													<item.icon class="size-4" />
													<span>{item.label}</span>
												</a>
											{:else}
												<button type="button" {...props} onclick={handleNav}>
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
			</Collapsible.Content>
			<SidebarMenu>
				<SidebarMenuItem>
					<Collapsible.Trigger>
						{#snippet child({ props })}
						<SidebarMenuButton
							{...props}
							tooltipContent={m.nav_system({}, locale.messageOptions())}
						>
							<Wrench class="size-4" />
							<span>{m.nav_system({}, locale.messageOptions())}</span>
								<ChevronUp
									class="ml-auto size-4 transition-transform group-data-[state=closed]/system:rotate-180"
								/>
							</SidebarMenuButton>
						{/snippet}
					</Collapsible.Trigger>
				</SidebarMenuItem>
			</SidebarMenu>
		</Collapsible.Root>

		<SidebarSeparator />

		{#if auth.user}
			{@const currentUser = auth.user}
			<!--
				The cached path lets the image start loading on the first frame. Claiming
				`null` here instead would render the initials until `me` resolves, which
				is the avatar flashing on every reload.
			-->
			{@const profileUser = me.user ?? {
				name: currentUser.name,
				username: currentUser.username,
				avatarPath: cachedAvatarPath(),
			}}
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						isActive={isActive("/profile")}
						tooltipContent={m.nav_profile({}, locale.messageOptions())}
					>
						{#snippet child({ props })}
							<a href="/profile" {...props} onclick={handleNav}>
								<Avatar user={profileUser} size="xs" />
								<span>{m.nav_profile({}, locale.messageOptions())}</span>
							</a>
						{/snippet}
					</SidebarMenuButton>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuButton
						tooltipContent={m.nav_signed_in_as(
							{ name: currentUser.name },
							locale.messageOptions(),
						)}
					>
						{#snippet child({ props })}
							<button type="button" {...props} onclick={logout}>
								<LogOut class="size-4" />
								<span class="truncate">
									{m.nav_log_out({ name: currentUser.name }, locale.messageOptions())}
								</span>
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
