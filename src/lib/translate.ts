// Translation brain — tiered engines (DeepL / Google / LLM / LibreTranslate / MyMemory).
// Detect-before-translate when source is "auto".

import { resolveSourceLang } from "./detect";
import { hasLLM, llmText } from "./llm";
import { labelOf } from "./langs";
import type { Segment } from "./transcribe";

export type TranslateMode = "caption" | "document";
export type TranslateEngine = "deepl" | "google" | "llm" | "libretranslate" | "mymemory";

export type TranslateResult = {
  translation: string;
  engine: TranslateEngine;
  detected_source_lang?: string | null;
};

type EnginePref = "auto" | TranslateEngine;

function enginePref(): EnginePref {
  const v = (process.env.TRANSLATION_ENGINE || "auto").toLowerCase();
  if (v === "deepl" || v === "google" || v === "llm" || v === "libretranslate" || v === "mymemory") return v;
  return "auto";
}

function systemPrompt(targetLang: string, sourceLang: string, mode: TranslateMode): string {
  const target = labelOf(targetLang);
  const from = labelOf(sourceLang);
  const register =
    mode === "caption"
      ? " This is live spoken speech: keep it natural and terse, spoken register, no added punctuation drama."
      : " Preserve paragraph breaks, formatting and meaning faithfully.";
  return (
    `You are a professional translator. Translate the user's text from ${from} into ${target}.` +
    register +
    ` Keep names, numbers, URLs and code unchanged. Output ONLY the translation — no notes, no quotes, no explanations.` +
    ` If the text is already in ${target}, return it unchanged.`
  );
}

// --- DeepL ---

const DEEPL_TARGET: Record<string, string> = {
  en: "EN", el: "EL", es: "ES", fr: "FR", de: "DE", it: "IT", pt: "PT-PT",
  nl: "NL", da: "DA", sv: "SV", ru: "RU", tr: "TR", ar: "AR", hi: "HI",
  ja: "JA", ko: "KO", zh: "ZH",
};
const DEEPL_SOURCE: Record<string, string> = {
  en: "EN", el: "EL", es: "ES", fr: "FR", de: "DE", it: "IT", pt: "PT",
  nl: "NL", da: "DA", sv: "SV", ru: "RU", tr: "TR", ar: "AR", hi: "HI",
  ja: "JA", ko: "KO", zh: "ZH",
};

async function deeplTranslate(text: string, source: string, target: string): Promise<string> {
  const key = process.env.DEEPL_API_KEY;
  if (!key) throw new Error("DEEPL_API_KEY not set");
  const base = key.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
  const tgt = DEEPL_TARGET[target];
  const src = DEEPL_SOURCE[source];
  if (!tgt) throw new Error(`DeepL unsupported target: ${target}`);
  const body = new URLSearchParams({ text, target_lang: tgt });
  if (src) body.set("source_lang", src);
  const res = await fetch(`${base}/v2/translate`, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`DeepL failed (${res.status})`);
  const data: { translations?: { text: string }[] } = await res.json();
  const out = data.translations?.[0]?.text;
  if (!out) throw new Error("DeepL returned no translation");
  return out;
}

// --- Google Cloud Translation ---

async function googleTranslate(text: string, source: string, target: string): Promise<string> {
  const key = process.env.GOOGLE_CLOUD_TRANSLATE_KEY;
  if (!key) throw new Error("GOOGLE_CLOUD_TRANSLATE_KEY not set");
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source, target, format: "text" }),
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!res.ok) throw new Error(`Google Translate failed (${res.status})`);
  const data: { data?: { translations?: { translatedText: string }[] } } = await res.json();
  const out = data.data?.translations?.[0]?.translatedText;
  if (!out) throw new Error("Google Translate returned no translation");
  return out;
}

// --- free MT fallbacks ---

async function myMemoryTranslate(text: string, source: string, target: string): Promise<string> {
  if (!source || source === "auto") {
    throw new Error("Cannot translate with auto source on MyMemory — language detection required");
  }
  const url =
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}` +
    `&langpair=${encodeURIComponent(source)}|${encodeURIComponent(target)}`;
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

async function llmTranslate(text: string, source: string, target: string, mode: TranslateMode): Promise<string> {
  const out = await llmText(systemPrompt(target, source, mode), text);
  if (!out.trim()) throw new Error("LLM returned empty translation");
  return out.trim();
}

type EngineFn = (text: string, source: string, target: string, mode: TranslateMode) => Promise<string>;

const ENGINE_ORDER: { id: TranslateEngine; available: () => boolean; run: EngineFn }[] = [
  {
    id: "deepl",
    available: () => !!process.env.DEEPL_API_KEY,
    run: (t, s, tgt) => deeplTranslate(t, s, tgt),
  },
  {
    id: "google",
    available: () => !!process.env.GOOGLE_CLOUD_TRANSLATE_KEY,
    run: (t, s, tgt) => googleTranslate(t, s, tgt),
  },
  {
    id: "llm",
    available: () => hasLLM(),
    run: (t, s, tgt, mode) => llmTranslate(t, s, tgt, mode),
  },
  {
    id: "libretranslate",
    available: () => !!process.env.LIBRETRANSLATE_URL,
    run: (t, s, tgt) => libreTranslate(t, s, tgt),
  },
  {
    id: "mymemory",
    available: () => true,
    run: (t, s, tgt) => myMemoryTranslate(t, s, tgt),
  },
];

function orderedEngines(): typeof ENGINE_ORDER {
  const pref = enginePref();
  if (pref !== "auto") {
    const one = ENGINE_ORDER.find((e) => e.id === pref);
    return one ? [one, ...ENGINE_ORDER.filter((e) => e.id !== pref && e.available())] : ENGINE_ORDER;
  }
  return ENGINE_ORDER;
}

async function runEngines(
  text: string,
  source: string,
  target: string,
  mode: TranslateMode,
): Promise<TranslateResult> {
  let lastErr: unknown;
  for (const eng of orderedEngines()) {
    if (!eng.available()) continue;
    try {
      const translation = await eng.run(text, source, target, mode);
      return { translation, engine: eng.id };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("No translation engine available");
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
  const { source, detected } = await resolveSourceLang(opts.sourceLang || "auto", clean);
  const result = await runEngines(clean, source, targetLang, mode);
  return {
    ...result,
    detected_source_lang: detected?.code ?? (opts.sourceLang === "auto" ? source : opts.sourceLang) ?? null,
  };
}

// Translate many segments with bounded concurrency.
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
      if (!seg.text.trim()) continue;
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
