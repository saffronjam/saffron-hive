<script lang="ts">
	interface Props {
		name: string;
		class?: string;
		onsave: (newName: string) => void;
	}

	let { name, class: className = "", onsave }: Props = $props();

	let editing = $state(false);
	let editValue = $state("");
	let inputEl = $state<HTMLInputElement | null>(null);

	function startEditing() {
		editValue = name;
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
<div class="relative min-w-0 {className}" ondblclick={startEditing}>
	<h3
		class="truncate font-medium text-card-foreground {editing ? 'invisible' : ''}"
		title="Double-click to rename"
	>{editing ? editValue : name}</h3>
	{#if editing}
		<input
			bind:this={inputEl}
			bind:value={editValue}
			class="absolute inset-0 w-full truncate rounded bg-transparent px-0 py-0 font-medium text-card-foreground outline-none ring-1 ring-ring/50 focus:ring-2 focus:ring-ring"
			onblur={commit}
			onkeydown={handleKeydown}
		/>
	{/if}
</div>
