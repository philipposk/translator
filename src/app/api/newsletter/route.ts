import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const TABLE = "translator_newsletter";

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
}

/** POST { email } — store newsletter signup (same pattern as other 6x7 apps). */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`newsletter:${ip}`, 8, 60_000))) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  if (!validEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const db = adminClient();
    const { error } = await db.from(TABLE).upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
    if (error) {
      console.error("[newsletter]", error.message);
      return NextResponse.json({ error: "Could not save signup. Try again later." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[newsletter]", e);
    return NextResponse.json({ error: "Newsletter signup is temporarily unavailable." }, { status: 503 });
  }
}
