// Helpers for two-language live conversation (e.g. Greek ↔ English).

import { detectedToCode } from "./langs";

const GREEK_RE = /[\u0370-\u03FF\u1F00-\u1FFF]/;

/** Whisper often hallucinates these on silence or background noise. */
const STT_JUNK = [
  /subtitles?\s*(by|from|autor|wave)/i,
  /υπότιτλοι/i,
  /υποτιτλ/i,
  /autorwave/i,
  /auto\s*wave/i,
  /thank you for watching/i,
  /please subscribe/i,
  /^\s*[\.\s…,!?-]*$/,
];

/** True when the transcript looks like STT noise, not real speech. */
export function isSttHallucination(text: string): boolean {
  const t = text.trim();
  if (!t || t.length < 2) return true;
  return STT_JUNK.some((re) => re.test(t));
}

/**
 * Guess language from the writing system in the transcript.
 * Very reliable for Greek vs English; returns null for short or mixed text.
 */
export function scriptHint(text: string): "el" | "en" | null {
  let greek = 0;
  let latin = 0;
  for (const ch of text) {
    if (GREEK_RE.test(ch)) greek++;
    else if (/[a-zA-Z]/.test(ch)) latin++;
  }
  const total = greek + latin;
  if (total < 3) return null;
  if (greek / total >= 0.4) return "el";
  if (latin / total >= 0.4) return "en";
  return null;
}

export type ConvLangResult = { code: string; speaker: "A" | "B"; method: "script" | "audio" | "alternate" };

/** Score and pick the best of two language-hinted Whisper runs (hands-free bilingual STT). */
export function pickBilingualTranscript(
  candidates: { lang: string; text: string }[],
  langA: string,
  langB: string,
): { text: string; language: string } | null {
  const valid = candidates
    .map((c) => ({ lang: c.lang, text: c.text.trim() }))
    .filter((c) => c.text && !isSttHallucination(c.text));
  if (!valid.length) return null;
  if (valid.length === 1) return { text: valid[0].text, language: valid[0].lang };

  const scored = valid.map((c) => {
    let score = c.text.length;
    const script = scriptHint(c.text);
    if (script && script === c.lang) score += 80;
    else if (script && script !== c.lang) score -= 60;
    // Prefer text that looks like real words over random syllables
    if (/[.!?;,]/.test(c.text)) score += 5;
    return { ...c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  return best.score > 0 ? { text: best.text, language: best.lang } : null;
}

/**
 * Pick speaker side and source language for conversation mode.
 * Prefers script (letters) over Whisper audio detection, and only allows langA/langB.
 */
export function resolveConvLang(
  text: string,
  audioDetected: string | null | undefined,
  langA: string,
  langB: string,
  lastSpeaker: "A" | "B" | null,
): ConvLangResult {
  const pair = new Set([langA, langB]);
  const fromScript = scriptHint(text);
  const fromAudio = detectedToCode(audioDetected);

  // Script beats audio for el/en pairs — Whisper often mis-guesses on short clips.
  let code: string | null = null;
  let method: ConvLangResult["method"] = "audio";

  if (fromScript && pair.has(fromScript)) {
    code = fromScript;
    method = "script";
  } else if (fromAudio && pair.has(fromAudio)) {
    code = fromAudio;
    method = "audio";
  } else if (fromScript) {
    // Script says Greek/English but pair is different langs — still trust script if one matches
    code = pair.has(fromScript) ? fromScript : null;
    if (code) method = "script";
  }

  if (!code) {
    const spk: "A" | "B" = lastSpeaker === "A" ? "B" : lastSpeaker === "B" ? "A" : "A";
    return { code: spk === "A" ? langA : langB, speaker: spk, method: "alternate" };
  }

  const speaker: "A" | "B" = code === langB ? "B" : "A";
  return { code, speaker, method };
}
