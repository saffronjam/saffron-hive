<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import { Save, Plug, Loader2, CircleCheck, CircleX } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";

	interface MqttConfig {
		broker: string;
		username: string;
		password: string;
		useWss: boolean;
	}

	interface SettingData {
		key: string;
		value: string;
	}

	const MQTT_CONFIG_QUERY = graphql(`
		query MqttConfig {
			mqttConfig {
				broker
				username
				password
				useWss
			}
		}
	`);

	const SETTINGS_QUERY = graphql(`
		query Settings {
			settings {
				key
				value
			}
		}
	`);

	const UPDATE_MQTT_CONFIG = graphql(`
		mutation UpdateMqttConfig($input: MqttConfigInput!) {
			updateMqttConfig(input: $input) {
				broker
				username
				password
				useWss
			}
		}
	`);

	const TEST_MQTT_CONNECTION = graphql(`
		mutation TestMqttConnection($input: MqttConfigInput!) {
			testMqttConnection(input: $input) {
				success
				message
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

	let broker = $state("");
	let username = $state("");
	let password = $state("");
	let useWss = $state(false);
	let mqttLoaded = $state(false);

	let origBroker = $state("");
	let origUsername = $state("");
	let origPassword = $state("");
	let origUseWss = $state(false);

	let logLevel = $state("INFO");
	let origLogLevel = $state("");

	let historyRetentionDays = $state("365");
	let origHistoryRetentionDays = $state("365");

	let saving = $state(false);
	let testing = $state(false);
	let testResult = $state<{ success: boolean; message: string } | null>(null);
	let showReconnectDialog = $state(false);

	const mqttDirty = $derived(
		broker !== origBroker ||
			username !== origUsername ||
			password !== origPassword ||
			useWss !== origUseWss
	);

	const settingsDirty = $derived(
		logLevel !== origLogLevel || historyRetentionDays !== origHistoryRetentionDays
	);

	const isDirty = $derived(mqttDirty || settingsDirty);

	const logLevelOptions = [
		{ value: "DEBUG", label: "Debug" },
		{ value: "INFO", label: "Info" },
		{ value: "WARN", label: "Warn" },
		{ value: "ERROR", label: "Error" },
	];

	async function loadData() {
		const [mqttResult, settingsResult] = await Promise.all([
			client.query(MQTT_CONFIG_QUERY, {}).toPromise(),
			client.query(SETTINGS_QUERY, {}).toPromise(),
		]);

		if (mqttResult.data?.mqttConfig) {
			const cfg = mqttResult.data.mqttConfig;
			broker = origBroker = cfg.broker;
			username = origUsername = cfg.username;
			password = origPassword = cfg.password;
			useWss = origUseWss = cfg.useWss;
			mqttLoaded = true;
		}

		if (settingsResult.data?.settings) {
			for (const s of settingsResult.data.settings) {
				if (s.key === "log_level") {
					logLevel = origLogLevel = s.value;
				} else if (s.key === "history.retention_days") {
					historyRetentionDays = origHistoryRetentionDays = s.value;
				}
			}
		}
	}

	function handleSave() {
		if (mqttDirty) {
			showReconnectDialog = true;
		} else {
			doSave();
		}
	}

	async function doSave() {
		saving = true;
		showReconnectDialog = false;

		try {
			if (mqttDirty) {
				const result = await client
					.mutation(UPDATE_MQTT_CONFIG, {
						input: { broker, username, password, useWss },
					})
					.toPromise();
				if (result.error) {
					console.error("Failed to update MQTT config:", result.error);
					return;
				}
				origBroker = broker;
				origUsername = username;
				origPassword = password;
				origUseWss = useWss;
			}

			if (logLevel !== origLogLevel) {
				const result = await client
					.mutation(UPDATE_SETTING, {
						key: "log_level",
						value: logLevel,
					})
					.toPromise();
				if (result.error) {
					console.error("Failed to update setting:", result.error);
					return;
				}
				origLogLevel = logLevel;
			}
			if (historyRetentionDays !== origHistoryRetentionDays) {
				const parsed = Number(historyRetentionDays);
				if (!Number.isFinite(parsed) || parsed <= 0) {
					console.error("Invalid retention value");
					return;
				}
				const result = await client
					.mutation(UPDATE_SETTING, {
						key: "history.retention_days",
						value: String(Math.floor(parsed)),
					})
					.toPromise();
				if (result.error) {
					console.error("Failed to update retention:", result.error);
					return;
				}
				origHistoryRetentionDays = historyRetentionDays;
			}
		} finally {
			saving = false;
		}
	}

	async function testConnection() {
		testing = true;
		testResult = null;
		try {
			const result = await client
				.mutation<{
					testMqttConnection: { success: boolean; message: string };
				}>(TEST_MQTT_CONNECTION, {
					input: { broker, username, password, useWss },
				})
				.toPromise();
			if (result.data) {
				testResult = result.data.testMqttConnection;
			} else if (result.error) {
				testResult = { success: false, message: result.error.message };
			}
		} finally {
			testing = false;
		}
	}

	$effect(() => {
		pageHeader.actions = [
			{
				label: "Save",
				icon: Save,
				onclick: handleSave,
				disabled: !isDirty || saving,
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
		<h2 class="text-lg font-semibold mb-4">MQTT</h2>
		<div class="grid gap-4 max-w-lg">
			<div class="grid gap-1.5">
				<label for="broker" class="text-sm font-medium">Broker address</label>
				<Input id="broker" bind:value={broker} placeholder="mqtt.example.com:1883" />
			</div>
			<div class="grid gap-1.5">
				<label for="mqtt-username" class="text-sm font-medium">Username</label>
				<Input id="mqtt-username" bind:value={username} placeholder="Optional" />
			</div>
			<div class="grid gap-1.5">
				<label for="mqtt-password" class="text-sm font-medium">Password</label>
				<Input
					id="mqtt-password"
					type="password"
					bind:value={password}
					placeholder="Optional"
				/>
			</div>
			<div class="flex items-center gap-3 min-h-[18.4px]">
				{#if mqttLoaded}
					<Switch id="use-wss" bind:checked={useWss} />
					<label for="use-wss" class="text-sm font-medium"
						>Use WebSocket Secure (WSS)</label
					>
				{/if}
			</div>
			<div class="flex items-center gap-3 pt-2">
				<Button variant="outline" size="sm" onclick={testConnection} disabled={testing}>
					{#if testing}
						<Loader2 class="size-4 mr-1.5 animate-spin" />
					{:else}
						<Plug class="size-4 mr-1.5" />
					{/if}
					Check Connection
				</Button>
				{#if testResult}
					{#if testResult.success}
						<CircleCheck class="size-5 text-green-600 dark:text-green-400" />
					{:else}
						<div class="flex items-center gap-1.5 text-red-600 dark:text-red-400">
							<CircleX class="size-5 shrink-0" />
							<span class="text-sm">{testResult.message}</span>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>

	<div class="rounded-lg shadow-card bg-card p-6">
		<h2 class="text-lg font-semibold mb-4">History</h2>
		<div class="grid gap-4 max-w-lg">
			<div class="grid gap-1.5">
				<label for="retention-days" class="text-sm font-medium">Retention (days)</label>
				<Input
					id="retention-days"
					type="number"
					min="1"
					bind:value={historyRetentionDays}
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

<Dialog bind:open={showReconnectDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Reconnect MQTT?</DialogTitle>
			<DialogDescription>
				Saving these changes will disconnect from the current MQTT broker and reconnect with
				the new configuration. Active device subscriptions will be interrupted briefly.
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={() => (showReconnectDialog = false)}>Cancel</Button>
			<Button onclick={doSave} disabled={saving}>
				{#if saving}
					<Loader2 class="size-4 mr-1.5 animate-spin" />
				{/if}
				Save & Reconnect
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
