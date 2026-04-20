import { describe, expect, it } from "vitest";
import { tokenize } from "$lib/components/json-inline.svelte";

describe("tokenize", () => {
	it("classifies object keys and string values distinctly", () => {
		const tokens = tokenize(`{"name":"Kitchen"}`);
		const key = tokens.find((t) => t.text === `"name"`);
		const val = tokens.find((t) => t.text === `"Kitchen"`);
		expect(key?.kind).toBe("key");
		expect(val?.kind).toBe("string");
	});

	it("classifies numbers, booleans, and null", () => {
		const tokens = tokenize(`{"a":12.5,"b":true,"c":null}`);
		const byText = (s: string) => tokens.find((t) => t.text === s);
		expect(byText("12.5")?.kind).toBe("number");
		expect(byText("true")?.kind).toBe("boolean");
		expect(byText("null")?.kind).toBe("null");
	});

	it("handles nested objects and arrays", () => {
		const input = `{"arr":[1,"x",false]}`;
		const tokens = tokenize(input);
		const reconstructed = tokens.map((t) => t.text).join("");
		expect(reconstructed).toBe(input);
	});

	it("handles escaped quotes in strings", () => {
		const tokens = tokenize(`{"msg":"he said \\"hi\\""}`);
		const stringTokens = tokens.filter((t) => t.kind === "string" || t.kind === "key");
		const joined = stringTokens.map((t) => t.text).join("|");
		expect(joined).toContain(`\\"hi\\"`);
	});

	it("round-trips arbitrary whitespace as punctuation", () => {
		const input = `{\n  "k": 1\n}`;
		const reconstructed = tokenize(input).map((t) => t.text).join("");
		expect(reconstructed).toBe(input);
	});

	it("tokenises negative and exponent numbers", () => {
		const tokens = tokenize(`{"a":-3,"b":1.2e10}`);
		expect(tokens.find((t) => t.text === "-3")?.kind).toBe("number");
		expect(tokens.find((t) => t.text === "1.2e10")?.kind).toBe("number");
	});
});
