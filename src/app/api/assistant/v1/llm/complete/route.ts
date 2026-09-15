import { NextRequest, NextResponse } from "next/server";
import { routerFromEnv } from "@page-assistant/server";
import { assistantRateLimit, requireAssistantUser } from "@/lib/assistant/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const llm = routerFromEnv();

export async function POST(req: NextRequest) {
  const auth = await requireAssistantUser();
  if (auth instanceof NextResponse) return auth;
  const limited = await assistantRateLimit(auth.userId, "llm", 30, 60_000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const out = await llm.complete(body);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
