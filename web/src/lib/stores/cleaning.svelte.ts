import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import type {
  CleaningStoreQuery,
  CleaningAction,
  CleaningSelectionInput,
  CleaningMapViewQuery,
} from "$lib/gql/graphql";
import { createEntityStore } from "$lib/stores/entity-store.svelte";
import { cleaningMapId } from "$lib/cleaning";

export type CleaningRobot = CleaningStoreQuery["cleaningDevices"][number];

graphql(`
  fragment CleaningTaskFields on CleaningTask {
    id
    scope
    deviceId
    mapId
    roomIds
    state
    origin
    elapsedMinutes
    cleanedArea
    error
    createdAt
    updatedAt
    completedAt
  }
`);
graphql(`
  fragment CleaningMapFields on CleaningMap {
    revision
    id
    name
    width
    height
    origin {
      x
      y
    }
    metersPerPixel
    rotation
    robot {
      x
      y
      angle
    }
    dock {
      x
      y
      angle
    }
    layers {
      kind
      roomId
      path
    }
    rooms {
      id
      name
      x
      y
      area
    }
    areas {
      kind
      points {
        x
        y
      }
    }
    walls {
      x
      y
    }
    path {
      x
      y
    }
  }
`);
graphql(`
  fragment CleaningRobotFields on CleaningDevice {
    id: deviceId
    deviceId
    supported
    controls {
      action
      enabled
    }
    model
    modelId
    manufacturer
    status
    battery
    suction
    water
    elapsedMinutes
    cleanedArea
    progress
    estimatedProgress
    updatedAt
    consumables {
      name
      percent
      resettable
    }
    error
    activeMapId
    liveAt
    mapError
    maps {
      id
      name
      revision
    }
    roomLinks {
      mapId
      mapRevision
      revision
      links {
        roomId
        areaId
      }
    }
    activeTask {
      ...CleaningTaskFields
    }
  }
`);
const QUERY = graphql(`
  query CleaningStore {
    cleaningDevices {
      ...CleaningRobotFields
    }
  }
`);
const CHANGED = graphql(`
  subscription CleaningStoreChanged {
    cleaningChanged
  }
`);
const CONTROL = graphql(`
  mutation CleaningControl($deviceId: ID!, $action: CleaningAction!) {
    controlCleaning(deviceId: $deviceId, action: $action)
  }
`);
const PREPARE = graphql(`
  mutation CleaningPrepare($input: CleaningSelectionInput!) {
    prepareCleaning(input: $input) {
      scope
      deviceId
      mapId
      roomIds
      areaIds
      revision
      options {
        suction
        water
        repeats
      }
    }
  }
`);
const START = graphql(`
  mutation CleaningStart($input: StartCleaningInput!) {
    startCleaning(input: $input) {
      ...CleaningTaskFields
    }
  }
`);
export const CLEANING_DETAILS = graphql(`
  query CleaningDetails($id: ID!) {
    cleaningDevice(deviceId: $id) {
      maps {
        ...CleaningMapFields
      }
      liveMap {
        ...CleaningMapFields
      }
    }
  }
`);
export const CLEANING_HISTORY = graphql(`
  query CleaningHistory($id: ID!, $before: String, $limit: Int!) {
    cleaningHistory(deviceId: $id, before: $before, limit: $limit) {
      ...CleaningTaskFields
    }
  }
`);
const base = createEntityStore<CleaningRobot, CleaningStoreQuery>({
  name: "cleaning",
  version: 5,
  query: QUERY,
  select: (data) => data.cleaningDevices,
});
let unsubscribe: (() => void) | null = null;
let generation = 0;
let refreshing: Promise<void> | null = null;
let refreshAgain = false;
let pending = $state<Record<string, CleaningAction | "start">>({});

async function refresh(client: Client) {
  if (refreshing) {
    refreshAgain = true;
    return refreshing;
  }
  refreshing = (async () => {
    do {
      refreshAgain = false;
      await base.refresh(client);
    } while (refreshAgain);
  })();
  try {
    await refreshing;
  } finally {
    refreshing = null;
  }
}
export const cleaningStore = {
  get items() {
    return base.items;
  },
  get byId() {
    return base.byId;
  },
  get hydrated() {
    return base.hydrated;
  },
  get error() {
    return base.error;
  },
  get pending() {
    return pending;
  },
  refresh,
  async start(client: Client) {
    if (unsubscribe) return;
    const current = ++generation;
    const subscription = client.subscription(CHANGED, {}).subscribe((result) => {
      if (result.data && current === generation) void refresh(client);
    });
    unsubscribe = () => subscription.unsubscribe();
    await base.start(client);
  },
  stop() {
    generation++;
    unsubscribe?.();
    unsubscribe = null;
    base.stop();
    pending = {};
    mapViews.clear();
  },
  clear() {
    base.clear();
    mapViews.clear();
  },
  mapView: getMapView,
  loadMapView,
  async control(client: Client, id: string, action: CleaningAction) {
    if (pending[id]) return;
    pending = { ...pending, [id]: action };
    try {
      const result = await client.mutation(CONTROL, { deviceId: id, action }).toPromise();
      if (result.error) throw result.error;
      await refresh(client);
    } finally {
      const next = { ...pending };
      delete next[id];
      pending = next;
    }
  },
  async prepare(client: Client, input: CleaningSelectionInput) {
    const result = await client.mutation(PREPARE, { input }).toPromise();
    if (result.error) throw result.error;
    if (!result.data) throw new Error("Missing cleaning preparation");
    return result.data.prepareCleaning;
  },
  async begin(
    client: Client,
    input: CleaningSelectionInput,
    revision: string,
    requestId: string,
    replaceTaskId?: string,
  ) {
    pending = { ...pending, [input.deviceId]: "start" };
    try {
      const result = await client
        .mutation(START, {
          input: {
            selection: input,
            expectedRevision: revision,
            requestId,
            replaceTaskId,
          },
        })
        .toPromise();
      if (result.error) throw result.error;
      await refresh(client);
      return result.data?.startCleaning;
    } finally {
      const next = { ...pending };
      delete next[input.deviceId];
      pending = next;
    }
  },
};

export const CLEANING_MAP = graphql(`
  query CleaningMapView($id: ID!, $mapId: ID!, $floorplanId: ID!) {
    cleaningDevice(deviceId: $id) {
      maps {
        ...CleaningMapFields
      }
      liveMap {
        ...CleaningMapFields
      }
    }
    cleaningCalibration(deviceId: $id, mapId: $mapId, floorplanId: $floorplanId) {
      mapRotation
      enabled
      revision
      valid
      mapRevision
      floorplanRevision
      deviceId
      mapId
      floorplanId
      anchors {
        robot {
          x
          y
        }
        hive {
          x
          y
        }
      }
      transform {
        a
        b
        x
        y
      }
    }
  }
`);

interface MapViewState {
  data: CleaningMapViewQuery | null;
  loaded: boolean;
}

interface MapViewEntry {
  view: MapViewState;
  requestedVersion: string;
  completedVersion: string | null;
  failed: boolean;
  pending: Promise<void> | null;
}

const mapViews = new Map<string, MapViewEntry>();

function mapViewEntry(robot: CleaningRobot, floorplanId: string): MapViewEntry {
  const key = JSON.stringify([robot.id, cleaningMapId(robot), floorplanId]);
  let entry = mapViews.get(key);
  if (!entry) {
    const view = $state<MapViewState>({ data: null, loaded: false });
    entry = { view, requestedVersion: "", completedVersion: null, failed: false, pending: null };
    mapViews.set(key, entry);
  }
  return entry;
}

function getMapView(robot: CleaningRobot, floorplanId: string): MapViewState {
  return mapViewEntry(robot, floorplanId).view;
}

async function loadMapView(
  client: Client,
  robot: CleaningRobot,
  floorplanId: string,
  floorplanRevision = 0,
): Promise<void> {
  const mapId = cleaningMapId(robot);
  const key = JSON.stringify([robot.id, mapId, floorplanId]);
  const entry = mapViewEntry(robot, floorplanId);
  if (!mapId || !floorplanId) {
    entry.view.data = null;
    entry.view.loaded = true;
    return;
  }
  entry.requestedVersion = JSON.stringify([
    robot.updatedAt,
    robot.liveAt,
    floorplanRevision,
    robot.maps.find((map) => String(map.id) === mapId)?.revision,
    robot.roomLinks.find((links) => links.mapId === mapId)?.revision,
  ]);
  if (entry.pending) return entry.pending;
  if (entry.completedVersion === entry.requestedVersion && !entry.failed) return;
  entry.pending = (async () => {
    do {
      const version = entry.requestedVersion;
      try {
        const result = await client
          .query(
            CLEANING_MAP,
            { id: robot.id, mapId, floorplanId },
            { requestPolicy: "network-only" },
          )
          .toPromise();
        if (mapViews.get(key) !== entry) return;
        if (version === entry.requestedVersion) {
          entry.failed = !!result.error || !result.data;
          entry.view.data = result.error ? null : (result.data ?? null);
          entry.view.loaded = true;
        }
      } catch {
        if (mapViews.get(key) !== entry) return;
        if (version === entry.requestedVersion) {
          entry.failed = true;
          entry.view.data = null;
          entry.view.loaded = true;
        }
      }
      entry.completedVersion = version;
    } while (entry.completedVersion !== entry.requestedVersion);
  })().finally(() => {
    entry.pending = null;
  });
  return entry.pending;
}
