<script lang="ts">
	import { onMount, tick, untrack } from "svelte";
	import { getContextClient, subscriptionStore } from "@urql/svelte";
	import type { AssistantConversationFieldsFragment } from "$lib/gql/graphql";
	import { CHAT_GET, CHAT_WATCH, CHAT_SEND, CHAT_STOP } from "$lib/assistant";
	import { authenticatedFetch } from "$lib/graphql/client";
	import { onGraphQLRecovered } from "$lib/graphql/app-recovery";
	import Message from "./message.svelte";
	import Action from "./action.svelte";
	import Image from "./image.svelte";
	import Composer from "./composer.svelte";
	import { MessageCircle } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	let { id, enabled, onchange }: { id: string; enabled: boolean; onchange: (conversation: AssistantConversationFieldsFragment) => void } = $props();
	const options = $derived(locale.messageOptions());
	const client = getContextClient();
	let conversation = $state<AssistantConversationFieldsFragment | null>(null);
	let error = $state("");
	let scroller = $state<HTMLDivElement>();
	let nearBottom = true;
	let hasScrolled = false;
	const events = subscriptionStore({
		client,
		query: CHAT_WATCH,
		variables: { id: untrack(() => id) },
	});
	const active = $derived(
		conversation?.runs.find((r) => r.state === "RUNNING" || r.state === "WAITING") ??
			conversation?.runs.find((r) => r.state === "QUEUED"),
	);
	const activity = $derived(
		active?.state === "WAITING"
			? m.assistant_waiting({}, options)
			: active?.state === "QUEUED"
				? m.assistant_queued({}, options)
				: active?.activity === "classifying"
					? m.assistant_classifying({}, options)
					: active?.activity === "retrying"
						? m.assistant_retrying({}, options)
						: active?.activity === "writing" ? m.assistant_writing({}, options) : active?.activity === "reading" ? m.assistant_reading({},options) : m.assistant_thinking({}, options),
	);
	function apply(c: AssistantConversationFieldsFragment) {
		if (!conversation || c.revision > conversation.revision) {
			conversation = c;
			onchange(c);
		}
	}
	async function load() {
		const r = await client.query(CHAT_GET, { id }, { requestPolicy: "network-only" }).toPromise();
		if (r.error) error = r.error.message;
		else if (r.data) {
			error = "";
			apply(r.data.assistantConversation);
		}
	}
	const uploads = new Map<string, string[]>();
	async function send(text: string, files: File[], clientId: string) {
		let ids = uploads.get(clientId) ?? [];
		for (let i = ids.length; i < files.length; i++) {
			const form = new FormData();
			form.set("file", files[i]);
			const response = await authenticatedFetch(
				`/api/assistant/attachments?conversationId=${encodeURIComponent(id)}`,
				{ method: "POST", body: form },
			);
			if (!response.ok) throw new Error(await response.text());
			const a: { id: string } = await response.json();
			ids = [...ids, a.id];
			uploads.set(clientId, ids);
		}
		const r = await client
			.mutation(CHAT_SEND, { input: { conversationId: id, clientId, text, attachmentIds: ids } })
			.toPromise();
		if (r.error) throw r.error;
		if (r.data) apply(r.data.sendAssistantMessage);
		uploads.delete(clientId);
	}
	async function stop() {
		const r = await client.mutation(CHAT_STOP, { id }).toPromise();
		if (r.error) error = r.error.message;
		await load();
	}
	$effect(() => {
		const snapshot = $events.data?.assistantConversationChanged;
		if (snapshot) untrack(() => apply(snapshot));
	});
	$effect(() => {
		if (conversation?.revision !== undefined && nearBottom)
			void tick().then(() => {
				if (scroller) {
					scroller.scrollTo({ top: scroller.scrollHeight, behavior: hasScrolled ? "auto" : "instant" });
					hasScrolled = true;
				}
			});
	});
	onMount(() => {
		void load();
	});
	onGraphQLRecovered(() => {
		void load();
	});
</script>

<div class="flex min-h-0 flex-1 flex-col gap-4">
	<div
		bind:this={scroller}
		class="min-h-0 flex-1 overflow-y-auto scroll-smooth motion-reduce:scroll-auto"
		onscroll={() => {
			if (scroller)
				nearBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 100;
		}}
	>
		<div class="mx-auto max-w-3xl space-y-6 px-1 pb-3">
			{#if conversation?.messages.length === 0}<div
					class="flex min-h-48 flex-col items-center justify-center gap-3 text-center"
				>
					<MessageCircle class="text-primary size-8" />
					<h2 class="text-xl font-medium">{m.assistant_empty({}, options)}</h2>
					<p class="text-muted-foreground max-w-md text-sm">{m.assistant_hint({}, options)}</p>
				</div>{/if}
			{#each conversation?.runs ?? [] as run (run.id)}<section
					class="space-y-4"
					aria-label={run.model || m.assistant_title({}, options)}
				>
					{#each conversation?.messages.filter((message) => message.runId === run.id) ?? [] as message (message.id)}{#if message.text || message.attachments.length}<div
								class={message.role === "user"
									? "bg-muted ml-auto w-fit max-w-[90%] rounded-lg px-4 py-3"
									: "px-1"}
							>
								<Message text={message.text} />{#if message.attachments.length}<div
										class="mt-3 flex flex-wrap gap-2"
									>
										{#each message.attachments as attachment (attachment.id)}<Image
												id={attachment.id}
												name={attachment.name}
											/>{/each}
									</div>{/if}
							</div>{/if}{/each}
					{#each conversation?.actions.filter((action) => action.runId === run.id) ?? [] as action (action.id)}<Action
							{action}
							conversationId={id}
							onchange={apply}
						/>{/each}
					{#if run.state === "FAILED"}<p class="text-destructive text-sm" role="alert">
							{run.error || m.assistant_failed({}, options)}
						</p>{:else if run.state === "INTERRUPTED"}<p class="text-muted-foreground text-sm">
							{m.assistant_interrupted({}, options)}
						</p>{:else if run.state === "STOPPED"}<p class="text-muted-foreground text-xs">
							{m.assistant_stopped({}, options)}
						</p>{:else if run.state === "QUEUED"}<p class="text-muted-foreground text-xs">
							{m.assistant_queued({}, options)}
						</p>{/if}
				</section>{/each}
			{#if active}<div
					class="text-muted-foreground flex items-center gap-2 text-sm"
					role="status"
					aria-live="polite"
				>
					<span class="bg-primary size-2 rounded-full motion-safe:animate-pulse"></span>{activity}
				</div>{/if}
		</div>
	</div>
	{#if error}<p class="text-destructive text-sm" role="alert">{error}</p>{/if}
	<div class="mx-auto w-full max-w-3xl">
		<Composer
			disabled={!enabled || !conversation}
			running={!!active}
			waiting={active?.state === "WAITING"}
			onsend={send}
			onstop={stop}
		/>
	</div>
</div>
