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
  it("prefers the first GraphQL error message", () => {
    const err = {
      graphQLErrors: [{ message: "[GraphQL] saved but failed to reconnect" }],
      message: "combined",
    };
    expect(graphqlErrorMessage(err, "fallback")).toBe("saved but failed to reconnect");
  });

  it("skips GraphQL errors without a message", () => {
    const err = { graphQLErrors: [{}, { message: "second" }] };
    expect(graphqlErrorMessage(err, "fallback")).toBe("second");
  });

  it("falls back to the combined message", () => {
    expect(graphqlErrorMessage({ message: "[Network] offline" }, "fallback")).toBe("offline");
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
