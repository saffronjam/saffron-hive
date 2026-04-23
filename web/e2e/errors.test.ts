import { describe, it, expect } from "vitest";
import { graphql } from "$lib/gql";
import { getContext } from "./setup.js";

const SCENE_QUERY = graphql(`
  query E2EErrorsScene($id: ID!) {
    scene(id: $id) {
      id
      name
    }
  }
`);

const AUTOMATION_QUERY = graphql(`
  query E2EErrorsAutomation($id: ID!) {
    automation(id: $id) {
      id
      name
    }
  }
`);

const ADD_GROUP_MEMBER = graphql(`
  mutation E2EErrorsAddGroupMember($input: AddGroupMemberInput!) {
    addGroupMember(input: $input) {
      id
    }
  }
`);

const DELETE_SCENE = graphql(`
  mutation E2EErrorsDeleteScene($id: ID!) {
    deleteScene(id: $id)
  }
`);

const CREATE_GROUP = graphql(`
  mutation E2EErrorsCreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      id
    }
  }
`);

const DELETE_GROUP = graphql(`
  mutation E2EErrorsDeleteGroup($id: ID!) {
    deleteGroup(id: $id)
  }
`);

describe("error handling", () => {
  it("should return error for invalid scene ID", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient.query(SCENE_QUERY, { id: "nonexistent" }).toPromise();

    expect(result.error !== undefined || result.data?.scene === null).toBe(true);
  });

  it("should return error for invalid automation ID", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient.query(AUTOMATION_QUERY, { id: "nonexistent" }).toPromise();

    expect(result.error !== undefined || result.data?.automation === null).toBe(true);
  });

  it("should return error for addGroupMember with invalid memberType", async () => {
    const { graphqlClient } = getContext();

    const group = await graphqlClient
      .mutation(CREATE_GROUP, {
        input: { name: "Error Test Group" },
      })
      .toPromise();
    expect(group.data).toBeDefined();
    const groupId = group.data!.createGroup.id;

    const result = await graphqlClient
      .mutation(ADD_GROUP_MEMBER, {
        input: {
          groupId,
          memberType: "invalid",
          memberId: "some-id",
        },
      })
      .toPromise();

    expect(result.error).toBeDefined();

    await graphqlClient.mutation(DELETE_GROUP, { id: groupId }).toPromise();
  });

  it("should not error for deleteScene with nonexistent ID", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient.mutation(DELETE_SCENE, { id: "nonexistent" }).toPromise();

    expect(result.error).toBeUndefined();
  });
});
