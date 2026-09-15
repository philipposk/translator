// Text language detection — API providers first, franc offline fallback, LLM last resort.

import { franc } from "franc";
import { hasLLM, llmJson } from "./llm";
import { LANGUAGES, detectedToCode } from "./langs";

export type DetectResult = {
  code: string;
  confidence: number;
  method: "deepl" | "google" | "libretranslate" | "franc" | "llm";
};

const SUPPORTED = new Set(LANGUAGES.map((l) => l.code).filter((c) => c !== "auto"));

// ISO 639-3 (franc / Tesseract) -> our internal code
const ISO3_TO_CODE: Record<string, string> = {
  eng: "en",
  ell: "el",
  gre: "el",
  spa: "es",
  fra: "fr",
  fre: "fr",
  deu: "de",
  ger: "de",
  ita: "it",
  por: "pt",
  nld: "nl",
  dut: "nl",
  dan: "da",
  swe: "sv",
  rus: "ru",
  tur: "tr",
  ara: "ar",
  hin: "hi",
  jpn: "ja",
  kor: "ko",
  cmn: "zh",
  zho: "zh",
};

for (const l of LANGUAGES) {
  if (l.ocrCode) ISO3_TO_CODE[l.ocrCode] = l.code;
}

export function iso3ToCode(iso3: string | undefined | null): string | null {
  if (!iso3) return null;
  const s = iso3.trim().toLowerCase();
  return ISO3_TO_CODE[s] ?? detectedToCode(s);
}

function francDetect(text: string): DetectResult | null {
  const sample = text.trim().slice(0, 2000);
  if (sample.length < 10) return null;
  const iso3 = franc(sample, { minLength: 10 });
  if (!iso3 || iso3 === "und") return null;
  const code = iso3ToCode(iso3);
  if (!code || !SUPPORTED.has(code)) return null;
  return { code, confidence: 0.7, method: "franc" };
}

async function deeplDetect(text: string): Promise<DetectResult | null> {
  const key = process.env.DEEPL_API_KEY;
  if (!key) return null;
  const base = key.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
  const res = await fetch(`${base}/v2/detect`, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 5000) }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return null;
  const data: { detections?: { language: string; confidence: number }[][] } = await res.json();
  const hit = data.detections?.[0]?.[0];
  if (!hit) return null;
  const code = detectedToCode(hit.language.toLowerCase()) ?? detectedToCode(hit.language);
  if (!code || !SUPPORTED.has(code)) return null;
  return { code, confidence: hit.confidence ?? 0.9, method: "deepl" };
}

async function googleDetect(text: string): Promise<DetectResult | null> {
  const key = process.env.GOOGLE_CLOUD_TRANSLATE_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2/detect?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text.slice(0, 5000) }),
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!res.ok) return null;
  const data: { data?: { detections?: { language: string; confidence: number }[] } } = await res.json();
  const hit = data.data?.detections?.[0];
  if (!hit) return null;
  const code = detectedToCode(hit.language);
  if (!code || !SUPPORTED.has(code)) return null;
  return { code, confidence: hit.confidence ?? 0.9, method: "google" };
}

async function libreDetect(text: string): Promise<DetectResult | null> {
  const base = process.env.LIBRETRANSLATE_URL;
  if (!base) return null;
  const res = await fetch(`${base.replace(/\/$/, "")}/detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text.slice(0, 5000) }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return null;
  const data: { language?: { language: string; confidence: number }[] } = await res.json();
  const hit = data.language?.[0];
  if (!hit) return null;
  const code = detectedToCode(hit.language);
  if (!code || !SUPPORTED.has(code)) return null;
  return { code, confidence: hit.confidence ?? 0.8, method: "libretranslate" };
}

async function llmDetect(text: string): Promise<DetectResult | null> {
  if (!hasLLM()) return null;
  try {
    const out = await llmJson<{ language?: string; confidence?: number }>(
      `Detect the language of the user's text. Reply JSON only: {"language":"<iso639-1 code>","confidence":0.0-1.0}. ` +
        `Use one of: ${[...SUPPORTED].join(", ")}.`,
      text.slice(0, 2000),
    );
    const code = detectedToCode(out.language || "");
    if (!code || !SUPPORTED.has(code)) return null;
    return { code, confidence: Math.min(1, Math.max(0, Number(out.confidence) || 0.75)), method: "llm" };
  } catch {
    return null;
  }
}

/** Detect language of plain text. Returns null when uncertain. */
export async function detectTextLanguage(text: string): Promise<DetectResult | null> {
  const clean = (text || "").trim();
  if (clean.length < 3) return null;

  for (const fn of [deeplDetect, googleDetect, libreDetect]) {
    const r = await fn(clean);
    if (r) return r;
  }

  const offline = francDetect(clean);
  if (offline) return offline;

  return llmDetect(clean);
}

/** Resolve "auto" to a concrete source code, or return explicit source unchanged. */
export async function resolveSourceLang(
  sourceLang: string | undefined,
  text: string,
): Promise<{ source: string; detected: DetectResult | null }> {
  if (sourceLang && sourceLang !== "auto") {
    return { source: sourceLang, detected: null };
  }
  const detected = await detectTextLanguage(text);
  if (detected) return { source: detected.code, detected };
  return { source: "en", detected: null };
}
