import { describe, expect, it } from "vitest";
import { graphql } from "$lib/gql";
import { getContext } from "./setup.js";

const CREATE_GUEST = graphql(`
  mutation E2ECreateGuest($input: CreateGuestInput!) {
    createGuest(input: $input) {
      id
      name
      expiresAt
      createdAt
    }
  }
`);

const EXTEND_GUEST = graphql(`
  mutation E2EExtendGuest($id: ID!) {
    extendGuest(id: $id, durationMinutes: 60) {
      id
      expiresAt
    }
  }
`);

const DELETE_GUEST = graphql(`
  mutation E2EDeleteGuest($id: ID!) {
    deleteGuest(id: $id)
  }
`);

interface RawGraphQLResponse {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

async function rawGraphQL(
  token: string,
  query: string,
  variables = {},
): Promise<RawGraphQLResponse> {
  const { graphqlUrl } = getContext();
  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  return (await response.json()) as RawGraphQLResponse;
}

describe("guests", () => {
  it("limits a temporary guest to dashboard operations and revokes immediately", async () => {
    const { graphqlClient } = getContext();
    const created = await graphqlClient
      .mutation(CREATE_GUEST, { input: { name: "TS E2E Guest", durationMinutes: 60 } })
      .toPromise();
    expect(created.error).toBeUndefined();
    const guestId = created.data!.createGuest.id;

    try {
      const login = await rawGraphQL(
        "",
        `mutation($name: String!) { guestLogin(name: $name) { token guest { id name } } }`,
        { name: " ts e2e GUEST " },
      );
      expect(login.errors).toBeUndefined();
      const payload = login.data!.guestLogin as {
        token: string;
        guest: { id: string; name: string };
      };
      expect(payload.guest.id).toBe(guestId);

      const dashboard = await rawGraphQL(
        payload.token,
        `query { currentGuest { id } devices { id } rooms { id } groups { id } scenes { id } dashboardLocalization { defaultContentLanguage } }`,
      );
      expect(dashboard.errors).toBeUndefined();

      const users = await rawGraphQL(payload.token, `query { users { id } }`);
      expect(users.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");

      const extended = await graphqlClient.mutation(EXTEND_GUEST, { id: guestId }).toPromise();
      expect(extended.error).toBeUndefined();
      const revoked = await graphqlClient.mutation(DELETE_GUEST, { id: guestId }).toPromise();
      expect(revoked.data?.deleteGuest).toBe(true);

      const afterRevoke = await rawGraphQL(payload.token, `query { devices { id } }`);
      expect(afterRevoke.errors?.[0]?.extensions?.code).toBe("UNAUTHENTICATED");
    } finally {
      await graphqlClient.mutation(DELETE_GUEST, { id: guestId }).toPromise();
    }
  });
});
