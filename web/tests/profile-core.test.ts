import { describe, it, expect, beforeEach } from "vitest";
import { loadProfile, saveProfile, PROFILE_STORAGE_KEY } from "$lib/profile-core";

beforeEach(() => {
  localStorage.clear();
});

describe("loadProfile", () => {
  it("returns empty object when storage is null", () => {
    expect(loadProfile(null)).toEqual({});
    expect(loadProfile(undefined)).toEqual({});
  });

  it("returns empty object when key is missing", () => {
    expect(loadProfile(localStorage)).toEqual({});
  });

  it("returns empty object for empty string", () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, "");
    expect(loadProfile(localStorage)).toEqual({});
  });

  it("returns empty object for malformed JSON", () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, "{not json");
    expect(loadProfile(localStorage)).toEqual({});
  });

  it("returns empty object for non-object JSON (array)", () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(["a", "b"]));
    expect(loadProfile(localStorage)).toEqual({});
  });

  it("returns empty object for non-object JSON (primitive)", () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify("hello"));
    expect(loadProfile(localStorage)).toEqual({});
  });

  it("returns empty object for null JSON", () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, "null");
    expect(loadProfile(localStorage)).toEqual({});
  });

  it("returns parsed state for valid JSON object", () => {
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ "view.devices": "table", "view.scenes": "card" }),
    );
    expect(loadProfile(localStorage)).toEqual({
      "view.devices": "table",
      "view.scenes": "card",
    });
  });
});

describe("saveProfile", () => {
  it("is a no-op when storage is null", () => {
    expect(() => saveProfile(null, { "view.devices": "table" })).not.toThrow();
    expect(() => saveProfile(undefined, { "view.devices": "table" })).not.toThrow();
  });

  it("writes the state as a JSON blob under the storage key", () => {
    saveProfile(localStorage, { "view.devices": "table" });
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    expect(raw).toBe(JSON.stringify({ "view.devices": "table" }));
  });

  it("round-trips through loadProfile", () => {
    const state = {
      "view.devices": "table",
      "view.automations": "card",
      "view.scenes": "table",
    } as const;
    saveProfile(localStorage, state);
    expect(loadProfile(localStorage)).toEqual(state);
  });

  it("overwrites previous contents", () => {
    saveProfile(localStorage, { "view.devices": "card" });
    saveProfile(localStorage, { "view.devices": "table" });
    expect(loadProfile(localStorage)).toEqual({ "view.devices": "table" });
  });
});
