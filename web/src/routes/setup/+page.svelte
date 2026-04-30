<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import type { Client } from "@urql/svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Loader2, Plug, CircleCheck, CircleX } from "@lucide/svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { delayedLoading } from "$lib/delayed-loading.svelte";

	const SETUP_STATUS = graphql(`
		query setupStatus {
			setupStatus {
				hasInitialUser
				mqttConfigured
			}
		}
	`);

	const CREATE_INITIAL_USER = graphql(`
		mutation createInitialUser($input: CreateInitialUserInput!) {
			createInitialUser(input: $input) {
				token
				user {
					id
					username
					name
				}
			}
		}
	`);

	const UPDATE_MQTT_CONFIG = graphql(`
		mutation SetupUpdateMqttConfig($input: MqttConfigInput!) {
			updateMqttConfig(input: $input) {
				broker
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

	let client: Client;
	let phase = $state<"loading" | "user" | "mqtt" | "done">("loading");
	const loader = delayedLoading(() => phase === "loading");
	let error = $state<string | null>(null);

	// Phase 1 state
	let username = $state("");
	let name = $state("");
	let password = $state("");
	let confirmPassword = $state("");
	let submittingUser = $state(false);

	// Phase 2 state
	let broker = $state("");
	let mqttUsername = $state("");
	let mqttPassword = $state("");
	let useWss = $state(false);
	let savingMqtt = $state(false);
	let testing = $state(false);
	let testResult = $state<{ success: boolean; message: string } | null>(null);

	async function determinePhase() {
		const result = await client.query<{ setupStatus: { hasInitialUser: boolean; mqttConfigured: boolean } }>(
			SETUP_STATUS,
			{}
		).toPromise();
		const s = result.data?.setupStatus;
		if (!s) {
			error = "Could not reach the server.";
			return;
		}
		if (!s.hasInitialUser) {
			phase = "user";
		} else if (!s.mqttConfigured) {
			phase = "mqtt";
		} else {
			phase = "done";
			await goto("/", { replaceState: true });
		}
	}

	async function submitUser(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		if (password !== confirmPassword) {
			error = "Passwords do not match.";
			return;
		}
		if (password.length < 6) {
			error = "Password must be at least 6 characters.";
			return;
		}
		submittingUser = true;
		try {
			const result = await client
				.mutation<{ createInitialUser: { token: string } }>(CREATE_INITIAL_USER, {
					input: { username, name, password },
				})
				.toPromise();
			if (result.error || !result.data) {
				error = result.error?.message ?? "Failed to create user.";
				return;
			}
			auth.setToken(result.data.createInitialUser.token);
			await determinePhase();
		} finally {
			submittingUser = false;
		}
	}

	async function testConnection() {
		testing = true;
		testResult = null;
		try {
			const result = await client
				.mutation<{ testMqttConnection: { success: boolean; message: string } }>(
					TEST_MQTT_CONNECTION,
					{ input: { broker, username: mqttUsername, password: mqttPassword, useWss } }
				)
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

	async function submitMqtt(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		savingMqtt = true;
		try {
			const result = await client
				.mutation(UPDATE_MQTT_CONFIG, {
					input: { broker, username: mqttUsername, password: mqttPassword, useWss },
				})
				.toPromise();
			if (result.error) {
				error = result.error.message;
				return;
			}
			phase = "done";
			await goto("/", { replaceState: true });
		} finally {
			savingMqtt = false;
		}
	}

	onMount(() => {
		client = getContextClient();
		pageHeader.breadcrumbs = [{ label: "Setup" }];
		void determinePhase();
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-6">
	<div class="w-full max-w-lg rounded-lg shadow-card bg-card p-8">
		{#if phase === "loading"}
			{#if loader.visible}
				<div class="flex items-center gap-2 text-muted-foreground">
					<Loader2 class="size-4 animate-spin" />
					Loading...
				</div>
			{/if}
		{:else if phase === "user"}
			<h1 class="text-xl font-semibold">Welcome to Hive!</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Create the first user. This will be your admin account.
			</p>
			<form class="mt-6 flex flex-col gap-4" onsubmit={submitUser}>
				<div class="grid gap-1.5">
					<label for="setup-name" class="text-sm font-medium">Name</label>
					<Input id="setup-name" bind:value={name} required />
				</div>
				<div class="grid gap-1.5">
					<label for="setup-username" class="text-sm font-medium">Username</label>
					<Input id="setup-username" bind:value={username} autocomplete="username" required />
				</div>
				<div class="grid gap-1.5">
					<label for="setup-password" class="text-sm font-medium">Password</label>
					<Input
						id="setup-password"
						type="password"
						bind:value={password}
						autocomplete="new-password"
						required
					/>
				</div>
				<div class="grid gap-1.5">
					<label for="setup-confirm" class="text-sm font-medium">Confirm password</label>
					<Input
						id="setup-confirm"
						type="password"
						bind:value={confirmPassword}
						autocomplete="new-password"
						required
					/>
				</div>
				{#if error}
					<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
				{/if}
				<Button type="submit" disabled={submittingUser}>
					{#if submittingUser}
						<Loader2 class="mr-1.5 size-4 animate-spin" />
					{/if}
					Create user
				</Button>
			</form>
		{:else if phase === "mqtt"}
			<h1 class="text-xl font-semibold">Connect to MQTT</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Hive needs an MQTT broker to talk to your devices. Leave user & password blank for an
				anonymous broker.
			</p>
			<form class="mt-6 flex flex-col gap-4" onsubmit={submitMqtt}>
				<div class="grid gap-1.5">
					<label for="setup-broker" class="text-sm font-medium">Broker address</label>
					<Input id="setup-broker" bind:value={broker} placeholder="mqtt.example.com:1883" required />
				</div>
				<div class="grid gap-1.5">
					<label for="setup-mqtt-user" class="text-sm font-medium">Username</label>
					<Input id="setup-mqtt-user" bind:value={mqttUsername} placeholder="Optional" />
				</div>
				<div class="grid gap-1.5">
					<label for="setup-mqtt-pass" class="text-sm font-medium">Password</label>
					<Input
						id="setup-mqtt-pass"
						type="password"
						bind:value={mqttPassword}
						placeholder="Optional"
					/>
				</div>
				<div class="flex items-center gap-3">
					<Switch id="setup-wss" bind:checked={useWss} />
					<label for="setup-wss" class="text-sm font-medium">Use WebSocket Secure (WSS)</label>
				</div>
				<div class="flex items-center gap-3">
					<Button variant="outline" type="button" size="sm" onclick={testConnection} disabled={testing || !broker}>
						{#if testing}
							<Loader2 class="mr-1.5 size-4 animate-spin" />
						{:else}
							<Plug class="mr-1.5 size-4" />
						{/if}
						Check connection
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
				{#if error}
					<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
				{/if}
				<Button type="submit" disabled={savingMqtt || !broker}>
					{#if savingMqtt}
						<Loader2 class="mr-1.5 size-4 animate-spin" />
					{/if}
					Save and continue
				</Button>
			</form>
		{/if}
	</div>
</div>
