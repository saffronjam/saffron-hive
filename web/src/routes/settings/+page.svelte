<script lang="ts">
	import { onMount } from "svelte";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import NumberInput from "$lib/components/number-input.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { Save } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { m, languageName, type Language } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";

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
	let defaultContentLanguage = $state<Language>("en");
	let origDefaultContentLanguage = $state<Language>("en");
	let translateStandardRoomNames = $state(false);
	let origTranslateStandardRoomNames = $state(false);

	let saving = $state(false);
	let loaded = $state(false);

	// Nothing counts as edited until the server values are in hand. Without this
	// the field defaults differ from the empty originals, so the page would arm
	// the unsaved-changes guard and enable Save before the user touched anything.
	const isDirty = $derived(
		loaded &&
			(logLevel !== origLogLevel ||
				historyRetentionDays !== origHistoryRetentionDays ||
				defaultContentLanguage !== origDefaultContentLanguage ||
				translateStandardRoomNames !== origTranslateStandardRoomNames)
	);

	const logLevelOptions = $derived([
		{ value: "DEBUG", label: m.settings_log_debug({}, locale.messageOptions()) },
		{ value: "INFO", label: m.settings_log_info({}, locale.messageOptions()) },
		{ value: "WARN", label: m.settings_log_warn({}, locale.messageOptions()) },
		{ value: "ERROR", label: m.settings_log_error({}, locale.messageOptions()) },
	]);
	const contentLanguages: readonly Language[] = ["en", "sv", "ru"];

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
			} else if (s.key === "i18n.default_content_language" && contentLanguages.includes(s.value as Language)) {
				defaultContentLanguage = origDefaultContentLanguage = s.value as Language;
			} else if (s.key === "i18n.translate_standard_room_names") {
				translateStandardRoomNames = origTranslateStandardRoomNames = s.value === "true";
			}
		}
		// Sync the baselines for any key the server did not return, so an absent
		// setting reads as "unchanged" rather than as an edit.
		origLogLevel = logLevel;
		origHistoryRetentionDays = historyRetentionDays ?? 365;
		origDefaultContentLanguage = defaultContentLanguage;
		origTranslateStandardRoomNames = translateStandardRoomNames;
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
			if (defaultContentLanguage !== origDefaultContentLanguage) {
				const result = await client.mutation(UPDATE_SETTING, { key: "i18n.default_content_language", value: defaultContentLanguage }).toPromise();
				if (result.error) { console.error(result.error); return; }
				origDefaultContentLanguage = defaultContentLanguage;
				localizedNamesStore.setDefaultContentLanguage(defaultContentLanguage);
			}
			if (translateStandardRoomNames !== origTranslateStandardRoomNames) {
				const result = await client.mutation(UPDATE_SETTING, {
					key: "i18n.translate_standard_room_names",
					value: String(translateStandardRoomNames),
				}).toPromise();
				if (result.error) { console.error(result.error); return; }
				origTranslateStandardRoomNames = translateStandardRoomNames;
				localizedNamesStore.setTranslateStandardRoomNames(translateStandardRoomNames);
			}
		} finally {
			saving = false;
		}
	}

	$effect(() => {
		pageHeader.actions = [
			{
				label: m.common_save({}, locale.messageOptions()),
				icon: Save,
				onclick: save,
				disabled: !isDirty || saving,
				hideLabelOnMobile: true,
			},
		];
	});

		onMount(() => {
		pageHeader.breadcrumbs = [{ label: m.nav_settings({}, locale.messageOptions()) }];
		loadData();
	});

</script>

<UnsavedGuard dirty={isDirty} />

<div class="flex flex-col gap-6">
	<div class="rounded-lg shadow-card bg-card p-6">
		<h2 class="text-lg font-semibold mb-4">{m.settings_history({}, locale.messageOptions())}</h2>
		<div class="grid gap-4 max-w-lg">
			<div class="grid gap-1.5">
				<label for="retention-days" class="text-sm font-medium">{m.settings_retention_days({}, locale.messageOptions())}</label>
				<NumberInput
					id="retention-days"
					min={1}
					bind:value={historyRetentionDays}
					ariaLabel={m.settings_retention_aria({}, locale.messageOptions())}
				/>
				<p class="text-xs text-muted-foreground">
					{m.settings_retention_help({}, locale.messageOptions())}
				</p>
			</div>
		</div>
	</div>

	<div class="rounded-lg shadow-card bg-card p-6">
		<h2 class="text-lg font-semibold mb-4">{m.translation_card({}, locale.messageOptions())}</h2>
		<div class="grid max-w-lg gap-5">
			<div class="grid gap-1.5">
			<label for="content-language" class="text-sm font-medium">{m.translation_default_language({}, locale.messageOptions())}</label>
			<Select type="single" value={defaultContentLanguage} onValueChange={(value) => { if (value) defaultContentLanguage = value as Language; }}>
				<SelectTrigger id="content-language" class="w-48">{languageName(defaultContentLanguage, locale.currentLanguage)}</SelectTrigger>
				<SelectContent>
					{#each contentLanguages as language}
						<SelectItem value={language}>{languageName(language, locale.currentLanguage)}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
			<p class="text-xs text-muted-foreground">{m.translation_default_help({}, locale.messageOptions())}</p>
			</div>
			<label class="flex items-start gap-3">
				<Checkbox bind:checked={translateStandardRoomNames} class="mt-0.5" />
				<span class="grid gap-1">
					<span class="text-sm font-medium">{m.translation_standard_rooms({}, locale.messageOptions())}</span>
					<span class="text-xs text-muted-foreground">{m.translation_standard_rooms_help({}, locale.messageOptions())}</span>
				</span>
			</label>
		</div>
	</div>

	<div class="rounded-lg shadow-card bg-card p-6">
		<h2 class="text-lg font-semibold mb-4">{m.settings_internals({}, locale.messageOptions())}</h2>
		<div class="grid gap-4 max-w-lg">
			<div class="grid gap-1.5">
				<label for="log-level" class="text-sm font-medium">{m.settings_log_level({}, locale.messageOptions())}</label>
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
