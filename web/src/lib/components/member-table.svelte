<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from "$lib/components/ui/table/index.js";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import DeviceTypeBadge from "$lib/components/device-type-badge.svelte";
	import {
		Lightbulb,
		Thermometer,
		ToggleLeft,
		Group,
		DoorOpen,
		Package,
		Plus,
		X,
		Search,
	} from "@lucide/svelte";
	import type { Device } from "$lib/stores/devices";

	interface RelatedItem {
		id: string;
		name: string;
		href: string;
	}

	interface MemberRow {
		id: string;
		name: string;
		type: "light" | "sensor" | "switch" | "group" | "room" | string;
		related: RelatedItem[];
		onclick?: () => void;
	}

	interface Props {
		rows: MemberRow[];
		relatedLabel?: string;
		emptyMessage?: string;
		addLabel?: string;
		onadd: () => void;
		onremove: (id: string) => void;
		disabled?: boolean;
	}

	let {
		rows,
		relatedLabel,
		emptyMessage = "No members yet.",
		addLabel = "Add member",
		onadd,
		onremove,
		disabled = false,
	}: Props = $props();

	const showRelated = $derived(relatedLabel !== undefined);

	let search = $state("");

	const MAX_CHIPS = 3;

	const filteredRows = $derived.by(() => {
		if (!search) return rows;
		const q = search.toLowerCase();
		return rows.filter(
			(r) =>
				r.name.toLowerCase().includes(q) ||
				r.type.toLowerCase().includes(q) ||
				(showRelated && r.related.some((rel) => rel.name.toLowerCase().includes(q)))
		);
	});

	function deviceIcon(type: string): typeof Lightbulb {
		switch (type) {
			case "light":
				return Lightbulb;
			case "sensor":
				return Thermometer;
			case "switch":
				return ToggleLeft;
			case "group":
				return Group;
			case "room":
				return DoorOpen;
			default:
				return Package;
		}
	}

	function typeLabel(type: string): string {
		return type.charAt(0).toUpperCase() + type.slice(1);
	}
</script>

<div class="space-y-3">
	<div class="flex items-center gap-2">
		<div class="relative flex-1">
			<Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				bind:value={search}
				placeholder="Search members..."
				class="pl-9"
			/>
		</div>
		<Button variant="outline" size="sm" onclick={onadd} class="shrink-0">
			<Plus class="size-4" />
			<span>{addLabel}</span>
		</Button>
	</div>

	{#if rows.length === 0}
		<p class="py-6 text-center text-sm text-muted-foreground">
			{emptyMessage}
		</p>
	{:else if filteredRows.length === 0}
		<p class="py-6 text-center text-sm text-muted-foreground">
			No matches.
		</p>
	{:else}
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead class="w-24">Type</TableHead>
					<TableHead>Name</TableHead>
					{#if showRelated}
						<TableHead>{relatedLabel}</TableHead>
					{/if}
					<TableHead class="w-10"></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each filteredRows as row (row.id)}
					{@const Icon = deviceIcon(row.type)}
					<TableRow>
						<TableCell>
							{#if ["light", "sensor", "switch"].includes(row.type)}
								<DeviceTypeBadge type={row.type} />
							{:else}
								<Badge variant="outline">{typeLabel(row.type)}</Badge>
							{/if}
						</TableCell>
						<TableCell>
							{#if row.onclick}
								<button
									type="button"
									class="flex items-center gap-2 text-left hover:underline"
									onclick={row.onclick}
								>
									<Icon class="size-4 text-muted-foreground shrink-0" />
									<span class="truncate">{row.name}</span>
								</button>
							{:else}
								<div class="flex items-center gap-2">
									<Icon class="size-4 text-muted-foreground shrink-0" />
									<span class="truncate">{row.name}</span>
								</div>
							{/if}
						</TableCell>
						{#if showRelated}
							<TableCell>
								{#if row.related.length === 0}
									<span class="text-muted-foreground">—</span>
								{:else}
									<div class="flex flex-wrap items-center gap-1">
										{#each row.related.slice(0, MAX_CHIPS) as rel (rel.id)}
											<a
												href={rel.href}
												class="inline-flex"
											>
												<Badge variant="outline" class="cursor-pointer hover:bg-muted">
													{rel.name}
												</Badge>
											</a>
										{/each}
										{#if row.related.length > MAX_CHIPS}
											{@const overflow = row.related.slice(MAX_CHIPS)}
											<Popover>
												<PopoverTrigger>
													<Badge variant="outline" class="cursor-pointer hover:bg-muted">
														+{overflow.length} more
													</Badge>
												</PopoverTrigger>
												<PopoverContent class="w-56 p-0">
													<div class="max-h-48 overflow-y-auto p-2 space-y-1">
														{#each overflow as rel (rel.id)}
															<a
																href={rel.href}
																class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
															>
																{rel.name}
															</a>
														{/each}
													</div>
												</PopoverContent>
											</Popover>
										{/if}
									</div>
								{/if}
							</TableCell>
						{/if}
						<TableCell>
							<Button
								variant="ghost"
								size="icon-sm"
								onclick={() => onremove(row.id)}
								{disabled}
								aria-label="Remove"
							>
								<X class="size-4" />
							</Button>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
</div>
