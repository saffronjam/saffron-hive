<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import { allFlagsMask, flagIsSet, setFlag } from "$lib/device-configuration";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		/** Flag names in bit order. */
		flags: string[];
		value: number;
		onchange: (mask: number) => void;
		label: string;
		disabled?: boolean;
	}

	let { flags, value, onchange, label, disabled = false }: Props = $props();

	const enabledCount = $derived(flags.filter((_, index) => flagIsSet(value, index)).length);
	const firstName = $derived(flags[0] ?? "");
	const lastName = $derived(flags[flags.length - 1] ?? "");
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between gap-2">
		<span class="text-xs text-muted-foreground tabular-nums">
			{m.device_flags_summary({ count: enabledCount, total: flags.length }, locale.messageOptions())}
		</span>
		<div class="flex items-center gap-1">
			<Button
				type="button"
				variant="ghost"
				size="xs"
				disabled={disabled || enabledCount === flags.length}
				onclick={() => onchange(allFlagsMask(flags.length))}
			>
				{m.device_flags_all({}, locale.messageOptions())}
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="xs"
				disabled={disabled || enabledCount === 0}
				onclick={() => onchange(0)}
			>
				{m.device_flags_none({}, locale.messageOptions())}
			</Button>
		</div>
	</div>
	<div class="flex gap-0.5" role="group" aria-label={label}>
		{#each flags as flag, index (index)}
			{@const on = flagIsSet(value, index)}
			<Tooltip>
				<TooltipTrigger
					type="button"
					class="h-7 min-w-0 flex-1 rounded-[3px] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 {on
						? 'bg-primary hover:bg-primary/80'
						: 'bg-muted hover:bg-muted-foreground/25'}"
					aria-pressed={on}
					aria-label={flag}
					{disabled}
					onclick={() => onchange(setFlag(value, index, !on))}
				/>
				<TooltipContent>{flag}</TooltipContent>
			</Tooltip>
		{/each}
	</div>
	{#if flags.length > 1}
		<div class="flex justify-between gap-2 text-[11px] text-muted-foreground">
			<span class="truncate">{firstName}</span>
			<span class="truncate">{lastName}</span>
		</div>
	{/if}
</div>
