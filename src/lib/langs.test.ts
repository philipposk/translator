import { describe, expect, it } from "vitest";
import { detectedToCode, effectiveSourceCode } from "./langs";

describe("detectedToCode", () => {
  it("maps ISO 639-1 codes", () => {
    expect(detectedToCode("en")).toBe("en");
    expect(detectedToCode("el")).toBe("el");
  });

  it("maps ISO 639-3 codes", () => {
    expect(detectedToCode("ell")).toBe("el");
    expect(detectedToCode("eng")).toBe("en");
  });

  it("maps English names", () => {
    expect(detectedToCode("english")).toBe("en");
    expect(detectedToCode("greek")).toBe("el");
  });

  it("maps chinese variants", () => {
    expect(detectedToCode("mandarin")).toBe("zh");
    expect(detectedToCode("chinese")).toBe("zh");
  });

  it("returns null for unknown", () => {
    expect(detectedToCode("klingon")).toBeNull();
    expect(detectedToCode(null)).toBeNull();
  });
});

describe("effectiveSourceCode", () => {
  it("prefers whisper detection over user pick", () => {
    expect(effectiveSourceCode("en", "el")).toBe("en");
    expect(effectiveSourceCode("english", "el")).toBe("en");
  });

  it("falls back to user pick when whisper unknown", () => {
    expect(effectiveSourceCode(null, "el")).toBe("el");
  });

  it("defaults to en when both unknown", () => {
    expect(effectiveSourceCode(null, "auto")).toBe("en");
    expect(effectiveSourceCode(undefined, undefined)).toBe("en");
  });
});
