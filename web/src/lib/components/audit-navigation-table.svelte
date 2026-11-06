<script lang="ts" module>
  import type { AuditHistoryQuery } from "$lib/gql/graphql";
  export type AuditRow = AuditHistoryQuery["audit"]["entries"][number];
</script>

<script lang="ts">
  import HiveNavigationTable from "$lib/components/hive-navigation-table.svelte";
  import HiveChip from "$lib/components/hive-chip.svelte";
  import {
    createTableState,
    type ColumnDef,
  } from "$lib/utils/table-state.svelte";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte";
  import { sentenceCase } from "$lib/utils";
  import {
    auditLabel,
    auditResultChipClass,
    auditActionLabel,
    auditActorSourceLabel,
  } from "$lib/audit";
  import { formatTooltip } from "$lib/time-format";
  import { me } from "$lib/stores/me.svelte";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";

  interface Props {
    entries: AuditRow[];
    hasMore: boolean;
    loadingMore: boolean;
    onLoadMore: () => void;
    onOpen: (entry: AuditRow) => void;
    onFilter: (keyword: string, value: string) => void;
    scrollElement?: HTMLDivElement | null;
  }
  let {
    entries,
    hasMore,
    loadingMore,
    onLoadMore,
    onOpen,
    onFilter,
    scrollElement = $bindable(null),
  }: Props = $props();
  const mobile = new IsMobile();
  const options = $derived(locale.messageOptions());
  const allColumns: ColumnDef<AuditRow>[] = $derived([
    {
      key: "entry",
      label: m.audit_entity({}, options),
      hideable: false,
      width: "minmax(0, 1fr)",
      cell: compactCell,
    },
    {
      key: "time",
      label: m.audit_time({}, options),
      width: "12rem",
      cell: timeCell,
    },
    {
      key: "result",
      label: m.audit_result({}, options),
      width: "8.5rem",
      cell: resultCell,
    },
    {
      key: "action",
      label: m.audit_action({}, options),
      width: "minmax(10rem, 1fr)",
      cell: actionCell,
    },
    {
      key: "entity",
      label: m.audit_entity({}, options),
      hideable: false,
      width: "minmax(12rem, 1.4fr)",
      cell: entityCell,
    },
    {
      key: "actor",
      label: m.audit_actor({}, options),
      width: "minmax(9rem, 1fr)",
      cell: actorCell,
    },
  ]);
  const columns = $derived(
    allColumns.filter((column) =>
      mobile.current ? column.key === "entry" : column.key !== "entry",
    ),
  );
  const tableState = createTableState({
    storageKey: "audit-v3",
    columns: () => allColumns,
  });
  function filterActor(entry: AuditRow) {
    onFilter(entry.actorId ? "actor" : "source", entry.actorId || entry.source);
  }
</script>

{#snippet actorChip(entry: AuditRow)}
  <HiveChip
    type="audit"
    label={sentenceCase(entry.actorName)}
    class="max-w-full"
    onclick={() => filterActor(entry)}
  />
{/snippet}
{#snippet actionText(entry: AuditRow)}
  <span class="block min-w-0 truncate" title={auditActionLabel(entry)}
    >{auditActionLabel(entry)}</span
  >
{/snippet}
{#snippet resultChip(entry: AuditRow)}
  <HiveChip
    type="audit"
    label={auditLabel(entry.status)}
    class={auditResultChipClass(entry.status)}
    onclick={() => onFilter("result", entry.status)}
  />
{/snippet}
{#snippet timeCell(entry: AuditRow)}
  <span class="whitespace-nowrap text-xs text-muted-foreground"
    >{formatTooltip(
      new Date(entry.timestamp),
      me.user?.timeFormat ?? "24h",
    )}</span
  >
{/snippet}
{#snippet actorCell(entry: AuditRow)}
  <div class="flex min-w-0 flex-col items-start gap-1">
    {@render actorChip(entry)}
    {#if auditActorSourceLabel(entry)}<span
        class="text-xs text-muted-foreground"
        >{auditActorSourceLabel(entry)}</span
      >{/if}
  </div>
{/snippet}
{#snippet actionCell(entry: AuditRow)}
  {@render actionText(entry)}
{/snippet}
{#snippet entityCell(entry: AuditRow)}
  <div class="flex min-w-0 flex-col items-start gap-1">
    <span class="block max-w-full truncate text-left">{entry.entityName}</span
    >
    <span class="text-xs text-muted-foreground"
      >{auditLabel(entry.entityType)}</span
    >
  </div>
{/snippet}
{#snippet resultCell(entry: AuditRow)}
  {@render resultChip(entry)}
{/snippet}
{#snippet compactCell(entry: AuditRow)}
  <div class="flex min-w-0 flex-col gap-2 py-2">
    <span class="block truncate text-left font-medium"
      >{entry.entityName}<span
        class="ml-2 text-xs font-normal text-muted-foreground"
        >{auditLabel(entry.entityType)}</span
      ></span
    >
    <div class="flex min-w-0 items-center gap-1.5">
      {@render resultChip(entry)}{@render actionText(entry)}{@render actorChip(
        entry,
      )}
    </div>
    <div class="truncate text-xs text-muted-foreground">
      {@render timeCell(entry)}{#if auditActorSourceLabel(entry)}<span>
          · {auditActorSourceLabel(entry)}</span
        >{/if}
    </div>
  </div>
{/snippet}

<HiveNavigationTable
  {tableState}
  {columns}
  rows={entries}
  onRowClick={onOpen}
  rowId={(entry) => entry.operationId ?? entry.id}
  rowAttrs={(entry) => ({
    "data-audit-operation": entry.operationId ?? entry.id,
  })}
  {hasMore}
  {loadingMore}
  {onLoadMore}
  bind:scrollElement
  showColumnMenu={!mobile.current}
  collapsedHeight={mobile.current ? 112 : 64}
/>
