<script lang="ts">
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";

	interface Props {
		value: number;
	}

	let { value = $bindable() }: Props = $props();

	const labels: Record<string, string> = {
		"0": "Auto",
		"60": "1 minute",
		"300": "5 minutes",
		"3600": "1 hour",
		"86400": "1 day",
	};
</script>

<Select
	type="single"
	value={String(value)}
	onValueChange={(v) => {
		if (v) value = Number(v);
	}}
>
	<SelectTrigger class="h-8 w-[120px]">
		{labels[String(value)] ?? "Resolution"}
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="0">Auto</SelectItem>
		<SelectItem value="60">1 minute</SelectItem>
		<SelectItem value="300">5 minutes</SelectItem>
		<SelectItem value="3600">1 hour</SelectItem>
		<SelectItem value="86400">1 day</SelectItem>
	</SelectContent>
</Select>
