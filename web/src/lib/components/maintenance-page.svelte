<script lang="ts">
	import { page } from "$app/state";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import {
		maintenanceStore,
		type MaintenanceTask,
	} from "$lib/stores/maintenance.svelte";
	import { MaintenanceKind } from "$lib/gql/graphql";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import HiveIcon from "$lib/components/hive-icon.svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, ChipOption } from "$lib/components/hive-searchbar";
	import { createUrlSearchState } from "$lib/search-state.svelte";
	import { deviceDisplayName, sentenceCase } from "$lib/utils";
	import { CircleCheck, ExternalLink } from "@lucide/svelte";
	import { slide } from "svelte/transition";

	interface Props {
		visible: boolean;
	}

	let { visible }: Props = $props();

	const groups: { kind: MaintenanceKind; title: string }[] = [
		{ kind: MaintenanceKind.Battery, title: "Replace batteries" },
		{ kind: MaintenanceKind.Firmware, title: "Updates" },
		{ kind: MaintenanceKind.Posture, title: "Correct sensor placement" },
		{ kind: MaintenanceKind.Storage, title: "System maintenance" },
	];
	const kindOptions = groups.map((group) => ({
		value: group.kind,
		label: sentenceCase(group.kind.toLowerCase()),
	}));
	const statusOptions = [
		{ value: "online", label: "Online" },
		{ value: "offline", label: "Offline" },
		{ value: "disabled", label: "Disabled" },
		{ value: "system", label: "System" },
	];

	const searchController = createUrlSearchState({
		active: () => visible && page.url.pathname === "/maintenance",
	});

	function filterOptions(input: string, options: ChipOption[]): ChipOption[] {
		const query = input.toLowerCase();
		if (!query) return options;
		return options.filter(
			(option) =>
				option.value.toLowerCase().includes(query) ||
				option.label.toLowerCase().includes(query),
		);
	}

	const deviceOptions = $derived.by(() => {
		const devices = new Map<string, ChipOption>();
		for (const task of maintenanceStore.items) {
			if (!task.device) continue;
			devices.set(task.device.id, {
				value: task.device.id,
				label: deviceDisplayName(task.device),
			});
		}
		return [...devices.values()].sort((a, b) => a.label.localeCompare(b.label));
	});
	const deviceTypeOptions = $derived.by(() => {
		const types = new Set(
			maintenanceStore.items.flatMap((task) => (task.device ? [task.device.type] : [])),
		);
		return [...types]
			.map((type) => ({ value: type, label: sentenceCase(type) }))
			.sort((a, b) => a.label.localeCompare(b.label));
	});
	const searchChipConfigs = $derived<ChipConfig[]>([
		{
			keyword: "maintenance",
			label: "Maintenance",
			variant: "secondary",
			options: (input) => filterOptions(input, kindOptions),
			resolveLabel: (value) => kindOptions.find((option) => option.value === value)?.label ?? null,
		},
		{
			keyword: "device",
			label: "Device",
			variant: "secondary",
			options: (input) => filterOptions(input, deviceOptions),
			resolveLabel: (value) =>
				deviceOptions.find((option) => option.value === value)?.label ?? null,
		},
		{
			keyword: "device-type",
			label: "Device type",
			variant: "secondary",
			options: (input) => filterOptions(input, deviceTypeOptions),
			resolveLabel: (value) =>
				deviceTypeOptions.find((option) => option.value === value)?.label ?? null,
		},
		{
			keyword: "status",
			label: "Status",
			variant: "secondary",
			options: (input) => filterOptions(input, statusOptions),
			resolveLabel: (value) =>
				statusOptions.find((option) => option.value === value)?.label ?? null,
		},
	]);

	function taskStatus(task: MaintenanceTask): string {
		if (!task.device) return "system";
		if (task.device.disabled) return "disabled";
		return task.device.available ? "online" : "offline";
	}

	const filteredTasks = $derived.by(() => {
		const kindFilters = searchController.value.chips
			.filter((chip) => chip.keyword === "maintenance")
			.map((chip) => chip.value.toUpperCase());
		const deviceFilters = searchController.value.chips
			.filter((chip) => chip.keyword === "device")
			.map((chip) => chip.value);
		const typeFilters = searchController.value.chips
			.filter((chip) => chip.keyword === "device-type")
			.map((chip) => chip.value.toLowerCase());
		const statusFilters = searchController.value.chips
			.filter((chip) => chip.keyword === "status")
			.map((chip) => chip.value.toLowerCase());
		const freeText = searchController.value.freeText.trim().toLowerCase();

		return maintenanceStore.items.filter((task) => {
			if (kindFilters.length > 0 && !kindFilters.includes(task.kind)) return false;
			if (deviceFilters.length > 0 && !deviceFilters.includes(task.device?.id ?? "")) return false;
			if (typeFilters.length > 0 && !typeFilters.includes(task.device?.type.toLowerCase() ?? "")) {
				return false;
			}
			if (statusFilters.length > 0 && !statusFilters.includes(taskStatus(task))) return false;
			if (freeText) {
				const deviceName = task.device ? deviceDisplayName(task.device) : "Hive";
				const haystack = [
					task.title,
					task.detail,
					task.action,
					task.kind,
					task.currentValue,
					task.targetValue,
					task.device?.id,
					deviceName,
					task.device?.type,
					taskStatus(task),
				]
					.filter(Boolean)
					.join(" ")
					.toLowerCase();
				if (!haystack.includes(freeText)) return false;
			}
			return true;
		});
	});

	$effect(() => {
		if (visible) pageHeader.breadcrumbs = [{ label: "Maintenance" }];
	});

	function external(url: string): boolean {
		return url.startsWith("http://") || url.startsWith("https://");
	}
</script>

<div class="flex flex-col gap-4">
	<HiveSearchbar
		controller={searchController}
		chips={searchChipConfigs}
		placeholder="Search maintenance..."
		debounceMs={300}
		commitOnBlur
	/>

	<div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
		{#if maintenanceStore.actionableCount === 0}
			<div class="rounded-lg shadow-card bg-card p-12 text-center lg:col-span-2">
				<CircleCheck class="mx-auto size-6 text-muted-foreground" />
				<p class="mt-3 text-foreground">Nothing needs maintenance.</p>
			</div>
		{:else if filteredTasks.length === 0}
			<div class="rounded-lg shadow-card bg-card p-12 text-center lg:col-span-2">
				<p class="text-muted-foreground">No maintenance matches your search.</p>
			</div>
		{:else}
			{#each groups as group (group.kind)}
				{@const tasks = filteredTasks.filter((task) => task.kind === group.kind)}
				{#if tasks.length > 0}
					<Card class="flex max-h-[calc(100dvh-10rem)] flex-col gap-0 overflow-hidden">
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="sticky top-0 z-20 bg-card">
								<CardHeader class="pb-4">
									<div class="flex items-center justify-between gap-4 px-3">
										<CardTitle>{group.title}</CardTitle>
										<Button
											variant="outline"
											size="xs"
											disabled={tasks.some((task) => maintenanceStore.isPending(task.id))}
											onclick={() => void maintenanceStore.completeMany(tasks.map((task) => task.id))}
										>
											Mark all done
										</Button>
									</div>
								</CardHeader>
								<div class="px-6"><Separator /></div>
							</div>
							<CardContent>
								<div class="divide-y divide-border">
									{#each tasks as task (task.id)}
									<div
										class="flex flex-col gap-3 px-3 py-5 last:pb-0 sm:flex-row sm:items-center"
										out:slide|global={{ duration: 200 }}
									>
										<div class="flex min-w-0 flex-1 items-center gap-4">
											{#if task.device}
												<div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
													<HiveIcon
														type={task.device.type}
														contactRole={task.device.roles.contact}
														iconOverride={task.device.icon}
														class="size-5"
													/>
												</div>
											{/if}
											<div class="min-w-0">
												<div class="flex flex-wrap items-center gap-2">
													{#if task.device}
														<a href={`/devices/${task.device.id}`} class="font-medium hover:underline">
															{deviceDisplayName(task.device)}
														</a>
													{:else}
														<span class="font-medium">Hive</span>
													{/if}
													<HiveChip type={task.kind.toLowerCase()} />
												</div>
												<p class="mt-1 text-sm text-muted-foreground">{task.detail}</p>
												<div class="mt-3 flex items-center gap-1.5 text-sm">
													<span>{task.action}</span>
													{#if task.actionUrl}
														<span class="text-muted-foreground">·</span>
														<a
															href={task.actionUrl}
															target={external(task.actionUrl) ? "_blank" : undefined}
															rel={external(task.actionUrl) ? "noreferrer" : undefined}
															class="inline-flex items-center gap-1 text-primary hover:underline"
														>
															{external(task.actionUrl) ? "Open" : "View device"}{#if external(
																task.actionUrl
															)}<ExternalLink class="size-3" />{/if}
														</a>
													{/if}
												</div>
											</div>
										</div>
										<Button
											variant="outline"
											size="xs"
											disabled={maintenanceStore.isPending(task.id)}
											onclick={() => void maintenanceStore.completeOne(task.id)}
										>
											Mark done
										</Button>
									</div>
									{/each}
								</div>
							</CardContent>
						</div>
					</Card>
				{/if}
			{/each}
		{/if}
	</div>
</div>
