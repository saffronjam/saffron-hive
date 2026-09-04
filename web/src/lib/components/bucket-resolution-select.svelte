<script lang="ts">
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		value: number;
	}

	let { value = $bindable() }: Props = $props();

	const labels = $derived.by<Record<string, string>>(() => {
		const options = locale.messageOptions();
		return {
			"0": m.history_resolution_auto({}, options),
			"60": m.history_resolution_minutes({ count: 1 }, options),
			"300": m.history_resolution_minutes({ count: 5 }, options),
			"3600": m.history_resolution_hours({ count: 1 }, options),
			"86400": m.history_resolution_days({ count: 1 }, options),
		};
	});
</script>

<Select
	type="single"
	value={String(value)}
	onValueChange={(v) => {
		if (v) value = Number(v);
	}}
>
	<SelectTrigger class="h-8 w-[120px]">
		{labels[String(value)] ?? m.history_resolution({}, locale.messageOptions())}
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="0">{labels["0"]}</SelectItem>
		<SelectItem value="60">{labels["60"]}</SelectItem>
		<SelectItem value="300">{labels["300"]}</SelectItem>
		<SelectItem value="3600">{labels["3600"]}</SelectItem>
		<SelectItem value="86400">{labels["86400"]}</SelectItem>
	</SelectContent>
</Select>
