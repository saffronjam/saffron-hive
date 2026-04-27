<script lang="ts">
	import { untrack } from "svelte";
	import { Input } from "$lib/components/ui/input/index.js";

	interface Props {
		value: number | null;
		min?: number;
		max?: number;
		placeholder?: string;
		disabled?: boolean;
		id?: string;
		class?: string;
		ariaLabel?: string;
		ariaInvalid?: "true" | "false" | undefined;
		allowDecimal?: boolean;
		allowNegative?: boolean;
		nullable?: boolean;
		onValueChange?: (next: number | null) => void;
	}

	let {
		value = $bindable(),
		min,
		max,
		placeholder,
		disabled = false,
		id,
		class: className = "",
		ariaLabel,
		ariaInvalid,
		allowDecimal = false,
		allowNegative = false,
		nullable = false,
		onValueChange,
	}: Props = $props();

	let inputRef = $state<HTMLInputElement | null>(null);
	let buffer = $state(value === null || value === undefined ? "" : String(value));

	$effect(() => {
		const incoming = value;
		untrack(() => {
			if (typeof document !== "undefined" && inputRef !== null && document.activeElement === inputRef) {
				return;
			}
			const next = incoming === null || incoming === undefined ? "" : String(incoming);
			if (next !== buffer) buffer = next;
		});
	});

	function cleanBuffer(raw: string): string {
		let sign = "";
		let body = raw;
		if (allowNegative && body.startsWith("-")) {
			sign = "-";
			body = body.slice(1);
		}
		body = body.replace(/-/g, "");
		if (!allowDecimal) return sign + body.replace(/[^0-9]/g, "");
		body = body.replace(/[^0-9.]/g, "");
		const firstDot = body.indexOf(".");
		if (firstDot !== -1) {
			body = body.slice(0, firstDot + 1) + body.slice(firstDot + 1).replace(/\./g, "");
		}
		return sign + body;
	}

	function handleInput(event: Event) {
		const raw = (event.currentTarget as HTMLInputElement).value;
		const cleaned = cleanBuffer(raw);
		buffer = cleaned;
		if (cleaned !== raw) {
			(event.currentTarget as HTMLInputElement).value = cleaned;
		}
	}

	function commitEmpty() {
		if (nullable) {
			value = null;
			buffer = "";
			onValueChange?.(null);
			return;
		}
		const fallback = min ?? 0;
		value = fallback;
		buffer = String(fallback);
		onValueChange?.(fallback);
	}

	function isPartial(s: string): boolean {
		return s === "" || s === "-" || s === "." || s === "-." ;
	}

	function commit() {
		if (isPartial(buffer)) {
			commitEmpty();
			return;
		}
		const parsed = allowDecimal ? parseFloat(buffer) : parseInt(buffer, 10);
		if (!Number.isFinite(parsed)) {
			commitEmpty();
			return;
		}
		let clamped = parsed;
		if (typeof min === "number" && clamped < min) clamped = min;
		if (typeof max === "number" && clamped > max) clamped = max;
		value = clamped;
		buffer = String(clamped);
		onValueChange?.(clamped);
	}
</script>

<Input
	bind:ref={inputRef}
	{id}
	type="text"
	inputmode={allowDecimal ? "decimal" : "numeric"}
	value={buffer}
	{placeholder}
	{disabled}
	class={className}
	aria-label={ariaLabel}
	aria-invalid={ariaInvalid}
	oninput={handleInput}
	onblur={commit}
/>
