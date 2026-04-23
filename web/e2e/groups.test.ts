import { describe, it, expect } from "vitest";
import { graphql } from "$lib/gql";
import { getContext } from "./setup.js";

const CREATE_GROUP = graphql(`
  mutation E2ECreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      id
      name
      members {
        id
        memberType
        memberId
      }
      resolvedDevices {
        id
        name
      }
    }
  }
`);

const ADD_GROUP_MEMBER = graphql(`
  mutation E2EAddGroupMember($input: AddGroupMemberInput!) {
    addGroupMember(input: $input) {
      id
      memberType
      memberId
      device {
        id
        name
      }
    }
  }
`);

const GROUP_QUERY = graphql(`
  query E2EGroup($id: ID!) {
    group(id: $id) {
      id
      name
      members {
        id
        memberType
        memberId
      }
      resolvedDevices {
        id
        name
      }
    }
  }
`);

const DELETE_GROUP = graphql(`
  mutation E2EDeleteGroup($id: ID!) {
    deleteGroup(id: $id)
  }
`);

const GROUPS_QUERY = graphql(`
  query E2EGroups {
    groups {
      id
      name
      members {
        id
        memberType
        memberId
      }
      resolvedDevices {
        id
        name
      }
    }
  }
`);

const UPDATE_GROUP = graphql(`
  mutation E2EUpdateGroup($id: ID!, $input: UpdateGroupInput!) {
    updateGroup(id: $id, input: $input) {
      id
      name
    }
  }
`);

const REMOVE_GROUP_MEMBER = graphql(`
  mutation E2ERemoveGroupMember($id: ID!) {
    removeGroupMember(id: $id)
  }
`);

const DEVICES_QUERY = graphql(`
  query E2EGroupsDevices {
    devices {
      id
      name
    }
  }
`);

describe("groups", () => {
  let groupId: string;
  let deviceId: string;

  it("should create a group", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient
      .mutation(CREATE_GROUP, {
        input: { name: "Test Group" },
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.createGroup.name).toBe("Test Group");
    expect(result.data!.createGroup.id).toBeTruthy();
    expect(result.data!.createGroup.members).toHaveLength(0);

    groupId = result.data!.createGroup.id;
  });

  it("should add a device member to the group", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();

    expect(devicesResult.data).toBeDefined();
    expect(devicesResult.data!.devices.length).toBeGreaterThan(0);
    deviceId = devicesResult.data!.devices[0].id;

    const result = await graphqlClient
      .mutation(ADD_GROUP_MEMBER, {
        input: {
          groupId,
          memberType: "device",
          memberId: deviceId,
        },
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.addGroupMember.memberType).toBe("device");
    expect(result.data!.addGroupMember.memberId).toBe(deviceId);
  });

  it("should query group with resolved devices", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient.query(GROUP_QUERY, { id: groupId }).toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.group).toBeDefined();
    expect(result.data!.group!.name).toBe("Test Group");
    expect(result.data!.group!.members).toHaveLength(1);
    expect(result.data!.group!.resolvedDevices).toHaveLength(1);
    expect(result.data!.group!.resolvedDevices[0].id).toBe(deviceId);
  });

  it("should delete the group", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient.mutation(DELETE_GROUP, { id: groupId }).toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.deleteGroup).toBe(true);

    const queryResult = await graphqlClient.query(GROUP_QUERY, { id: groupId }).toPromise();

    expect(queryResult.data?.group === null || queryResult.error !== undefined).toBe(true);
  });

  it("should list all groups", async () => {
    const { graphqlClient } = getContext();

    const group1 = await graphqlClient
      .mutation(CREATE_GROUP, {
        input: { name: "List Group A" },
      })
      .toPromise();
    const group2 = await graphqlClient
      .mutation(CREATE_GROUP, {
        input: { name: "List Group B" },
      })
      .toPromise();

    expect(group1.data).toBeDefined();
    expect(group2.data).toBeDefined();

    const result = await graphqlClient.query(GROUPS_QUERY, {}).toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();

    const names = result.data!.groups.map((g) => g.name);
    expect(names).toContain("List Group A");
    expect(names).toContain("List Group B");

    await graphqlClient
      .mutation(DELETE_GROUP, {
        id: group1.data!.createGroup.id,
      })
      .toPromise();
    await graphqlClient
      .mutation(DELETE_GROUP, {
        id: group2.data!.createGroup.id,
      })
      .toPromise();
  });

  it("should update group name", async () => {
    const { graphqlClient } = getContext();

    const created = await graphqlClient
      .mutation(CREATE_GROUP, {
        input: { name: "Original Name" },
      })
      .toPromise();

    expect(created.data).toBeDefined();
    const id = created.data!.createGroup.id;

    const updated = await graphqlClient
      .mutation(UPDATE_GROUP, {
        id,
        input: { name: "Updated Name" },
      })
      .toPromise();

    expect(updated.error).toBeUndefined();
    expect(updated.data).toBeDefined();
    expect(updated.data!.updateGroup.name).toBe("Updated Name");

    await graphqlClient.mutation(DELETE_GROUP, { id }).toPromise();
  });

  it("should remove a group member", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();
    expect(devicesResult.data).toBeDefined();
    const devId = devicesResult.data!.devices[0].id;

    const created = await graphqlClient
      .mutation(CREATE_GROUP, {
        input: { name: "Remove Member Group" },
      })
      .toPromise();
    expect(created.data).toBeDefined();
    const gId = created.data!.createGroup.id;

    const memberResult = await graphqlClient
      .mutation(ADD_GROUP_MEMBER, {
        input: { groupId: gId, memberType: "device", memberId: devId },
      })
      .toPromise();
    expect(memberResult.data).toBeDefined();
    const memberId = memberResult.data!.addGroupMember.id;

    const removeResult = await graphqlClient
      .mutation(REMOVE_GROUP_MEMBER, { id: memberId })
      .toPromise();
    expect(removeResult.error).toBeUndefined();
    expect(removeResult.data).toBeDefined();
    expect(removeResult.data!.removeGroupMember).toBe(true);

    const queryResult = await graphqlClient.query(GROUP_QUERY, { id: gId }).toPromise();
    expect(queryResult.data).toBeDefined();
    expect(queryResult.data!.group!.members).toHaveLength(0);

    await graphqlClient.mutation(DELETE_GROUP, { id: gId }).toPromise();
  });

  it("should resolve devices from nested groups", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();
    expect(devicesResult.data).toBeDefined();
    const devId = devicesResult.data!.devices[0].id;

    const childGroup = await graphqlClient
      .mutation(CREATE_GROUP, {
        input: { name: "Child Group" },
      })
      .toPromise();
    expect(childGroup.data).toBeDefined();
    const childId = childGroup.data!.createGroup.id;

    await graphqlClient
      .mutation(ADD_GROUP_MEMBER, {
        input: { groupId: childId, memberType: "device", memberId: devId },
      })
      .toPromise();

    const parentGroup = await graphqlClient
      .mutation(CREATE_GROUP, {
        input: { name: "Parent Group" },
      })
      .toPromise();
    expect(parentGroup.data).toBeDefined();
    const parentId = parentGroup.data!.createGroup.id;

    await graphqlClient
      .mutation(ADD_GROUP_MEMBER, {
        input: { groupId: parentId, memberType: "group", memberId: childId },
      })
      .toPromise();

    const result = await graphqlClient.query(GROUP_QUERY, { id: parentId }).toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.group!.resolvedDevices.length).toBeGreaterThanOrEqual(1);
    expect(result.data!.group!.resolvedDevices.some((d) => d.id === devId)).toBe(true);

    await graphqlClient.mutation(DELETE_GROUP, { id: parentId }).toPromise();
    await graphqlClient.mutation(DELETE_GROUP, { id: childId }).toPromise();
  });

  it("should reject circular group dependency", async () => {
    const { graphqlClient } = getContext();

    const groupA = await graphqlClient
      .mutation(CREATE_GROUP, {
        input: { name: "Circular A" },
      })
      .toPromise();
    const groupB = await graphqlClient
      .mutation(CREATE_GROUP, {
        input: { name: "Circular B" },
      })
      .toPromise();

    expect(groupA.data).toBeDefined();
    expect(groupB.data).toBeDefined();
    const idA = groupA.data!.createGroup.id;
    const idB = groupB.data!.createGroup.id;

    const firstAdd = await graphqlClient
      .mutation(ADD_GROUP_MEMBER, {
        input: { groupId: idA, memberType: "group", memberId: idB },
      })
      .toPromise();
    expect(firstAdd.error).toBeUndefined();

    const circularAdd = await graphqlClient
      .mutation(ADD_GROUP_MEMBER, {
        input: { groupId: idB, memberType: "group", memberId: idA },
      })
      .toPromise();
    expect(circularAdd.error).toBeDefined();

    await graphqlClient.mutation(DELETE_GROUP, { id: idA }).toPromise();
    await graphqlClient.mutation(DELETE_GROUP, { id: idB }).toPromise();
  });

  it("should handle duplicate device member", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();
    expect(devicesResult.data).toBeDefined();
    const devId = devicesResult.data!.devices[0].id;

    const created = await graphqlClient
      .mutation(CREATE_GROUP, {
        input: { name: "Duplicate Member Group" },
      })
      .toPromise();
    expect(created.data).toBeDefined();
    const gId = created.data!.createGroup.id;

    const first = await graphqlClient
      .mutation(ADD_GROUP_MEMBER, {
        input: { groupId: gId, memberType: "device", memberId: devId },
      })
      .toPromise();
    expect(first.error).toBeUndefined();

    const second = await graphqlClient
      .mutation(ADD_GROUP_MEMBER, {
        input: { groupId: gId, memberType: "device", memberId: devId },
      })
      .toPromise();

    const queryResult = await graphqlClient.query(GROUP_QUERY, { id: gId }).toPromise();
    expect(queryResult.data).toBeDefined();

    if (second.error) {
      expect(queryResult.data!.group!.members).toHaveLength(1);
    } else {
      expect(queryResult.data!.group!.members.length).toBeGreaterThanOrEqual(1);
    }

    expect(
      queryResult.data!.group!.resolvedDevices.filter((d) => d.id === devId).length,
    ).toBeGreaterThanOrEqual(1);

    await graphqlClient.mutation(DELETE_GROUP, { id: gId }).toPromise();
  });
});
