<script lang="ts">
	import { onMount } from "svelte";
	import FieldError from "$lib/components/field-error.svelte";
	import { goto } from "$app/navigation";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { SETUP_STATUS_QUERY } from "$lib/graphql/setup-status";
	import type { Client } from "@urql/svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Loader2 } from "@lucide/svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { delayedLoading } from "$lib/delayed-loading.svelte";
	import { validateNewPassword } from "$lib/password";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	const CREATE_INITIAL_USER = graphql(`
		mutation createInitialUser($input: CreateInitialUserInput!) {
			createInitialUser(input: $input) {
				token
				user {
					id
					username
					name
				}
			}
		}
	`);

	let client: Client;
	let phase = $state<"loading" | "user">("loading");
	const loader = delayedLoading(() => phase === "loading");
	let error = $state<string | null>(null);
	let passwordError = $state<string | null>(null);
	let confirmError = $state<string | null>(null);

	let username = $state("");
	let name = $state("");
	let password = $state("");
	let confirmPassword = $state("");
	let bootstrapToken = $state("");
	let submittingUser = $state(false);

	async function determinePhase() {
		const result = await client.query(SETUP_STATUS_QUERY, {}).toPromise();
		const s = result.data?.setupStatus;
		if (!s) {
			error = m.common_error_server_unreachable({}, locale.messageOptions());
			return;
		}
		if (!s.hasInitialUser) {
			phase = "user";
			return;
		}
		await goto("/", { replaceState: true });
	}

	async function submitUser(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		const pwErr = validateNewPassword(password);
		passwordError = pwErr;
		confirmError =
			password !== confirmPassword
				? m.auth_passwords_mismatch({}, locale.messageOptions())
				: null;
		if (passwordError || confirmError) return;
		submittingUser = true;
		try {
			const result = await client
				.mutation(CREATE_INITIAL_USER, {
					input: { username, name, password, bootstrapToken },
				})
				.toPromise();
			if (result.error || !result.data) {
				if (result.error) console.error(result.error);
				error = m.auth_create_user_failed({}, locale.messageOptions());
				return;
			}
			auth.setToken(result.data.createInitialUser.token);
			await goto("/", { replaceState: true });
		} finally {
			submittingUser = false;
		}
	}

	onMount(() => {
		client = getContextClient();
		void determinePhase();
	});

	$effect(() => {
		pageHeader.breadcrumbs = [{ label: m.auth_setup({}, locale.messageOptions()) }];
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-6">
	<div class="w-full max-w-lg rounded-lg shadow-card bg-card p-8">
		{#if phase === "loading"}
			{#if error}
				<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
			{:else if loader.visible}
				<div class="flex items-center gap-2 text-muted-foreground">
					<Loader2 class="size-4 animate-spin" />
					{m.common_loading({}, locale.messageOptions())}
				</div>
			{/if}
		{:else}
			<h1 class="text-xl font-semibold">
				{m.auth_setup_welcome({}, locale.messageOptions())}
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{m.auth_setup_description({}, locale.messageOptions())}
			</p>
			<form class="mt-6 flex flex-col gap-4" onsubmit={submitUser}>
				<div class="grid gap-1.5">
					<label for="setup-name" class="text-sm font-medium">
						{m.auth_name({}, locale.messageOptions())}
					</label>
					<Input id="setup-name" bind:value={name} required />
				</div>
				<div class="grid gap-1.5">
					<label for="setup-username" class="text-sm font-medium">
						{m.auth_username({}, locale.messageOptions())}
					</label>
					<Input id="setup-username" bind:value={username} autocomplete="username" required />
				</div>
				<div class="grid gap-1.5">
					<label for="setup-password" class="text-sm font-medium">
						{m.auth_password({}, locale.messageOptions())}
					</label>
					<Input
						id="setup-password"
						type="password"
						bind:value={password}
						autocomplete="new-password"
						required
						aria-invalid={!!passwordError}
						aria-describedby={passwordError ? "setup-password-error" : undefined}
						oninput={() => (passwordError = null)}
					/>
					<FieldError id="setup-password-error" message={passwordError} />
				</div>
				<div class="grid gap-1.5">
					<label for="setup-confirm" class="text-sm font-medium">
						{m.auth_confirm_password({}, locale.messageOptions())}
					</label>
					<Input
						id="setup-confirm"
						type="password"
						bind:value={confirmPassword}
						autocomplete="new-password"
						required
						aria-invalid={!!confirmError}
						aria-describedby={confirmError ? "setup-confirm-error" : undefined}
						oninput={() => (confirmError = null)}
					/>
					<FieldError id="setup-confirm-error" message={confirmError} />
				</div>
				<div class="grid gap-1.5">
					<label for="setup-bootstrap" class="text-sm font-medium">
						{m.auth_bootstrap_token({}, locale.messageOptions())}
					</label>
					<Input id="setup-bootstrap" bind:value={bootstrapToken} required />
					<p class="text-xs text-muted-foreground">
						{m.auth_bootstrap_help(
							{ path: "$HIVE_DATA_DIR/bootstrap.token" },
							locale.messageOptions(),
						)}
					</p>
				</div>
				{#if error}
					<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
				{/if}
				<Button type="submit" disabled={submittingUser}>
					{#if submittingUser}
						<Loader2 class="mr-1.5 size-4 animate-spin" />
					{/if}
					{m.auth_create_user({}, locale.messageOptions())}
				</Button>
			</form>
		{/if}
	</div>
</div>
