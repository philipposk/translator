import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { getUserId } from "@/lib/supabase/user";
import { overSttQuota } from "@/lib/usage";

export const runtime = "nodejs";

/** Mint a short-lived Deepgram token for browser live STT (key never exposed). */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (!(await rateLimit(`live-token:${userId}`, 30, 60_000))) {
    return NextResponse.json({ error: "Too many live session requests." }, { status: 429 });
  }

  if (await overSttQuota(userId)) {
    return NextResponse.json(
      { error: "Monthly transcription limit reached.", code: "quota" },
      { status: 402 },
    );
  }

  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return NextResponse.json({ error: "Deepgram live STT is not configured." }, { status: 503 });

  try {
    const res = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ttl_seconds: 60 }),
    });
    if (!res.ok) {
      console.error("[live-token]", res.status, await res.text());
      return NextResponse.json({ error: "Could not start live transcription." }, { status: 502 });
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
      return NextResponse.json({ error: "Could not start live transcription." }, { status: 502 });
    }
    return NextResponse.json({ token: data.access_token, expires_in: data.expires_in ?? 60 });
  } catch (e) {
    console.error("[live-token]", e);
    return NextResponse.json({ error: "Could not start live transcription." }, { status: 500 });
  }
}
