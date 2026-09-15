import { describe, expect, it } from "vitest";
import { toPlainTxt, toSrt, toTxt, toVtt } from "./export";

const segs = [
  { start: 0, end: 2.5, text: "Hello", translation: "Γειά σου" },
  { start: 2.5, end: 5, text: "World", translation: "Κόσμε" },
];

describe("export", () => {
  it("builds SRT with translation", () => {
    const srt = toSrt(segs);
    expect(srt).toContain("1\n00:00:00,000 --> 00:00:02,500\nΓειά σου");
    expect(srt).toContain("2\n00:00:02,500 --> 00:00:05,000\nΚόσμε");
  });

  it("builds VTT header", () => {
    expect(toVtt(segs)).toMatch(/^WEBVTT/);
  });

  it("builds plain txt", () => {
    expect(toTxt(segs)).toBe("Γειά σου\n\nΚόσμε");
  });

  it("builds bilingual plain export", () => {
    expect(toPlainTxt("Hi", "Γειά")).toBe("Hi\n\nΓειά");
  });
});
