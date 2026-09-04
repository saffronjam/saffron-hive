<script lang="ts">
	import { onMount } from "svelte";
	import { getContextClient, subscriptionStore } from "@urql/svelte";
	import { toast } from "svelte-sonner";
	import { graphql } from "$lib/gql";
	import { onGraphQLRecovered } from "$lib/graphql/app-recovery";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { connectionResultMessage, type ConnectionResult } from "$lib/i18n/connection";
	import { integrationDescription, integrationMeta } from "$lib/integrations";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
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
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import { CircleCheck, CircleX, Info, Loader2, Radar, Save, Unplug } from "@lucide/svelte";

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
				interactiveCommandsPerSecond
				continuousCommandsPerSecond
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
				interactiveCommandsPerSecond
				continuousCommandsPerSecond
			}
		}
	`);

	const TEST_ZIGBEE2MQTT_CONNECTION = graphql(`
		mutation TestZigbee2MqttConnection($input: Zigbee2MqttConfigInput!) {
			testZigbee2MqttConnection(input: $input) {
				success
				code
				diagnostic
			}
		}
	`);

	const SCAN_ZIGBEE2MQTT_NETWORK = graphql(`
		mutation ScanZigbee2MqttNetwork {
			scanZigbee2MqttNetwork
		}
	`);

	const SCAN_STATE_QUERY = graphql(`
		query Zigbee2MqttScanState {
			zigbee2MqttConfig {
				scanStartedAt
			}
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

	type TestResult = ConnectionResult;

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
		interactiveCommandsPerSecond: number;
		continuousCommandsPerSecond: number;
	};

	const client = getContextClient();
	const messageOptions = $derived(locale.messageOptions());
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
	let interactiveCommandsPerSecond = $state(10);
	let continuousCommandsPerSecond = $state(2);
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
			interactiveCommandsPerSecond,
			continuousCommandsPerSecond,
		});
	}

	const hasBroker = $derived(broker.trim() !== "");
	const scanning = $derived(scanStartedAt != null);
	const isDirty = $derived(loaded && (snapshot() !== original || password !== ""));
	const scheduleIncomplete = $derived(
		scanScheduleEnabled && (scanHour == null || scanMinute == null),
	);
	const frontendUrlError = $derived.by(() => validateFrontendUrl(frontendUrl));
	const commandRateError = $derived.by(() => {
		if (interactiveCommandsPerSecond < 1 || interactiveCommandsPerSecond > 50) {
			return m.zigbee_rate_interactive_invalid({}, messageOptions);
		}
		if (continuousCommandsPerSecond < 1 || continuousCommandsPerSecond > 10) {
			return m.zigbee_rate_continuous_invalid({}, messageOptions);
		}
		if (continuousCommandsPerSecond > interactiveCommandsPerSecond) {
			return m.zigbee_rate_order_invalid({}, messageOptions);
		}
		return "";
	});

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
				return m.zigbee_frontend_url_restricted({}, messageOptions);
			}
			return "";
		} catch {
			return m.zigbee_frontend_url_invalid({}, messageOptions);
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
			interactiveCommandsPerSecond,
			continuousCommandsPerSecond,
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
		interactiveCommandsPerSecond = config?.interactiveCommandsPerSecond ?? 10;
		continuousCommandsPerSecond = config?.continuousCommandsPerSecond ?? 2;
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

	async function loadScanState() {
		const result = await client
			.query(SCAN_STATE_QUERY, {}, { requestPolicy: "network-only" })
			.toPromise();
		const startedAt = result.data?.zigbee2MqttConfig?.scanStartedAt;
		scanStartedAt = startedAt ? new Date(startedAt) : null;
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
			toast.error(graphqlErrorMessage(e, m.zigbee_config_save_failed({}, messageOptions)));
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
			console.error(e);
			testResult = { success: false, code: "FAILED", diagnostic: null };
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
			toast.error(graphqlErrorMessage(e, m.zigbee_scan_start_failed({}, messageOptions)));
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
		toast.success(m.zigbee_scan_complete({}, messageOptions));
	});

	$effect(() => {
		pageHeader.actions = [
			{
				label: m.common_save({}, messageOptions),
				icon: Save,
				onclick: saveConfig,
				disabled:
					!isDirty ||
					saving ||
					!hasBroker ||
					scheduleIncomplete ||
					frontendUrlError !== "" ||
					commandRateError !== "",
				hideLabelOnMobile: true,
			},
		];
		pageHeader.viewToggle = null;
		pageHeader.breadcrumbs = [
			{ label: m.nav_integrations({}, messageOptions), href: "/integrations" },
			{ label: "Zigbee2MQTT" },
		];
	});

	onMount(() => {
		void loadConfig();
		void loadScanState();
	});

	onGraphQLRecovered(() => {
		void loadScanState();
	});

</script>

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
	<section class="rounded-lg shadow-card bg-card p-6">
		<div class="mb-6 flex items-center gap-3">
			<meta.icon class="size-10" />
			<div>
				<h1 class="text-xl font-semibold">Zigbee2MQTT</h1>
				<p class="text-sm text-muted-foreground">{integrationDescription("zigbee2mqtt")}</p>
			</div>
		</div>

		<div class="grid gap-4 max-w-xl">
			<div class="flex items-center gap-3 min-h-9">
				<Switch id="z2m-enabled" bind:checked={enabled} disabled={!loaded} />
				<label for="z2m-enabled" class="text-sm font-medium">{m.zigbee_enabled({}, messageOptions)}</label>
			</div>

			<div class="grid gap-1.5">
				<label for="z2m-broker" class="text-sm font-medium">{m.zigbee_broker_address({}, messageOptions)}</label>
				<Input
					id="z2m-broker"
					bind:value={broker}
					disabled={!loaded}
					autocomplete="off"
					placeholder="mqtt.example.com:1883"
				/>
			</div>

			<div class="grid gap-1.5">
				<label for="z2m-frontend-url" class="text-sm font-medium">{m.zigbee_frontend_url({}, messageOptions)}</label>
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
						{m.zigbee_frontend_url_help({}, messageOptions)}
					</p>
				{/if}
			</div>

			<div class="grid gap-1.5">
				<label for="z2m-username" class="text-sm font-medium">{m.zigbee_username({}, messageOptions)}</label>
				<Input
					id="z2m-username"
					bind:value={username}
					disabled={!loaded}
					autocomplete="off"
					placeholder={m.zigbee_optional({}, messageOptions)}
				/>
			</div>

			<div class="grid gap-1.5">
				<label for="z2m-password" class="text-sm font-medium">{m.zigbee_password({}, messageOptions)}</label>
				<Input
					id="z2m-password"
					type="password"
					bind:value={password}
					disabled={!loaded}
					autocomplete="new-password"
					data-1p-ignore
					data-lpignore="true"
					placeholder={storedPassword ? m.zigbee_password_keep({}, messageOptions) : m.zigbee_optional({}, messageOptions)}
				/>
			</div>

			<div class="flex items-center gap-3 min-h-9">
				<Switch id="z2m-use-wss" bind:checked={useWss} disabled={!loaded} />
				<label for="z2m-use-wss" class="text-sm font-medium">{m.zigbee_use_wss({}, messageOptions)}</label>
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
					{m.zigbee_check_connection({}, messageOptions)}
				</Button>
				{#if testResult}
					{#if testResult.success}
						<div class="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
							<CircleCheck class="size-5" />
							<span>{connectionResultMessage(testResult)}</span>
						</div>
					{:else}
						<div class="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
							<CircleX class="size-5 shrink-0" />
							<span>{connectionResultMessage(testResult)}</span>
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<div class="mt-8 border-t border-border pt-6 grid gap-4 max-w-xl">
			<div class="flex items-center gap-1.5">
				<h2 class="text-sm font-semibold">{m.zigbee_command_traffic({}, messageOptions)}</h2>
				<Tooltip>
					<TooltipTrigger class="text-muted-foreground" aria-label={m.zigbee_command_traffic_about({}, messageOptions)}>
						<Info class="size-3.5" />
					</TooltipTrigger>
					<TooltipContent>
						{m.zigbee_command_traffic_help({}, messageOptions)}
					</TooltipContent>
				</Tooltip>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="grid gap-1.5">
					<div class="flex items-center gap-1.5">
						<label for="z2m-interactive-rate" class="text-sm font-medium">
							{m.zigbee_interactive_rate({}, messageOptions)}
						</label>
						<Tooltip>
							<TooltipTrigger class="text-muted-foreground" aria-label={m.zigbee_interactive_rate_about({}, messageOptions)}>
								<Info class="size-3.5" />
							</TooltipTrigger>
							<TooltipContent>
								{m.zigbee_interactive_rate_help({}, messageOptions)}
							</TooltipContent>
						</Tooltip>
					</div>
					<NumberInput
						id="z2m-interactive-rate"
						value={interactiveCommandsPerSecond}
						onValueChange={(value) => (interactiveCommandsPerSecond = value ?? 10)}
						min={1}
						max={50}
						disabled={!loaded}
					/>
				</div>
				<div class="grid gap-1.5">
					<div class="flex items-center gap-1.5">
						<label for="z2m-continuous-rate" class="text-sm font-medium">
							{m.zigbee_continuous_rate({}, messageOptions)}
						</label>
						<Tooltip>
							<TooltipTrigger class="text-muted-foreground" aria-label={m.zigbee_continuous_rate_about({}, messageOptions)}>
								<Info class="size-3.5" />
							</TooltipTrigger>
							<TooltipContent>
								{m.zigbee_continuous_rate_help({}, messageOptions)}
							</TooltipContent>
						</Tooltip>
					</div>
					<NumberInput
						id="z2m-continuous-rate"
						value={continuousCommandsPerSecond}
						onValueChange={(value) => (continuousCommandsPerSecond = value ?? 2)}
						min={1}
						max={10}
						disabled={!loaded}
					/>
				</div>
			</div>
			{#if commandRateError}
				<FieldError id="z2m-command-rate-error" message={commandRateError} />
			{/if}
		</div>

		<div class="mt-8 border-t border-border pt-6 grid gap-4 max-w-xl">
			<div class="flex items-center gap-1.5">
				<h2 class="text-sm font-semibold">{m.zigbee_topology({}, messageOptions)}</h2>
				<Tooltip>
					<TooltipTrigger class="text-muted-foreground" aria-label={m.zigbee_topology_about({}, messageOptions)}>
						<Info class="size-3.5" />
					</TooltipTrigger>
					<TooltipContent>
						{m.zigbee_topology_help({}, messageOptions)}
					</TooltipContent>
				</Tooltip>
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
					{m.zigbee_scan_network({}, messageOptions)}
				</Button>
				<span class="text-sm text-muted-foreground">
					{#if scanStartedAt}
						{m.zigbee_scanning({ duration: elapsedLabel(scanStartedAt, nowStore.current) }, messageOptions)}
					{:else if lastScannedAt}
						{m.zigbee_last_scanned({ time: formatRelative(lastScannedAt, nowStore.current, me.user?.timeFormat ?? "24h") }, messageOptions)}
					{:else}
						{m.zigbee_never_scanned({}, messageOptions)}
					{/if}
				</span>
			</div>

			<div class="flex items-center gap-3 min-h-9">
				<Switch id="z2m-scan-schedule" bind:checked={scanScheduleEnabled} disabled={!loaded} />
				<label for="z2m-scan-schedule" class="text-sm font-medium">{m.zigbee_scheduled_scan({}, messageOptions)}</label>
			</div>

			{#if scanScheduleEnabled}
				<div class="grid gap-1.5">
					<span class="text-sm font-medium">{m.zigbee_runs_daily_at({}, messageOptions)}</span>
					<div class="flex w-36 gap-1">
						<NumberInput
							value={scanHour}
							onValueChange={(v) => (scanHour = v)}
							min={0}
							max={23}
							nullable
							placeholder={m.common_time_hour_placeholder({}, messageOptions)}
							ariaLabel={m.zigbee_scan_hour({}, messageOptions)}
						/>
						<span class="flex items-center text-xs text-muted-foreground">:</span>
						<NumberInput
							value={scanMinute}
							onValueChange={(v) => (scanMinute = v)}
							min={0}
							max={59}
							nullable
							placeholder={m.common_time_minute_placeholder({}, messageOptions)}
							ariaLabel={m.zigbee_scan_minute({}, messageOptions)}
						/>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<aside class="rounded-lg shadow-card bg-card p-6">
		<h2 class="text-sm font-semibold">{m.zigbee_connecting({}, messageOptions)}</h2>
		<ol class="mt-3 space-y-2 text-sm text-muted-foreground">
			<li>{m.zigbee_connect_step_broker({}, messageOptions)}</li>
			<li>{m.zigbee_connect_step_registry({}, messageOptions)}</li>
			<li>{m.zigbee_connect_step_availability({}, messageOptions)}</li>
		</ol>
		<p class="mt-4 text-sm text-muted-foreground">
			{m.zigbee_reconnect_help({}, messageOptions)}
		</p>
	</aside>
</div>
