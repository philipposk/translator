import { NextRequest, NextResponse } from "next/server";
import { detectTextLanguage } from "@/lib/detect";
import { getUserId } from "@/lib/supabase/user";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

// POST { text } -> { code, confidence, method } | { code: null }
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (!(await rateLimit(`det:${userId}`, 120, 60_000))) {
    return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text || "").toString().trim();
  if (!text) return NextResponse.json({ code: null });
  if (text.length > 5000) return NextResponse.json({ error: "Text too long (max 5000 chars)" }, { status: 413 });

  const result = await detectTextLanguage(text);
  if (!result) return NextResponse.json({ code: null });
  return NextResponse.json(result);
}
