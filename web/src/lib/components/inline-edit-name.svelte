<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { locale } from "$lib/i18n/locale.svelte";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";

	interface Props {
		name: string;
		class?: string;
		onsave: (newName: string) => void;
		entityType?: string;
		entityId?: string;
	}

	let { name, class: className = "", onsave, entityType, entityId }: Props = $props();
	const client = getContextClient();

	let editing = $state(false);
	let editValue = $state("");
	let optimisticName = $state<string | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);

	const displayName = $derived(optimisticName ?? name);

	$effect(() => {
		if (optimisticName !== null && name === optimisticName) {
			optimisticName = null;
		}
	});

	function startEditing() {
		editValue = displayName;
		editing = true;
		requestAnimationFrame(() => {
			inputEl?.focus();
			inputEl?.select();
		});
	}

	async function commit() {
		editing = false;
		const trimmed = editValue.trim();
		const names = entityType && entityId ? localizedNamesStore.get(entityType, entityId) : undefined;
		if (names && locale.currentLanguage !== names.sourceLanguage) {
			const current = names.translations[locale.currentLanguage]?.trim() ?? "";
			if (trimmed === current || (!trimmed && !current)) return;
			const translations = { ...names.translations };
			if (trimmed) translations[locale.currentLanguage] = trimmed;
			else delete translations[locale.currentLanguage];
			optimisticName = trimmed || null;
			if (!(await localizedNamesStore.update(client, { ...names, translations }))) {
				optimisticName = null;
			}
			return;
		}
		if (trimmed && trimmed !== name) {
			optimisticName = trimmed;
			onsave(trimmed);
		}
	}

	function cancel() {
		editing = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			void commit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			cancel();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative min-w-0 overflow-hidden {className}" ondblclick={startEditing}>
	<h3 class="truncate font-medium text-card-foreground {editing ? 'invisible' : ''}">{displayName}</h3>
	{#if editing}
		<input
			bind:this={inputEl}
			bind:value={editValue}
			class="absolute inset-0 w-full min-w-0 truncate bg-transparent px-0 py-0 font-medium text-card-foreground outline-none border-b-2 border-ring"
			spellcheck="false"
			autocorrect="off"
			autocapitalize="off"
			onblur={() => void commit()}
			onkeydown={handleKeydown}
		/>
	{/if}
</div>
