<script lang="ts">
  import { watchErrorToast } from "$lib/error-toast.svelte";
  import { onMount, untrack, type Snippet } from "svelte";
  import { page } from "$app/state";
  import { getContextClient, subscriptionStore } from "@urql/svelte";
  import { graphql } from "$lib/gql";
  import AuditNavigationTable from "$lib/components/audit-navigation-table.svelte";
  import HiveChip from "$lib/components/hive-chip.svelte";
  import JsonEditor from "$lib/components/json-editor.svelte";
  import JsonInline from "$lib/components/json-inline.svelte";
  import {
    auditLabel,
    auditActionLabel,
    auditActorSourceLabel,
  } from "$lib/audit";
  import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
  import type { ChipConfig } from "$lib/components/hive-searchbar";
  import { createUrlSearchState } from "$lib/search-state.svelte";
  import { onGraphQLRecovered } from "$lib/graphql/app-recovery";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { pageHeader } from "$lib/stores/page-header.svelte";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  import { formatTooltip, parseSince } from "$lib/time-format";
  import { deviceStore } from "$lib/stores/devices";
  import { automationsStore } from "$lib/stores/automations.svelte";
  import { scenesStore } from "$lib/stores/scenes.svelte";
  import { effectsStore } from "$lib/stores/effects.svelte";
  import { roomsStore } from "$lib/stores/rooms.svelte";
  import { groupsStore } from "$lib/stores/groups.svelte";
  import { sentenceCase, deviceDisplayName } from "$lib/utils";
  import { me } from "$lib/stores/me.svelte";
  import { Pause, Play, ChevronRight } from "@lucide/svelte";
  const query = graphql(`
    query AuditHistory($filter: AuditFilter, $before: String) {
      audit(filter: $filter, before: $before, limit: 50) {
        cursor
        hasMore
        resetRequired
        entries {
          id
          details
          operationId
          parentOperationId
          runId
          actionId
          timestamp
          entityType
          entityId
          entityName
          action
          actorId
          actorName
          source
          operation
          status
          conversationId
          proposed
          before
          after
          changes {
            path
            before
            after
          }
        }
      }
    }
  `);
  const stream = graphql(`
    subscription AuditLive($filter: AuditFilter, $after: String!) {
      auditStream(filter: $filter, after: $after) {
        cursor
        hasMore
        resetRequired
        entries {
          id
          details
          operationId
          parentOperationId
          runId
          actionId
          timestamp
          entityType
          entityId
          entityName
          action
          actorId
          actorName
          source
          operation
          status
          conversationId
          proposed
          before
          after
          changes {
            path
            before
            after
          }
        }
      }
    }
  `);
  type Result = NonNullable<
    import("$lib/gql/graphql").AuditHistoryQuery["audit"]
  >;
  type Entry = Result["entries"][number];
  const client = getContextClient();
  const search = createUrlSearchState({
    active: () => page.url.pathname === "/audit",
  });
  let mounted = $state(false),
    ready = $state(0),
    live = $state(true),
    hasMore = $state(false),
    loading = $state(false),
    error = $state("");
  let entries = $state<Entry[]>([]),
    pending = $state<Entry[]>([]),
    selected = $state<Entry | null>(null);
  let drawerOpen = $state(false),
    proposedOpen = $state(false),
    jsonOpen = $state(false);
  let listScroller = $state<HTMLDivElement | null>(null);
  let loadMoreFailed = $state(false);
  let cursor = "";
  let generation = $state(0);
  function groupEntries(rows: Entry[]): Entry[] {
    const groups = new Map<string, Entry[]>();
    for (const e of rows) {
      const key = e.operationId ?? e.id;
      const group = groups.get(key) ?? [];
      group.push(e);
      groups.set(key, group);
    }
    return [...groups.values()].map((group) => {
      const actual = group.filter((e) => e.entityType !== "operation");
      const main = actual[0] ?? group[0];
      const targets = new Set(
        actual.map((e) => `${e.entityType}:${e.entityId}`),
      );
      const changes = new Map<string, Entry["changes"][number]>();
      for (const e of [...actual].reverse()) {
        if (e.action === "deleted") continue;
        for (const change of e.changes) {
          const key = `${e.entityType}:${e.entityId}:${change.path}`;
          const previous = changes.get(key);
          changes.set(key, {
            ...change,
            before: previous?.before ?? change.before,
            path:
              targets.size > 1
                ? `${e.entityType}.${e.entityId}.${change.path}`
                : change.path,
          });
        }
      }
      return {
        ...main,
        details: JSON.stringify(
          actual
            .filter((e) => e.details !== "{}")
            .map((e) => ({ entity: e.entityId, value: JSON.parse(e.details) })),
        ),
        entityName:
          main.entityType === "operation"
            ? auditLabel(main.operation)
            : main.entityName || auditLabel(main.operation),
        action:
          actual.length > 0 && /^(update|save)/.test(main.operation)
            ? "updated"
            : actual.length > 0 && /^(delete|batchDelete)/.test(main.operation)
              ? "deleted"
              : actual.length > 0 && main.operation.startsWith("create")
                ? "created"
                : main.action,
        changes: [...changes.values()].filter(
          (change) => change.before !== change.after,
        ),
        before:
          actual.length > 1
            ? JSON.stringify(
                actual.map((e) => ({
                  entity: e.entityId,
                  value: JSON.parse(e.before),
                })),
              )
            : main.before,
        after:
          actual.length > 1
            ? JSON.stringify(
                actual.map((e) => ({
                  entity: e.entityId,
                  value: JSON.parse(e.after),
                })),
              )
            : main.after,
      };
    });
  }
  const displayEntries = $derived(groupEntries(entries));
  async function openEntry(entry: Entry) {
    selected = entry;
    proposedOpen = false;
    jsonOpen = false;
    drawerOpen = true;
    if (!entry.operationId) return;
    let before: string | undefined;
    const rows: Entry[] = [];
    const operation = entry.operationId;
    do {
      const response = await client
        .query(
          query,
          { filter: { operationId: operation }, before },
          { requestPolicy: "network-only" },
        )
        .toPromise();
      if (!drawerOpen || selected?.operationId !== operation) return;
      if (response.error) {
        error = response.error.message;
        return;
      }
      if (!response.data) return;
      rows.push(...response.data.audit.entries);
      selected = groupEntries(rows)[0] ?? entry;
      if (!response.data.audit.hasMore) break;
      before = response.data.audit.entries.at(-1)?.id;
    } while (before);
  }
  function entityKind(entry: Entry): string {
    if (
      ["device_state", "delivery", "run_target", "run_summary"].includes(
        entry.entityType,
      )
    )
      return "device";
    for (const kind of [
      "device",
      "automation",
      "scene",
      "effect",
      "room",
      "group",
      "user",
      "guest",
      "alarm",
      "setting",
      "floorplan",
    ]) {
      if (
        entry.entityType === `${kind}s` ||
        entry.entityType.startsWith(`${kind}_`)
      )
        return kind;
    }
    return entry.entityType;
  }
  function deviceType(entry: Entry): string | null {
    if (entityKind(entry) !== "device") return null;
    const current = $deviceStore[entry.entityId];
    if (current) return current.type;
    for (const raw of [entry.after, entry.before]) {
      const snapshot:
        { type?: string } | { value: { type?: string } | null }[] | null =
        JSON.parse(raw);
      const values = Array.isArray(snapshot)
        ? snapshot.map((row) => row.value)
        : snapshot
          ? [snapshot]
          : [];
      const type = values.find((value) => value?.type)?.type;
      if (type) return type;
    }
    return null;
  }
  function entityHref(entry: Entry): string | null {
    const id = encodeURIComponent(entry.entityId);
    switch (entry.entityType) {
      case "devices":
      case "delivery":
      case "run_target":
      case "device_state":
      case "run_summary":
        return $deviceStore[entry.entityId] ? `/devices/${id}` : null;
      case "automations":
        return automationsStore.byId.has(entry.entityId)
          ? `/automations/${id}`
          : null;
      case "scenes":
        return scenesStore.byId.has(entry.entityId) ? `/scenes/${id}` : null;
      case "effects":
        return effectsStore.byId.has(entry.entityId) ? `/effects/${id}` : null;
      case "rooms":
        return roomsStore.byId.has(entry.entityId) ? `/rooms?edit=${id}` : null;
      case "groups":
        return groupsStore.byId.has(entry.entityId)
          ? `/groups?edit=${id}`
          : null;
      default: {
        type Snapshot = {
          automationId?: string;
          sceneId?: string;
          effectId?: string;
          roomId?: string;
          groupId?: string;
        };
        const snapshots = [entry.before, entry.after].flatMap((value) => {
          const parsed: Snapshot | { value: Snapshot | null }[] | null =
            JSON.parse(value);
          return Array.isArray(parsed)
            ? parsed.map((row) => row.value)
            : parsed
              ? [parsed]
              : [];
        });
        for (const snapshot of snapshots) {
          if (!snapshot) continue;
          if (
            snapshot.automationId &&
            automationsStore.byId.has(snapshot.automationId)
          )
            return `/automations/${encodeURIComponent(snapshot.automationId)}`;
          if (snapshot.sceneId && scenesStore.byId.has(snapshot.sceneId))
            return `/scenes/${encodeURIComponent(snapshot.sceneId)}`;
          if (snapshot.effectId && effectsStore.byId.has(snapshot.effectId))
            return `/effects/${encodeURIComponent(snapshot.effectId)}`;
          if (snapshot.roomId && roomsStore.byId.has(snapshot.roomId))
            return `/rooms?edit=${encodeURIComponent(snapshot.roomId)}`;
          if (snapshot.groupId && groupsStore.byId.has(snapshot.groupId))
            return `/groups?edit=${encodeURIComponent(snapshot.groupId)}`;
        }
        return null;
      }
    }
  }
  function proposedChanges(entry: Entry): Entry["changes"] {
    if (entry.action === "deleted" || /^(delete|batchDelete)/.test(entry.operation))
      return [];
    if (!/^(create|update|save|delete|batch)/.test(entry.operation)) return [];
    const proposal: {
      changes?: { path: string; before: unknown; after: unknown }[];
    } = JSON.parse(entry.proposed);
    return (proposal.changes ?? []).map((c) => ({
      path: c.path,
      before: JSON.stringify(c.before),
      after: JSON.stringify(c.after),
    }));
  }
  const options = $derived(locale.messageOptions());
  const labels = $derived({
    actor: m.audit_actor({}, options),
    source: m.audit_source({}, options),
    action: m.audit_action({}, options),
    result: m.audit_result({}, options),
    type: m.audit_type({}, options),
    entity: m.audit_entity({}, options),
    since: m.audit_since({}, options),
    operation: m.audit_operation({}, options),
  });
  const chips = $derived.by<ChipConfig[]>(() =>
    Object.entries(labels).map(([keyword, label]) => ({
      keyword,
      label,
      options: (q: string) => {
        const values =
          keyword === "source"
            ? ["human", "assistant", "system", "automation", "integration"]
            : keyword === "action"
              ? [
                  "created",
                  "updated",
                  "deleted",
                  "succeeded",
                  "failed",
                  "pending",
                  "rejected",
                ]
              : keyword === "result"
                ? [
                    "succeeded",
                    "accepted",
                    "running",
                    "pending",
                    "partial",
                    "failed",
                    "denied",
                    "rejected",
                    "stale",
                    "interrupted",
                    "completed",
                    "stopped",
                    "preempted",
                    "drift",
                  ]
                : keyword === "type"
                  ? [
                      "automations",
                      "scenes",
                      "effects",
                      "devices",
                      "rooms",
                      "groups",
                      "users",
                      "guests",
                      "settings",
                      "floorplans",
                      "delivery",
                      "device_state",
                      "run_summary",
                      "operation",
                    ]
                  : keyword === "since"
                    ? ["1h", "24h", "7d", "30d"]
                    : [];
        const candidates = values.map((value) => ({
          value,
          label: auditLabel(value),
        }));
        if (keyword === "entity") {
          for (const entity of [
            ...automationsStore.items,
            ...scenesStore.items,
            ...effectsStore.items,
            ...roomsStore.items,
          ]) {
            candidates.push({ value: entity.id, label: entity.name });
          }
          for (const entity of groupsStore.items) {
            candidates.push({
              value: entity.id,
              label: entity.name ?? entity.friendlyName ?? entity.id,
            });
          }
          for (const entity of Object.values($deviceStore)) {
            candidates.push({
              value: entity.id,
              label: deviceDisplayName(entity),
            });
          }
        }
        for (const e of entries) {
          const value =
            keyword === "actor"
              ? e.actorId
              : keyword === "type"
                ? e.entityType
                : keyword === "entity"
                  ? e.entityId
                  : keyword === "action"
                    ? e.action
                    : keyword === "result"
                      ? e.status
                      : keyword === "source"
                        ? e.source
                        : "";
          if (value)
            candidates.push({
              value,
              label:
                keyword === "actor"
                  ? sentenceCase(e.actorName)
                  : keyword === "entity"
                    ? e.entityName
                    : auditLabel(value),
            });
        }
        return [
          ...new Map(candidates.map((v) => [v.value, v])).values(),
        ].filter((v) => v.label.toLowerCase().includes(q.toLowerCase()));
      },
      resolveLabel: (value: string) =>
        keyword === "actor"
          ? sentenceCase(
              entries.find((e) => e.actorId === value)?.actorName ?? value,
            )
          : keyword === "entity"
            ? (entries.find((e) => e.entityId === value)?.entityName ?? value)
            : ["source", "action", "result", "type"].includes(keyword)
              ? auditLabel(value)
              : value,
    })),
  );
  const filter = $derived.by(() => {
    const value: import("$lib/gql/graphql").AuditFilter = {
      search: search.value.freeText,
    };
    for (const c of search.value.chips) {
      switch (c.keyword) {
        case "operation":
          value.operationId = c.value;
          break;
        case "actor":
          value.actorId = c.value;
          break;
        case "source":
          value.source = c.value;
          break;
        case "action":
          value.action = c.value;
          break;
        case "result":
          value.status = c.value;
          break;
        case "type":
          value.entityType = c.value;
          break;
        case "entity":
          value.entityId = c.value;
          break;
        case "since": {
          const since = parseSince(c.value);
          if (since) value.since = since.toISOString();
          break;
        }
      }
    }
    return value;
  });
  onMount(() => {
    mounted = true;
  });
  $effect(() => {
    pageHeader.breadcrumbs = [{ label: m.nav_audit({}, options) }];
  });
  $effect(() => {
    void generation;
    const f = filter;
    if (!mounted) return;
    let active = true;
    loading = true;
    loadMoreFailed = false;
    ready = 0;
    entries = [];
    pending = [];
    hasMore = false;
    error = "";
    void client
      .query(query, { filter: f }, { requestPolicy: "network-only" })
      .toPromise()
      .then((r) => {
        if (!active) return;
        loading = false;
        if (r.error) {
          error = r.error.message;
          return;
        }
        if (r.data) {
          entries = r.data.audit.entries;
          pending = [];
          hasMore = r.data.audit.hasMore;
          cursor = r.data.audit.cursor;
          listScroller?.scrollTo({ top: 0, behavior: "instant" });
          ready++;
        }
      });
    return () => {
      active = false;
    };
  });
  const liveResult = $derived.by(() => {
    void ready;
    return subscriptionStore({
      client,
      query: stream,
      variables: { filter, after: untrack(() => cursor) || "0" },
      pause: !mounted || !ready || !live,
    });
  });
  $effect(() => {
    const result = $liveResult;
    untrack(() => {
      if (result.error) {
        error = result.error.message;
        return;
      }
      if (!result.data) return;
      if (!loadMoreFailed) error = "";
      cursor = result.data.auditStream.cursor;
      if (result.data.auditStream.resetRequired) {
        generation++;
        return;
      }
      const incoming = result.data.auditStream.entries;
      const ids = new Set([...entries, ...pending].map((e) => e.id));
      const fresh = incoming.filter((e) => !ids.has(e.id));
      if (drawerOpen || (listScroller?.scrollTop ?? 0) > 200) {
        pending = [...fresh, ...pending];
      } else {
        entries = [...fresh, ...entries].sort(
          (a, b) => Number(b.id) - Number(a.id),
        );
      }
    });
  });
  onGraphQLRecovered(() => {
    if (ready) ready++;
    else generation++;
  });
  async function older() {
    if (loading || !ready || !hasMore || loadMoreFailed) return;
    loading = true;
    const state = filter;
    try {
      const r = await client
        .query(
          query,
          { filter: state, before: entries.at(-1)?.id },
          { requestPolicy: "network-only" },
        )
        .toPromise();
      if (filter !== state) return;
      if (r.error) {
        error = r.error.message;
        loadMoreFailed = true;
        return;
      }
      if (r.data) {
        const ids = new Set(entries.map((e) => e.id));
        entries = [
          ...entries,
          ...r.data.audit.entries.filter((e) => !ids.has(e.id)),
        ];
        hasMore = r.data.audit.hasMore;
      }
    } finally {
      if (filter === state) loading = false;
    }
  }
  function setChip(keyword: string, value: string) {
    const existing = search.value.chips.filter(
      (chip) => chip.keyword === keyword,
    );
    if (existing.length === 1 && existing[0].value === value) return;
    search.set(
      {
        ...search.value,
        chips: [
          ...search.value.chips.filter((chip) => chip.keyword !== keyword),
          { keyword, value },
        ],
      },
      { replaceState: false },
    );
  }
  function retry() {
    error = "";
    if (loadMoreFailed) {
      loadMoreFailed = false;
      void older();
    } else generation++;
  }
  function prettyJson(raw: string): string {
    return JSON.stringify(JSON.parse(raw), null, 2);
  }
  function showNew() {
    entries = [...pending, ...entries].sort(
      (a, b) => Number(b.id) - Number(a.id),
    );
    pending = [];
    listScroller?.scrollTo({ top: 0, behavior: "smooth" });
  }
  watchErrorToast(() => error, retry);
</script>

<div class="flex h-[calc(100dvh-8rem)] min-h-0 flex-col gap-4">
  <div class="flex shrink-0 items-center gap-3">
    <HiveSearchbar
      controller={search}
      {chips}
      class="min-w-0 flex-1"
      debounceMs={300}
      commitOnBlur
    /><Button variant="outline" size="sm" onclick={() => (live = !live)}
      >{#if live}<Pause class="size-4" />{m.audit_live({}, options)}{:else}<Play
          class="size-4"
        />{m.audit_paused({}, options)}{/if}</Button
    >
  </div>

  {#if pending.length}<Button variant="outline" onclick={showNew}
      >{m.audit_new({ count: pending.length }, options)}</Button
    >{/if}
  <div class="min-h-0 flex-1">
    {#if entries.length}
      <AuditNavigationTable
        entries={displayEntries}
        {hasMore}
        loadingMore={loading}
        onLoadMore={older}
        onOpen={(entry) => void openEntry(entry)}
        onFilter={setChip}
        bind:scrollElement={listScroller}
      />
    {:else}
      <p
        class="rounded-lg bg-card shadow-card p-8 text-center text-muted-foreground"
        role="status"
      >
        {loading ? m.common_loading({}, options) : m.audit_empty({}, options)}
      </p>
    {/if}
  </div>
</div>
<Sheet.Root
  open={drawerOpen}
  onOpenChange={(open) => {
    drawerOpen = open;
  }}
  ><Sheet.Content
    side="bottom"
    class="max-h-[85dvh] overflow-y-auto rounded-t-2xl gap-2 duration-300 motion-reduce:animate-none! outline-none"
    ><Sheet.Header class="pb-0"
      ><div class="flex min-w-0 flex-wrap items-center gap-2 pr-10">
        <Sheet.Title
          >{#if selected && entityHref(selected)}<a
              class="hover:underline focus-visible:underline"
              href={entityHref(selected)!}>{selected.entityName}</a
            >{:else}{selected?.entityName ?? ""}{/if}</Sheet.Title
        >
        {#if selected}<HiveChip
            type={entityKind(selected)}
            label={auditLabel(entityKind(selected))}
          />{#if deviceType(selected)}<HiveChip
              type={deviceType(selected)!}
            />{/if}{/if}
      </div>
      <Sheet.Description
        >{selected
          ? [
              selected.actorName,
              auditActorSourceLabel(selected),
              auditActionLabel(selected),
              formatTooltip(
                new Date(selected.timestamp),
                me.user?.timeFormat ?? "24h",
              ),
            ]
              .filter(Boolean)
              .join(" / ")
          : ""}</Sheet.Description
      ></Sheet.Header
    >
    {#if selected}<div class="px-4 pb-4 flex flex-col gap-3">
        {#if selected.parentOperationId}<Button
            variant="outline"
            size="sm"
            onclick={() => {
              if (!selected?.parentOperationId) return;
              search.set({
                freeText: "",
                chips: [
                  { keyword: "operation", value: selected.parentOperationId },
                ],
              });
              drawerOpen = false;
            }}>{m.audit_parent({}, options)}</Button
          >{/if}
        {#if selected.conversationId}<a
            class="underline"
            href={`/assistant?chat=${encodeURIComponent(selected.conversationId)}`}
            >{m.audit_conversation({}, options)}</a
          >{/if}
        {#if selected.action !== "deleted"}
          <h3 class="font-medium">{m.audit_actual({}, options)}</h3>
          {#if selected.changes.length}<div class="w-full max-w-3xl">
              <Table.Root
                ><Table.Header
                  ><Table.Row
                    ><Table.Head>{m.audit_property({}, options)}</Table.Head
                    ><Table.Head>{m.audit_before({}, options)}</Table.Head
                    ><Table.Head>{m.audit_after({}, options)}</Table.Head
                    ></Table.Row
                  ></Table.Header
                ><Table.Body
                  >{#each selected.changes as change}<Table.Row
                      ><Table.Cell
                        >{change.path || selected.entityType}</Table.Cell
                      ><Table.Cell class="max-w-96 whitespace-normal align-top"
                        ><JsonInline
                          value={prettyJson(change.before)}
                          class="whitespace-pre-wrap! break-all"
                        /></Table.Cell
                      ><Table.Cell class="max-w-96 whitespace-normal align-top"
                        ><JsonInline
                          value={prettyJson(change.after)}
                          class="whitespace-pre-wrap! break-all"
                        /></Table.Cell
                      ></Table.Row
                    >{/each}</Table.Body
                ></Table.Root
              >
            </div>{:else}<p class="text-muted-foreground">
              {m.audit_no_change({}, options)}
            </p>{/if}
        {/if}
        {#if proposedChanges(selected).length}
          {#snippet proposedContent()}
            <div class="flex max-w-5xl flex-col gap-4 pb-2">
              <div class="w-full max-w-3xl">
                <Table.Root
                  ><Table.Header
                    ><Table.Row
                      ><Table.Head>{m.audit_property({}, options)}</Table.Head
                      ><Table.Head>{m.audit_before({}, options)}</Table.Head
                      ><Table.Head>{m.audit_after({}, options)}</Table.Head
                      ></Table.Row
                    ></Table.Header
                  >
                  <Table.Body
                    >{#each proposedChanges(selected!) as change}<Table.Row
                        ><Table.Cell>{change.path}</Table.Cell><Table.Cell
                          class="max-w-96 whitespace-normal align-top"
                          ><JsonInline
                            value={prettyJson(change.before)}
                            class="whitespace-pre-wrap! break-all"
                          /></Table.Cell
                        ><Table.Cell
                          class="max-w-96 whitespace-normal align-top"
                          ><JsonInline
                            value={prettyJson(change.after)}
                            class="whitespace-pre-wrap! break-all"
                          /></Table.Cell
                        ></Table.Row
                      >{/each}</Table.Body
                  >
                </Table.Root>
              </div>
              <div class="h-72 min-w-0">
                <JsonEditor value={prettyJson(selected!.proposed)} readonly />
              </div>
            </div>
          {/snippet}
          {@render disclosure(
            "audit-proposed",
            m.audit_proposed({}, options),
            proposedOpen,
            () => (proposedOpen = !proposedOpen),
            proposedContent,
          )}
        {/if}
        {#snippet jsonContent()}
          <div class="h-80 min-w-0 max-w-5xl pb-2">
            <JsonEditor
              value={JSON.stringify(
                {
                  operationId: selected!.operationId,
                  runId: selected!.runId,
                  actionId: selected!.actionId,
                  request: JSON.parse(selected!.proposed).request,
                  before: JSON.parse(selected!.before),
                  after: JSON.parse(selected!.after),
                  details: JSON.parse(selected!.details),
                },
                null,
                2,
              )}
              readonly
            />
          </div>
        {/snippet}
        {@render disclosure(
          "audit-json",
          selected.action === "deleted"
            ? m.audit_json_details({}, options)
            : m.audit_json({}, options),
          jsonOpen,
          () => (jsonOpen = !jsonOpen),
          jsonContent,
        )}
      </div>{/if}
  </Sheet.Content></Sheet.Root
>

{#snippet disclosure(
  id: string,
  label: string,
  open: boolean,
  onclick: () => void,
  content: Snippet,
)}
  <div>
    <Button
      variant="ghost"
      size="sm"
      class="-ml-2 justify-start"
      {onclick}
      aria-expanded={open}
      aria-controls={id}
      ><ChevronRight
        class={"size-4 transition-transform duration-200 motion-reduce:transition-none! " +
          (open ? "rotate-90" : "")}
      />{label}</Button
    >
    <div
      {id}
      class={"grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none! " +
        (open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
      aria-hidden={!open}
    >
      <div class="min-h-0 overflow-hidden" inert={!open}>
        {@render content()}
      </div>
    </div>
  </div>
{/snippet}
