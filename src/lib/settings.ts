// Client-side user preferences, persisted to localStorage. No server round-trip.

export type LiveMode = "captions" | "conversation";
export type SttEngine = "auto" | "webspeech" | "groq";
export type WorkspaceMode = "live" | "text" | "file" | "camera";

export type Settings = {
  mode: WorkspaceMode;
  sourceLang: string;
  targetLang: string;
  altLang: string; // the other side's language in conversation mode
  liveMode: LiveMode;
  flipSide: boolean; // rotate the top panel 180° for face-to-face seating
  sttEngine: SttEngine;
  convAuto: boolean; // conversation mode: auto-detect spoken language (Whisper) instead of manual side
};

const KEY = "tr_settings";

export const DEFAULTS: Settings = {
  mode: "text",
  sourceLang: "auto",
  targetLang: "en",
  altLang: "es",
  liveMode: "captions",
  flipSide: false,
  sttEngine: "auto",
  convAuto: false,
};

export function getSettings(): Settings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }
  return next;
}
