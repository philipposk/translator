import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { adminClient, UPLOAD_BUCKET, JOBS_TABLE } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/supabase/user";
import { isValidLang, isValidSource } from "@/lib/langs";

export const runtime = "nodejs";

const MAX_ACTIVE_JOBS = 3;

// Create a job row + hand back a signed upload URL so the browser uploads the media
// straight to Supabase Storage (bypassing the serverless request-body size limit).
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const kind = ["file", "image"].includes(String(body.kind)) ? String(body.kind) : "file";
  const ext = String(body.ext || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const sourceLang = body.source_lang ? String(body.source_lang) : null;
  const targetLang = body.target_lang ? String(body.target_lang) : null;
  const sourceName = body.source_name ? String(body.source_name).slice(0, 200) : null;

  if (sourceLang && !isValidSource(sourceLang)) return NextResponse.json({ error: "Invalid source language" }, { status: 400 });
  if (targetLang && !isValidLang(targetLang)) return NextResponse.json({ error: "Invalid target language" }, { status: 400 });

  const db = adminClient();

  // Cap concurrent in-flight jobs per user (abuse / runaway guard).
  const active = await db
    .from(JOBS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["uploading", "transcribing", "translating"]);
  if ((active.count ?? 0) >= MAX_ACTIVE_JOBS) {
    return NextResponse.json({ error: "Too many jobs in progress — wait for them to finish." }, { status: 429 });
  }

  const id = randomUUID();
  const path = `${id}/source.${ext}`;

  const created = await db.from(JOBS_TABLE).insert({
    id,
    user_id: userId,
    kind,
    status: "uploading",
    source_lang: sourceLang,
    target_lang: targetLang,
    source_name: sourceName,
    media_path: path,
  });
  if (created.error) return NextResponse.json({ error: created.error.message }, { status: 500 });

  const signed = await db.storage.from(UPLOAD_BUCKET).createSignedUploadUrl(path);
  if (signed.error) {
    await db.from(JOBS_TABLE).update({ status: "error" }).eq("id", id);
    return NextResponse.json({ error: signed.error.message }, { status: 500 });
  }

  return NextResponse.json({ id, path, token: signed.data.token });
}
