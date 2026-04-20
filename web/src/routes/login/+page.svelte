<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Loader2 } from "@lucide/svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";

	const LOGIN = graphql(`
		mutation login($input: LoginInput!) {
			login(input: $input) {
				token
				user {
					id
					username
					name
				}
			}
		}
	`);

	const client = getContextClient();
	let username = $state("");
	let password = $state("");
	let submitting = $state(false);
	let error = $state<string | null>(null);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		submitting = true;
		try {
			const result = await client
				.mutation(LOGIN, { input: { username, password } })
				.toPromise();
			if (result.error || !result.data) {
				error = result.error?.message ?? "Login failed";
				return;
			}
			auth.setToken(result.data.login.token);
			await goto("/", { replaceState: true });
		} finally {
			submitting = false;
		}
	}

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Sign in" }];
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-6">
	<div class="w-full max-w-sm rounded-lg shadow-card bg-card p-8">
		<h1 class="text-xl font-semibold">Sign in</h1>
		<p class="mt-1 text-sm text-muted-foreground">Welcome back.</p>
		<form class="mt-6 flex flex-col gap-4" onsubmit={submit}>
			<div class="grid gap-1.5">
				<label for="login-username" class="text-sm font-medium">Username</label>
				<Input id="login-username" bind:value={username} autocomplete="username" required />
			</div>
			<div class="grid gap-1.5">
				<label for="login-password" class="text-sm font-medium">Password</label>
				<Input
					id="login-password"
					type="password"
					bind:value={password}
					autocomplete="current-password"
					required
				/>
			</div>
			{#if error}
				<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
			{/if}
			<Button type="submit" disabled={submitting || !username || !password}>
				{#if submitting}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
				{/if}
				Sign in
			</Button>
		</form>
	</div>
</div>
