<script lang="ts">
	import { goto } from "$app/navigation";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Loader2 } from "@lucide/svelte";
	import SegmentedControl from "$lib/components/segmented-control.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { me } from "$lib/stores/me.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
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
	let guestName = $state("");
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

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		submitting = true;
		try {
			if (mode === "guest") {
				const result = await client.mutation(GUEST_LOGIN, { name: guestName.trim() }).toPromise();
				if (result.error || !result.data?.guestLogin) {
					if (result.error) console.error(result.error);
					error = m.guest_login_failed({}, locale.messageOptions());
					return;
				}
				auth.setToken(result.data.guestLogin.token);
				await goto("/", { replaceState: true });
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

<div class="flex min-h-screen items-center justify-center bg-background p-6">
	<div class="w-full max-w-sm rounded-lg shadow-card bg-card p-8">
		<h1 class="text-xl font-semibold">{title}</h1>
		<SegmentedControl
			class="mt-6 w-full [&>button]:flex-1"
			value={mode}
			onchange={setMode}
			options={[
				{ value: "user", label: m.guest_mode_user({}, locale.messageOptions()) },
				{ value: "guest", label: m.guest_mode_guest({}, locale.messageOptions()) },
			]}
		/>
		{#if unavailable && mode === "guest"}
			<p class="mt-4 text-sm text-red-600 dark:text-red-400">
				{m.guest_unavailable({}, locale.messageOptions())}
			</p>
		{/if}
		<form class="mt-6 flex flex-col gap-4" onsubmit={submit}>
			{#if mode === "guest"}
				<div class="grid gap-1.5">
					<label for="guest-name" class="text-sm font-medium">
						{m.guest_name({}, locale.messageOptions())}
					</label>
					<Input
						id="guest-name"
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
					<Input id="login-username" bind:value={username} autocomplete="username" required />
				</div>
				<div class="grid gap-1.5">
					<label for="login-password" class="text-sm font-medium">
						{m.auth_password({}, locale.messageOptions())}
					</label>
					<Input
						id="login-password"
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
