<script lang="ts">
	import EntityReference from "./entity-reference.svelte";
	import { messageBlocks } from "$lib/assistant-markdown";
	import * as Table from "$lib/components/ui/table";
	import { Lexer, type Token } from "marked";
	let { text }: { text: string } = $props();
	const blocks = $derived(messageBlocks(text));
</script>

{#snippet inline(value: string | Token[])}
	{#each typeof value === "string" ? Lexer.lexInline(value) : value as token, j (j)}
		{#if token.type === "strong"}<strong>{@render inline(token.tokens ?? [])}</strong>
		{:else if token.type === "em"}<em>{@render inline(token.tokens ?? [])}</em>
		{:else if token.type === "del"}<del>{@render inline(token.tokens ?? [])}</del>
		{:else if token.type === "codespan"}<code class="bg-muted rounded px-1 py-0.5 text-xs">{token.text}</code>
		{:else if token.type === "link" && /^\/[a-zA-Z0-9/_?=&%.-]+$/.test(token.href) && !token.href.startsWith("//")}
			<a href={token.href} class="text-primary underline underline-offset-4">{@render inline(token.tokens ?? [])}</a>
		{:else if token.type === "br"}<br />
		{:else if token.type === "text" || token.type === "escape"}{token.text}
		{:else}{token.raw}{/if}
	{/each}
{/snippet}

<div class="min-w-0 space-y-3 text-sm leading-7 break-words">
	{#each blocks as block, i (i)}
		{#if block.kind === "entity"}<EntityReference reference={block.reference} label={block.text} />
		{:else if block.kind === "code"}<pre
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
