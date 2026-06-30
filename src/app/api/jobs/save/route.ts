import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { adminClient, JOBS_TABLE } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/supabase/user";
import { isValidLang, isValidSource } from "@/lib/langs";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

// Save a finished translation (text / image / live) to the user's history.
// POST { kind, source_lang, target_lang, source_text, target_text, segments? } -> { id }
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!rateLimit(`save:${userId}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const kind = ["text", "image", "live"].includes(String(body.kind)) ? String(body.kind) : "text";
  const source = body.source_lang ? String(body.source_lang) : "auto";
  const target = String(body.target_lang || "");
  const sourceText = String(body.source_text || "").slice(0, 20000);
  const targetText = String(body.target_text || "").slice(0, 20000);

  if (!isValidLang(target)) return NextResponse.json({ error: "Invalid target language" }, { status: 400 });
  if (!isValidSource(source)) return NextResponse.json({ error: "Invalid source language" }, { status: 400 });
  if (!sourceText.trim() && !targetText.trim()) return NextResponse.json({ error: "Nothing to save" }, { status: 400 });

  const id = randomUUID();
  const db = adminClient();
  const { error } = await db.from(JOBS_TABLE).insert({
    id,
    user_id: userId,
    kind,
    status: "done",
    source_lang: source,
    target_lang: target,
    source_text: sourceText,
    target_text: targetText,
    segments: Array.isArray(body.segments) ? body.segments.slice(0, 1000) : [],
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id });
}
