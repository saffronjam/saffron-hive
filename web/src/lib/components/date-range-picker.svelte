<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { Calendar as CalendarIcon } from "@lucide/svelte";
	import {
		RangeCalendar,
	} from "$lib/components/ui/range-calendar/index.js";
	import {
		DateFormatter,
		getLocalTimeZone,
		today,
		type DateValue,
	} from "@internationalized/date";

	interface Props {
		from: Date;
		to: Date;
		presets?: boolean;
		compact?: boolean;
	}

	let { from = $bindable(), to = $bindable(), presets = true, compact = false }: Props = $props();

	const df = new DateFormatter("en", { dateStyle: "medium" });
	const tf = new DateFormatter("en", { timeStyle: "short" });
	const tz = getLocalTimeZone();

	function toDateValue(d: Date): DateValue {
		return today(tz).set({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
	}

	function toTimeString(d: Date): string {
		return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
	}

	function parseTimeString(s: string): [number, number] {
		const [h, m] = s.split(":");
		return [Number(h) || 0, Number(m) || 0];
	}

	function combine(day: DateValue, time: string, endOfMinute: boolean): Date {
		const [h, m] = parseTimeString(time);
		const d = day.toDate(tz);
		d.setHours(h, m, endOfMinute ? 59 : 0, endOfMinute ? 999 : 0);
		return d;
	}

	let value = $state<{ start: DateValue | undefined; end: DateValue | undefined }>({
		start: toDateValue(from),
		end: toDateValue(to),
	});
	let startTime = $state<string>(toTimeString(from));
	let endTime = $state<string>(toTimeString(to));
	let open = $state(false);

	function pushOutput() {
		if (value.start) from = combine(value.start, startTime, false);
		if (value.end) to = combine(value.end, endTime, true);
	}

	function setRangeHours(hours: number) {
		const now = new Date();
		const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
		value = { start: toDateValue(start), end: toDateValue(now) };
		startTime = toTimeString(start);
		endTime = toTimeString(now);
		from = start;
		to = now;
		open = false;
	}

	const label = $derived.by(() => {
		if (!from || !to) return "Pick a range";
		const sameDay = from.toDateString() === to.toDateString();
		if (sameDay) {
			return `${df.format(from)}, ${tf.format(from)} – ${tf.format(to)}`;
		}
		return `${df.format(from)} ${tf.format(from)} – ${df.format(to)} ${tf.format(to)}`;
	});
</script>

<Popover bind:open>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				size={compact ? "sm" : "default"}
				{...props}
				class={"w-full max-w-full " + (compact ? "sm:w-[25rem]" : "sm:w-[26rem]") + " justify-start gap-2 font-normal"}
			>
				<CalendarIcon class="size-4 shrink-0 opacity-70" />
				<span class="truncate">{label}</span>
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="w-auto p-0" align="end">
		<div class="flex">
			{#if presets}
				<div class="flex flex-col gap-1 border-r p-2 text-sm">
					<Button variant="ghost" size="sm" class="justify-start" onclick={() => setRangeHours(1)}>Last 1h</Button>
					<Button variant="ghost" size="sm" class="justify-start" onclick={() => setRangeHours(24)}>Last 24h</Button>
					<Button variant="ghost" size="sm" class="justify-start" onclick={() => setRangeHours(24 * 7)}>Last 7d</Button>
					<Button variant="ghost" size="sm" class="justify-start" onclick={() => setRangeHours(24 * 30)}>Last 30d</Button>
					<Button variant="ghost" size="sm" class="justify-start" onclick={() => setRangeHours(24 * 365)}>Last 365d</Button>
				</div>
			{/if}
			<div class="flex flex-col gap-2 p-2">
				<RangeCalendar
					bind:value
					onValueChange={pushOutput}
					numberOfMonths={2}
					maxValue={today(tz)}
				/>
				<div class="flex items-center gap-2 border-t pt-2">
					<span class="text-xs text-muted-foreground">Start</span>
					<Input
						type="time"
						bind:value={startTime}
						oninput={pushOutput}
						class="h-8 w-[6.5rem] appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
					/>
					<span class="ml-2 text-xs text-muted-foreground">End</span>
					<Input
						type="time"
						bind:value={endTime}
						oninput={pushOutput}
						class="h-8 w-[6.5rem] appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
					/>
				</div>
			</div>
		</div>
	</PopoverContent>
</Popover>
