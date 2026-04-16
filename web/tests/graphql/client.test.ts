import { describe, it, expect } from "vitest";

describe("getWSUrl", () => {
  it("converts http to ws", () => {
    const url = new URL("http://localhost:8080/graphql");
    url.protocol = "ws:";
    expect(url.toString()).toBe("ws://localhost:8080/graphql");
  });

  it("converts https to wss", () => {
    const url = new URL("https://example.com/graphql");
    url.protocol = "wss:";
    expect(url.toString()).toBe("wss://example.com/graphql");
  });

  it("preserves path and port", () => {
    const url = new URL("http://192.168.1.100:3000/api/graphql");
    url.protocol = "ws:";
    expect(url.toString()).toBe("ws://192.168.1.100:3000/api/graphql");
  });
});
