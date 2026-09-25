import { describe, expect, it } from "vitest";
import { applyGlossary } from "./glossary";

describe("applyGlossary", () => {
  it("normalizes common PT phrases to EN", () => {
    expect(applyGlossary("Obrigado pela ajuda", "pt", "en").toLowerCase()).toContain("thank you");
  });

  it("replaces multi-word phrases before shorter overlaps", () => {
    expect(applyGlossary("Por favor, não entendo.", "pt", "en").toLowerCase()).toContain("please");
    expect(applyGlossary("Por favor, não entendo.", "pt", "en").toLowerCase()).toContain("i don't understand");
  });

  it("leaves unrelated language pairs unchanged", () => {
    const text = "Bonjour le monde";
    expect(applyGlossary(text, "fr", "en")).toBe(text);
  });
});
