<script lang="ts">
	import { messageBlocks } from "$lib/assistant-markdown";
	import * as Table from "$lib/components/ui/table";
	let { text }: { text: string } = $props();
	const blocks = $derived(messageBlocks(text));
	function parts(value: string) {
		return value.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\(\/[a-zA-Z0-9/_?=&%.-]+\))/g);
	}
</script>

{#snippet inline(value: string)}
	{#each parts(value) as part, j (j)}
		{#if part.startsWith("**") && part.endsWith("**")}<strong>{part.slice(2, -2)}</strong>
		{:else if part.startsWith("`") && part.endsWith("`")}<code
				class="bg-muted rounded px-1 py-0.5 text-xs">{part.slice(1, -1)}</code
			>
		{:else if /^\[[^\]]+\]\(\/[^/]/.test(part)}
			{@const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)}
			{#if link}<a href={link[2]} class="text-primary underline underline-offset-4">{link[1]}</a
				>{:else}{part}{/if}
		{:else}{part}{/if}
	{/each}
{/snippet}

<div class="min-w-0 space-y-3 text-sm leading-7 break-words">
	{#each blocks as block, i (i)}
		{#if block.kind === "code"}<pre
				class="bg-muted overflow-x-auto rounded-lg p-4 text-xs leading-6"><code>{block.text}</code
				></pre>
		{:else if block.kind === "heading"}
			<svelte:element this={`h${block.level}`} class={['font-semibold leading-snug', block.level === 1 ? 'text-xl' : block.level === 2 ? 'text-lg' : block.level === 3 ? 'text-base' : 'text-sm']}>
				{@render inline(block.text)}
			</svelte:element>
		{:else if block.kind === "table"}
			<div class="overflow-hidden rounded-lg border border-border">
				<Table.Root>
					<Table.Header
						><Table.Row>
							{#each block.headers as header, column (column)}
								<Table.Head scope="col" style={`text-align: ${block.alignments[column]}`}
									>{@render inline(header)}</Table.Head
								>
							{/each}
						</Table.Row></Table.Header
					>
					<Table.Body>
						{#each block.rows as row, index (index)}<Table.Row>
								{#each row as cell, column (column)}
									<Table.Cell style={`text-align: ${block.alignments[column]}`}
										>{@render inline(cell)}</Table.Cell
									>
								{/each}
							</Table.Row>{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{:else}<div class="whitespace-pre-wrap">
				{@render inline(block.text)}
			</div>{/if}
	{/each}
</div>
