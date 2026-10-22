import { NextRequest, NextResponse } from "next/server";
import { routerFromEnv } from "@page-assistant/server";
import { assistantRateLimit, requireAssistantUser } from "@/lib/assistant/auth";
import { publicApiError } from "@/lib/api-error";

export const runtime = "nodejs";
export const maxDuration = 60;

// Built lazily so a missing LLM key fails the request, not `next build`.
let _llm: ReturnType<typeof routerFromEnv> | undefined;

export async function POST(req: NextRequest) {
  const auth = await requireAssistantUser();
  if (auth instanceof NextResponse) return auth;
  const limited = await assistantRateLimit(auth.userId, "llm", 30, 60_000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const out = await (_llm ??= routerFromEnv()).complete(body);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: publicApiError(e, "Assistant is temporarily unavailable.") }, { status: 502 });
  }
}
