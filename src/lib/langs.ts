// Language registry shared across all features.
// code      — our internal id (ISO 639-1, or "auto")
// label     — human name
// speechCode — BCP-47 tag for the Web Speech API (SpeechRecognition.lang)
// ocrCode   — Tesseract.js traineddata code (ISO 639-2/3); null = OCR not supported

export type Lang = {
  code: string;
  label: string;
  speechCode: string;
  ocrCode: string | null;
};

export const LANGUAGES: Lang[] = [
  { code: "auto", label: "Detect language", speechCode: "en-US", ocrCode: null },
  { code: "en", label: "English", speechCode: "en-US", ocrCode: "eng" },
  { code: "el", label: "Greek", speechCode: "el-GR", ocrCode: "ell" },
  { code: "es", label: "Spanish", speechCode: "es-ES", ocrCode: "spa" },
  { code: "fr", label: "French", speechCode: "fr-FR", ocrCode: "fra" },
  { code: "de", label: "German", speechCode: "de-DE", ocrCode: "deu" },
  { code: "it", label: "Italian", speechCode: "it-IT", ocrCode: "ita" },
  { code: "pt", label: "Portuguese", speechCode: "pt-PT", ocrCode: "por" },
  { code: "nl", label: "Dutch", speechCode: "nl-NL", ocrCode: "nld" },
  { code: "da", label: "Danish", speechCode: "da-DK", ocrCode: "dan" },
  { code: "sv", label: "Swedish", speechCode: "sv-SE", ocrCode: "swe" },
  { code: "ru", label: "Russian", speechCode: "ru-RU", ocrCode: "rus" },
  { code: "tr", label: "Turkish", speechCode: "tr-TR", ocrCode: "tur" },
  { code: "ar", label: "Arabic", speechCode: "ar-SA", ocrCode: "ara" },
  { code: "hi", label: "Hindi", speechCode: "hi-IN", ocrCode: "hin" },
  { code: "ja", label: "Japanese", speechCode: "ja-JP", ocrCode: "jpn" },
  { code: "ko", label: "Korean", speechCode: "ko-KR", ocrCode: "kor" },
  { code: "zh", label: "Chinese", speechCode: "zh-CN", ocrCode: "chi_sim" },
];

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]));
const byLabel = new Map(LANGUAGES.map((l) => [l.label.toLowerCase(), l.code]));
const byOcr = new Map(LANGUAGES.filter((l) => l.ocrCode).map((l) => [l.ocrCode!, l.code]));

// ISO 639-3 aliases Whisper / franc may emit
const ISO3_ALIASES: Record<string, string> = {
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
  chi_sim: "zh",
};

// Whisper reports ISO 639-1 ("en"), ISO 639-3 ("ell"), or English name ("english").
// Normalize to our internal code, or null if unrecognized.
export function detectedToCode(detected: string | undefined | null): string | null {
  if (!detected) return null;
  const s = detected.trim().toLowerCase();
  if (byCode.has(s)) return s;
  if (byLabel.has(s)) return byLabel.get(s)!;
  if (byOcr.has(s)) return byOcr.get(s)!;
  if (ISO3_ALIASES[s]) return ISO3_ALIASES[s];
  if (s === "mandarin" || s.startsWith("chinese")) return "zh";
  // DeepL-style uppercase ISO 639-1
  const lower = s.toLowerCase();
  if (byCode.has(lower)) return lower;
  return null;
}

/** Best source code for STT/translation: Whisper detect wins over user picker. */
export function effectiveSourceCode(
  whisperLang: string | undefined | null,
  userSource: string | undefined,
): string {
  const detected = detectedToCode(whisperLang);
  if (detected) return detected;
  if (userSource && userSource !== "auto") return userSource;
  return "en";
}

// Validation — reject anything not in our registry (prevents injection into the
// free-MT URL / prompt and bad Whisper/LLM params).
export function isValidLang(code: string | undefined | null): boolean {
  return !!code && code !== "auto" && byCode.has(code);
}
export function isValidSource(code: string | undefined | null): boolean {
  return !!code && byCode.has(code); // "auto" allowed as a source
}

export function labelOf(code: string): string {
  return byCode.get(code)?.label ?? code;
}

export function speechCodeOf(code: string): string {
  return byCode.get(code)?.speechCode ?? "en-US";
}

export function ocrCodeOf(code: string): string {
  return byCode.get(code)?.ocrCode ?? "eng";
}

// Languages valid as a translation source (includes "auto").
export const SOURCE_LANGS = LANGUAGES;
// Languages valid as a translation target (excludes "auto").
export const TARGET_LANGS = LANGUAGES.filter((l) => l.code !== "auto");
// Languages Tesseract can OCR (excludes "auto" / null ocrCode).
export const OCR_LANGS = LANGUAGES.filter((l) => l.ocrCode);
// Camera source picker: detect + OCR-supported langs.
export const OCR_SOURCE_LANGS = [LANGUAGES[0], ...OCR_LANGS];
