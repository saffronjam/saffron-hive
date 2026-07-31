<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { getContextClient } from "@urql/svelte";
	import { toast } from "svelte-sonner";
	import { graphql } from "$lib/gql";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { integrationMeta } from "$lib/integrations";
	import { hasStoredSecret, secretToSend } from "$lib/redacted-secret";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { CircleCheck, CircleX, Loader2, Save, Unplug } from "@lucide/svelte";

	const ZIGBEE2MQTT_CONFIG_QUERY = graphql(`
		query Zigbee2MqttConfigPage {
			zigbee2MqttConfig {
				broker
				username
				password
				useWss
				enabled
			}
		}
	`);

	const UPDATE_ZIGBEE2MQTT_CONFIG = graphql(`
		mutation UpdateZigbee2MqttConfig($input: Zigbee2MqttConfigInput!) {
			updateZigbee2MqttConfig(input: $input) {
				broker
				username
				password
				useWss
				enabled
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

	type TestResult = { success: boolean; message: string };

	const client = getContextClient();
	const meta = integrationMeta("zigbee2mqtt");

	let loaded = $state(false);
	let saving = $state(false);
	let testing = $state(false);
	let broker = $state("");
	let username = $state("");
	let password = $state("");
	let useWss = $state(false);
	let enabled = $state(true);
	let original = $state("");
	let storedPassword = $state(false);
	let testResult = $state<TestResult | null>(null);

	function snapshot(): string {
		return JSON.stringify({ broker, username, useWss, enabled });
	}

	const hasBroker = $derived(broker.trim() !== "");
	const isDirty = $derived(loaded && (snapshot() !== original || password !== ""));

	function mutationInput() {
		return {
			broker: broker.trim(),
			username: username.trim(),
			password: secretToSend(password, storedPassword),
			useWss,
			enabled,
		};
	}

	function applyConfig(
		config:
			| {
					broker: string;
					username: string;
					password: string;
					useWss: boolean;
					enabled: boolean;
			  }
			| null
			| undefined,
	) {
		broker = config?.broker ?? "";
		username = config?.username ?? "";
		useWss = config?.useWss ?? false;
		enabled = config?.enabled ?? true;
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

	$effect(() => {
		pageHeader.actions = [
			{
				label: "Save",
				icon: Save,
				onclick: saveConfig,
				disabled: !isDirty || saving || !hasBroker,
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
	});

	onDestroy(() => pageHeader.reset());
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
					autocomplete="off"
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
					disabled={!loaded || testing || !hasBroker}
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
