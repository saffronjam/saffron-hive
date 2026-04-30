<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Loader2 } from "@lucide/svelte";
	import { me } from "$lib/stores/me.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { toast } from "svelte-sonner";

	const COMPLETE_FIRST_PASSWORD_CHANGE = graphql(`
		mutation completeFirstPasswordChange($newPassword: String!) {
			completeFirstPasswordChange(newPassword: $newPassword)
		}
	`);

	const client = getContextClient();
	let newPassword = $state("");
	let confirmPassword = $state("");
	let submitting = $state(false);
	let error = $state<string | null>(null);

	function friendlyError(msg: string | undefined): string | null {
		if (!msg) return null;
		const stripped = msg.replace(/^\[GraphQL\]\s*/i, "").replace(/^\[Network\]\s*/i, "");
		return stripped.charAt(0).toUpperCase() + stripped.slice(1);
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		if (newPassword.length < 6) {
			error = "Password must be at least 6 characters";
			return;
		}
		if (newPassword !== confirmPassword) {
			error = "Passwords do not match";
			return;
		}
		submitting = true;
		try {
			const result = await client
				.mutation(COMPLETE_FIRST_PASSWORD_CHANGE, { newPassword })
				.toPromise();
			if (result.error || !result.data?.completeFirstPasswordChange) {
				error = friendlyError(result.error?.message) ?? "Could not set password";
				return;
			}
			await me.refresh(client);
			toast.success("Password set");
			await goto("/", { replaceState: true });
		} finally {
			submitting = false;
		}
	}

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Set new password" }];
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-6">
	<div class="w-full max-w-sm rounded-lg shadow-card bg-card p-8">
		<h1 class="text-xl font-semibold">Set a new password</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			{#if me.user}
				Welcome, {me.user.name}. Choose a password before continuing.
			{:else}
				Choose a password before continuing.
			{/if}
		</p>
		<form class="mt-6 flex flex-col gap-4" onsubmit={submit}>
			<div class="grid gap-1.5">
				<label for="cpr-new" class="text-sm font-medium">New password</label>
				<Input
					id="cpr-new"
					type="password"
					bind:value={newPassword}
					autocomplete="new-password"
					required
					minlength={6}
				/>
			</div>
			<div class="grid gap-1.5">
				<label for="cpr-confirm" class="text-sm font-medium">Confirm new password</label>
				<Input
					id="cpr-confirm"
					type="password"
					bind:value={confirmPassword}
					autocomplete="new-password"
					required
					minlength={6}
				/>
			</div>
			{#if error}
				<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
			{/if}
			<Button type="submit" disabled={submitting || !newPassword || !confirmPassword}>
				{#if submitting}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
				{/if}
				Set password
			</Button>
		</form>
	</div>
</div>
