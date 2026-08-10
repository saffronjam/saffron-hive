<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import NumberInput from "$lib/components/number-input.svelte";
	import { Input } from "$lib/components/ui/input/index.js";
	import FieldError from "$lib/components/field-error.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { MapPin, Save } from "@lucide/svelte";
	import { throttle, type Throttle } from "$lib/throttle";
	import { graphqlErrorMessage } from "$lib/graphql-error";
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

	const SEARCH_PLACES = graphql(`
		query SearchPlaces($query: String!) {
			searchPlaces(query: $query) {
				name
				latitude
				longitude
			}
		}
	`);

	const client = getContextClient();

	let logLevel = $state("INFO");
	let origLogLevel = $state("");

	let historyRetentionDays = $state<number | null>(365);
	let origHistoryRetentionDays = $state(365);

	let placeQuery = $state("");
	let placeResults = $state<{ name: string; latitude: number; longitude: number }[]>([]);
	let placeError = $state<string | null>(null);
	let searching = $state(false);
	const placeThrottle: Throttle = { lastSent: 0, trailing: null };

	/**
	 * Look the term up through the API, which forwards to the geocoder. Throttled
	 * because this runs while someone is still typing.
	 */
	function searchPlaces(term: string) {
		placeQuery = term;
		placeError = null;
		if (term.trim() === "") {
			placeResults = [];
			return;
		}
		throttle(placeThrottle, async () => {
			searching = true;
			const result = await client.query(SEARCH_PLACES, { query: term }).toPromise();
			searching = false;
			// A slower earlier search must not overwrite a later one's results.
			if (placeQuery !== term) return;
			if (result.error) {
				placeError = graphqlErrorMessage(result.error, "Could not reach the place search.");
				placeResults = [];
				return;
			}
			placeResults = result.data?.searchPlaces ?? [];
		});
	}

	function usePlace(place: { name: string; latitude: number; longitude: number }) {
		latitude = Number(place.latitude.toFixed(5));
		longitude = Number(place.longitude.toFixed(5));
		placeQuery = "";
		placeResults = [];
	}

	// Nullable throughout: with no location set the map simply has no sun.
	let latitude = $state<number | null>(null);
	let origLatitude = $state<number | null>(null);
	let longitude = $state<number | null>(null);
	let origLongitude = $state<number | null>(null);
	let planNorth = $state<number | null>(null);
	let origPlanNorth = $state<number | null>(null);

	let saving = $state(false);
	let loaded = $state(false);

	// Nothing counts as edited until the server values are in hand. Without this
	// the field defaults differ from the empty originals, so the page would arm
	// the unsaved-changes guard and enable Save before the user touched anything.
	const isDirty = $derived(
		loaded &&
			(logLevel !== origLogLevel ||
				historyRetentionDays !== origHistoryRetentionDays ||
				latitude !== origLatitude ||
				longitude !== origLongitude ||
				planNorth !== origPlanNorth)
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
			} else if (s.key === "location.latitude") {
				latitude = origLatitude = parseNumber(s.value);
			} else if (s.key === "location.longitude") {
				longitude = origLongitude = parseNumber(s.value);
			} else if (s.key === "location.plan_north_deg") {
				planNorth = origPlanNorth = parseNumber(s.value);
			}
		}
		// Sync the baselines for any key the server did not return, so an absent
		// setting reads as "unchanged" rather than as an edit.
		origLogLevel = logLevel;
		origHistoryRetentionDays = historyRetentionDays ?? 365;
		origLatitude = latitude;
		origLongitude = longitude;
		origPlanNorth = planNorth;
		loaded = true;
	}

	function parseNumber(raw: string): number | null {
		const parsed = Number.parseFloat(raw);
		return Number.isFinite(parsed) ? parsed : null;
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
			// An empty field clears the setting, which turns the sun back off.
			if (latitude !== origLatitude && !(await saveNumber("location.latitude", latitude))) return;
			origLatitude = latitude;
			if (longitude !== origLongitude && !(await saveNumber("location.longitude", longitude))) {
				return;
			}
			origLongitude = longitude;
			if (planNorth !== origPlanNorth && !(await saveNumber("location.plan_north_deg", planNorth))) {
				return;
			}
			origPlanNorth = planNorth;
		} finally {
			saving = false;
		}
	}

	async function saveNumber(key: string, value: number | null): Promise<boolean> {
		const result = await client
			.mutation(UPDATE_SETTING, { key, value: value === null ? "" : String(value) })
			.toPromise();
		if (result.error) {
			console.error(`Failed to update ${key}:`, result.error);
			return false;
		}
		return true;
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
		<h2 class="text-lg font-semibold mb-4">Location</h2>
		<div class="grid gap-4 max-w-lg">
			<div class="grid gap-1.5">
				<label for="place-search" class="text-sm font-medium">Search for a place</label>
				<Input
					id="place-search"
					value={placeQuery}
					placeholder="Town, street or landmark"
					oninput={(e) => searchPlaces(e.currentTarget.value)}
					aria-invalid={!!placeError}
					aria-describedby={placeError ? "place-search-error" : undefined}
				/>
				<FieldError id="place-search-error" message={placeError} />
				{#if placeResults.length > 0}
					<div class="grid gap-0.5">
						{#each placeResults as place (`${place.latitude},${place.longitude}`)}
							<Button
								variant="ghost"
								size="sm"
								class="h-8 justify-start gap-2 font-normal"
								onclick={() => usePlace(place)}
							>
								<MapPin class="size-3.5 text-muted-foreground" />
								<span class="truncate">{place.name}</span>
							</Button>
						{/each}
					</div>
				{:else if searching}
					<p class="text-xs text-muted-foreground">Searching…</p>
				{/if}
			</div>
			<div class="grid gap-1.5 sm:grid-cols-2 sm:gap-4">
				<div class="grid gap-1.5">
					<label for="latitude" class="text-sm font-medium">Latitude</label>
					<NumberInput
						id="latitude"
						min={-90}
						max={90}
						allowDecimal
						allowNegative
						nullable
						bind:value={latitude}
						ariaLabel="Latitude"
					/>
				</div>
				<div class="grid gap-1.5">
					<label for="longitude" class="text-sm font-medium">Longitude</label>
					<NumberInput
						id="longitude"
						min={-180}
						max={180}
						allowDecimal
						allowNegative
						nullable
						bind:value={longitude}
						ariaLabel="Longitude"
					/>
				</div>
			</div>
			<div class="grid gap-1.5">
				<label for="plan-north" class="text-sm font-medium">Plan north (degrees)</label>
				<NumberInput
					id="plan-north"
					min={0}
					max={360}
					allowDecimal
					nullable
					bind:value={planNorth}
					ariaLabel="Plan north in degrees"
				/>
				<p class="text-xs text-muted-foreground">
					The compass bearing that points up the map, so the sun reaches the right windows.
					Leave the location empty and the map stays at night.
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
