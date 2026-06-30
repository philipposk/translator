import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/user";
import { transcribe, friendlyTranscribeError } from "@/lib/transcribe";
import { overQuota, meter } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 60;

// Live fallback for browsers without the Web Speech API (iOS Safari, Firefox)
// AND the auto-detect path for conversation mode. Accepts a few-seconds audio
// Blob, returns its transcript + the language Whisper detected. Omit ?lang= to
// let Whisper auto-detect (used by conversation auto-detect mode).
// POST multipart { audio } ?lang= -> { text, language }
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (await overQuota(userId)) {
    return NextResponse.json({ error: "Monthly transcription limit reached." }, { status: 429 });
  }

  const lang = req.nextUrl.searchParams.get("lang") || undefined;
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "No audio" }, { status: 400 });
  }

  try {
    const tr = await transcribe(audio, "chunk.webm", lang);
    if (tr.duration) await meter(userId, tr.duration);
    return NextResponse.json({ text: tr.text.trim(), language: tr.language ?? null });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: friendlyTranscribeError(raw) }, { status: 502 });
  }
}
