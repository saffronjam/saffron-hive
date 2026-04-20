<script lang="ts" module>
	type TokenKind = "key" | "string" | "number" | "boolean" | "null" | "punct";
	interface Token {
		kind: TokenKind;
		text: string;
	}

	/**
	 * Tokenise a compact JSON string for colored inline rendering. Walks the
	 * input once, classifying runs of characters. Whitespace is preserved as
	 * "punct" so the output string round-trips visually. Invalid JSON still
	 * tokenises best-effort — everything else is treated as punct.
	 */
	export function tokenize(input: string): Token[] {
		const tokens: Token[] = [];
		const n = input.length;
		let i = 0;

		while (i < n) {
			const c = input[i];

			if (c === '"') {
				let end = i + 1;
				while (end < n) {
					if (input[end] === "\\") {
						end += 2;
						continue;
					}
					if (input[end] === '"') break;
					end++;
				}
				const text = input.slice(i, Math.min(end + 1, n));
				const after = nextNonSpace(input, Math.min(end + 1, n));
				const kind: TokenKind = input[after] === ":" ? "key" : "string";
				tokens.push({ kind, text });
				i = Math.min(end + 1, n);
				continue;
			}

			if (c === "t" && input.startsWith("true", i)) {
				tokens.push({ kind: "boolean", text: "true" });
				i += 4;
				continue;
			}
			if (c === "f" && input.startsWith("false", i)) {
				tokens.push({ kind: "boolean", text: "false" });
				i += 5;
				continue;
			}
			if (c === "n" && input.startsWith("null", i)) {
				tokens.push({ kind: "null", text: "null" });
				i += 4;
				continue;
			}

			if (c === "-" || (c >= "0" && c <= "9")) {
				let end = i + 1;
				while (end < n && /[0-9.eE+-]/.test(input[end])) end++;
				tokens.push({ kind: "number", text: input.slice(i, end) });
				i = end;
				continue;
			}

			// Coalesce runs of punctuation/whitespace.
			let end = i + 1;
			while (end < n) {
				const ch = input[end];
				if (ch === '"' || ch === "t" || ch === "f" || ch === "n" || ch === "-" || (ch >= "0" && ch <= "9")) break;
				end++;
			}
			tokens.push({ kind: "punct", text: input.slice(i, end) });
			i = end;
		}

		return tokens;
	}

	function nextNonSpace(s: string, from: number): number {
		let i = from;
		while (i < s.length && (s[i] === " " || s[i] === "\t" || s[i] === "\n")) i++;
		return i;
	}
</script>

<script lang="ts">
	interface Props {
		value: string;
		class?: string;
	}

	let { value, class: className = "" }: Props = $props();

	const tokens = $derived(tokenize(value));

	const classFor: Record<TokenKind, string> = {
		key: "text-primary",
		string: "text-emerald-500 dark:text-emerald-400",
		number: "text-sky-600 dark:text-sky-400",
		boolean: "text-amber-600 dark:text-amber-400",
		null: "text-muted-foreground",
		punct: "text-muted-foreground",
	};
</script>

<span class="font-mono text-xs whitespace-pre {className}">
	{#each tokens as tok, i (i)}<span class={classFor[tok.kind]}>{tok.text}</span>{/each}
</span>
