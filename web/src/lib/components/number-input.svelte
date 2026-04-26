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

	function handleInput(event: Event) {
		const raw = (event.currentTarget as HTMLInputElement).value;
		const cleaned = raw.replace(/[^0-9]/g, "");
		buffer = cleaned;
		if (cleaned !== raw) {
			(event.currentTarget as HTMLInputElement).value = cleaned;
		}
	}

	function commit() {
		if (buffer === "") {
			const fallback = min ?? 0;
			value = fallback;
			buffer = String(fallback);
			onValueChange?.(fallback);
			return;
		}
		const parsed = parseInt(buffer, 10);
		if (!Number.isFinite(parsed)) {
			const fallback = min ?? 0;
			value = fallback;
			buffer = String(fallback);
			onValueChange?.(fallback);
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
	inputmode="numeric"
	pattern="[0-9]*"
	value={buffer}
	{placeholder}
	{disabled}
	class={className}
	aria-label={ariaLabel}
	oninput={handleInput}
	onblur={commit}
/>
