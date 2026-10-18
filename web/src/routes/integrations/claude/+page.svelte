<script lang="ts">
 import { createEditorRefresh } from "$lib/editor-refresh.svelte";
 import ExternalChangeBanner from "$lib/components/external-change-banner.svelte";
	import { onMount } from "svelte";
	import { getContextClient } from "@urql/svelte";
	import { toast } from "svelte-sonner";
	import { graphql } from "$lib/gql";
	import type { ClaudeAvailableModel } from "$lib/gql/graphql";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import type { ConnectionResult } from "$lib/i18n/connection";
	import { hasStoredSecret, secretToSend } from "$lib/redacted-secret";
	import { assistantAvailability } from "$lib/stores/assistant-availability.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { integrationDescription, integrationMeta } from "$lib/integrations";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Switch } from "$lib/components/ui/switch";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
	import ConnectionTest from "$lib/components/connection-test.svelte";
	import FieldError from "$lib/components/field-error.svelte";
	import { Save, Loader2 } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	const CONFIG = graphql(`
		query ClaudeIntegrationConfig {
			claudeConfig {
 revision
				token
				enabled
				model
				ready
			}
		}
	`);
	const SAVE = graphql(`
		mutation ClaudeIntegrationSave($input: ClaudeConfigInput!, $expectedRevision: Int!) {
			updateClaudeConfig(input: $input, expectedRevision: $expectedRevision) {
 revision
				token
				enabled
				model
				ready
			}
		}
	`);
	const TEST = graphql(`
		mutation ClaudeIntegrationTest($input: ClaudeConfigInput!) {
			testClaudeConnection(input: $input) {
				success
				code
				diagnostic
			}
		}
	`);
	const MODELS = graphql(`
		mutation ClaudeIntegrationModels($token: String!) {
			discoverClaudeModels(token: $token) {
				id
				name
				resolvedModel
			}
		}
	`);
	const client = getContextClient();
	const messageOptions = $derived(locale.messageOptions());
	const meta = integrationMeta("claude");
	let token = $state("");
	let stored = $state(false);
	let enabled = $state(true);
	let model = $state("");
	let loaded = $state(false);
	let saving = $state(false);
 let savedRevision=$state(0);
	let testing = $state(false);
	let discovering = $state(false);
	let models = $state<ClaudeAvailableModel[]>([]);
	let modelNames = $state<Record<string, string>>({});
	let modelsError = $state("");
	let original = $state("");
	let testResult = $state<ConnectionResult | null>(null);
	let discoveryGeneration = 0;
	const hasToken = $derived(stored || token.trim() !== "");
	const isDirty = $derived(loaded && (snapshot() !== original || token !== ""));
	function snapshot() {
		return JSON.stringify({ enabled, model });
	}
	function input() {
		return { token: secretToSend(token.trim(), stored), enabled, model };
	}
	async function discoverModels() {
		if (!hasToken) return;
		const generation = ++discoveryGeneration;
		discovering = true;
		modelsError = "";
		try {
			const r = await client.mutation(MODELS, { token: input().token }).toPromise();
			if (generation !== discoveryGeneration) return;
			if (r.error) throw r.error;
			models = r.data?.discoverClaudeModels ?? [];
			modelNames = { ...modelNames, ...Object.fromEntries(models.map(({ id, name }) => [id, name])) };
			if (!model) model = models[0]?.id ?? "";
		} catch {
			if (generation === discoveryGeneration)
				modelsError = m.claude_models_failed({}, messageOptions);
		} finally {
			if (generation === discoveryGeneration) discovering = false;
		}
	}
 type Config = {revision:number;token: string; enabled: boolean; model: string} | null;
 function applyConfig(c: Config) {
 savedRevision=c?.revision??0;
  stored=hasStoredSecret(c?.token); token="";enabled=c?.enabled??true;model=c?.model??"";
  original=snapshot();loaded=true;
  if(stored) void discoverModels();
 }
 async function readConfig():Promise<Config> {
  const result=await client.query(CONFIG,{}, {requestPolicy:"network-only"}).toPromise();
  if(result.error) throw result.error;
  const c=result.data?.claudeConfig;
  return c ? {revision:c.revision,token:c.token, enabled:c.enabled, model:c.model}:null;
 }
 const refreshGuard=createEditorRefresh({read:readConfig,apply:applyConfig,dirty:()=>isDirty,busy:()=>saving||!loaded});
 async function load(){
  try { const c=await readConfig();applyConfig(c);refreshGuard.accept(c); }
  catch(e){toast.error(graphqlErrorMessage(e,m.assistant_error({},messageOptions)));}
 }

	async function save() {
 if(refreshGuard.conflict)return;
		saving = true;
		try {
			const r = await client.mutation(SAVE, { input: input(), expectedRevision:savedRevision }).toPromise();
			if (r.error) throw r.error;
			stored = hasStoredSecret(r.data?.updateClaudeConfig.token);
			token = "";
			original = snapshot();
 savedRevision=r.data?.updateClaudeConfig.revision??savedRevision;
 refreshGuard.accept({revision:savedRevision,token:r.data?.updateClaudeConfig.token ?? "",enabled,model});
			testResult = null;
			await assistantAvailability.refresh(client);
		} catch (e) {
			toast.error(graphqlErrorMessage(e, m.assistant_error({}, messageOptions)));
		} finally {
			saving = false;
		}
	}
	async function test() {
		testing = true;
		try {
			const r = await client
				.mutation(TEST, { input: { ...input(), model: model || "default" } })
				.toPromise();
			if (r.error) throw r.error;
			testResult = r.data?.testClaudeConnection ?? null;
		} catch {
			testResult = { success: false, code: "FAILED" };
		} finally {
			testing = false;
		}
	}
	$effect(() => {
		pageHeader.breadcrumbs = [
			{ label: m.nav_integrations({}, messageOptions), href: "/integrations" },
			{ label: "Claude" },
		];
		pageHeader.actions = [
			{
				label: m.common_save({}, messageOptions),
				icon: Save,
				onclick: save,
				disabled: refreshGuard.conflict || !isDirty || saving || !hasToken || !model,
				hideLabelOnMobile: true,
			},
		];
		pageHeader.viewToggle = null;
	});
	onMount(() => {
		void load();
	});
</script>
{#if refreshGuard.conflict}<ExternalChangeBanner onreload={() => { void refreshGuard.refresh(true); }} />{/if}

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
	<section class="rounded-lg shadow-card bg-card p-6">
		<div class="mb-6 flex items-center gap-3">
			<meta.icon class="size-10" />
			<div>
				<h1 class="text-xl font-semibold">Claude</h1>
				<p class="text-sm text-muted-foreground">{integrationDescription("claude")}</p>
			</div>
		</div>
		<div class="grid gap-4 max-w-xl">
			<div class="flex items-center gap-3 min-h-9">
				<Switch id="claude-enabled" bind:checked={enabled} disabled={!loaded} />
				<label for="claude-enabled" class="text-sm font-medium"
					>{m.claude_enabled({}, messageOptions)}</label
				>
			</div>
			<div class="grid gap-1.5">
				<label for="claude-token" class="text-sm font-medium"
					>{m.claude_token({}, messageOptions)}</label
				>
				<Input
					id="claude-token"
					type="password"
					bind:value={token}
					disabled={!loaded}
					autocomplete="new-password"
					data-1p-ignore
					data-lpignore="true"
					placeholder={stored ? m.claude_token_keep({}, messageOptions) : ""}
					onblur={() => {
						void discoverModels();
					}}
					oninput={() => {
						discoveryGeneration++;
						discovering = false;
						models = [];
						modelsError = "";
						testResult = null;
					}}
				/>
			</div>
			<div class="grid gap-1.5">
				<div class="flex items-center gap-2">
					<label for="claude-model" class="text-sm font-medium"
						>{m.claude_model({}, messageOptions)}</label
					>
					{#if discovering}<Loader2 class="size-3.5 animate-spin text-muted-foreground" />{/if}
				</div>
				<Select
					type="single"
					bind:value={model}
					disabled={!loaded || discovering || models.length === 0}
				>
					<SelectTrigger id="claude-model" class="w-full"
						>{modelNames[model] ||
							m.claude_choose_model({}, messageOptions)}</SelectTrigger
					>
					<SelectContent>
						{#each models as item (item.id)}<SelectItem value={item.id}>{item.name}</SelectItem
							>{/each}
					</SelectContent>
				</Select>
				{#if modelsError}
					<FieldError message={modelsError} />
					<Button
						variant="outline"
						size="sm"
						class="w-fit"
						disabled={discovering || !hasToken}
						onclick={discoverModels}>{m.common_try_again({}, messageOptions)}</Button
					>
				{/if}
			</div>
			<ConnectionTest
				label={m.claude_test({}, messageOptions)}
				{testing}
				disabled={!loaded || !hasToken}
				result={testResult}
				ontest={test}
			/>
		</div>
	</section>
	<aside class="rounded-lg shadow-card bg-card p-6">
		<h2 class="text-sm font-semibold">{m.claude_connecting({}, messageOptions)}</h2>
		<ol class="mt-3 space-y-2 text-sm text-muted-foreground">
			<li>{m.claude_connect_token({}, messageOptions)}</li>
			<li>{m.claude_connect_model({}, messageOptions)}</li>
			<li>{m.claude_connect_save({}, messageOptions)}</li>
		</ol>
	</aside>
</div>
