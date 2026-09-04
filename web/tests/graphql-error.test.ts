import { describe, it, expect } from "vitest";
import { stripErrorPrefix, graphqlErrorMessage } from "$lib/graphql-error";

describe("stripErrorPrefix", () => {
  it("drops the [GraphQL] prefix", () => {
    expect(stripErrorPrefix("[GraphQL] broker unreachable")).toBe("broker unreachable");
  });

  it("drops the [Network] prefix", () => {
    expect(stripErrorPrefix("[Network] failed to fetch")).toBe("failed to fetch");
  });

  it("is case-insensitive", () => {
    expect(stripErrorPrefix("[graphql] nope")).toBe("nope");
  });

  it("leaves an unprefixed message alone", () => {
    expect(stripErrorPrefix("broker unreachable")).toBe("broker unreachable");
  });

  it("trims surrounding whitespace", () => {
    expect(stripErrorPrefix("[GraphQL]   spaced  ")).toBe("spaced");
  });

  it("only strips a leading prefix", () => {
    expect(stripErrorPrefix("wrapped [GraphQL] inner")).toBe("wrapped [GraphQL] inner");
  });
});

describe("graphqlErrorMessage", () => {
  it("presents the first GraphQL error's stable code", () => {
    const err = {
      graphQLErrors: [
        {
          message: "internal authentication detail",
          extensions: { code: "UNAUTHENTICATED" },
        },
      ],
      message: "combined",
    };
    expect(graphqlErrorMessage(err, "fallback")).toBe("Please sign in to continue.");
  });

  it("does not expose uncoded GraphQL error prose", () => {
    const err = { graphQLErrors: [{}, { message: "second" }] };
    expect(graphqlErrorMessage(err, "fallback")).toBe("fallback");
  });

  it("does not expose a raw transport message", () => {
    expect(graphqlErrorMessage({ message: "[Network] offline" }, "fallback")).toBe("fallback");
  });

  it("uses the fallback for a non-object", () => {
    expect(graphqlErrorMessage("boom", "fallback")).toBe("fallback");
    expect(graphqlErrorMessage(null, "fallback")).toBe("fallback");
    expect(graphqlErrorMessage(undefined, "fallback")).toBe("fallback");
  });

  it("uses the fallback when no message is present", () => {
    expect(graphqlErrorMessage({ graphQLErrors: [] }, "fallback")).toBe("fallback");
  });

  it("uses the fallback when the message is only a prefix", () => {
    expect(graphqlErrorMessage({ message: "[GraphQL] " }, "fallback")).toBe("fallback");
  });
});
