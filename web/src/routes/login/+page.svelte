<script lang="ts">
	import { goto } from "$app/navigation";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Loader2, Users } from "@lucide/svelte";
	import HiveLogo from "$lib/components/icons/hive-logo.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { me } from "$lib/stores/me.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";
	import { prepareGuestDashboard } from "$lib/guest-dashboard";
	import { languageFromGraphQL } from "$lib/i18n/graphql-language";
	import { page } from "$app/state";

	const LOGIN = graphql(`
		mutation login($input: LoginInput!) {
			login(input: $input) {
				token
				user {
					id
					username
					name
					avatarPath
					theme
					timeFormat
					temperatureUnit
					hapticsEnabled
					language
					createdAt
					mustChangePassword
				}
			}
		}
	`);

	const GUEST_LOGIN = graphql(`
		mutation GuestLogin($name: String!) {
			guestLogin(name: $name) {
				token
				guest {
					id
					name
					language
					expiresAt
				}
			}
		}
	`);

	const client = getContextClient();
	type LoginMode = "user" | "guest";
	let mode = $state<LoginMode>(page.url.searchParams.get("mode") === "guest" ? "guest" : "user");
	let username = $state("");
	let password = $state("");
	let guestName = $state(page.url.searchParams.get("name")?.trim() ?? "");
	let submitting = $state(false);
	let error = $state<string | null>(null);
	const unavailable = page.url.searchParams.get("reason") === "unavailable";
	const title = $derived(
		mode === "guest"
			? m.guest_sign_in_title({}, locale.messageOptions())
			: m.auth_sign_in_title({}, locale.messageOptions()),
	);

	function setMode(next: LoginMode) {
		mode = next;
		error = null;
	}

	async function loginGuest() {
		const result = await client.mutation(GUEST_LOGIN, { name: guestName.trim() }).toPromise();
		if (result.error || !result.data?.guestLogin) {
			if (result.error) console.error(result.error);
			error = m.guest_login_failed({}, locale.messageOptions());
			return;
		}
		auth.setToken(result.data.guestLogin.token);
		locale.setLanguage(languageFromGraphQL(result.data.guestLogin.guest.language));
		await prepareGuestDashboard(client);
		await goto("/", { replaceState: true });
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		submitting = true;
		try {
			if (mode === "guest") {
				await loginGuest();
				return;
			}
			const result = await client
				.mutation(LOGIN, { input: { username, password } })
				.toPromise();
			if (result.error || !result.data) {
				if (result.error) console.error(result.error);
				error = m.auth_login_failed({}, locale.messageOptions());
				return;
			}
			auth.setToken(result.data.login.token);
			me.apply(result.data.login.user);
			await localizedNamesStore.refresh(client);
			const dest = result.data.login.user.mustChangePassword
				? "/change-password-required"
				: "/";
			await goto(dest, { replaceState: true });
		} finally {
			submitting = false;
		}
	}

	$effect(() => {
		pageHeader.breadcrumbs = [{ label: title }];
	});
</script>

<div
	class="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-background px-6 py-24"
>
	<Button
		variant="ghost"
		size="sm"
		class="absolute top-6 right-6 z-10"
		disabled={submitting}
		onclick={() => setMode(mode === "user" ? "guest" : "user")}
	>
		<Users class="size-4" aria-hidden="true" />
		{mode === "user"
			? m.guest_mode_guest({}, locale.messageOptions())
			: m.guest_mode_user({}, locale.messageOptions())}
	</Button>
	<div class="login-content relative isolate w-full max-w-[23.75rem]">
		<HiveLogo
			class="mx-auto mb-5 size-20"
			role="img"
			aria-label={m.common_brand_name({}, locale.messageOptions())}
		/>
		<h1 class="text-center text-3xl font-semibold tracking-tight">{title}</h1>
		{#if unavailable && mode === "guest"}
			<p class="mt-4 text-sm text-red-600 dark:text-red-400">
				{m.guest_unavailable({}, locale.messageOptions())}
			</p>
		{/if}
		<form class="mt-8 flex min-h-60 flex-col gap-5" onsubmit={submit}>
			{#if mode === "guest"}
				<div class="grid gap-1.5">
					<label for="guest-name" class="text-sm font-medium">
						{m.guest_name({}, locale.messageOptions())}
					</label>
					<Input
						id="guest-name"
						class="h-12 px-4 md:text-base"
						bind:value={guestName}
						autocomplete="off"
						required
						oninput={() => (error = null)}
					/>
				</div>
			{:else}
				<div class="grid gap-1.5">
					<label for="login-username" class="text-sm font-medium">
						{m.auth_username({}, locale.messageOptions())}
					</label>
					<Input
						id="login-username"
						class="h-12 px-4 md:text-base"
						bind:value={username}
						autocomplete="username"
						required
					/>
				</div>
				<div class="grid gap-1.5">
					<label for="login-password" class="text-sm font-medium">
						{m.auth_password({}, locale.messageOptions())}
					</label>
					<Input
						id="login-password"
						class="h-12 px-4 md:text-base"
						type="password"
						bind:value={password}
						autocomplete="current-password"
						required
					/>
				</div>
			{/if}
			{#if error}
				<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
			{/if}
			<Button
				type="submit"
				class="mt-1 h-12 text-base"
				disabled={submitting || (mode === "guest" ? !guestName.trim() : !username || !password)}
			>
				{#if submitting}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
				{/if}
				{mode === "guest"
					? m.common_continue({}, locale.messageOptions())
					: m.auth_sign_in({}, locale.messageOptions())}
			</Button>
		</form>
	</div>
</div>

<style>
	.login-content::before {
		position: absolute;
		z-index: -1;
		top: 2.5rem;
		left: 50%;
		width: min(64rem, 200vw);
		height: clamp(24rem, 80vw, 34rem);
		transform: translate(-50%, -50%);
		background: radial-gradient(
			ellipse,
			color-mix(in srgb, var(--brand) 24%, transparent),
			color-mix(in srgb, var(--brand) 11%, transparent) 32%,
			transparent 68%
		);
		content: "";
		pointer-events: none;
	}
</style>
