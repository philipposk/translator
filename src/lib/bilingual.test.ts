import { describe, expect, it } from "vitest";
import { isSttHallucination, pickBilingualTranscript, resolveConvLang, scriptHint } from "./bilingual";

describe("scriptHint", () => {
  it("detects Greek from letters", () => {
    expect(scriptHint("Γεια σου πώς είσαι")).toBe("el");
  });

  it("detects English from letters", () => {
    expect(scriptHint("Hello how are you today")).toBe("en");
  });
});

describe("isSttHallucination", () => {
  it("filters subtitle junk", () => {
    expect(isSttHallucination("υπότιτλοι autorwave")).toBe(true);
    expect(isSttHallucination("Subtitles by autorwave")).toBe(true);
  });

  it("keeps real speech", () => {
    expect(isSttHallucination("Καλημέρα, τι κάνεις;")).toBe(false);
    expect(isSttHallucination("Good morning, how are you?")).toBe(false);
  });
});

describe("pickBilingualTranscript", () => {
  it("picks Greek transcript when English run is gibberish", () => {
    const r = pickBilingualTranscript(
      [{ lang: "el", text: "Καλημέρα, τι κάνεις;" }, { lang: "en", text: "kali mera ti kanis" }],
      "el",
      "en",
    );
    expect(r?.language).toBe("el");
    expect(r?.text).toContain("Καλημέρα");
  });
});

describe("resolveConvLang", () => {
  it("prefers script over wrong audio detection", () => {
    const r = resolveConvLang("Γεια σου", "en", "el", "en", null);
    expect(r.code).toBe("el");
    expect(r.speaker).toBe("A");
    expect(r.method).toBe("script");
  });

  it("clamps to the chosen pair only", () => {
    const r = resolveConvLang("Bonjour", "fr", "el", "en", null);
    expect(["el", "en"]).toContain(r.code);
  });

  it("alternates when unsure", () => {
    const r = resolveConvLang("ok", null, "el", "en", "A");
    expect(r.speaker).toBe("B");
    expect(r.method).toBe("alternate");
  });
});
