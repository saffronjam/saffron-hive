<script lang="ts">
	import { tick } from "svelte";
	import { flip } from "svelte/animate";
	import { fly } from "svelte/transition";
	import { deviceDisplayName, entityDisplayName, groupDisplayName } from "$lib/utils";
	import { badgeVariants } from "$lib/components/ui/badge/index.js";
	import { cn } from "$lib/utils.js";
	import { X } from "@lucide/svelte";
	import DeviceOptionRow from "$lib/components/graph/device-option-row.svelte";
	import { roomLabelsByDevice } from "$lib/memberships";
	import {
		clauseSubjects,
		clauseOps,
		CLAUSE_DEVICE_ROLES,
		CLAUSE_DEVICE_TYPES,
		capabilityLabel,
		capabilityOptions,
		evaluateExpression,
		type Clause,
		type GroupLite,
		type RoomLite,
	} from "$lib/target-resolve";
	import { TargetClauseConnector, TargetClauseOperator, TargetClauseSubject, type Device } from "$lib/gql/graphql";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { chipLabel } from "$lib/i18n/vocabulary";

	interface Props {
		value: Clause[];
		onchange: (next: Clause[]) => void;
		devices: Device[];
		groups: GroupLite[];
		rooms: RoomLite[];
		disabled?: boolean;
	}

	let { value, onchange, devices, groups, rooms, disabled = false }: Props = $props();
	const messageOptions = $derived(locale.messageOptions());
	const subjects = $derived.by(() => clauseSubjects());
	const operators = $derived.by(() => clauseOps());

	interface Option {
		value: string;
		label: string;
		deviceType?: string;
		roomLabel?: string;
	}

	let draft = $state<{ connector?: string; subject?: string; op?: string; values: string[] }>({
		values: [],
	});
	let query = $state("");
	let open = $state(false);
	let activeIdx = $state(0);
	let inputRef = $state<HTMLInputElement | null>(null);
	let wrapperRef = $state<HTMLDivElement | null>(null);

	function motionDuration(duration: number): number {
		if (typeof window === "undefined" || typeof Element.prototype.animate !== "function") return 0;
		return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
			? 0
			: duration;
	}

	function onFocusOut(e: FocusEvent) {
		const next = e.relatedTarget as Node | null;
		if (!next || !wrapperRef?.contains(next)) open = false;
	}

	$effect(() => {
		if (disabled) open = false;
	});

	const nameById = $derived.by(() => {
		const m = new Map<string, string>();
		for (const d of devices) m.set(d.id, deviceDisplayName(d));
		for (const g of groups) m.set(g.id, groupDisplayName(g));
		for (const r of rooms) m.set(r.id, entityDisplayName("room", r, r.id));
		return m;
	});
	const removedGroupIDs = $derived(new Set(groups.filter((g) => g.removed).map((g) => g.id)));
	const deviceRoomLabels = $derived(roomLabelsByDevice(rooms));

	const subjectLabel = (v: string) => subjects.find((s) => s.value === v)?.label ?? v;
	const isCapabilitySubject = (subject?: string) =>
		subject === TargetClauseSubject.WritableCapability || subject === TargetClauseSubject.ReportedCapability;
	const opLabel = (subject: string | undefined, v: string) => {
		if (!isCapabilitySubject(subject)) return operators.find((o) => o.value === v)?.label ?? v;
		return {
			[TargetClauseOperator.Is]: m.target_op_includes({}, messageOptions),
			[TargetClauseOperator.IsOneOf]: m.target_op_includes_any({}, messageOptions),
			[TargetClauseOperator.IsNot]: m.target_op_excludes({}, messageOptions),
			[TargetClauseOperator.IsNotOneOf]: m.target_op_includes_none({}, messageOptions),
		}[v] ?? v;
	};
	const valueLabel = (subject: string, v: string) => {
		const label = isCapabilitySubject(subject)
			? capabilityLabel(v, devices.flatMap((device) => device.capabilities ?? []))
			: subject === "device_type" || subject === "device_role"
			? chipLabel(v)
			: (nameById.get(v) ?? v);
		return subject === "group" && removedGroupIDs.has(v) ? m.target_removed({ name: label }, messageOptions) : label;
	};

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
		if (subject === TargetClauseSubject.WritableCapability || subject === TargetClauseSubject.ReportedCapability) {
			return capabilityOptions(devices, subject);
		}
		if (subject === "device_type" || subject === "device_role") {
			const kinds = subject === "device_type" ? CLAUSE_DEVICE_TYPES : CLAUSE_DEVICE_ROLES;
			return kinds.map((kind) => ({
				value: kind,
				label: chipLabel(kind),
			}));
		}
		if (subject === "room")
			return rooms.map((r) => ({ value: r.id, label: entityDisplayName("room", r, r.id) }));
		if (subject === "group") return groups.filter((g) => !g.removed).map((g) => ({ value: g.id, label: groupDisplayName(g) }));
		return devices.map((d) => ({
			value: d.id,
			label: deviceDisplayName(d),
			deviceType: d.type,
			roomLabel: deviceRoomLabels.get(d.id),
		}));
	}

	const suggestions = $derived.by<Option[]>(() => {
		const q = query.trim().toLowerCase();
		const match = (o: Option) =>
			!q ||
			o.label.toLowerCase().includes(q) ||
			o.value.toLowerCase().includes(q) ||
			o.roomLabel?.toLowerCase().includes(q);
		if (phase === "connector") return [{ value: TargetClauseConnector.And, label: m.target_connector_and({}, messageOptions) }, { value: TargetClauseConnector.Or, label: m.target_connector_or({}, messageOptions) }].filter(match);
		if (phase === "subject") return subjects.map((s) => ({ value: s.value, label: s.label })).filter(match);
		if (phase === "op") return operators.map((o) => ({ value: o.value, label: opLabel(draft.subject, o.value) })).filter(match);
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
		if (disabled) return;
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
		if (disabled) return;
		if (!d.subject || !d.op || d.values.length === 0) return;
		const clause: Clause = {
			subject: d.subject as Clause["subject"],
			op: d.op as Clause["op"],
			values: d.values,
		};
		if (value.length > 0) clause.connector = (d.connector ?? TargetClauseConnector.And) as Clause["connector"];
		onchange([...value, clause]);
		draft = { values: [] };
		query = "";
	}

	function commitDraft() {
		if (canCommit) commit(draft);
	}

	function removeClause(i: number) {
		if (disabled) return;
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
		if (disabled) return;
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
			? m.target_placeholder_connector({}, messageOptions)
			: phase === "subject"
				? value.length === 0 && draft.values.length === 0
					? m.target_placeholder_add_rule({}, messageOptions)
					: m.target_placeholder_field({}, messageOptions)
				: phase === "op"
					? isCapabilitySubject(draft.subject) ? m.target_placeholder_includes({}, messageOptions) : m.target_placeholder_operator({}, messageOptions)
					: m.target_placeholder_value({}, messageOptions),
	);
</script>

<div class={cn("flex flex-col gap-2", disabled && "pointer-events-none opacity-50")} aria-disabled={disabled}>
	<div bind:this={wrapperRef} class="relative" onfocusout={onFocusOut}>
		<div
			class="inline-flex w-full flex-wrap items-center gap-1 rounded-md border border-input bg-transparent p-1.5 shadow-xs focus-within:border-ring dark:bg-input/30"
			onclick={() => {
				if (disabled) return;
				open = true;
				inputRef?.focus();
			}}
			role="presentation"
		>
			{#each value as clause, i (clause)}
				<span
					class="inline-flex items-center gap-1"
					in:fly={{ x: 6, duration: motionDuration(150) }}
					out:fly={{ x: -6, duration: motionDuration(130) }}
					animate:flip={{ duration: motionDuration(150) }}
				>
					{#if i > 0}
						<span class="text-[11px] font-medium uppercase text-muted-foreground">{clause.connector === TargetClauseConnector.Or ? m.target_connector_or({}, messageOptions) : m.target_connector_and({}, messageOptions)}</span>
					{/if}
					<span class={cn(badgeVariants({ variant: "secondary" }), "gap-1")}>
						{subjectLabel(clause.subject)} {opLabel(clause.subject, clause.op)}
						{clause.values.map((v) => valueLabel(clause.subject, v)).join(", ")}
						<button
							type="button"
							{disabled}
							class="text-muted-foreground hover:text-foreground"
							onclick={(e) => {
								e.stopPropagation();
								removeClause(i);
							}}
							aria-label={m.target_remove_rule({}, messageOptions)}
						>
							<X class="size-3" />
						</button>
					</span>
				</span>
			{/each}

			{#if draft.connector}
				<span class="text-[11px] font-medium uppercase text-muted-foreground" in:fly={{ x: 6, duration: motionDuration(150) }} out:fly={{ x: -6, duration: motionDuration(130) }}>{draft.connector}</span>
			{/if}
			{#if draft.subject}
				<span class={badgeVariants({ variant: "outline" })} in:fly={{ x: 6, duration: motionDuration(150) }} out:fly={{ x: -6, duration: motionDuration(130) }}>{subjectLabel(draft.subject)}</span>
			{/if}
			{#if draft.op}
				<span class={badgeVariants({ variant: "outline" })} in:fly={{ x: 6, duration: motionDuration(150) }} out:fly={{ x: -6, duration: motionDuration(130) }}>{opLabel(draft.subject, draft.op)}</span>
			{/if}
			{#each draft.values as v (v)}
				<span class={badgeVariants({ variant: "outline" })} in:fly={{ x: 6, duration: motionDuration(150) }} out:fly={{ x: -6, duration: motionDuration(130) }}>{valueLabel(draft.subject ?? "", v)}</span>
			{/each}

			<input
				bind:this={inputRef}
				bind:value={query}
				{placeholder}
				{disabled}
				class="min-w-[8ch] flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
				oninput={() => (open = true)}
				onfocus={() => (open = true)}
				onkeydown={onKeydown}
			/>
		</div>

		{#if open}
			<ul
				role="listbox"
				class="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md bg-popover py-1 text-popover-foreground shadow-card ring-1 ring-foreground/10"
				onpointerdowncapture={(e) => e.stopPropagation()}
			>
				{#if suggestions.length === 0}
					<li class="px-2.5 py-1 text-xs text-muted-foreground">
						{phase === "value" ? m.target_no_matches({}, messageOptions) : m.target_type_filter({}, messageOptions)}
					</li>
				{:else}
					{#each suggestions as opt, i (opt.value)}
						<li
							role="option"
							aria-selected={i === activeIdx}
							class={cn(
								"border-l-2 px-2.5 py-1 text-xs leading-5 transition-colors",
								phase === "value" && draft.subject === "device" &&
									"border-b border-b-border py-2 last:border-b-0",
								i === activeIdx
									? "border-l-primary bg-primary/10 text-foreground"
									: "border-l-transparent hover:bg-muted",
							)}
							onmousedowncapture={(e) => {
								e.preventDefault();
								e.stopPropagation();
								pick(opt);
							}}
							onmouseenter={() => (activeIdx = i)}
						>
							{#if phase === "value" && draft.subject === "device" && opt.deviceType}
								<DeviceOptionRow name={opt.label} deviceType={opt.deviceType} roomLabel={opt.roomLabel} />
							{:else}
								{opt.label}
							{/if}
						</li>
					{/each}
				{/if}
				{#if canCommit}
					<button
						type="button"
						class="mt-1 block w-full border-t px-2.5 py-1 text-left text-xs text-muted-foreground hover:bg-accent/50"
						onmousedowncapture={(e) => {
							e.preventDefault();
							e.stopPropagation();
							commitDraft();
						}}
					>
						{m.target_done_rule({}, messageOptions)}
					</button>
				{/if}
			</ul>
		{/if}
	</div>

	<span class="text-xs text-muted-foreground">{m.target_device_count({ count: resolvedCount }, messageOptions)}</span>
</div>
