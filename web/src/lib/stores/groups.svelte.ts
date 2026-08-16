import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import type { GroupsStoreQuery, UpdateGroupInput } from "$lib/gql/graphql";
import { createEntityStore } from "$lib/stores/entity-store.svelte";

/**
 * A group as the shared store holds it: identity, tags, membership and the
 * resolved device id set. Device detail is deliberately absent — join
 * `deviceStore` by `memberId` / `resolvedDevices[].id` for names, state and
 * capabilities, and `roomsStore` for a room member.
 */
export type Group = GroupsStoreQuery["groups"][number];
export type GroupMember = Group["members"][number];

graphql(`
  fragment GroupFields on Group {
    id
    name
    icon
    tags
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

const GROUPS_QUERY = graphql(`
  query GroupsStore {
    groups {
      ...GroupFields
    }
  }
`);

const CREATE_GROUP = graphql(`
  mutation GroupsStoreCreate($input: CreateGroupInput!) {
    createGroup(input: $input) {
      ...GroupFields
    }
  }
`);

const UPDATE_GROUP = graphql(`
  mutation GroupsStoreUpdate($id: ID!, $input: UpdateGroupInput!) {
    updateGroup(id: $id, input: $input) {
      ...GroupFields
    }
  }
`);

const DELETE_GROUP = graphql(`
  mutation GroupsStoreDelete($id: ID!) {
    deleteGroup(id: $id)
  }
`);

const BATCH_DELETE_GROUPS = graphql(`
  mutation GroupsStoreBatchDelete($ids: [ID!]!) {
    batchDeleteGroups(ids: $ids)
  }
`);

const ADD_GROUP_MEMBER = graphql(`
  mutation GroupsStoreAddMember($input: AddGroupMemberInput!) {
    addGroupMember(input: $input) {
      ...GroupFields
    }
  }
`);

const REMOVE_GROUP_MEMBER = graphql(`
  mutation GroupsStoreRemoveMember($id: ID!) {
    removeGroupMember(id: $id) {
      ...GroupFields
    }
  }
`);

const base = createEntityStore<Group, GroupsStoreQuery>({
  name: "groups",
  version: 1,
  query: GROUPS_QUERY,
  select: (data) => data.groups,
});

/**
 * Groups, shared across every page.
 *
 * Every write runs through this store so the returned group lands in the cache
 * directly — the API reports the whole group, including the recomputed
 * `resolvedDevices`, which is what makes a follow-up refetch unnecessary.
 */
export const groupsStore = {
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

  async create(client: Client, name: string): Promise<Group> {
    const result = await client.mutation(CREATE_GROUP, { input: { name } }).toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("createGroup failed");
    base.upsert(result.data.createGroup);
    return result.data.createGroup;
  },

  async update(client: Client, id: string, input: UpdateGroupInput): Promise<Group> {
    const result = await client.mutation(UPDATE_GROUP, { id, input }).toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("updateGroup failed");
    base.upsert(result.data.updateGroup);
    return result.data.updateGroup;
  },

  async delete(client: Client, id: string): Promise<void> {
    const result = await client.mutation(DELETE_GROUP, { id }).toPromise();
    if (result.error) throw result.error;
    base.remove(id);
  },

  async deleteMany(client: Client, ids: string[]): Promise<void> {
    const result = await client.mutation(BATCH_DELETE_GROUPS, { ids }).toPromise();
    if (result.error) throw result.error;
    base.removeMany(ids);
  },

  async addMember(
    client: Client,
    groupId: string,
    memberType: string,
    memberId: string,
  ): Promise<Group> {
    const result = await client
      .mutation(ADD_GROUP_MEMBER, { input: { groupId, memberType, memberId } })
      .toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("addGroupMember failed");
    base.upsert(result.data.addGroupMember);
    return result.data.addGroupMember;
  },

  async removeMember(client: Client, membershipId: string): Promise<Group> {
    const result = await client.mutation(REMOVE_GROUP_MEMBER, { id: membershipId }).toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("removeGroupMember failed");
    base.upsert(result.data.removeGroupMember);
    return result.data.removeGroupMember;
  },
};
