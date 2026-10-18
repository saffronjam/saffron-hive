<script lang="ts">
 import { createEditorRefresh } from "$lib/editor-refresh.svelte";
 import ExternalChangeBanner from "$lib/components/external-change-banner.svelte";
	import ConnectionTest from "$lib/components/connection-test.svelte";
	import { onMount } from "svelte";
	import { getContextClient } from "@urql/svelte";
	import { toast } from "svelte-sonner";
	import { graphql } from "$lib/gql";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import type { ConnectionResult } from "$lib/i18n/connection";
	import { hasStoredSecret as secretIsStored, secretToSend } from "$lib/redacted-secret";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import TuyaIcon from "$lib/components/icons/tuya-icon.svelte";
	import { Loader2, RefreshCw, Save } from "@lucide/svelte";
	import { integrationDescription } from "$lib/integrations";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	const TUYA_CONFIG_QUERY = graphql(`
		query TuyaConfigPage {
			tuyaConfig {
 revision
				accessId
				accessSecret
				region
				enabled
			}
		}
	`);

	const UPDATE_TUYA_CONFIG = graphql(`
		mutation UpdateTuyaConfig($input: TuyaConfigInput!, $expectedRevision: Int!) {
			updateTuyaConfig(input: $input, expectedRevision: $expectedRevision) {
 config {
 revision
				accessId
				accessSecret
				region
				enabled
 } application { success code diagnostic }
			}
		}
	`);

	const TEST_TUYA_CONNECTION = graphql(`
		mutation TestTuyaConnection($input: TuyaConfigInput!) {
			testTuyaConnection(input: $input) {
				success
				code
				diagnostic
			}
		}
	`);

	const SYNC_TUYA_DEVICES = graphql(`
		mutation SyncTuyaDevices {
			syncTuyaDevices {
				id
			}
		}
	`);

	type TestResult = ConnectionResult;

	const client = getContextClient();
	const messageOptions = $derived(locale.messageOptions());

	let loaded = $state(false);
	let saving = $state(false);
 let savedRevision=$state(0);
	let testing = $state(false);
	let syncing = $state(false);
	let accessId = $state("");
	let accessSecret = $state("");
	let region = $state("eu");
	let enabled = $state(true);
	let original = $state("");
	let testResult = $state<TestResult | null>(null);
	let hasStoredSecret = $state(false);

	const regionOptions = $derived.by(() => [
		{ value: "eu", label: m.tuya_region_eu({}, messageOptions) },
		{ value: "us", label: m.tuya_region_us({}, messageOptions) },
		{ value: "cn", label: m.tuya_region_cn({}, messageOptions) },
		{ value: "in", label: m.tuya_region_in({}, messageOptions) },
	]);

	function snapshot(): string {
		return JSON.stringify({ accessId, accessSecret, region, enabled });
	}

	const isDirty = $derived(loaded && snapshot() !== original);

	function mutationInput() {
		return {
			accessId: accessId.trim(),
			accessSecret: secretToSend(accessSecret, hasStoredSecret),
			region,
			enabled,
		};
	}

	function applyConfig(config: {
 revision:number;
		accessId: string;
		accessSecret: string;
		region: string;
		enabled: boolean;
	} | null | undefined) {
 savedRevision=config?.revision??0;
		accessId = config?.accessId ?? "";
		accessSecret = config?.accessSecret ?? "";
		region = config?.region || "eu";
		enabled = config?.enabled ?? true;
		hasStoredSecret = secretIsStored(config?.accessSecret);
		original = snapshot();
	}

 const refreshGuard = createEditorRefresh({
  read: async () => { const result = await client.query(TUYA_CONFIG_QUERY, {}, {requestPolicy:"network-only"}).toPromise(); if(result.error) throw result.error; return result.data?.tuyaConfig ?? null; },
  apply: applyConfig, dirty: () => isDirty, busy: () => saving || !loaded,
 });

	async function loadConfig() {
		const result = await client.query(TUYA_CONFIG_QUERY, {}, { requestPolicy: "network-only" }).toPromise();
		applyConfig(result.data?.tuyaConfig ?? null);
 refreshGuard.accept(result.data?.tuyaConfig ?? null);
		loaded = true;
	}

	async function saveConfig() {
 if(refreshGuard.conflict) return;
		saving = true;
		try {
			const result = await client.mutation(UPDATE_TUYA_CONFIG, { input: mutationInput(), expectedRevision:savedRevision }).toPromise();
			if (result.error) throw result.error;
			applyConfig(result.data?.updateTuyaConfig.config ?? null);
 refreshGuard.accept(result.data?.updateTuyaConfig.config ?? null);
			testResult = result.data?.updateTuyaConfig.application ?? null;
		} catch (e) {
			console.error(e);
			toast.error(graphqlErrorMessage(e, m.tuya_save_failed({}, messageOptions)));
		} finally {
			saving = false;
		}
	}

	async function testConnection() {
		testing = true;
		try {
			const result = await client.mutation(TEST_TUYA_CONNECTION, { input: mutationInput(), expectedRevision:savedRevision }).toPromise();
			if (result.error) throw result.error;
			testResult = result.data?.testTuyaConnection ?? null;
		} catch (e) {
			console.error(e);
			testResult = { success: false, code: "FAILED", diagnostic: null };
		} finally {
			testing = false;
		}
	}

	async function syncDevices() {
		syncing = true;
		try {
			const result = await client.mutation(SYNC_TUYA_DEVICES, {}).toPromise();
			if (result.error) throw result.error;
			const count = result.data?.syncTuyaDevices.length ?? 0;
			toast.success(m.tuya_synced({ count }, messageOptions));
		} catch (e) {
			console.error(e);
			toast.error(graphqlErrorMessage(e, m.tuya_sync_failed({}, messageOptions)));
		} finally {
			syncing = false;
		}
	}

	$effect(() => {
		pageHeader.actions = [
			{
				label: m.common_save({}, messageOptions),
				icon: Save,
				onclick: saveConfig,
				disabled: refreshGuard.conflict || !isDirty || saving,
				hideLabelOnMobile: true,
			},
		];
		pageHeader.viewToggle = null;
		pageHeader.breadcrumbs = [{ label: m.nav_integrations({}, messageOptions), href: "/integrations" }, { label: "Tuya" }];
	});

	onMount(() => {
		void loadConfig();
	});

</script>

{#if refreshGuard.conflict}<ExternalChangeBanner onreload={() => { void refreshGuard.refresh(true); }} />{/if}

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
	<section class="rounded-lg shadow-card bg-card p-6">
		<div class="mb-6 flex items-center gap-3">
			<TuyaIcon class="size-10" />
			<div>
				<h1 class="text-xl font-semibold">Tuya</h1>
				<p class="text-sm text-muted-foreground">{integrationDescription("tuya")}</p>
			</div>
		</div>

		<div class="grid gap-4 max-w-xl">
			<div class="flex items-center gap-3 min-h-9">
				<Switch id="tuya-enabled" bind:checked={enabled} disabled={!loaded} />
				<label for="tuya-enabled" class="text-sm font-medium">{m.tuya_enabled({}, messageOptions)}</label>
			</div>

			<div class="grid gap-1.5">
				<label for="tuya-access-id" class="text-sm font-medium">{m.tuya_access_id({}, messageOptions)}</label>
				<Input id="tuya-access-id" bind:value={accessId} disabled={!loaded} autocomplete="off" />
			</div>

			<div class="grid gap-1.5">
				<label for="tuya-access-secret" class="text-sm font-medium">{m.tuya_access_secret({}, messageOptions)}</label>
				<Input
					id="tuya-access-secret"
					type="password"
					bind:value={accessSecret}
					disabled={!loaded}
					autocomplete="off"
					placeholder={hasStoredSecret ? m.tuya_secret_keep({}, messageOptions) : ""}
				/>
			</div>

			<div class="grid gap-1.5">
				<span class="text-sm font-medium">{m.tuya_region({}, messageOptions)}</span>
				<Select type="single" bind:value={region} disabled={!loaded}>
					<SelectTrigger class="w-full">
						{regionOptions.find((r) => r.value === region)?.label ?? m.tuya_select_region({}, messageOptions)}
					</SelectTrigger>
					<SelectContent>
						{#each regionOptions as option (option.value)}
							<SelectItem value={option.value}>{option.label}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>

			<ConnectionTest label={m.tuya_check_connection({}, messageOptions)} {testing} disabled={!loaded} result={testResult} ontest={testConnection}><Button variant="outline" size="sm" onclick={syncDevices} disabled={!loaded || syncing || isDirty}>
					{#if syncing}
						<Loader2 class="size-4 animate-spin" />
					{:else}
						<RefreshCw class="size-4" />
					{/if}
					{m.tuya_sync_devices({}, messageOptions)}
				</Button></ConnectionTest>
		</div>
	</section>

	<aside class="rounded-lg shadow-card bg-card p-6">
		<h2 class="text-sm font-semibold">{m.tuya_cloud_keys({}, messageOptions)}</h2>
		<ol class="mt-3 space-y-2 text-sm text-muted-foreground">
			<li>{m.tuya_cloud_step_app({}, messageOptions)}</li>
			<li>{m.tuya_cloud_step_project({}, messageOptions)}</li>
			<li>{m.tuya_cloud_step_account({}, messageOptions)}</li>
			<li>{m.tuya_cloud_step_keys({}, messageOptions)}</li>
		</ol>
	</aside>
</div>
