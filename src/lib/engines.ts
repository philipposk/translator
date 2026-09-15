import { hasLLM } from "./llm";

export type EngineStatus = {
  translation: {
    primary: string;
    available: string[];
    deeplConfigured: boolean;
    googleConfigured: boolean;
  };
  stt: {
    primary: string;
    groqConfigured: boolean;
  };
};

export function getEngineStatus(): EngineStatus {
  const available: string[] = [];
  const deepl = !!process.env.DEEPL_API_KEY;
  const google = !!process.env.GOOGLE_CLOUD_TRANSLATE_KEY;
  const llm = hasLLM();
  const libre = !!process.env.LIBRETRANSLATE_URL;

  if (deepl) available.push("deepl");
  if (google) available.push("google");
  if (llm) available.push("llm");
  if (libre) available.push("libretranslate");
  available.push("mymemory");

  const pref = (process.env.TRANSLATION_ENGINE || "auto").toLowerCase();
  let primary = available[0] || "mymemory";
  if (pref !== "auto" && available.includes(pref)) primary = pref;

  const groq = !!process.env.GROQ_API_KEY;

  return {
    translation: {
      primary,
      available,
      deeplConfigured: deepl,
      googleConfigured: google,
    },
    stt: {
      primary: groq ? "groq-whisper" : "webspeech",
      groqConfigured: groq,
    },
  };
}
