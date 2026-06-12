<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { getContextClient } from "@urql/svelte";
	import { toast } from "svelte-sonner";
	import { graphql } from "$lib/gql";
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
	import { CircleCheck, CircleX, Loader2, RefreshCw, Save, Unplug } from "@lucide/svelte";

	const REDACTED_SECRET = "********";

	const TUYA_CONFIG_QUERY = graphql(`
		query TuyaConfigPage {
			tuyaConfig {
				accessId
				accessSecret
				region
				enabled
			}
		}
	`);

	const UPDATE_TUYA_CONFIG = graphql(`
		mutation UpdateTuyaConfig($input: TuyaConfigInput!) {
			updateTuyaConfig(input: $input) {
				accessId
				accessSecret
				region
				enabled
			}
		}
	`);

	const TEST_TUYA_CONNECTION = graphql(`
		mutation TestTuyaConnection($input: TuyaConfigInput!) {
			testTuyaConnection(input: $input) {
				success
				message
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

	type TestResult = { success: boolean; message: string };

	const client = getContextClient();

	let loaded = $state(false);
	let saving = $state(false);
	let testing = $state(false);
	let syncing = $state(false);
	let accessId = $state("");
	let accessSecret = $state("");
	let region = $state("eu");
	let enabled = $state(true);
	let original = $state("");
	let testResult = $state<TestResult | null>(null);
	let hasStoredSecret = $state(false);

	const regionOptions = [
		{ value: "eu", label: "EU Central" },
		{ value: "us", label: "US" },
		{ value: "cn", label: "China" },
		{ value: "in", label: "India" },
	];

	function snapshot(): string {
		return JSON.stringify({ accessId, accessSecret, region, enabled });
	}

	const isDirty = $derived(loaded && snapshot() !== original);

	function mutationInput() {
		return {
			accessId: accessId.trim(),
			accessSecret: accessSecret === "" && hasStoredSecret ? REDACTED_SECRET : accessSecret,
			region,
			enabled,
		};
	}

	function cleanTuyaError(message: string): string {
		let cleaned = message.replace(/^\[GraphQL\]\s*/i, "").trim();
		cleaned = cleaned.replace(
			/^saved config but failed to reconnect Tuya:\s*/i,
			"Saved config, but Tuya did not connect: ",
		);
		cleaned = cleaned.replace(
			/^tuya token request failed:\s*/i,
			"Tuya token request failed: ",
		);
		if (/code=2009/i.test(cleaned) || /clientId is invalid/i.test(cleaned)) {
			return "Tuya rejected the Access ID. Check the Access ID, region, and linked cloud project.";
		}
		if (/code=40009004/i.test(cleaned) || /param size too much/i.test(cleaned)) {
			return "Tuya rejected the device sync request size. Try saving again.";
		}
		return cleaned;
	}

	function errorMessage(error: unknown, fallback: string): string {
		if (typeof error !== "object" || error === null) return fallback;
		const maybe = error as {
			graphQLErrors?: Array<{ message?: string }>;
			message?: string;
		};
		const raw = maybe.graphQLErrors?.find((e) => e.message)?.message ?? maybe.message;
		return raw ? cleanTuyaError(raw) : fallback;
	}

	function applyConfig(config: {
		accessId: string;
		accessSecret: string;
		region: string;
		enabled: boolean;
	} | null | undefined) {
		accessId = config?.accessId ?? "";
		accessSecret = config?.accessSecret ?? "";
		region = config?.region || "eu";
		enabled = config?.enabled ?? true;
		hasStoredSecret = Boolean(config?.accessSecret);
		original = snapshot();
	}

	async function loadConfig() {
		const result = await client.query(TUYA_CONFIG_QUERY, {}, { requestPolicy: "network-only" }).toPromise();
		applyConfig(result.data?.tuyaConfig ?? null);
		loaded = true;
	}

	async function saveConfig() {
		saving = true;
		try {
			const result = await client.mutation(UPDATE_TUYA_CONFIG, { input: mutationInput() }).toPromise();
			if (result.error) throw result.error;
			applyConfig(result.data?.updateTuyaConfig ?? null);
			testResult = null;
			toast.success("Tuya configuration saved");
		} catch (e) {
			toast.error(errorMessage(e, "Failed to save Tuya configuration"));
		} finally {
			saving = false;
		}
	}

	async function testConnection() {
		testing = true;
		try {
			const result = await client.mutation(TEST_TUYA_CONNECTION, { input: mutationInput() }).toPromise();
			if (result.error) throw result.error;
			testResult = result.data?.testTuyaConnection ?? null;
		} catch (e) {
			testResult = { success: false, message: errorMessage(e, "Connection failed") };
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
			toast.success(`${count} Tuya device${count === 1 ? "" : "s"} synced`);
		} catch (e) {
			toast.error(errorMessage(e, "Failed to sync Tuya devices"));
		} finally {
			syncing = false;
		}
	}

	$effect(() => {
		pageHeader.actions = [
			{
				label: "Save",
				icon: Save,
				onclick: saveConfig,
				disabled: !isDirty || saving,
				hideLabelOnMobile: true,
			},
		];
		pageHeader.viewToggle = null;
	});

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Integrations", href: "/integrations" }, { label: "Tuya" }];
		void loadConfig();
	});

	onDestroy(() => pageHeader.reset());
</script>

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
	<section class="rounded-lg shadow-card bg-card p-6">
		<div class="mb-6 flex items-center gap-3">
			<TuyaIcon class="size-10" />
			<div>
				<h1 class="text-xl font-semibold">Tuya</h1>
				<p class="text-sm text-muted-foreground">Cloud API device adapter</p>
			</div>
		</div>

		<div class="grid gap-4 max-w-xl">
			<div class="flex items-center gap-3 min-h-9">
				<Switch id="tuya-enabled" bind:checked={enabled} disabled={!loaded} />
				<label for="tuya-enabled" class="text-sm font-medium">Enabled</label>
			</div>

			<div class="grid gap-1.5">
				<label for="tuya-access-id" class="text-sm font-medium">Access ID / Client ID</label>
				<Input id="tuya-access-id" bind:value={accessId} disabled={!loaded} autocomplete="off" />
			</div>

			<div class="grid gap-1.5">
				<label for="tuya-access-secret" class="text-sm font-medium">Access Secret / Client Secret</label>
				<Input
					id="tuya-access-secret"
					type="password"
					bind:value={accessSecret}
					disabled={!loaded}
					autocomplete="off"
					placeholder={hasStoredSecret ? "Secret set - leave blank to keep" : ""}
				/>
			</div>

			<div class="grid gap-1.5">
				<span class="text-sm font-medium">Region</span>
				<Select type="single" bind:value={region} disabled={!loaded}>
					<SelectTrigger class="w-full">
						{regionOptions.find((r) => r.value === region)?.label ?? "Select region"}
					</SelectTrigger>
					<SelectContent>
						{#each regionOptions as option (option.value)}
							<SelectItem value={option.value}>{option.label}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>

			<div class="flex flex-wrap items-center gap-3 pt-2">
				<Button variant="outline" size="sm" onclick={testConnection} disabled={!loaded || testing}>
					{#if testing}
						<Loader2 class="size-4 animate-spin" />
					{:else}
						<Unplug class="size-4" />
					{/if}
					Check Connection
				</Button>
				<Button variant="outline" size="sm" onclick={syncDevices} disabled={!loaded || syncing || isDirty}>
					{#if syncing}
						<Loader2 class="size-4 animate-spin" />
					{:else}
						<RefreshCw class="size-4" />
					{/if}
					Sync Devices
				</Button>
				{#if testResult}
					{#if testResult.success}
						<div class="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
							<CircleCheck class="size-5" />
							<span>{testResult.message}</span>
						</div>
					{:else}
						<div class="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
							<CircleX class="size-5 shrink-0" />
							<span>{testResult.message}</span>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</section>

	<aside class="rounded-lg shadow-card bg-card p-6">
		<h2 class="text-sm font-semibold">Cloud keys</h2>
		<ol class="mt-3 space-y-2 text-sm text-muted-foreground">
			<li>1. Connect device to Tuya app</li>
			<li>2. Setup a Tuya cloud</li>
			<li>3. Connect the app account to Tuya cloud</li>
			<li>4. Register the cloud service API keys from Tuya cloud here.</li>
		</ol>
	</aside>
</div>
