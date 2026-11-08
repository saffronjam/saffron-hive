<script lang="ts">
  import { watchErrorToast } from "$lib/error-toast.svelte";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import { prefersReducedMotion } from "svelte/motion";
  import { getContextClient } from "@urql/svelte";
  import { Check, Copy, Loader2, Save, ScanLine } from "@lucide/svelte";
  import { graphql } from "$lib/gql";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Switch } from "$lib/components/ui/switch";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select";
  import ConnectionTest from "$lib/components/connection-test.svelte";
  import ExternalChangeBanner from "$lib/components/external-change-banner.svelte";
  import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
  import { createEditorRefresh } from "$lib/editor-refresh.svelte";
  import { secretToSend, hasStoredSecret } from "$lib/redacted-secret";
  import DreameVacuumSettings from "$lib/components/dreame-vacuum-settings.svelte";
  import { cleaningStore } from "$lib/stores/cleaning.svelte";
  import { pageHeader } from "$lib/stores/page-header.svelte";
  import { integrationDescription, integrationMeta } from "$lib/integrations";
  import { graphqlErrorMessage } from "$lib/graphql-error";
  import type { ConnectionResult } from "$lib/i18n/connection";
  import type { DreameConfig } from "$lib/gql/graphql";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  const QUERY = graphql(`
    query DreameSettings {
      dreameConfig {
        revision
        email
        password
        region
        enabled
      }
    }
  `);
  const SAVE = graphql(`
    mutation DreameSettingsSave(
      $input: DreameConfigInput!
      $expectedRevision: Int!
    ) {
      updateDreameConfig(input: $input, expectedRevision: $expectedRevision) {
        config {
          revision
          email
          password
          region
          enabled
        }
        application {
          success
          code
          diagnostic
        }
      }
    }
  `);
  const TEST = graphql(`
    mutation DreameSettingsTest($input: DreameConfigInput!) {
      testDreameConnection(input: $input) {
        success
        code
        diagnostic
      }
    }
  `);
  const client = getContextClient();
  const meta = integrationMeta("dreame");
  const options = $derived(locale.messageOptions());
  let email = $state("");
  let password = $state("");
  let region = $state("eu");
  let enabled = $state(true);
  let revision = $state(0);
  let stored = $state(false);
  let diagnostic = $state("");
  let diagnosticCopied = $state(false);
  $effect(() => {
    if (!diagnosticCopied) return;
    const timer = setTimeout(() => (diagnosticCopied = false), 1500);
    return () => clearTimeout(timer);
  });
  async function copyDiagnostics() {
    if (!diagnostic) return;
    try {
      await navigator.clipboard.writeText(diagnostic);
      diagnosticCopied = true;
    } catch (e) {
      error = graphqlErrorMessage(e);
    }
  }
  let reading = $state(false);
  const READ = graphql(`
    mutation DreameSettingsDiagnostics {
      readDreameDiagnostics {
        authenticated
        completedAt
        reads {
          name
          json
          error
        }
        devices {
          id
          name
          model
          reads {
            name
            json
            error
          }
          properties {
            name
            siid
            piid
            value
            code
          }
          maps {
            ...CleaningMapFields
          }
        }
      }
    }
  `);
  async function readDiagnostics() {
    reading = true;
    diagnosticCopied = false;
    error = "";
    try {
      const res = await client.mutation(READ, {}).toPromise();
      if (res.error) throw res.error;
      diagnostic = JSON.stringify(res.data?.readDreameDiagnostics, null, 2);
    } catch (e) {
      error = graphqlErrorMessage(e, m.cleaning_failed({}, options));
    } finally {
      reading = false;
    }
  }
  let original = $state("");
  let loaded = $state(false);
  let saving = $state(false);
  let testing = $state(false);
  let error = $state("");
  let result = $state<ConnectionResult | null>(null);
  const configDirty = $derived(
    loaded && JSON.stringify({ email, password, region, enabled }) !== original,
  );
  let vacuumForms = $state<Record<string, { isDirty: () => boolean; save: () => Promise<void> } | undefined>>({});
  const dirty = $derived(configDirty || cleaningStore.items.some((robot) => vacuumForms[robot.id]?.isDirty()));
  const regions = $derived([
    { id: "eu", name: m.dreame_region_eu({}, options) },
    { id: "us", name: m.dreame_region_us({}, options) },
    { id: "cn", name: m.dreame_region_cn({}, options) },
    { id: "sg", name: m.dreame_region_sg({}, options) },
    { id: "ru", name: m.dreame_region_ru({}, options) },
    { id: "kr", name: m.dreame_region_kr({}, options) },
    { id: "in", name: m.dreame_region_in({}, options) },
  ]);
  function apply(config: DreameConfig | null) {
    email = config?.email ?? "";
    password = "";
    region = config?.region ?? "eu";
    enabled = config?.enabled ?? true;
    revision = config?.revision ?? 0;
    stored = hasStoredSecret(config?.password);
    original = JSON.stringify({ email, password, region, enabled });
  }
  async function read() {
    const res = await client
      .query(QUERY, {}, { requestPolicy: "network-only" })
      .toPromise();
    if (res.error) throw res.error;
    return res.data?.dreameConfig ?? null;
  }
  const guard = createEditorRefresh({
    read,
    apply,
    dirty: () => configDirty,
    busy: () => saving || !loaded,
  });
  function input() {
    return {
      email: email.trim(),
      password: secretToSend(password, stored),
      region,
      enabled,
    };
  }
  async function save() {
    if (guard.conflict) return;
    saving = true;
    error = "";
    try {
      if (configDirty) {
        const res = await client
          .mutation(SAVE, { input: input(), expectedRevision: revision })
          .toPromise();
        if (res.error) throw res.error;
        if (res.data) {
          apply(res.data.updateDreameConfig.config);
          guard.accept(res.data.updateDreameConfig.config);
          result = res.data.updateDreameConfig.application;
          await cleaningStore.refresh(client);
        }
      }
      for (const robot of cleaningStore.items) {
        await vacuumForms[robot.id]?.save();
      }
    } catch (e) {
      error = graphqlErrorMessage(e, m.cleaning_failed({}, options));
    } finally {
      saving = false;
    }
  }
  async function test() {
    testing = true;
    error = "";
    try {
      const res = await client.mutation(TEST, { input: input() }).toPromise();
      if (res.error) throw res.error;
      result = res.data?.testDreameConnection ?? null;
    } catch (e) {
      error = graphqlErrorMessage(e, m.cleaning_failed({}, options));
    } finally {
      testing = false;
    }
  }
  $effect(() => {
    pageHeader.breadcrumbs = [
      { label: m.nav_integrations({}, options), href: "/integrations" },
      { label: "Dreame" },
    ];
    pageHeader.viewToggle = null;
    pageHeader.actions = [
      {
        label: m.common_save({}, options),
        icon: Save,
        saving,
        onclick: save,
        disabled:
          !dirty ||
          guard.conflict ||
          saving ||
          !email.trim() ||
          (!stored && !password),
      },
    ];
  });
  onMount(() => {
    void read()
      .then((value) => {
        apply(value);
        guard.accept(value);
        loaded = true;
      })
      .catch(
        (e) =>
          (error = graphqlErrorMessage(
            e,
            m.common_error_load_data({}, options),
          )),
      );
  });
  watchErrorToast(() => error);
</script>

<UnsavedGuard {dirty} />
{#if guard.conflict}<ExternalChangeBanner
    onreload={() => void guard.refresh(true)}
  />{/if}

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
  <section class="rounded-lg bg-card p-6 shadow-card">
    <div class="mb-6 flex items-center gap-3">
      <meta.icon class="size-10" />
      <div>
        <h1 class="text-xl font-semibold">Dreame</h1>
        <p class="text-sm text-muted-foreground">
          {integrationDescription("dreame")}
        </p>
      </div>
    </div>
    <div class="grid max-w-xl gap-4">
      <div class="flex min-h-9 items-center gap-3">
        <Switch
          id="dreame-enabled"
          bind:checked={enabled}
          disabled={!loaded || saving}
        /><label for="dreame-enabled" class="text-sm font-medium"
          >{m.dreame_enabled({}, options)}</label
        >
      </div>
      <div class="grid gap-1.5">
        <label for="dreame-email" class="text-sm font-medium"
          >{m.dreame_email({}, options)}</label
        ><Input
          id="dreame-email"
          type="email"
          autocomplete="off"
          bind:value={email}
          disabled={!loaded || saving}
        />
      </div>
      <div class="grid gap-1.5">
        <label for="dreame-password" class="text-sm font-medium"
          >{m.dreame_password({}, options)}</label
        ><Input
          id="dreame-password"
          type="password"
          autocomplete="new-password"
          bind:value={password}
          disabled={!loaded || saving}
          placeholder={stored ? "••••••••" : ""}
        />
      </div>
      <div class="grid gap-1.5">
        <span class="text-sm font-medium">{m.dreame_region({}, options)}</span
        ><Select type="single" bind:value={region} disabled={!loaded || saving}
          ><SelectTrigger
            class="w-full"
            aria-label={m.dreame_region({}, options)}
            >{regions.find((r) => r.id === region)?.name}</SelectTrigger
          ><SelectContent
            >{#each regions as r (r.id)}<SelectItem value={r.id}
                >{r.name}</SelectItem
              >{/each}</SelectContent
          ></Select
        >
      </div>
      <ConnectionTest
        label={m.cleaning_test({}, options)}
        {testing}
        disabled={!loaded || saving || !email.trim() || (!stored && !password)}
        {result}
        ontest={test}
      />
    </div>
  </section>
  <aside class="rounded-lg bg-card p-6 shadow-card">
    <h2 class="text-sm font-semibold">{m.dreame_connecting({}, options)}</h2>
    <ol class="mt-3 space-y-2 text-sm text-muted-foreground">
      <li>{m.dreame_connect_account({}, options)}</li>
      <li>{m.dreame_connect_region({}, options)}</li>
      <li>{m.dreame_connect_save({}, options)}</li>
    </ol>
  </aside>
</div>
{#if cleaningStore.items.length}
  <div class="mt-6 grid items-start gap-6 lg:grid-cols-2">
  <div class="min-w-0 space-y-6">
  {#each cleaningStore.items as robot (robot.id)}<DreameVacuumSettings
      {robot}
      bind:this={vacuumForms[robot.id]}
      disabled={saving}
    />{/each}
  </div>
  <section class="min-w-0 space-y-5 rounded-lg bg-card p-6 shadow-card" aria-labelledby="dreame-diagnostics-title">
    <div class="flex items-center justify-between gap-3">
      <h2 id="dreame-diagnostics-title" class="font-semibold">{m.cleaning_diagnostics({}, options)}</h2>
      <div class="flex items-center gap-2">
      {#if diagnostic}
        <div transition:slide={{ axis: "x", duration: prefersReducedMotion.current ? 0 : 160 }}>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={diagnosticCopied ? m.common_copied({}, options) : m.common_copy({}, options)}
            title={diagnosticCopied ? m.common_copied({}, options) : m.common_copy({}, options)}
            onclick={copyDiagnostics}
          >{#if diagnosticCopied}<Check class="size-4" />{:else}<Copy class="size-4" />{/if}</Button>
        </div>
      {/if}
      <Button
        size="sm"
        variant="outline"
        class="w-8 px-0 md:w-auto md:px-2.5"
        disabled={reading || dirty}
        aria-busy={reading}
        aria-label={m.dreame_read({}, options)}
        onclick={readDiagnostics}
        >{#if reading}<Loader2 class="size-4 animate-spin" />{:else}<ScanLine class="size-4" />{/if}<span class="hidden md:inline">{m.dreame_read({}, options)}</span></Button
      >
      </div>
    </div>
    {#if diagnostic}<pre
      class="max-h-80 overflow-auto text-xs">{diagnostic}</pre>
    {/if}
  </section>
  </div>
{/if}
