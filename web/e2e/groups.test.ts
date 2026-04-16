import { describe, it, expect } from "vitest";
import { gql } from "@urql/core";
import { getContext } from "./setup.js";

const CREATE_GROUP = gql`
  mutation CreateGroup($input: CreateGroupInput!) {
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
`;

const ADD_GROUP_MEMBER = gql`
  mutation AddGroupMember($input: AddGroupMemberInput!) {
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
`;

const GROUP_QUERY = gql`
  query Group($id: ID!) {
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
`;

const DELETE_GROUP = gql`
  mutation DeleteGroup($id: ID!) {
    deleteGroup(id: $id)
  }
`;

const DEVICES_QUERY = gql`
  query Devices {
    devices {
      id
      name
    }
  }
`;

interface GroupFields {
  id: string;
  name: string;
  members: Array<{
    id: string;
    memberType: string;
    memberId: string;
  }>;
  resolvedDevices: Array<{
    id: string;
    name: string;
  }>;
}

interface GroupMemberFields {
  id: string;
  memberType: string;
  memberId: string;
  device: {
    id: string;
    name: string;
  } | null;
}

interface CreateGroupResult {
  createGroup: GroupFields;
}

interface AddGroupMemberResult {
  addGroupMember: GroupMemberFields;
}

interface GroupQueryResult {
  group: GroupFields | null;
}

interface DeleteGroupResult {
  deleteGroup: boolean;
}

interface DevicesQueryResult {
  devices: Array<{ id: string; name: string }>;
}

describe("groups", () => {
  let groupId: string;
  let deviceId: string;

  it("should create a group", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient
      .mutation<CreateGroupResult>(CREATE_GROUP, {
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

    const devicesResult = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();

    expect(devicesResult.data).toBeDefined();
    expect(devicesResult.data!.devices.length).toBeGreaterThan(0);
    deviceId = devicesResult.data!.devices[0].id;

    const result = await graphqlClient
      .mutation<AddGroupMemberResult>(ADD_GROUP_MEMBER, {
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

    const result = await graphqlClient
      .query<GroupQueryResult>(GROUP_QUERY, { id: groupId })
      .toPromise();

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

    const result = await graphqlClient
      .mutation<DeleteGroupResult>(DELETE_GROUP, { id: groupId })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.deleteGroup).toBe(true);

    const queryResult = await graphqlClient
      .query<GroupQueryResult>(GROUP_QUERY, { id: groupId })
      .toPromise();

    expect(
      queryResult.data?.group === null || queryResult.error !== undefined,
    ).toBe(true);
  });
});
