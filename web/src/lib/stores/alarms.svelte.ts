import type { Client } from "@urql/svelte";
import { toast } from "svelte-sonner";
import { graphql } from "$lib/gql";
import type { AlarmSeverity, AlarmKind } from "$lib/gql/graphql";

export interface Alarm {
  id: string;
  latestRowId: string;
  severity: AlarmSeverity;
  kind: AlarmKind;
  message: string;
  source: string;
  count: number;
  firstRaisedAt: string;
  lastRaisedAt: string;
}

const ALARMS_QUERY = graphql(`
  query ActiveAlarms {
    alarms {
      id
      latestRowId
      severity
      kind
      message
      source
      count
      firstRaisedAt
      lastRaisedAt
    }
  }
`);

const ALARM_EVENT_SUBSCRIPTION = graphql(`
  subscription AlarmEvents {
    alarmEvent {
      kind
      clearedAlarmId
      alarm {
        id
        latestRowId
        severity
        kind
        message
        source
        count
        firstRaisedAt
        lastRaisedAt
      }
    }
  }
`);

const TOAST_COALESCE_WINDOW_MS = 2000;
const TOAST_COALESCE_THRESHOLD = 3;

const SEVERITY_RANK: Record<AlarmSeverity, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/**
 * Alarms store. Hydrates from the `alarms` query on start, then keeps a live
 * list in sync via the `alarmEvent` subscription. Exposes a derived active
 * count and highest-severity, and fires toasts when brand-new alarm ids
 * appear (coalesced to one summary toast when 3+ arrive within 2 seconds).
 */
function createAlarmsStore() {
  let list = $state<Alarm[]>([]);
  let started = false;
  let unsubFn: (() => void) | null = null;

  // Toast coalescer. `pendingIds` accumulates within the rolling window; the
  // timer fires and flushes them as either a summary toast or per-id toasts.
  const pending: Alarm[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleFlush() {
    if (flushTimer !== null) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushPending();
    }, TOAST_COALESCE_WINDOW_MS);
  }

  function flushPending() {
    if (pending.length === 0) return;
    if (pending.length >= TOAST_COALESCE_THRESHOLD) {
      const highest = pending.reduce(
        (acc, a) => (SEVERITY_RANK[a.severity] > SEVERITY_RANK[acc] ? a.severity : acc),
        "LOW" as AlarmSeverity,
      );
      emitToast(highest, `${pending.length} new alarms`, "Multiple alarms were just raised.");
    } else {
      for (const a of pending) emitToast(a.severity, a.message, `Alarm: ${a.id}`);
    }
    pending.length = 0;
  }

  function emitToast(severity: AlarmSeverity, title: string, description: string) {
    const opts = { description };
    switch (severity) {
      case "HIGH":
        toast.error(title, opts);
        break;
      case "MEDIUM":
        toast.warning(title, opts);
        break;
      case "LOW":
      default:
        toast.info(title, opts);
        break;
    }
  }

  function upsert(alarm: Alarm, isNew: boolean) {
    const idx = list.findIndex((a) => a.id === alarm.id);
    if (idx >= 0) {
      list[idx] = alarm;
    } else {
      list.push(alarm);
    }
    list.sort((a, b) => (a.lastRaisedAt < b.lastRaisedAt ? 1 : -1));
    if (isNew) {
      pending.push(alarm);
      scheduleFlush();
    }
  }

  function remove(id: string) {
    const idx = list.findIndex((a) => a.id === id);
    if (idx >= 0) list.splice(idx, 1);
  }

  return {
    get list() {
      return list;
    },
    get activeCount() {
      return list.length;
    },
    get highestSeverity(): AlarmSeverity | null {
      let best: AlarmSeverity | null = null;
      for (const a of list) {
        if (best === null || SEVERITY_RANK[a.severity] > SEVERITY_RANK[best]) {
          best = a.severity;
        }
      }
      return best;
    },
    async start(client: Client) {
      if (started) return;
      started = true;

      const res = await client.query(ALARMS_QUERY, {}).toPromise();
      if (res.data?.alarms) {
        list.length = 0;
        list.push(...(res.data.alarms as Alarm[]));
      }

      const sub = client.subscription(ALARM_EVENT_SUBSCRIPTION, {}).subscribe((result) => {
        const evt = result.data?.alarmEvent;
        if (!evt) return;
        if (evt.kind === "RAISED" && evt.alarm) {
          const isNew = !list.some((a) => a.id === evt.alarm!.id);
          upsert(evt.alarm as Alarm, isNew);
        } else if (evt.kind === "CLEARED" && evt.clearedAlarmId) {
          remove(evt.clearedAlarmId);
        }
      });
      unsubFn = sub.unsubscribe;
    },
    stop() {
      if (unsubFn) {
        unsubFn();
        unsubFn = null;
      }
      started = false;
      list.length = 0;
      pending.length = 0;
      if (flushTimer !== null) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
    },
  };
}

export const alarmsStore = createAlarmsStore();
