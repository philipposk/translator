import { NextRequest, NextResponse } from "next/server";
import { translateText, type TranslateMode } from "@/lib/translate";
import { getUserId } from "@/lib/supabase/user";
import { isValidLang, isValidSource } from "@/lib/langs";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

// POST { text, source_lang?, target_lang, mode? } -> { translation, engine }
export async function POST(req: NextRequest) {
  // Auth-gated: only signed-in 6x7 users can spend translation credits.
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // Per-user rate limit (defense-in-depth; per-instance).
  if (!rateLimit(`tr:${userId}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests — slow down." }, { status: 429 });
  }

  let body: { text?: string; source_lang?: string; target_lang?: string; mode?: TranslateMode };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text || "").toString();
  const target = (body.target_lang || "").toString();
  const source = body.source_lang ? body.source_lang.toString() : "auto";

  if (!text.trim()) return NextResponse.json({ translation: "", engine: "llm" });
  if (text.length > 20000) return NextResponse.json({ error: "Text too long (max 20000 chars)" }, { status: 413 });
  if (!isValidLang(target)) return NextResponse.json({ error: "Invalid target language" }, { status: 400 });
  if (!isValidSource(source)) return NextResponse.json({ error: "Invalid source language" }, { status: 400 });

  try {
    const result = await translateText(text, target, {
      sourceLang: source,
      mode: body.mode === "caption" ? "caption" : "document",
    });
    return NextResponse.json(result);
  } catch (e) {
    // Don't leak raw provider error bodies to the client.
    console.error("translate error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Translation is temporarily unavailable. Try again." }, { status: 502 });
  }
}
