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
			error = "Could not reach the server.";
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
		passwordError = pwErr ? pwErr + "." : null;
		confirmError = password !== confirmPassword ? "Passwords do not match." : null;
		if (passwordError || confirmError) return;
		submittingUser = true;
		try {
			const result = await client
				.mutation(CREATE_INITIAL_USER, {
					input: { username, name, password, bootstrapToken },
				})
				.toPromise();
			if (result.error || !result.data) {
				error = result.error?.message ?? "Failed to create user.";
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
		pageHeader.breadcrumbs = [{ label: "Setup" }];
		void determinePhase();
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
					Loading...
				</div>
			{/if}
		{:else}
			<h1 class="text-xl font-semibold">Welcome to Hive!</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Create the first user. This will be your admin account.
			</p>
			<form class="mt-6 flex flex-col gap-4" onsubmit={submitUser}>
				<div class="grid gap-1.5">
					<label for="setup-name" class="text-sm font-medium">Name</label>
					<Input id="setup-name" bind:value={name} required />
				</div>
				<div class="grid gap-1.5">
					<label for="setup-username" class="text-sm font-medium">Username</label>
					<Input id="setup-username" bind:value={username} autocomplete="username" required />
				</div>
				<div class="grid gap-1.5">
					<label for="setup-password" class="text-sm font-medium">Password</label>
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
					<label for="setup-confirm" class="text-sm font-medium">Confirm password</label>
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
					<label for="setup-bootstrap" class="text-sm font-medium">Bootstrap token</label>
					<Input id="setup-bootstrap" bind:value={bootstrapToken} required />
					<p class="text-xs text-muted-foreground">
						Printed to the server logs on first boot, or read
						<code>$HIVE_DATA_DIR/bootstrap.token</code> on the host.
					</p>
				</div>
				{#if error}
					<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
				{/if}
				<Button type="submit" disabled={submittingUser}>
					{#if submittingUser}
						<Loader2 class="mr-1.5 size-4 animate-spin" />
					{/if}
					Create user
				</Button>
			</form>
		{/if}
	</div>
</div>
