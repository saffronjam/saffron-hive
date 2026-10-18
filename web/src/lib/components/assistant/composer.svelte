<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Textarea } from "$lib/components/ui/textarea";
	import { ArrowUp, Paperclip, Square, X, Loader2 } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	let {
		disabled = false,
		running = false,
		waiting = false,
		onsend,
		onstop,
	}: {
		disabled?: boolean;
		running?: boolean;
		waiting?: boolean;
		onsend: (text: string, files: File[], clientId: string) => Promise<void>;
		onstop?: () => void;
	} = $props();
	const options = $derived(locale.messageOptions());
	let text = $state("");
	let files = $state<File[]>([]);
	let busy = $state(false);
	let error = $state("");
	let input: HTMLInputElement;
	let clientId = crypto.randomUUID();
	function attach(selected: FileList | null) {
		if (!selected) return;
		const next = [...files, ...Array.from(selected)];
		if (
			next.length > 4 ||
			next.some((f) => f.size > 25 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(f.type))
		) {
			error = m.assistant_image_limit({}, options);
			return;
		}
		files = next;
		error = "";
	}
	async function send() {
		if (busy || disabled || waiting || (!text.trim() && !files.length)) return;
		busy = true;
		error = "";
		try {
			await onsend(text, files, clientId);
			text = "";
			files = [];
			clientId = crypto.randomUUID();
		} catch (e) {
			error = e instanceof Error ? e.message : m.assistant_error({}, options);
		} finally {
			busy = false;
		}
	}
</script>

<form
	class="bg-card shadow-card rounded-lg p-3"
	onsubmit={(e) => {
		e.preventDefault();
		void send();
	}}
>
	{#if files.length}<div class="mb-2 flex flex-wrap gap-2">
			{#each files as file, i (i)}<span
					class="bg-muted flex max-w-full items-center gap-1 rounded-md px-2 text-xs"
					><span class="truncate">{file.name}</span><Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label={m.assistant_remove_image({}, options)}
						onclick={() => (files = files.filter((_, j) => j !== i))}
						disabled={busy}><X class="size-3" /></Button
					></span
				>{/each}
		</div>{/if}
	<Textarea
		bind:value={text}
		oninput={(event) => { event.currentTarget.value = Array.from(event.currentTarget.value).slice(0, 32000).join(""); }}
		rows={2}
		class="min-h-16 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
		placeholder={waiting ? m.assistant_waiting({}, options) : m.assistant_placeholder({}, options)}
		aria-label={m.assistant_placeholder({}, options)}
		disabled={disabled || busy || waiting}
		onkeydown={(e) => {
			if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
				e.preventDefault();
				void send();
			}
		}}
		onpaste={(e) => {
			if (e.clipboardData?.files.length) {
				e.preventDefault();
				attach(e.clipboardData.files);
			}
		}}
	/>
	<div class="mt-2 flex items-center justify-between">
		<input
			bind:this={input}
			type="file"
			accept="image/jpeg,image/png,image/webp"
			multiple
			class="hidden"
			onchange={() => {
				attach(input.files);
				input.value = "";
			}}
		/><Button
			type="button"
			variant="ghost"
			size="icon-sm"
			aria-label={m.assistant_attach({}, options)}
			disabled={disabled || busy || waiting}
			onclick={() => input.click()}><Paperclip class="size-4" /></Button
		>
		<div class="flex items-center gap-2">
			{#if running}<Button type="button" variant="ghost" size="sm" onclick={onstop}
					><Square class="size-3" />{m.assistant_stop({}, options)}</Button
				>{/if}<Button
				type="submit"
				size="icon-sm"
				aria-label={m.assistant_send({}, options)}
				disabled={disabled || busy || waiting || (!text.trim() && !files.length)}
				>{#if busy}<Loader2 class="size-4 animate-spin motion-reduce:animate-none" />{:else}<ArrowUp
						class="size-4"
					/>{/if}</Button
			>
		</div>
	</div>
	{#if error}<p class="text-destructive mt-2 text-sm" role="alert">{error}</p>{/if}
</form>
