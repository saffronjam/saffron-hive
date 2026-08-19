import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import type { FloorplanStoreQuery, UpdateFloorplanInput } from "$lib/gql/graphql";
import { createEntityStore } from "$lib/stores/entity-store.svelte";

export type Floorplan = NonNullable<FloorplanStoreQuery["floorplan"]>;

graphql(`
  fragment FloorplanFields on Floorplan {
    id
    name
    vertices {
      id
      x
      y
    }
    walls {
      id
      vertexA
      vertexB
      thickness
      curveX
      curveY
    }
    openings {
      id
      wallId
      t
      width
      kind
    }
    doorBindings {
      openingId
      deviceId
      hingeSide
      swingSide
    }
    rooms {
      id
      name
      roomId
      vertexIds
    }
    placements {
      memberType
      memberId
      x
      y
    }
    furniture {
      id
      kind
      x
      y
      width
      height
      rotation
      occluder
    }
  }
`);

const FLOORPLAN_QUERY = graphql(`
  query FloorplanStore {
    floorplan {
      ...FloorplanFields
    }
  }
`);

const UPDATE_FLOORPLAN = graphql(`
  mutation FloorplanStoreUpdate($input: UpdateFloorplanInput!) {
    updateFloorplan(input: $input) {
      ...FloorplanFields
    }
  }
`);

// There is only ever one plan, held as a list of at most one so it gets the
// same snapshot, revalidation and teardown as every other shared store.
const base = createEntityStore<Floorplan, FloorplanStoreQuery>({
  name: "floorplan",
  version: 1,
  query: FLOORPLAN_QUERY,
  select: (data) => (data.floorplan ? [data.floorplan] : []),
});

/** The floor plan. Null until the first save. */
export const floorplanStore = {
  get current(): Floorplan | null {
    return base.items[0] ?? null;
  },
  get hydrated() {
    return base.hydrated;
  },
  get error() {
    return base.error;
  },
  start: base.start,
  stop: base.stop,
  clear: base.clear,
  refresh: base.refresh,

  async save(client: Client, input: UpdateFloorplanInput): Promise<Floorplan> {
    const result = await client.mutation(UPDATE_FLOORPLAN, { input }).toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("updateFloorplan failed");
    base.replaceAll([result.data.updateFloorplan]);
    return result.data.updateFloorplan;
  },
};
