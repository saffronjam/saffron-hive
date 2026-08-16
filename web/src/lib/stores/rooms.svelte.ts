import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import type { RoomsStoreQuery, UpdateRoomInput } from "$lib/gql/graphql";
import { createEntityStore } from "$lib/stores/entity-store.svelte";

/**
 * A room as the shared store holds it: identity, membership and the resolved
 * device id set. Device detail is deliberately absent — join `deviceStore` by
 * `memberId` / `resolvedDevices[].id` for names, state and capabilities.
 */
export type Room = RoomsStoreQuery["rooms"][number];
export type RoomMember = Room["members"][number];

graphql(`
  fragment RoomFields on Room {
    id
    name
    icon
    members {
      id
      memberType
      memberId
    }
    resolvedDevices {
      id
    }
    createdBy {
      id
      username
      name
    }
  }
`);

const ROOMS_QUERY = graphql(`
  query RoomsStore {
    rooms {
      ...RoomFields
    }
  }
`);

const CREATE_ROOM = graphql(`
  mutation RoomsStoreCreate($input: CreateRoomInput!) {
    createRoom(input: $input) {
      ...RoomFields
    }
  }
`);

const UPDATE_ROOM = graphql(`
  mutation RoomsStoreUpdate($id: ID!, $input: UpdateRoomInput!) {
    updateRoom(id: $id, input: $input) {
      ...RoomFields
    }
  }
`);

const DELETE_ROOM = graphql(`
  mutation RoomsStoreDelete($id: ID!) {
    deleteRoom(id: $id)
  }
`);

const BATCH_DELETE_ROOMS = graphql(`
  mutation RoomsStoreBatchDelete($ids: [ID!]!) {
    batchDeleteRooms(ids: $ids)
  }
`);

const ADD_ROOM_MEMBER = graphql(`
  mutation RoomsStoreAddMember($input: AddRoomMemberInput!) {
    addRoomMember(input: $input) {
      ...RoomFields
    }
  }
`);

const REMOVE_ROOM_MEMBER = graphql(`
  mutation RoomsStoreRemoveMember($id: ID!) {
    removeRoomMember(id: $id) {
      ...RoomFields
    }
  }
`);

const base = createEntityStore<Room, RoomsStoreQuery>({
  name: "rooms",
  version: 1,
  query: ROOMS_QUERY,
  select: (data) => data.rooms,
});

/**
 * Rooms, shared across every page.
 *
 * Every write runs through this store so the returned room lands in the cache
 * directly — the API reports the whole room, including the recomputed
 * `resolvedDevices`, which is what makes a follow-up refetch unnecessary.
 */
export const roomsStore = {
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
  start: base.start,
  stop: base.stop,
  clear: base.clear,
  refresh: base.refresh,

  async create(client: Client, name: string): Promise<Room> {
    const result = await client.mutation(CREATE_ROOM, { input: { name } }).toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("createRoom failed");
    base.upsert(result.data.createRoom);
    return result.data.createRoom;
  },

  async update(client: Client, id: string, input: UpdateRoomInput): Promise<Room> {
    const result = await client.mutation(UPDATE_ROOM, { id, input }).toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("updateRoom failed");
    base.upsert(result.data.updateRoom);
    return result.data.updateRoom;
  },

  async delete(client: Client, id: string): Promise<void> {
    const result = await client.mutation(DELETE_ROOM, { id }).toPromise();
    if (result.error) throw result.error;
    base.remove(id);
  },

  async deleteMany(client: Client, ids: string[]): Promise<void> {
    const result = await client.mutation(BATCH_DELETE_ROOMS, { ids }).toPromise();
    if (result.error) throw result.error;
    base.removeMany(ids);
  },

  async addMember(
    client: Client,
    roomId: string,
    memberType: string,
    memberId: string,
  ): Promise<Room> {
    const result = await client
      .mutation(ADD_ROOM_MEMBER, { input: { roomId, memberType, memberId } })
      .toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("addRoomMember failed");
    base.upsert(result.data.addRoomMember);
    return result.data.addRoomMember;
  },

  async removeMember(client: Client, membershipId: string): Promise<Room> {
    const result = await client.mutation(REMOVE_ROOM_MEMBER, { id: membershipId }).toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("removeRoomMember failed");
    base.upsert(result.data.removeRoomMember);
    return result.data.removeRoomMember;
  },
};
