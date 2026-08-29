import { afterEach, describe, expect, it, vi } from "vitest";
import { randomVibeSeed } from "$lib/vibe-seed";

afterEach(() => vi.restoreAllMocks());

describe("randomVibeSeed", () => {
  it("returns a positive signed 64-bit decimal string", () => {
    vi.spyOn(crypto, "getRandomValues").mockImplementation((array) => {
      const words = array as Uint32Array;
      words[0] = 0xffffffff;
      words[1] = 0xffffffff;
      return array;
    });
    expect(randomVibeSeed()).toBe("9223372036854775807");
  });

  it("never returns the reserved zero seed", () => {
    vi.spyOn(crypto, "getRandomValues").mockImplementation((array) => {
      (array as Uint32Array).fill(0);
      return array;
    });
    expect(randomVibeSeed()).toBe("1");
  });
});
