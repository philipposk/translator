import { NextRequest, NextResponse } from "next/server";
import { adminClient, UPLOAD_BUCKET, JOBS_TABLE } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/supabase/user";
import { transcribe, friendlyTranscribeError } from "@/lib/transcribe";
import { detectedToCode, effectiveSourceCode, isValidLang, labelOf } from "@/lib/langs";
import { overQuota, meter } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 60;

import type { FileSegment } from "@/lib/file-job";

// Step 1 of split file pipeline: transcribe only (fits Vercel Hobby 60s limit).
// POST { id, source_lang? } -> { id, segments, detected_lang?, lang_mismatch?, total }
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  if (await overQuota(userId)) {
    return NextResponse.json({ error: "Monthly transcription limit reached." }, { status: 429 });
  }

  const db = adminClient();
  const got = await db.from(JOBS_TABLE).select("*").eq("id", id).single();
  if (got.error || !got.data) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (got.data.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const job = got.data;
  const userSource: string | undefined = body.source_lang || job.source_lang || undefined;

  // Already transcribed or finished — return stored segments.
  if (["transcribed", "translating", "done"].includes(job.status)) {
    const segments = (job.segments as FileSegment[]) ?? [];
    const detected = job.source_lang || detectedToCode(job.language) || null;
    return NextResponse.json({
      id,
      segments,
      detected_lang: detected,
      total: segments.length,
      status: job.status,
    });
  }

  if (job.status === "done") {
    return NextResponse.json({ id, segments: job.segments ?? [], detected_lang: job.source_lang, total: 0 });
  }

  const path: string = job.media_path;
  const dl = await db.storage.from(UPLOAD_BUCKET).download(path);
  if (dl.error || !dl.data) {
    await db.from(JOBS_TABLE).update({ status: "error" }).eq("id", id);
    return NextResponse.json({ error: "Could not read the uploaded file" }, { status: 500 });
  }

  try {
    await db.from(JOBS_TABLE).update({ status: "transcribing" }).eq("id", id);
    const filename = path.split("/").pop() || "audio";
    const tr = await transcribe(dl.data, filename, "auto");

    const detectedLang = effectiveSourceCode(tr.language, userSource);
    let langMismatch: string | null = null;
    const whisperCode = detectedToCode(tr.language);
    if (userSource && userSource !== "auto" && whisperCode && whisperCode !== userSource) {
      langMismatch =
        `Audio detected as ${labelOf(whisperCode)} but you selected ${labelOf(userSource)}. ` +
        `Transcribed using detected language.`;
    }

    const segments: FileSegment[] = tr.segments.map((s) => ({
      idx: s.idx,
      start: s.start,
      end: s.end,
      text: s.text,
      translation: "",
    }));

    await db.from(JOBS_TABLE).update({
      status: "transcribed",
      language: tr.language ?? null,
      source_lang: detectedLang,
      duration: tr.duration ?? null,
      source_text: tr.text,
      segments,
    }).eq("id", id);

    if (tr.duration) await meter(userId, tr.duration);
    await db.storage.from(UPLOAD_BUCKET).remove([path]).then(() => {}, () => {});

    return NextResponse.json({
      id,
      segments,
      detected_lang: detectedLang,
      lang_mismatch: langMismatch,
      total: segments.length,
      status: "transcribed",
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    await db.from(JOBS_TABLE).update({ status: "error" }).eq("id", id);
    return NextResponse.json({ error: friendlyTranscribeError(raw) }, { status: 502 });
  }
}
