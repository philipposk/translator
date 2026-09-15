import { NextRequest, NextResponse } from "next/server";
import { synthesize } from "@page-assistant/server";
import { assistantRateLimit, requireAssistantUser } from "@/lib/assistant/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAssistantUser();
  if (auth instanceof NextResponse) return auth;
  const limited = await assistantRateLimit(auth.userId, "voice", 20, 60_000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const text = body?.text;
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }
    if (text.length > 2000) return NextResponse.json({ error: "text too long (max 2000 chars)" }, { status: 400 });
    const { audio, contentType } = await synthesize(body);
    return new NextResponse(new Uint8Array(audio), { headers: { "content-type": contentType } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
