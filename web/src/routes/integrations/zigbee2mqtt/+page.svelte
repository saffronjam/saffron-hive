<script lang="ts">
	import { onMount } from "svelte";
	import { getContextClient, subscriptionStore } from "@urql/svelte";
	import { toast } from "svelte-sonner";
	import { graphql } from "$lib/gql";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { integrationMeta } from "$lib/integrations";
	import { hasStoredSecret, secretToSend } from "$lib/redacted-secret";
	import { formatRelative } from "$lib/time-format";
	import { me } from "$lib/stores/me.svelte";
	import { nowStore } from "$lib/stores/now.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import FieldError from "$lib/components/field-error.svelte";
	import { Input } from "$lib/components/ui/input/index.js";
	import NumberInput from "$lib/components/number-input.svelte";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { CircleCheck, CircleX, Loader2, Radar, Save, Unplug } from "@lucide/svelte";

	const ZIGBEE2MQTT_CONFIG_QUERY = graphql(`
		query Zigbee2MqttConfigPage {
			zigbee2MqttConfig {
				broker
				frontendUrl
				username
				password
				useWss
				enabled
				scanScheduleEnabled
				scanHour
				scanMinute
				scanStartedAt
			}
		}
	`);

	const UPDATE_ZIGBEE2MQTT_CONFIG = graphql(`
		mutation UpdateZigbee2MqttConfig($input: Zigbee2MqttConfigInput!) {
			updateZigbee2MqttConfig(input: $input) {
				broker
				frontendUrl
				username
				password
				useWss
				enabled
				scanScheduleEnabled
				scanHour
				scanMinute
				scanStartedAt
			}
		}
	`);

	const TEST_ZIGBEE2MQTT_CONNECTION = graphql(`
		mutation TestZigbee2MqttConnection($input: Zigbee2MqttConfigInput!) {
			testZigbee2MqttConnection(input: $input) {
				success
				message
			}
		}
	`);

	const SCAN_ZIGBEE2MQTT_NETWORK = graphql(`
		mutation ScanZigbee2MqttNetwork {
			scanZigbee2MqttNetwork
		}
	`);

	const LAST_SCAN_QUERY = graphql(`
		query Zigbee2MqttLastScan {
			networkTopologies {
				provider
				scannedAt
			}
		}
	`);

	const SCAN_UPDATES_SUB = graphql(`
		subscription Zigbee2MqttScanUpdates($provider: String) {
			networkTopologyUpdated(provider: $provider) {
				provider
				scannedAt
				nodeCount
				linkCount
			}
		}
	`);

	type TestResult = { success: boolean; message: string };

	type ConfigShape = {
		broker: string;
		frontendUrl?: string | null;
		username: string;
		password: string;
		useWss: boolean;
		enabled: boolean;
		scanScheduleEnabled: boolean;
		scanHour?: number | null;
		scanMinute?: number | null;
		scanStartedAt?: string | null;
	};

	const client = getContextClient();
	const meta = integrationMeta("zigbee2mqtt");

	let loaded = $state(false);
	let saving = $state(false);
	let testing = $state(false);
	let scanStartedAt = $state<Date | null>(null);
	let broker = $state("");
	let frontendUrl = $state("");
	let username = $state("");
	let password = $state("");
	let useWss = $state(false);
	let enabled = $state(true);
	let scanScheduleEnabled = $state(false);
	let scanHour = $state<number | null>(null);
	let scanMinute = $state<number | null>(null);
	let lastScannedAt = $state<Date | null>(null);
	let original = $state("");
	let storedPassword = $state(false);
	let testResult = $state<TestResult | null>(null);

	function snapshot(): string {
		return JSON.stringify({
			broker,
			frontendUrl,
			username,
			useWss,
			enabled,
			scanScheduleEnabled,
			scanHour,
			scanMinute,
		});
	}

	const hasBroker = $derived(broker.trim() !== "");
	const scanning = $derived(scanStartedAt != null);
	const isDirty = $derived(loaded && (snapshot() !== original || password !== ""));
	const scheduleIncomplete = $derived(
		scanScheduleEnabled && (scanHour == null || scanMinute == null),
	);
	const frontendUrlError = $derived.by(() => validateFrontendUrl(frontendUrl));

	function validateFrontendUrl(value: string): string {
		if (value.trim() === "") return "";
		try {
			const parsed = new URL(value.trim());
			if (
				(parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
				parsed.username !== "" ||
				parsed.password !== "" ||
				parsed.search !== "" ||
				parsed.hash !== ""
			) {
				return "Use an HTTP or HTTPS URL without credentials, query, or fragment.";
			}
			return "";
		} catch {
			return "Enter a valid HTTP or HTTPS URL.";
		}
	}

	function mutationInput() {
		return {
			broker: broker.trim(),
			frontendUrl: frontendUrl.trim() || null,
			username: username.trim(),
			password: secretToSend(password, storedPassword),
			useWss,
			enabled,
			scanScheduleEnabled,
			scanHour,
			scanMinute,
		};
	}

	function applyConfig(config: ConfigShape | null | undefined) {
		broker = config?.broker ?? "";
		frontendUrl = config?.frontendUrl ?? "";
		username = config?.username ?? "";
		useWss = config?.useWss ?? false;
		enabled = config?.enabled ?? true;
		scanScheduleEnabled = config?.scanScheduleEnabled ?? false;
		scanHour = config?.scanHour ?? null;
		scanMinute = config?.scanMinute ?? null;
		scanStartedAt = config?.scanStartedAt ? new Date(config.scanStartedAt) : null;
		storedPassword = hasStoredSecret(config?.password);
		password = "";
		original = snapshot();
	}

	async function loadConfig() {
		const result = await client
			.query(ZIGBEE2MQTT_CONFIG_QUERY, {}, { requestPolicy: "network-only" })
			.toPromise();
		applyConfig(result.data?.zigbee2MqttConfig ?? null);
		loaded = true;
	}

	async function loadLastScan() {
		const result = await client
			.query(LAST_SCAN_QUERY, {}, { requestPolicy: "network-only" })
			.toPromise();
		const topo = result.data?.networkTopologies.find((t) => t.provider === "zigbee2mqtt");
		lastScannedAt = topo ? new Date(topo.scannedAt) : null;
	}

	async function saveConfig() {
		saving = true;
		try {
			const result = await client
				.mutation(UPDATE_ZIGBEE2MQTT_CONFIG, { input: mutationInput() })
				.toPromise();
			if (result.error) throw result.error;
			applyConfig(result.data?.updateZigbee2MqttConfig ?? null);
			testResult = null;
		} catch (e) {
			toast.error(graphqlErrorMessage(e, "Failed to save Zigbee2MQTT configuration"));
		} finally {
			saving = false;
		}
	}

	async function testConnection() {
		testing = true;
		try {
			const result = await client
				.mutation(TEST_ZIGBEE2MQTT_CONNECTION, { input: mutationInput() })
				.toPromise();
			if (result.error) throw result.error;
			testResult = result.data?.testZigbee2MqttConnection ?? null;
		} catch (e) {
			testResult = { success: false, message: graphqlErrorMessage(e, "Connection failed") };
		} finally {
			testing = false;
		}
	}

	async function scanNetwork() {
		scanStartedAt = new Date();
		try {
			const result = await client.mutation(SCAN_ZIGBEE2MQTT_NETWORK, {}).toPromise();
			if (result.error) throw result.error;
		} catch (e) {
			scanStartedAt = null;
			toast.error(graphqlErrorMessage(e, "Failed to start the network scan"));
		}
	}

	/** The scan reports nothing until it finishes; elapsed time is the only
	 * honest progress there is. */
	function elapsedLabel(from: Date, now: Date): string {
		const seconds = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 1000));
		if (seconds < 60) return `${seconds}s`;
		return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
	}

	const scanUpdates = subscriptionStore({
		client,
		query: SCAN_UPDATES_SUB,
		variables: { provider: "zigbee2mqtt" },
	});

	$effect(() => {
		const event = $scanUpdates.data?.networkTopologyUpdated;
		if (!event) return;
		scanStartedAt = null;
		lastScannedAt = new Date(event.scannedAt);
		toast.success("Network scan complete");
	});

	$effect(() => {
		pageHeader.actions = [
			{
				label: "Save",
				icon: Save,
				onclick: saveConfig,
				disabled:
					!isDirty || saving || !hasBroker || scheduleIncomplete || frontendUrlError !== "",
				hideLabelOnMobile: true,
			},
		];
		pageHeader.viewToggle = null;
	});

	onMount(() => {
		pageHeader.breadcrumbs = [
			{ label: "Integrations", href: "/integrations" },
			{ label: "Zigbee2MQTT" },
		];
		void loadConfig();
		void loadLastScan();
	});

</script>

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
	<section class="rounded-lg shadow-card bg-card p-6">
		<div class="mb-6 flex items-center gap-3">
			<meta.icon class="size-10" />
			<div>
				<h1 class="text-xl font-semibold">Zigbee2MQTT</h1>
				<p class="text-sm text-muted-foreground">{meta.description}</p>
			</div>
		</div>

		<div class="grid gap-4 max-w-xl">
			<div class="flex items-center gap-3 min-h-9">
				<Switch id="z2m-enabled" bind:checked={enabled} disabled={!loaded} />
				<label for="z2m-enabled" class="text-sm font-medium">Enabled</label>
			</div>

			<div class="grid gap-1.5">
				<label for="z2m-broker" class="text-sm font-medium">Broker address</label>
				<Input
					id="z2m-broker"
					bind:value={broker}
					disabled={!loaded}
					autocomplete="off"
					placeholder="mqtt.example.com:1883"
				/>
			</div>

			<div class="grid gap-1.5">
				<label for="z2m-frontend-url" class="text-sm font-medium">Zigbee2MQTT frontend URL</label>
				<Input
					id="z2m-frontend-url"
					bind:value={frontendUrl}
					disabled={!loaded}
					autocomplete="off"
					placeholder="https://zigbee2mqtt.example.com"
					aria-invalid={frontendUrlError !== ""}
					aria-describedby={frontendUrlError
						? "z2m-frontend-url-error"
						: "z2m-frontend-url-help"}
				/>
				{#if frontendUrlError}
					<FieldError id="z2m-frontend-url-error" message={frontendUrlError} />
				{:else}
					<p id="z2m-frontend-url-help" class="text-xs text-muted-foreground">
						Optional. Used for links into Zigbee2MQTT.
					</p>
				{/if}
			</div>

			<div class="grid gap-1.5">
				<label for="z2m-username" class="text-sm font-medium">Username</label>
				<Input
					id="z2m-username"
					bind:value={username}
					disabled={!loaded}
					autocomplete="off"
					placeholder="Optional"
				/>
			</div>

			<div class="grid gap-1.5">
				<label for="z2m-password" class="text-sm font-medium">Password</label>
				<Input
					id="z2m-password"
					type="password"
					bind:value={password}
					disabled={!loaded}
					autocomplete="new-password"
					data-1p-ignore
					data-lpignore="true"
					placeholder={storedPassword ? "Password set - leave blank to keep" : "Optional"}
				/>
			</div>

			<div class="flex items-center gap-3 min-h-9">
				<Switch id="z2m-use-wss" bind:checked={useWss} disabled={!loaded} />
				<label for="z2m-use-wss" class="text-sm font-medium">Use WebSocket Secure (WSS)</label>
			</div>

			<div class="flex flex-wrap items-center gap-3 pt-2">
				<Button
					variant="outline"
					size="sm"
					onclick={testConnection}
					disabled={!loaded || testing || !hasBroker || frontendUrlError !== ""}
				>
					{#if testing}
						<Loader2 class="size-4 animate-spin" />
					{:else}
						<Unplug class="size-4" />
					{/if}
					Check Connection
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

		<div class="mt-8 border-t border-border pt-6 grid gap-4 max-w-xl">
			<div>
				<h2 class="text-sm font-semibold">Network topology</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					A scan maps which devices relay for which, shown as the map's Connectivity view. It
					takes a few minutes and slows the Zigbee network while it runs.
				</p>
			</div>

			<div class="flex flex-wrap items-center gap-3">
				<Button
					variant="outline"
					size="sm"
					onclick={scanNetwork}
					disabled={!loaded || scanning || !enabled || !hasBroker}
				>
					{#if scanning}
						<Loader2 class="size-4 animate-spin" />
					{:else}
						<Radar class="size-4" />
					{/if}
					Scan Network
				</Button>
				<span class="text-sm text-muted-foreground">
					{#if scanStartedAt}
						Scanning for {elapsedLabel(scanStartedAt, nowStore.current)} — usually takes a few minutes
					{:else if lastScannedAt}
						Last scanned {formatRelative(lastScannedAt, nowStore.current, me.user?.timeFormat ?? "24h")}
					{:else}
						Never scanned
					{/if}
				</span>
			</div>

			<div class="flex items-center gap-3 min-h-9">
				<Switch id="z2m-scan-schedule" bind:checked={scanScheduleEnabled} disabled={!loaded} />
				<label for="z2m-scan-schedule" class="text-sm font-medium">Scheduled scan</label>
			</div>

			{#if scanScheduleEnabled}
				<div class="grid gap-1.5">
					<span class="text-sm font-medium">Runs daily at</span>
					<div class="flex w-36 gap-1">
						<NumberInput
							value={scanHour}
							onValueChange={(v) => (scanHour = v)}
							min={0}
							max={23}
							nullable
							placeholder="HH"
							ariaLabel="Scan hour"
						/>
						<span class="flex items-center text-xs text-muted-foreground">:</span>
						<NumberInput
							value={scanMinute}
							onValueChange={(v) => (scanMinute = v)}
							min={0}
							max={59}
							nullable
							placeholder="MM"
							ariaLabel="Scan minute"
						/>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<aside class="rounded-lg shadow-card bg-card p-6">
		<h2 class="text-sm font-semibold">Connecting</h2>
		<ol class="mt-3 space-y-2 text-sm text-muted-foreground">
			<li>1. Point Hive at the same MQTT broker your zigbee2mqtt instance publishes to.</li>
			<li>2. Hive reads the device registry from <code>zigbee2mqtt/bridge/devices</code>.</li>
			<li>3. Enable zigbee2mqtt's availability feature for online / offline state.</li>
		</ol>
		<p class="mt-4 text-sm text-muted-foreground">
			Saving reconnects to the broker. Device subscriptions are interrupted briefly.
		</p>
	</aside>
</div>
