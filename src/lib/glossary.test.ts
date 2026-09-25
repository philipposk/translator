import { describe, expect, it } from "vitest";
import { applyGlossary } from "./glossary";

describe("applyGlossary", () => {
  it("normalizes common PT phrases to EN", () => {
    expect(applyGlossary("Obrigado pela ajuda", "pt", "en")).toContain("thank you");
  });

  it("leaves unrelated language pairs unchanged", () => {
    const text = "Bonjour le monde";
    expect(applyGlossary(text, "fr", "en")).toBe(text);
  });
});
