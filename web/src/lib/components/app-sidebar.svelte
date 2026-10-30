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
	import { Collapsible } from "bits-ui";
	import HiveLogo from "$lib/components/icons/hive-logo.svelte";
	import { LogOut, Wrench, ChevronUp } from "@lucide/svelte";
	import { navigationGroups, systemItems, routeIsActive } from "$lib/app-navigation";
	import NavigationBadge from "$lib/components/navigation-badge.svelte";
	import Avatar from "$lib/components/avatar.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { sessionTeardown } from "$lib/session";
	import { me, cachedAvatarPath } from "$lib/stores/me.svelte";
	import { version } from "$lib/version";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	const navGroups = $derived(navigationGroups());
	const adminItems = $derived(systemItems());

	function isActive(href: string): boolean {
		return routeIsActive(page.url.pathname, href);
	}
	let systemOpen = $state(false);

	function logout() {
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
										<a href={item.href} {...props}>
											<item.icon class="size-4" />
											<span>{item.label}</span>
											<NavigationBadge href={item.href} />
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
							<a href="/profile" {...props}>
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
