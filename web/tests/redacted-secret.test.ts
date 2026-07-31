import { describe, it, expect } from "vitest";
import { REDACTED_SECRET, hasStoredSecret, secretToSend } from "$lib/redacted-secret";

describe("hasStoredSecret", () => {
  it("is true only for the placeholder", () => {
    expect(hasStoredSecret(REDACTED_SECRET)).toBe(true);
  });

  it("is false for an empty string", () => {
    expect(hasStoredSecret("")).toBe(false);
  });

  it("is false for null and undefined", () => {
    expect(hasStoredSecret(null)).toBe(false);
    expect(hasStoredSecret(undefined)).toBe(false);
  });

  it("is false for a real-looking value", () => {
    expect(hasStoredSecret("hunter2")).toBe(false);
  });
});

describe("secretToSend", () => {
  // An untouched field must echo the placeholder back, or saving any unrelated
  // field would wipe the stored secret and take the integration offline.
  it("echoes the placeholder when untouched and a secret is stored", () => {
    expect(secretToSend("", true)).toBe(REDACTED_SECRET);
  });

  it("sends an empty string when untouched and nothing is stored", () => {
    expect(secretToSend("", false)).toBe("");
  });

  it("passes a typed value through unchanged", () => {
    expect(secretToSend("hunter2", true)).toBe("hunter2");
    expect(secretToSend("hunter2", false)).toBe("hunter2");
  });

  it("passes the placeholder through when the user typed it verbatim", () => {
    expect(secretToSend(REDACTED_SECRET, false)).toBe(REDACTED_SECRET);
  });

  it("round-trips a fetched config without changing the stored secret", () => {
    const fetched = REDACTED_SECRET;
    const stored = hasStoredSecret(fetched);
    expect(secretToSend("", stored)).toBe(REDACTED_SECRET);
  });
});
