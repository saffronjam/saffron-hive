<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import NumberInput from "$lib/components/number-input.svelte";
	import {
		capabilityUnionForTarget,
		settableNumericCapabilities,
		type GroupLite,
		type RoomLite,
		type TargetKind,
	} from "$lib/target-resolve";
	import type { Capability, Device } from "$lib/gql/graphql";

	interface Props {
		target: { type: TargetKind; id: string } | null;
		value: string;
		onchange: (payload: string) => void;
		devices: Device[];
		groups: GroupLite[];
		rooms: RoomLite[];
		disabled?: boolean;
	}

	let { target, value, onchange, devices, groups, rooms, disabled = false }: Props = $props();

	type Mode = "percent" | "absolute";

	interface Payload {
		field: string;
		delta: number;
		mode: Mode;
	}

	function parsePayload(raw: string): Payload {
		try {
			const v = JSON.parse(raw);
			if (typeof v !== "object" || v === null) return { field: "", delta: 0, mode: "percent" };
			const obj = v as Record<string, unknown>;
			const field = typeof obj.field === "string" ? obj.field : "";
			const delta = typeof obj.delta === "number" && Number.isFinite(obj.delta) ? obj.delta : 0;
			const mode: Mode = obj.mode === "absolute" ? "absolute" : "percent";
			return { field, delta, mode };
		} catch {
			return { field: "", delta: 0, mode: "percent" };
		}
	}

	function emit(next: Payload) {
		onchange(JSON.stringify(next));
	}

	const parsed = $derived(parsePayload(value));

	const settableCaps = $derived<Capability[]>(
		target ? settableNumericCapabilities(capabilityUnionForTarget(target, devices, groups, rooms)) : [],
	);

	// Friendly labels for known capability names. Falls back to the raw name
	// so a future numeric capability still renders something sensible until
	// somebody adds a nicer label here.
	const capLabels: Record<string, string> = {
		brightness: "Brightness",
		color_temp: "Color Temp",
	};

	function fieldLabel(name: string): string {
		return capLabels[name] ?? name;
	}

	const selectedCap = $derived(settableCaps.find((c) => c.name === parsed.field) ?? null);

	$effect(() => {
		// Auto-select the sole option when there's exactly one and nothing is
		// chosen yet. Avoids a dead-end where the user is asked to pick from a
		// single-item list.
		if (!target) return;
		if (parsed.field === "" && settableCaps.length === 1) {
			emit({ ...parsed, field: settableCaps[0].name });
		}
	});

	function setField(name: string) {
		emit({ ...parsed, field: name });
	}

	function setDelta(n: number | null) {
		emit({ ...parsed, delta: n ?? 0 });
	}

	function setMode(m: Mode) {
		emit({ ...parsed, mode: m });
	}

	const fieldSelectedLabel = $derived(parsed.field ? fieldLabel(parsed.field) : "Select field");

	const rangeHint = $derived.by(() => {
		if (parsed.mode !== "absolute") return "";
		if (!selectedCap || selectedCap.valueMin == null || selectedCap.valueMax == null) return "";
		return `Range: ${selectedCap.valueMin} – ${selectedCap.valueMax}`;
	});
</script>

{#if !target}
	<p class="text-[11px] text-muted-foreground">Pick a target to configure delta.</p>
{:else if settableCaps.length === 0}
	<p class="text-[11px] text-muted-foreground">Target has no adjustable numeric fields.</p>
{:else}
	<div class="space-y-2">
		<Select
			type="single"
			value={parsed.field}
			onValueChange={(v) => v && setField(v)}
		>
			<SelectTrigger class="w-full text-xs">{fieldSelectedLabel}</SelectTrigger>
			<SelectContent>
				{#each settableCaps as c (c.name)}
					<SelectItem value={c.name}>{fieldLabel(c.name)}</SelectItem>
				{/each}
			</SelectContent>
		</Select>

		<div class="flex items-center gap-1.5">
			<NumberInput
				value={parsed.delta}
				allowDecimal
				allowNegative
				ariaLabel="Delta"
				class="flex-1 text-xs"
				{disabled}
				onValueChange={setDelta}
			/>
			<div class="flex rounded-md border border-input overflow-hidden">
				<Button
					type="button"
					variant={parsed.mode === "percent" ? "secondary" : "ghost"}
					size="sm"
					class="h-8 rounded-none px-2 text-xs"
					{disabled}
					onclick={() => setMode("percent")}
					aria-pressed={parsed.mode === "percent"}
				>
					%
				</Button>
				<Button
					type="button"
					variant={parsed.mode === "absolute" ? "secondary" : "ghost"}
					size="sm"
					class="h-8 rounded-none px-2 text-xs"
					{disabled}
					onclick={() => setMode("absolute")}
					aria-pressed={parsed.mode === "absolute"}
				>
					Value
				</Button>
			</div>
		</div>

		{#if rangeHint}
			<p class="text-[10px] text-muted-foreground">{rangeHint}</p>
		{/if}
	</div>
{/if}
