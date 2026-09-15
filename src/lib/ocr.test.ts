import { describe, expect, it } from "vitest";
import { looksLikeGibberish } from "./ocr";

describe("looksLikeGibberish", () => {
  it("flags short or symbol-heavy text", () => {
    expect(looksLikeGibberish("ab")).toBe(true);
    expect(looksLikeGibberish("@@@###")).toBe(true);
  });

  it("accepts normal prose", () => {
    expect(looksLikeGibberish("Hello world this is a test")).toBe(false);
    expect(looksLikeGibberish("Γειά σου κόσμε")).toBe(false);
  });
});
