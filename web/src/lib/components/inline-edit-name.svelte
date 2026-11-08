<script lang="ts">
 import { tick } from "svelte";
 import ResourceLink from "$lib/components/resource-link.svelte";
 import { graphqlErrorMessage } from "$lib/graphql-error";
	import {toast} from "svelte-sonner";
 import {m} from "$lib/i18n/messages";
 import type {LocalizedNameSet} from "$lib/i18n/names";
	import { getContextClient } from "@urql/svelte";
	import { locale } from "$lib/i18n/locale.svelte";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";

	interface Props {
		name: string;
    href?: string;
		class?: string;
		onsave: (newName: string) => void | Promise<void>;
		entityType?: string;
		entityId?: string;
	}

	let { name, href, class: className = "", onsave, entityType, entityId }: Props = $props();
	const client = getContextClient();

	let editing = $state(false);
 let originalName="";
 let originalNames:LocalizedNameSet|undefined;
	let editValue = $state("");
	let optimisticName = $state<string | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);
	let container = $state<HTMLDivElement | null>(null);

	const displayName = $derived(optimisticName ?? name);

	$effect(() => {
		if (optimisticName !== null && name === optimisticName) {
			optimisticName = null;
		}
	});

	export function startEditing() {
		originalName=displayName;
 originalNames=entityType&&entityId?structuredClone($state.snapshot(localizedNamesStore.get(entityType,entityId))):undefined;
		editValue = displayName;
		editing = true;
		requestAnimationFrame(() => {
			inputEl?.focus();
			inputEl?.select();
		});
	}

	async function commit() {
 if (!editing) return;
		finishEditing();
		const trimmed = editValue.trim();
		const names=originalNames;
 if(name!==originalName&&optimisticName===null){toast.error(m.editor_changed_elsewhere({},locale.messageOptions()));return;}
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
			try {
				await onsave(trimmed);
			} catch (error) {
				toast.error(graphqlErrorMessage(error, m.common_error_generic({}, locale.messageOptions())));
			} finally {
				optimisticName = null;
			}
		}
	}

	function finishEditing() {
		const restoreFocus = inputEl === document.activeElement;
		editing = false;
		if (href && restoreFocus) void tick().then(() => container?.querySelector("a")?.focus());
	}

	function cancel() {
		finishEditing();
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
<div bind:this={container} class="relative min-w-0 overflow-hidden {className}" ondblclick={href ? undefined : startEditing}>
	<h3 class="truncate font-medium text-card-foreground {editing ? 'invisible' : ''}">{#if href}<ResourceLink {href}>{displayName}</ResourceLink>{:else}{displayName}{/if}</h3>
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
