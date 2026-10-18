<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { getContextClient } from "@urql/svelte";
	import { CHAT_LIST, CHAT_CREATE, CHAT_RENAME, CHAT_DELETE } from "$lib/assistant";
	import type { AssistantChatListQuery } from "$lib/gql/graphql";
	import { onGraphQLRecovered } from "$lib/graphql/app-recovery";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import Conversation from "$lib/components/assistant/conversation.svelte";
	import { Plus, Pencil, Trash2, MessageCircle, LockKeyhole } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { formatRelative, formatFull } from "$lib/time-format";
	const options = $derived(locale.messageOptions());
	const client = getContextClient();
	let chats = $state<AssistantChatListQuery["assistantConversations"]>([]);
	let enabled = $state(false);
	let loaded = $state(false);
	let error = $state("");
	let busy = $state(false);
	let deleting = $state(false);
	let renaming = $state(false);
	let title = $state("");
	let now = $state(new Date());
	const id = $derived(page.url.searchParams.get("chat") ?? "");
	const selected = $derived(chats.find((c) => c.id === id));
	function chatName(chat: AssistantChatListQuery["assistantConversations"][number]) {
		return chat.titleOverride || chat.autoTitle || m.assistant_new({}, options);
	}
	function updateChat({ id, autoTitle, titleOverride, revision, updatedAt }: Omit<AssistantChatListQuery["assistantConversations"][number], "__typename">) {
		const chat = { id, autoTitle, titleOverride, revision, updatedAt };
		const current = chats.find((c) => c.id === chat.id);
		if (!current || chat.revision > current.revision) {
			chats = [...chats.filter((c) => c.id !== chat.id), chat].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
		}
	}
	async function load() {
		const r = await client.query(CHAT_LIST, {}, { requestPolicy: "network-only" }).toPromise();
		if (r.error) {
			error = r.error.message;
			return;
		}
		chats = (r.data?.assistantConversations ?? []).map((chat) => {
			const current = chats.find((c) => c.id === chat.id);
			return current && current.revision > chat.revision ? current : chat;
		});
		enabled = r.data?.claudeConfig?.enabled ?? false;
		loaded = true;
		if (!id && chats.length) await choose(chats[0].id);
	}
	async function choose(value: string) {
		await goto(`/assistant?chat=${encodeURIComponent(value)}`, {
			replaceState: true,
			noScroll: true,
		});
	}
	async function create() {
		busy = true;
		try {
			const r = await client
				.mutation(CHAT_CREATE, {})
				.toPromise();
			if (r.error) throw r.error;
			if (r.data) {
				await choose(r.data.createAssistantConversation.id);
				await load();
			}
		} catch (e) {
			error = e instanceof Error ? e.message : m.assistant_error({}, options);
		} finally {
			busy = false;
		}
	}
	async function remove() {
		busy = true;
		const r = await client.mutation(CHAT_DELETE, { id }).toPromise();
		busy = false;
		if (r.error) {
			error = r.error.message;
			return;
		}
		deleting = false;
		await goto("/assistant", { replaceState: true });
		await load();
	}
	async function rename() {
		busy = true;
		const r = await client.mutation(CHAT_RENAME, { id, title }).toPromise();
		busy = false;
		if (r.error) {
			error = r.error.message;
			return;
		}
		renaming = false;
		await load();
	}
	$effect(() => {
		pageHeader.breadcrumbs = [{ label: m.assistant_title({}, options) }];
		pageHeader.viewToggle = null;
		pageHeader.actions = [
			{
				label: m.assistant_new({}, options),
				icon: Plus,
				disabled: !enabled || busy,
				onclick: () => {
					void create();
				},
			},
		];
	});
	onMount(() => {
		void load();
		const timer = setInterval(() => { now = new Date(); }, 30_000);
		return () => clearInterval(timer);
	});
	onGraphQLRecovered(() => {
		void load();
	});
</script>

<div class="mx-auto flex h-[calc(100dvh-9rem)] min-h-96 w-full max-w-5xl flex-col gap-4">
	<div class="flex items-center justify-between gap-2">
		<div class="min-w-0 flex-1">
			<Select
				type="single"
				value={id}
				disabled={chats.length === 0}
				onValueChange={(v) => {
					if (v) void choose(v);
				}}
				><SelectTrigger class="w-full max-w-sm" aria-label={m.assistant_history({}, options)}
					>{selected ? chatName(selected) : m.assistant_history({}, options)}</SelectTrigger
				><SelectContent
					>{#each chats as chat (chat.id)}<SelectItem value={chat.id} label={chatName(chat)}>
							<div class="flex min-w-0 items-baseline gap-2">
								<span class="truncate">{chatName(chat)}</span>
								<time datetime={chat.updatedAt} title={formatFull(new Date(chat.updatedAt))} class="text-muted-foreground shrink-0 text-xs">{formatRelative(new Date(chat.updatedAt), now, "relative")}</time>
							</div>
						</SelectItem
						>{/each}</SelectContent
				></Select
			>
		</div>
		{#if selected}<Button
				variant="ghost"
				size="icon-sm"
				aria-label={m.assistant_rename({}, options)}
				onclick={() => {
					title = selected?.titleOverride ?? "";
					renaming = true;
				}}><Pencil class="size-4" /></Button
			><Button
				variant="ghost"
				size="icon-sm"
				aria-label={m.assistant_delete({}, options)}
				onclick={() => (deleting = true)}><Trash2 class="size-4" /></Button
			>{/if}
	</div>
	{#if error}<p role="alert" class="text-destructive text-sm">{error}</p>{/if}
	{#if loaded && !enabled}<div
			class="bg-card shadow-card flex flex-wrap items-center justify-between gap-3 rounded-lg p-4"
		>
			<p class="text-muted-foreground text-sm">{m.assistant_disabled({}, options)}</p>
			<Button variant="outline" size="sm" href="/integrations/claude"
				>{m.assistant_configure({}, options)}</Button
			>
		</div>{/if}
	{#if id}{#key id}<Conversation
				{id}
				enabled={enabled && !busy}
				onchange={updateChat}
			/>{/key}
	{:else if loaded}<div class="flex flex-1 flex-col items-center justify-center gap-4 text-center">
			<div class="bg-primary/10 text-primary rounded-lg p-4"><MessageCircle class="size-8" /></div>
			<h2 class="text-xl font-medium">{m.assistant_empty({}, options)}</h2>
			<p class="text-muted-foreground max-w-md text-sm">{m.assistant_hint({}, options)}</p>
			<Button disabled={!enabled || busy} onclick={create}
				><Plus class="size-4" />{m.assistant_new({}, options)}</Button
			>
		</div>{/if}
	<p class="text-muted-foreground flex items-center justify-center gap-1 text-xs">
		<LockKeyhole class="size-3" />{m.assistant_private({}, options)}
	</p>
</div>
<ConfirmDialog
	open={deleting}
	title={m.assistant_delete({}, options)}
	description={m.assistant_delete_description({}, options)}
	confirmLabel={m.assistant_delete({}, options)}
	loading={busy}
	onconfirm={() => {
		void remove();
	}}
	oncancel={() => (deleting = false)}
/>
<ConfirmDialog
	open={renaming}
	title={m.assistant_rename({}, options)}
	description={m.assistant_name_hint({}, options)}
	confirmLabel={m.common_save({}, options)}
	variant="default"
	loading={busy}
	onconfirm={() => {
		void rename();
	}}
	oncancel={() => (renaming = false)}
	><Input
		aria-label={m.assistant_rename({}, options)}
		bind:value={title}
		placeholder={selected?.autoTitle || m.assistant_new({}, options)}
		oninput={(event) => { event.currentTarget.value = Array.from(event.currentTarget.value).slice(0, 120).join(""); }}
	/></ConfirmDialog
>
