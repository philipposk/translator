import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/user";
import { isValidLang } from "@/lib/langs";
import { transcribe, transcribeBilingual, friendlyTranscribeError } from "@/lib/transcribe";
import { overQuota, meter } from "@/lib/usage";
import { rateLimit } from "@/lib/ratelimit";

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

  if (!(await rateLimit(`stt:${userId}`, 30, 60_000))) {
    return NextResponse.json({ error: "Too many speech requests. Slow down." }, { status: 429 });
  }

  if (await overQuota(userId)) {
    return NextResponse.json({ error: "Monthly transcription limit reached." }, { status: 429 });
  }

  const lang = req.nextUrl.searchParams.get("lang") || undefined;
  const langsParam = req.nextUrl.searchParams.get("langs");
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "No audio" }, { status: 400 });
  }

  try {
    let tr;
    if (langsParam) {
      const [langA, langB] = langsParam.split(",").map((s) => s.trim());
      if (!langA || !langB || !isValidLang(langA) || !isValidLang(langB) || langA === langB) {
        return NextResponse.json({ error: "Invalid langs pair" }, { status: 400 });
      }
      tr = await transcribeBilingual(audio, "chunk.webm", langA, langB);
    } else {
      tr = await transcribe(audio, "chunk.webm", lang);
    }
    if (tr.duration) await meter(userId, tr.duration);
    return NextResponse.json({ text: tr.text.trim(), language: tr.language ?? null });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: friendlyTranscribeError(raw) }, { status: 502 });
  }
}
