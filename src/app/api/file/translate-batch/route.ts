import { NextRequest, NextResponse } from "next/server";
import { adminClient, JOBS_TABLE } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/supabase/user";
import { translateText } from "@/lib/translate";
import { isValidLang } from "@/lib/langs";
import { meterChars, overCharsQuota } from "@/lib/usage";
import type { FileSegment } from "@/lib/file-job";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_BATCH = 8;
const MAX_BATCH = 15;

// Step 2 of split file pipeline: translate a batch of segments (repeat until done).
// POST { id, target_lang, offset?, limit? } -> { id, segments, done, next_offset, detected_lang? }
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const target = String(body.target_lang || "");
  const offset = Math.max(0, Number(body.offset ?? 0));
  const limit = Math.min(MAX_BATCH, Math.max(1, Number(body.limit ?? DEFAULT_BATCH)));

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (!isValidLang(target)) return NextResponse.json({ error: "Invalid target language" }, { status: 400 });

  if (await overCharsQuota(userId)) {
    return NextResponse.json({ error: "Monthly translation character limit reached." }, { status: 429 });
  }

  const db = adminClient();
  const got = await db.from(JOBS_TABLE).select("*").eq("id", id).single();
  if (got.error || !got.data) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (got.data.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const job = got.data;

  if (job.status === "done") {
    return NextResponse.json({
      id,
      segments: job.segments ?? [],
      done: true,
      next_offset: 0,
      detected_lang: job.source_lang ?? null,
    });
  }

  if (!["transcribed", "translating"].includes(job.status)) {
    return NextResponse.json({ error: "Transcribe this file first." }, { status: 400 });
  }

  const segments: FileSegment[] = Array.isArray(job.segments) ? [...job.segments] : [];
  const sourceLang = String(job.source_lang || "en");
  const batch = segments.slice(offset, offset + limit);

  if (batch.length === 0) {
    const targetText = segments.map((s) => s.translation).join(" ").trim();
    await db.from(JOBS_TABLE).update({
      status: "done",
      target_lang: target,
      target_text: targetText,
      segments,
    }).eq("id", id);
    return NextResponse.json({ id, segments, done: true, next_offset: offset, detected_lang: sourceLang });
  }

  try {
    await db.from(JOBS_TABLE).update({ status: "translating", target_lang: target }).eq("id", id);

    let charCount = 0;
    for (let i = 0; i < batch.length; i++) {
      const globalIdx = offset + i;
      const seg = batch[i];
      if (!seg.text.trim()) continue;
      const r = await translateText(seg.text, target, { sourceLang, mode: "document" });
      segments[globalIdx] = { ...seg, translation: r.translation };
      charCount += seg.text.length;
    }

    const nextOffset = offset + batch.length;
    const done = nextOffset >= segments.length;
    let targetText = segments.map((s) => s.translation).join(" ").trim();

    if (done && !targetText && job.source_text) {
      const r = await translateText(String(job.source_text), target, { sourceLang, mode: "document" });
      targetText = r.translation;
      charCount += String(job.source_text).length;
    }

    await db.from(JOBS_TABLE).update({
      status: done ? "done" : "translating",
      target_lang: target,
      target_text: done ? targetText : job.target_text,
      segments,
    }).eq("id", id);

    if (charCount) await meterChars(userId, charCount);

    return NextResponse.json({
      id,
      segments,
      done,
      next_offset: done ? segments.length : nextOffset,
      detected_lang: sourceLang,
    });
  } catch (e) {
    console.error("translate-batch error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Translation is temporarily unavailable. Try again." }, { status: 502 });
  }
}
