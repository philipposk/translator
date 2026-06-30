import { NextRequest, NextResponse } from "next/server";
import { adminClient, UPLOAD_BUCKET, JOBS_TABLE } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/supabase/user";
import { transcribe, friendlyTranscribeError } from "@/lib/transcribe";
import { translateSegments, translateText } from "@/lib/translate";
import { isValidLang } from "@/lib/langs";
import { overQuota, meter } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 300;

type ProcSegment = {
  idx: number;
  start: number;
  end: number;
  text: string;
  translation: string;
};

// Read the uploaded media from storage, transcribe (Groq Whisper), translate every
// segment, and persist the result on the job row.
// POST { id, source_lang?, target_lang } -> { id }
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const target = String(body.target_lang || "");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (!isValidLang(target)) return NextResponse.json({ error: "Invalid target language" }, { status: 400 });

  // Enforce the monthly STT quota before spending on Groq.
  if (await overQuota(userId)) {
    return NextResponse.json({ error: "Monthly transcription limit reached." }, { status: 429 });
  }

  const db = adminClient();
  const got = await db.from(JOBS_TABLE).select("*").eq("id", id).single();
  if (got.error || !got.data) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (got.data.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Idempotent: don't re-bill an already-finished job.
  if (got.data.status === "done") return NextResponse.json({ id });

  const sourceLang: string | undefined = body.source_lang || got.data.source_lang || undefined;
  const path: string = got.data.media_path;

  // 1) download the media
  const dl = await db.storage.from(UPLOAD_BUCKET).download(path);
  if (dl.error || !dl.data) {
    await db.from(JOBS_TABLE).update({ status: "error" }).eq("id", id);
    return NextResponse.json({ error: "Could not read the uploaded file" }, { status: 500 });
  }

  try {
    await db.from(JOBS_TABLE).update({ status: "transcribing" }).eq("id", id);
    const filename = path.split("/").pop() || "audio";
    const tr = await transcribe(dl.data, filename, sourceLang);

    await db.from(JOBS_TABLE).update({ status: "translating" }).eq("id", id);
    const translations = tr.segments.length
      ? await translateSegments(tr.segments, target, tr.language || sourceLang)
      : [];

    const segments: ProcSegment[] = tr.segments.map((s, i) => ({
      idx: s.idx,
      start: s.start,
      end: s.end,
      text: s.text,
      // TODO Phase 2: tone — attach per-segment prosody/emotion here.
      translation: translations[i] || "",
    }));

    const targetText = segments.map((s) => s.translation).join(" ").trim()
      || (await translateText(tr.text, target, { sourceLang })).translation;

    await db.from(JOBS_TABLE).update({
      status: "done",
      language: tr.language ?? null,
      duration: tr.duration ?? null,
      source_text: tr.text,
      target_text: targetText,
      target_lang: target,
      segments,
    }).eq("id", id);

    // meter usage (seconds of audio) and delete the source media — we keep only
    // the transcript/translation, not the user's raw recording.
    if (tr.duration) await meter(userId, tr.duration);
    await db.storage.from(UPLOAD_BUCKET).remove([path]).then(() => {}, () => {});

    return NextResponse.json({ id, segments });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    await db.from(JOBS_TABLE).update({ status: "error" }).eq("id", id);
    return NextResponse.json({ error: friendlyTranscribeError(raw) }, { status: 502 });
  }
}
