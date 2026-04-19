<script lang="ts">
	interface Props {
		name: string;
		class?: string;
		onsave: (newName: string) => void;
	}

	let { name, class: className = "", onsave }: Props = $props();

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

	function commit() {
		editing = false;
		const trimmed = editValue.trim();
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
			commit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			cancel();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative min-w-0 overflow-hidden {className}" ondblclick={startEditing}>
	<h3
		class="truncate font-medium text-card-foreground {editing ? 'invisible' : ''}"
		title="Double-click to rename"
	>{displayName}</h3>
	{#if editing}
		<input
			bind:this={inputEl}
			bind:value={editValue}
			class="absolute inset-0 w-full min-w-0 truncate bg-transparent px-0 py-0 font-medium text-card-foreground outline-none border-b-2 border-ring"
			onblur={commit}
			onkeydown={handleKeydown}
		/>
	{/if}
</div>
