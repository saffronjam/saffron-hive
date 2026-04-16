import { describe, it, expect } from "vitest";
import { gql } from "@urql/core";
import { getContext } from "./setup.js";

const SCENE_QUERY = gql`
  query Scene($id: ID!) {
    scene(id: $id) {
      id
      name
    }
  }
`;

const AUTOMATION_QUERY = gql`
  query Automation($id: ID!) {
    automation(id: $id) {
      id
      name
    }
  }
`;

const ADD_GROUP_MEMBER = gql`
  mutation AddGroupMember($input: AddGroupMemberInput!) {
    addGroupMember(input: $input) {
      id
    }
  }
`;

const DELETE_SCENE = gql`
  mutation DeleteScene($id: ID!) {
    deleteScene(id: $id)
  }
`;

const CREATE_GROUP = gql`
  mutation CreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      id
    }
  }
`;

const DELETE_GROUP = gql`
  mutation DeleteGroup($id: ID!) {
    deleteGroup(id: $id)
  }
`;

interface SceneQueryResult {
  scene: {
    id: string;
    name: string;
  } | null;
}

interface AutomationQueryResult {
  automation: {
    id: string;
    name: string;
  } | null;
}

interface AddGroupMemberResult {
  addGroupMember: {
    id: string;
  };
}

interface DeleteSceneResult {
  deleteScene: boolean;
}

interface CreateGroupResult {
  createGroup: {
    id: string;
  };
}

interface DeleteGroupResult {
  deleteGroup: boolean;
}

describe("error handling", () => {
  it("should return error for invalid scene ID", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient
      .query<SceneQueryResult>(SCENE_QUERY, { id: "nonexistent" })
      .toPromise();

    expect(
      result.error !== undefined || result.data?.scene === null,
    ).toBe(true);
  });

  it("should return error for invalid automation ID", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient
      .query<AutomationQueryResult>(AUTOMATION_QUERY, { id: "nonexistent" })
      .toPromise();

    expect(
      result.error !== undefined || result.data?.automation === null,
    ).toBe(true);
  });

  it("should return error for addGroupMember with invalid memberType", async () => {
    const { graphqlClient } = getContext();

    const group = await graphqlClient
      .mutation<CreateGroupResult>(CREATE_GROUP, {
        input: { name: "Error Test Group" },
      })
      .toPromise();
    expect(group.data).toBeDefined();
    const groupId = group.data!.createGroup.id;

    const result = await graphqlClient
      .mutation<AddGroupMemberResult>(ADD_GROUP_MEMBER, {
        input: {
          groupId,
          memberType: "invalid",
          memberId: "some-id",
        },
      })
      .toPromise();

    expect(result.error).toBeDefined();

    await graphqlClient
      .mutation<DeleteGroupResult>(DELETE_GROUP, { id: groupId })
      .toPromise();
  });

  it("should not error for deleteScene with nonexistent ID", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient
      .mutation<DeleteSceneResult>(DELETE_SCENE, { id: "nonexistent" })
      .toPromise();

    expect(result.error).toBeUndefined();
  });
});
