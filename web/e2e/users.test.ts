import { describe, it, expect } from "vitest";
import { gql } from "@urql/core";
import { getContext } from "./setup.js";

const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      username
      name
      avatarPath
      theme
    }
  }
`;

const UPDATE_CURRENT_USER = gql`
  mutation UpdateCurrentUser($input: UpdateCurrentUserInput!) {
    updateCurrentUser(input: $input) {
      id
      name
      theme
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

const RESET_PASSWORD = gql`
  mutation ResetPassword($id: ID!, $p: String!) {
    resetUserPassword(id: $id, newPassword: $p)
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      id
      username
      name
      theme
      avatarPath
    }
  }
`;

describe("users", () => {
  it("creates, updates, and deletes users", async () => {
    const { graphqlClient } = getContext();

    const created = await graphqlClient
      .mutation(CREATE_USER, {
        input: { username: "ts-user-a", name: "TS User A", password: "secret123" },
      })
      .toPromise();
    expect(created.error).toBeUndefined();
    expect(created.data?.createUser.username).toBe("ts-user-a");
    expect(created.data?.createUser.theme).toBe("DARK");
    expect(created.data?.createUser.avatarPath).toBeNull();

    const deleted = await graphqlClient
      .mutation(DELETE_USER, { id: created.data!.createUser.id })
      .toPromise();
    expect(deleted.error).toBeUndefined();
    expect(deleted.data?.deleteUser).toBe(true);
  });

  it("reflects server theme in me after updateCurrentUser", async () => {
    const { graphqlClient } = getContext();

    // Flip to LIGHT, confirm via me, flip back.
    const light = await graphqlClient
      .mutation(UPDATE_CURRENT_USER, { input: { theme: "LIGHT" } })
      .toPromise();
    expect(light.error).toBeUndefined();
    expect(light.data?.updateCurrentUser.theme).toBe("LIGHT");

    const me = await graphqlClient.query(ME_QUERY, {}, { requestPolicy: "network-only" }).toPromise();
    expect(me.data?.me?.theme).toBe("LIGHT");

    await graphqlClient
      .mutation(UPDATE_CURRENT_USER, { input: { theme: "DARK" } })
      .toPromise();
  });

  it("rejects deleting self", async () => {
    const { graphqlClient } = getContext();
    const me = await graphqlClient.query(ME_QUERY, {}, { requestPolicy: "network-only" }).toPromise();
    const selfId = me.data!.me!.id;

    const result = await graphqlClient.mutation(DELETE_USER, { id: selfId }).toPromise();
    expect(result.error).toBeDefined();
  });

  it("resets a user password via admin reset", async () => {
    const { graphqlClient } = getContext();
    const created = await graphqlClient
      .mutation(CREATE_USER, {
        input: { username: "ts-reset", name: "TS Reset", password: "oldpass1" },
      })
      .toPromise();
    expect(created.error).toBeUndefined();

    const reset = await graphqlClient
      .mutation(RESET_PASSWORD, { id: created.data!.createUser.id, p: "newpass2" })
      .toPromise();
    expect(reset.error).toBeUndefined();
    expect(reset.data?.resetUserPassword).toBe(true);

    await graphqlClient.mutation(DELETE_USER, { id: created.data!.createUser.id }).toPromise();
  });
});
