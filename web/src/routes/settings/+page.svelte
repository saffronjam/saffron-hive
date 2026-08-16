<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import NumberInput from "$lib/components/number-input.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { Save } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";

	const SETTINGS_QUERY = graphql(`
		query Settings {
			settings {
				key
				value
			}
		}
	`);

	const UPDATE_SETTING = graphql(`
		mutation UpdateSetting($key: String!, $value: String!) {
			updateSetting(key: $key, value: $value) {
				key
				value
			}
		}
	`);

	const client = getContextClient();

	let logLevel = $state("INFO");
	let origLogLevel = $state("");

	let historyRetentionDays = $state<number | null>(365);
	let origHistoryRetentionDays = $state(365);

	let saving = $state(false);
	let loaded = $state(false);

	// Nothing counts as edited until the server values are in hand. Without this
	// the field defaults differ from the empty originals, so the page would arm
	// the unsaved-changes guard and enable Save before the user touched anything.
	const isDirty = $derived(
		loaded &&
			(logLevel !== origLogLevel || historyRetentionDays !== origHistoryRetentionDays)
	);

	const logLevelOptions = [
		{ value: "DEBUG", label: "Debug" },
		{ value: "INFO", label: "Info" },
		{ value: "WARN", label: "Warn" },
		{ value: "ERROR", label: "Error" },
	];

	async function loadData() {
		const result = await client.query(SETTINGS_QUERY, {}).toPromise();
		// A failed query leaves the page unloaded on purpose: Save stays disabled
		// rather than offering to write our defaults over values we never read.
		if (!result.data?.settings) return;
		for (const s of result.data.settings) {
			if (s.key === "log_level") {
				logLevel = origLogLevel = s.value;
			} else if (s.key === "history.retention_days") {
				const parsed = parseInt(s.value, 10);
				const days = Number.isFinite(parsed) && parsed > 0 ? parsed : 365;
				historyRetentionDays = origHistoryRetentionDays = days;
			}
		}
		// Sync the baselines for any key the server did not return, so an absent
		// setting reads as "unchanged" rather than as an edit.
		origLogLevel = logLevel;
		origHistoryRetentionDays = historyRetentionDays ?? 365;
		loaded = true;
	}

	async function save() {
		saving = true;
		try {
			if (logLevel !== origLogLevel) {
				const result = await client
					.mutation(UPDATE_SETTING, { key: "log_level", value: logLevel })
					.toPromise();
				if (result.error) {
					console.error("Failed to update setting:", result.error);
					return;
				}
				origLogLevel = logLevel;
			}
			if (historyRetentionDays !== origHistoryRetentionDays) {
				const parsed = historyRetentionDays;
				if (parsed === null || !Number.isFinite(parsed) || parsed <= 0) {
					console.error("Invalid retention value");
					return;
				}
				const result = await client
					.mutation(UPDATE_SETTING, {
						key: "history.retention_days",
						value: String(parsed),
					})
					.toPromise();
				if (result.error) {
					console.error("Failed to update retention:", result.error);
					return;
				}
				origHistoryRetentionDays = parsed;
			}
		} finally {
			saving = false;
		}
	}

	$effect(() => {
		pageHeader.actions = [
			{
				label: "Save",
				icon: Save,
				onclick: save,
				disabled: !isDirty || saving,
				hideLabelOnMobile: true,
			},
		];
	});

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Settings" }];
		loadData();
	});

	onDestroy(() => pageHeader.reset());
</script>

<UnsavedGuard dirty={isDirty} />

<div class="flex flex-col gap-6">
	<div class="rounded-lg shadow-card bg-card p-6">
		<h2 class="text-lg font-semibold mb-4">History</h2>
		<div class="grid gap-4 max-w-lg">
			<div class="grid gap-1.5">
				<label for="retention-days" class="text-sm font-medium">Retention (days)</label>
				<NumberInput
					id="retention-days"
					min={1}
					bind:value={historyRetentionDays}
					ariaLabel="Retention days"
				/>
				<p class="text-xs text-muted-foreground">
					Device state samples older than this are pruned every 6 hours.
				</p>
			</div>
		</div>
	</div>

	<div class="rounded-lg shadow-card bg-card p-6">
		<h2 class="text-lg font-semibold mb-4">Internals</h2>
		<div class="grid gap-4 max-w-lg">
			<div class="grid gap-1.5">
				<label for="log-level" class="text-sm font-medium">Log level</label>
				<Select
					type="single"
					value={logLevel}
					onValueChange={(v) => {
						if (v) logLevel = v;
					}}
				>
					<SelectTrigger class="w-48">
						{logLevelOptions.find((o) => o.value === logLevel)?.label ?? logLevel}
					</SelectTrigger>
					<SelectContent>
						{#each logLevelOptions as opt (opt.value)}
							<SelectItem value={opt.value}>{opt.label}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>
		</div>
	</div>
</div>
