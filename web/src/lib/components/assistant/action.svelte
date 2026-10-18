<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import type { AssistantConversationFieldsFragment } from "$lib/gql/graphql";
	import { CHAT_RESPOND, ACTION_PRIVATE_RESULT } from "$lib/assistant";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { Check, ShieldCheck, LockKeyhole, Loader2, X } from "@lucide/svelte";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	let {
		action,
		conversationId,
		onchange,
	}: {
		action: AssistantConversationFieldsFragment["actions"][number];
		conversationId: string;
		onchange: (c: AssistantConversationFieldsFragment) => void;
	} = $props();
	const client = getContextClient();
	const options = $derived(locale.messageOptions());
	let privateResult = $state("");
	async function reveal() {
		const r = await client
			.query(
				ACTION_PRIVATE_RESULT,
				{ conversationId, actionId: action.id },
				{ requestPolicy: "network-only" },
			)
			.toPromise();
		if (r.error) error = r.error.message;
		else privateResult = r.data?.assistantActionPrivateResult ?? "";
	}
	let acknowledged = $state(false);
	let values = $state<Record<string, string>>({});
	let busy = $state(false);
	let error = $state("");
	const pending = $derived(action.status === "PENDING" || action.status === "NEEDS_INPUT");
	const ready = $derived(
		(!action.needsConfirmation || acknowledged) &&
			action.inputs.every((f) => !f.required || values[f.path]?.length),
	);
	const status = $derived.by(() => {
		switch (action.status) {
			case "COMPLETED":
				return m.assistant_completed({}, options);
			case "REJECTED":
				return m.assistant_rejected({}, options);
			case "STALE":
				return m.assistant_stale({}, options);
			case "FAILED":
				return m.assistant_failed({}, options);
			case "EXECUTING":
				return m.assistant_executing({}, options);
			default:
				return m.assistant_waiting({}, options);
		}
	});
	async function respond(approve: boolean) {
		busy = true;
		error = "";
		try {
			const r = await client
				.mutation(CHAT_RESPOND, {
					input: {
						conversationId,
						actionId: action.id,
						approve,
						acknowledged,
						values: approve
							? action.inputs.map((f) => ({ path: f.path, value: values[f.path] ?? "" }))
							: [],
					},
				})
				.toPromise();
			if (r.error) throw r.error;
			values = {};
			if (r.data) onchange(r.data.respondToAssistantAction);
		} catch (e) {
			error = graphqlErrorMessage(e, m.assistant_error({}, options));
		} finally {
			busy = false;
		}
	}
	$effect(() => {
		if (!pending) values = {};
	});
</script>

<div
	class="bg-card shadow-card space-y-3 rounded-lg p-4 transition-colors duration-200 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
	data-action-id={action.id}
>
	<div class="flex items-start gap-3">
		<div class="text-primary mt-0.5">
			{#if action.status === "COMPLETED"}<Check
					class="size-4"
				/>{:else if action.status === "REJECTED"}<X
					class="size-4"
				/>{:else if action.inputs.length}<LockKeyhole class="size-4" />{:else}<ShieldCheck
					class="size-4"
				/>{/if}
		</div>
		<div class="min-w-0 flex-1">
			<p class="text-sm font-medium">{action.title}</p>
			{#if action.description}<p class="text-muted-foreground mt-1 text-sm">{action.description}</p>{/if}
		</div>
	</div>
	{#if action.targets.length}<ul class="flex flex-wrap gap-2 text-xs">
			{#each action.targets as target, i (i)}<li class="bg-muted rounded-md px-2 py-1">
					{#if target.href.startsWith("/") && !target.href.startsWith("//")}<a
							href={target.href}
							class="hover:underline">{target.name}</a
						>{:else}{target.name}{/if}
				</li>{/each}
		</ul>{/if}
	{#if pending}<form
			class="space-y-3"
			onsubmit={(e) => {
				e.preventDefault();
				if (ready && !busy) void respond(true);
			}}
		>
			{#if action.inputs.length}<p class="text-muted-foreground text-xs">
					{m.assistant_private_input({}, options)}
				</p>
				{#each action.inputs as field (field.path)}<div class="space-y-1">
						<label for={`${action.id}-${field.path}`} class="text-sm">{field.label}</label><Input
							id={`${action.id}-${field.path}`}
							type="password"
							autocomplete="off"
							bind:value={values[field.path]}
							disabled={busy}
						/>
					</div>{/each}{/if}
			{#if action.needsConfirmation}<div class="flex items-start gap-2">
					<Checkbox id={`ack-${action.id}`} bind:checked={acknowledged} disabled={busy} /><label
						for={`ack-${action.id}`}
						class="text-sm leading-5">{m.assistant_acknowledge({}, options)}</label
					>
				</div>{/if}
			<div class="flex flex-wrap gap-2">
				<Button type="submit" size="sm" disabled={!ready || busy}
					>{#if busy}<Loader2
							class="size-4 animate-spin motion-reduce:animate-none"
						/>{/if}{action.buttonLabel || m.assistant_continue({}, options)}</Button
				><Button
					type="button"
					size="sm"
					variant="ghost"
					onclick={() => respond(false)}
					disabled={busy}>{m.assistant_reject({}, options)}</Button
				>
			</div>
		</form>{:else}<p class="text-muted-foreground text-xs" role="status">{status}</p>{/if}
	{#if action.hasPrivateResult}<Button variant="outline" size="sm" onclick={reveal}
			>{m.assistant_reveal({}, options)}</Button
		>{#if privateResult}<pre
				class="bg-muted overflow-x-auto whitespace-pre-wrap break-all rounded-lg p-3 text-xs">{privateResult}</pre>{/if}{/if}
	{#if error}<p class="text-destructive text-sm" role="alert">{error}</p>{/if}
</div>
