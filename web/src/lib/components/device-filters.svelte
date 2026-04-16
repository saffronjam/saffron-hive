<script lang="ts">
	import { Input } from "$lib/components/ui/input/index.js";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";

	interface Props {
		search: string;
		typeFilter: string;
		availabilityFilter: string;
		onsearchchange: (value: string) => void;
		ontypechange: (value: string) => void;
		onavailabilitychange: (value: string) => void;
	}

	let {
		search,
		typeFilter,
		availabilityFilter,
		onsearchchange,
		ontypechange,
		onavailabilitychange,
	}: Props = $props();

	const deviceTypes = [
		{ value: "all", label: "All types" },
		{ value: "light", label: "Light" },
		{ value: "sensor", label: "Sensor" },
		{ value: "switch", label: "Switch" },
	];

	const availabilityOptions = [
		{ value: "all", label: "All" },
		{ value: "online", label: "Online" },
		{ value: "offline", label: "Offline" },
	];
</script>

<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
	<Input
		type="search"
		placeholder="Search devices..."
		value={search}
		oninput={(e) => onsearchchange(e.currentTarget.value)}
		class="w-full sm:max-w-xs"
	/>
	<div class="flex gap-3">
		<Select
			type="single"
			value={typeFilter}
			onValueChange={(v) => { if (v) ontypechange(v); }}
		>
			<SelectTrigger class="w-[130px]">
				{deviceTypes.find((t) => t.value === typeFilter)?.label ?? "All types"}
			</SelectTrigger>
			<SelectContent>
				{#each deviceTypes as opt (opt.value)}
					<SelectItem value={opt.value}>{opt.label}</SelectItem>
				{/each}
			</SelectContent>
		</Select>
		<Select
			type="single"
			value={availabilityFilter}
			onValueChange={(v) => { if (v) onavailabilitychange(v); }}
		>
			<SelectTrigger class="w-[120px]">
				{availabilityOptions.find((a) => a.value === availabilityFilter)?.label ?? "All"}
			</SelectTrigger>
			<SelectContent>
				{#each availabilityOptions as opt (opt.value)}
					<SelectItem value={opt.value}>{opt.label}</SelectItem>
				{/each}
			</SelectContent>
		</Select>
	</div>
</div>
