// The translation brain. LLM-first (cheap Gemini Flash via OpenRouter), with a
// free machine-translation fallback (MyMemory / LibreTranslate) so text translation
// still works with no LLM key. Keeps an hour of live captions well under $0.50.

import { hasLLM, llmText } from "./llm";
import { labelOf } from "./langs";
import type { Segment } from "./transcribe";

export type TranslateMode = "caption" | "document";

export type TranslateResult = {
  translation: string;
  engine: "llm" | "mymemory" | "libretranslate";
};

function systemPrompt(targetLang: string, sourceLang: string | undefined, mode: TranslateMode): string {
  const target = labelOf(targetLang);
  const from = sourceLang && sourceLang !== "auto" ? ` from ${labelOf(sourceLang)}` : "";
  const register =
    mode === "caption"
      ? " This is live spoken speech: keep it natural and terse, spoken register, no added punctuation drama."
      : " Preserve paragraph breaks, formatting and meaning faithfully.";
  return (
    `You are a professional translator. Translate the user's text${from} into ${target}.` +
    register +
    ` Keep names, numbers, URLs and code unchanged. Output ONLY the translation — no notes, no quotes, no explanations.` +
    ` If the text is already in ${target}, return it unchanged.`
  );
}

// --- free MT fallbacks (no key needed) ---

async function myMemoryTranslate(text: string, source: string, target: string): Promise<string> {
  const src = source && source !== "auto" ? source : "en";
  const url =
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}` +
    `&langpair=${encodeURIComponent(src)}|${encodeURIComponent(target)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`MyMemory failed (${res.status})`);
  const data: { responseData?: { translatedText?: string } } = await res.json();
  const out = data.responseData?.translatedText;
  if (!out) throw new Error("MyMemory returned no translation");
  return out;
}

async function libreTranslate(text: string, source: string, target: string): Promise<string> {
  const base = process.env.LIBRETRANSLATE_URL;
  if (!base) throw new Error("LIBRETRANSLATE_URL not set");
  const res = await fetch(`${base.replace(/\/$/, "")}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: source === "auto" ? "auto" : source, target, format: "text" }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`LibreTranslate failed (${res.status})`);
  const data: { translatedText?: string } = await res.json();
  if (!data.translatedText) throw new Error("LibreTranslate returned no translation");
  return data.translatedText;
}

async function freeMtTranslate(text: string, source: string, target: string): Promise<TranslateResult> {
  if (process.env.LIBRETRANSLATE_URL) {
    try {
      return { translation: await libreTranslate(text, source, target), engine: "libretranslate" };
    } catch {
      /* fall through to MyMemory */
    }
  }
  return { translation: await myMemoryTranslate(text, source, target), engine: "mymemory" };
}

// Translate a single string.
export async function translateText(
  text: string,
  targetLang: string,
  opts: { sourceLang?: string; mode?: TranslateMode } = {},
): Promise<TranslateResult> {
  const clean = (text || "").trim();
  if (!clean) return { translation: "", engine: "llm" };
  const mode = opts.mode ?? "document";

  if (hasLLM()) {
    try {
      const out = await llmText(systemPrompt(targetLang, opts.sourceLang, mode), clean);
      if (out.trim()) return { translation: out.trim(), engine: "llm" };
    } catch {
      /* fall back to free MT */
    }
  }
  return freeMtTranslate(clean, opts.sourceLang || "auto", targetLang);
}

// Translate many segments with bounded concurrency (ported pattern from the
// transcriber's cleanTranscript: small batches, capped pool, fits the serverless limit).
export async function translateSegments(
  segments: Segment[],
  targetLang: string,
  sourceLang?: string,
): Promise<string[]> {
  const POOL = 6;
  const out: string[] = new Array(segments.length).fill("");
  let next = 0;

  async function worker() {
    while (next < segments.length) {
      const i = next++;
      const seg = segments[i];
      try {
        const r = await translateText(seg.text, targetLang, { sourceLang, mode: "document" });
        out[i] = r.translation;
      } catch {
        out[i] = "";
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(POOL, segments.length) }, worker));
  return out;
}
