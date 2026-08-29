import { CombinedError, type Client } from "@urql/svelte";
import { describe, expect, it, vi } from "vitest";
import { waitForSetupStatus } from "$lib/graphql/setup-status";

function result(value: unknown) {
  return { toPromise: () => Promise.resolve(value) };
}

describe("waitForSetupStatus", () => {
  it("retries network failures without treating them as an empty installation", async () => {
    const query = vi
      .fn()
      .mockReturnValueOnce(
        result({ error: new CombinedError({ networkError: new Error("connection reset") }) }),
      )
      .mockReturnValueOnce(result({ data: { setupStatus: { hasInitialUser: true } } }));
    const pauses: number[] = [];

    const status = await waitForSetupStatus({ query } as unknown as Client, {
      pause: async (delayMs) => {
        pauses.push(delayMs);
      },
    });

    expect(status).toEqual({ hasInitialUser: true });
    expect(query).toHaveBeenCalledTimes(2);
    expect(pauses).toEqual([100]);
  });

  it("surfaces GraphQL failures", async () => {
    const error = new CombinedError({ graphQLErrors: [new Error("resolver failed")] });
    const query = vi.fn().mockReturnValue(result({ error }));

    await expect(waitForSetupStatus({ query } as unknown as Client)).rejects.toBe(error);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
