<script lang="ts">
	import { goto } from "$app/navigation";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Loader2 } from "@lucide/svelte";
	import FieldError from "$lib/components/field-error.svelte";
	import { me } from "$lib/stores/me.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { toast } from "svelte-sonner";
	import { validateNewPassword } from "$lib/password";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

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
	let newPasswordError = $state<string | null>(null);
	let confirmError = $state<string | null>(null);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		newPasswordError = validateNewPassword(newPassword);
		confirmError =
			newPassword !== confirmPassword
				? m.auth_passwords_mismatch({}, locale.messageOptions())
				: null;
		if (newPasswordError || confirmError) return;
		submitting = true;
		try {
			const result = await client
				.mutation(COMPLETE_FIRST_PASSWORD_CHANGE, { newPassword })
				.toPromise();
			if (result.error || !result.data?.completeFirstPasswordChange) {
				if (result.error) console.error(result.error);
				error = m.auth_set_password_failed({}, locale.messageOptions());
				return;
			}
			await me.refresh(client);
			toast.success(m.auth_password_set({}, locale.messageOptions()));
			await goto("/", { replaceState: true });
		} finally {
			submitting = false;
		}
	}

	$effect(() => {
		pageHeader.breadcrumbs = [
			{ label: m.auth_set_new_password({}, locale.messageOptions()) },
		];
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-6">
	<div class="w-full max-w-sm rounded-lg shadow-card bg-card p-8">
		<h1 class="text-xl font-semibold">
			{m.auth_set_a_new_password({}, locale.messageOptions())}
		</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			{#if me.user}
				{m.auth_welcome_choose_password(
					{ name: me.user.name },
					locale.messageOptions(),
				)}
			{:else}
				{m.auth_choose_password({}, locale.messageOptions())}
			{/if}
		</p>
		<form class="mt-6 flex flex-col gap-4" onsubmit={submit}>
			<div class="grid gap-1.5">
				<label for="cpr-new" class="text-sm font-medium">
					{m.auth_new_password({}, locale.messageOptions())}
				</label>
				<Input
					id="cpr-new"
					type="password"
					bind:value={newPassword}
					autocomplete="new-password"
					required
					minlength={6}
					aria-invalid={!!newPasswordError}
					aria-describedby={newPasswordError ? "cpr-new-error" : undefined}
					oninput={() => (newPasswordError = null)}
				/>
				<FieldError id="cpr-new-error" message={newPasswordError} />
			</div>
			<div class="grid gap-1.5">
				<label for="cpr-confirm" class="text-sm font-medium">
					{m.auth_confirm_new_password({}, locale.messageOptions())}
				</label>
				<Input
					id="cpr-confirm"
					type="password"
					bind:value={confirmPassword}
					autocomplete="new-password"
					required
					minlength={6}
					aria-invalid={!!confirmError}
					aria-describedby={confirmError ? "cpr-confirm-error" : undefined}
					oninput={() => (confirmError = null)}
				/>
				<FieldError id="cpr-confirm-error" message={confirmError} />
			</div>
			{#if error}
				<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
			{/if}
			<Button type="submit" disabled={submitting || !newPassword || !confirmPassword}>
				{#if submitting}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
				{/if}
				{m.auth_set_password({}, locale.messageOptions())}
			</Button>
		</form>
	</div>
</div>
