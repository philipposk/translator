// Transcription layer — Groq Whisper only (cheap, ~$0.04/hr). Ported from the
// transcriber's groqTranscribe. Used by the file-translate route and the live
// Groq-chunk fallback (iOS/Safari, where the Web Speech API is unavailable).

export type Word = { start: number; end: number; word: string };
export type Segment = {
  idx: number;
  start: number;
  end: number;
  text: string;
};
export type Transcription = {
  engine: "groq";
  language?: string;
  duration?: number;
  text: string;
  segments: Segment[];
  words: Word[];
};

export async function transcribe(file: Blob, filename: string, language?: string): Promise<Transcription> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");
  const model = process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo";

  const form = new FormData();
  form.append("file", file, filename);
  form.append("model", model);
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");
  form.append("temperature", "0");
  if (language && language !== "auto") form.append("language", language);

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data: {
    language?: string;
    duration?: number;
    text?: string;
    segments?: { start: number; end: number; text: string }[];
    words?: { start: number; end: number; word: string }[];
  } = await res.json();

  const segments: Segment[] = (data.segments || []).map((s, i) => ({
    idx: i,
    start: s.start,
    end: s.end,
    text: (s.text || "").trim(),
  }));
  const words: Word[] = (data.words || []).map((w) => ({ start: w.start, end: w.end, word: w.word }));

  return {
    engine: "groq",
    language: data.language,
    duration: data.duration,
    text: data.text || "",
    segments,
    words,
  };
}

// Map a raw transcription error to a clean, user-safe message (no provider names / raw JSON).
export function friendlyTranscribeError(raw: string): string {
  const s = (raw || "").toLowerCase();
  if (/quota|credit|insufficient|usage limit|rate limit|429/.test(s))
    return "Transcription is temporarily over its usage limit. Try again later, or use a shorter recording.";
  if (/413|too large|request_too_large|entity too large|file too large|maximum/.test(s))
    return "This file is too large (limit ~25 MB). Try a shorter clip or compress it first.";
  if (/401|403|unauthor|forbidden|invalid api key|api key/.test(s))
    return "The transcription service isn't available right now. Please try again later.";
  if (/timeout|timed out|aborted|network|fetch failed|econn/.test(s))
    return "Transcription took too long and timed out. Try a shorter recording.";
  return "Couldn't transcribe this file. Please try again with a shorter or clearer recording.";
}
