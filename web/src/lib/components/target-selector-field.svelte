<script lang="ts">
	import { tick } from "svelte";
	import { badgeVariants } from "$lib/components/ui/badge/index.js";
	import { cn } from "$lib/utils.js";
	import { X } from "@lucide/svelte";
	import {
		CLAUSE_SUBJECTS,
		CLAUSE_OPS,
		CLAUSE_KINDS,
		evaluateExpression,
		type Clause,
		type GroupLite,
		type RoomLite,
	} from "$lib/target-resolve";
	import type { Device } from "$lib/gql/graphql";

	interface Props {
		value: Clause[];
		onchange: (next: Clause[]) => void;
		devices: Device[];
		groups: GroupLite[];
		rooms: RoomLite[];
	}

	let { value, onchange, devices, groups, rooms }: Props = $props();

	interface Option {
		value: string;
		label: string;
	}

	let draft = $state<{ connector?: string; subject?: string; op?: string; values: string[] }>({
		values: [],
	});
	let query = $state("");
	let open = $state(false);
	let activeIdx = $state(0);
	let inputRef = $state<HTMLInputElement | null>(null);
	let wrapperRef = $state<HTMLDivElement | null>(null);

	function onFocusOut(e: FocusEvent) {
		const next = e.relatedTarget as Node | null;
		if (!next || !wrapperRef?.contains(next)) open = false;
	}

	const nameById = $derived.by(() => {
		const m = new Map<string, string>();
		for (const d of devices) m.set(d.id, d.name);
		for (const g of groups) m.set(g.id, g.name ?? g.id);
		for (const r of rooms) m.set(r.id, r.name ?? r.id);
		return m;
	});

	const subjectLabel = (v: string) => CLAUSE_SUBJECTS.find((s) => s.value === v)?.label ?? v;
	const opLabel = (v: string) => CLAUSE_OPS.find((o) => o.value === v)?.label ?? v;
	const valueLabel = (subject: string, v: string) =>
		subject === "device_type" || subject === "device_role"
			? v.charAt(0).toUpperCase() + v.slice(1)
			: (nameById.get(v) ?? v);

	const isPlural = (op?: string) => op === "is_one_of" || op === "is_not_one_of";

	type Phase = "connector" | "subject" | "op" | "value";
	const phase = $derived<Phase>(
		value.length > 0 && !draft.connector && !draft.subject
			? "connector"
			: !draft.subject
				? "subject"
				: !draft.op
					? "op"
					: "value",
	);

	function valueOptions(subject: string): Option[] {
		if (subject === "device_type" || subject === "device_role")
			return CLAUSE_KINDS.map((k) => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }));
		if (subject === "room") return rooms.map((r) => ({ value: r.id, label: r.name ?? r.id }));
		if (subject === "group") return groups.map((g) => ({ value: g.id, label: g.name ?? g.id }));
		return devices.map((d) => ({ value: d.id, label: d.name }));
	}

	const suggestions = $derived.by<Option[]>(() => {
		const q = query.trim().toLowerCase();
		const match = (o: Option) => !q || o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q);
		if (phase === "connector") return [{ value: "and", label: "and" }, { value: "or", label: "or" }].filter(match);
		if (phase === "subject") return CLAUSE_SUBJECTS.map((s) => ({ value: s.value, label: s.label })).filter(match);
		if (phase === "op") return CLAUSE_OPS.map((o) => ({ value: o.value, label: o.label })).filter(match);
		return valueOptions(draft.subject ?? "").filter((o) => !draft.values.includes(o.value)).filter(match);
	});

	const canCommit = $derived(
		phase === "value" && isPlural(draft.op) && draft.values.length > 0,
	);

	const resolvedCount = $derived(evaluateExpression(value, devices, groups, rooms).length);

	$effect(() => {
		void phase;
		void query;
		activeIdx = 0;
	});

	function focusInput() {
		tick().then(() => inputRef?.focus());
	}

	function pick(opt: Option) {
		if (phase === "connector") draft = { ...draft, connector: opt.value };
		else if (phase === "subject") draft = { ...draft, subject: opt.value };
		else if (phase === "op") draft = { ...draft, op: opt.value };
		else {
			const values = [...draft.values, opt.value];
			if (!isPlural(draft.op)) {
				commit({ ...draft, values });
				query = "";
				open = true;
				focusInput();
				return;
			}
			draft = { ...draft, values };
		}
		query = "";
		open = true;
		focusInput();
	}

	function commit(d: { connector?: string; subject?: string; op?: string; values: string[] }) {
		if (!d.subject || !d.op || d.values.length === 0) return;
		const clause: Clause = { subject: d.subject, op: d.op, values: d.values };
		if (value.length > 0) clause.connector = d.connector ?? "and";
		onchange([...value, clause]);
		draft = { values: [] };
		query = "";
	}

	function commitDraft() {
		if (canCommit) commit(draft);
	}

	function removeClause(i: number) {
		const next = value.filter((_, idx) => idx !== i);
		if (next.length > 0) next[0] = { ...next[0], connector: undefined };
		onchange(next);
	}

	function stepBack() {
		if (draft.values.length > 0) {
			draft = { ...draft, values: draft.values.slice(0, -1) };
		} else if (draft.op) {
			draft = { ...draft, op: undefined };
		} else if (draft.subject) {
			draft = { ...draft, subject: undefined };
		} else if (draft.connector) {
			draft = { ...draft, connector: undefined };
		} else if (value.length > 0) {
			removeClause(value.length - 1);
		}
	}

	function onKeydown(e: KeyboardEvent) {
		e.stopPropagation();
		if (e.key === "Backspace" && query === "") {
			e.preventDefault();
			stepBack();
			return;
		}
		if (e.key === "Enter") {
			e.preventDefault();
			if (open && suggestions.length > 0) {
				pick(suggestions[activeIdx] ?? suggestions[0]);
				return;
			}
			if (canCommit) commitDraft();
			return;
		}
		if (e.key === "ArrowDown") {
			e.preventDefault();
			open = true;
			if (suggestions.length > 0) activeIdx = (activeIdx + 1) % suggestions.length;
			return;
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			if (suggestions.length > 0) activeIdx = (activeIdx - 1 + suggestions.length) % suggestions.length;
			return;
		}
		if (e.key === "Escape" && open) {
			e.preventDefault();
			open = false;
			inputRef?.blur();
		}
	}

	const placeholder = $derived(
		phase === "connector"
			? "and / or…"
			: phase === "subject"
				? value.length === 0 && draft.values.length === 0
					? "Add a rule…"
					: "field…"
				: phase === "op"
					? "is / is not…"
					: "value…",
	);
</script>

<div class="flex flex-col gap-2">
	<div bind:this={wrapperRef} class="relative" onfocusout={onFocusOut}>
		<div
			class="inline-flex w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background p-1.5"
			onclick={() => {
				open = true;
				inputRef?.focus();
			}}
			role="presentation"
		>
			{#each value as clause, i (i)}
				{#if i > 0}
					<span class="text-[11px] font-medium uppercase text-muted-foreground">{clause.connector ?? "and"}</span>
				{/if}
				<span class={cn(badgeVariants({ variant: "secondary" }), "gap-1")}>
					{subjectLabel(clause.subject)} {opLabel(clause.op)}
					{clause.values.map((v) => valueLabel(clause.subject, v)).join(", ")}
					<button
						type="button"
						class="text-muted-foreground hover:text-foreground"
						onclick={(e) => {
							e.stopPropagation();
							removeClause(i);
						}}
						aria-label="Remove rule"
					>
						<X class="size-3" />
					</button>
				</span>
			{/each}

			{#if draft.connector}
				<span class="text-[11px] font-medium uppercase text-muted-foreground">{draft.connector}</span>
			{/if}
			{#if draft.subject}
				<span class={badgeVariants({ variant: "outline" })}>{subjectLabel(draft.subject)}</span>
			{/if}
			{#if draft.op}
				<span class={badgeVariants({ variant: "outline" })}>{opLabel(draft.op)}</span>
			{/if}
			{#each draft.values as v (v)}
				<span class={badgeVariants({ variant: "outline" })}>{valueLabel(draft.subject ?? "", v)}</span>
			{/each}

			<input
				bind:this={inputRef}
				bind:value={query}
				{placeholder}
				class="min-w-[8ch] flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
				oninput={() => (open = true)}
				onfocus={() => (open = true)}
				onkeydown={onKeydown}
			/>
		</div>

		{#if open}
			<ul
				role="listbox"
				class="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md border border-input bg-popover py-1 shadow-card"
			>
				{#if suggestions.length === 0}
					<li class="px-2.5 py-1 text-xs text-muted-foreground">
						{phase === "value" ? "No matches" : "Type to filter…"}
					</li>
				{:else}
					{#each suggestions as opt, i (opt.value)}
						<li
							role="option"
							aria-selected={i === activeIdx}
							class={cn(
								"px-2.5 py-1 text-xs leading-5 transition-colors",
								i === activeIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
							)}
							onmousedown={(e) => {
								e.preventDefault();
								pick(opt);
							}}
							onmouseenter={() => (activeIdx = i)}
						>
							{opt.label}
						</li>
					{/each}
				{/if}
				{#if canCommit}
					<button
						type="button"
						class="mt-1 block w-full border-t px-2.5 py-1 text-left text-xs text-muted-foreground hover:bg-accent/50"
						onmousedown={(e) => {
							e.preventDefault();
							commitDraft();
						}}
					>
						Done — add this rule (Enter)
					</button>
				{/if}
			</ul>
		{/if}
	</div>

	<span class="text-xs text-muted-foreground">{resolvedCount} device{resolvedCount === 1 ? "" : "s"}</span>
</div>
