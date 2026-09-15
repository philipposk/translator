import { NextRequest, NextResponse } from "next/server";
import { MemoryTicketStore, normalizeTicket } from "@page-assistant/core";
import { assistantRateLimit } from "@/lib/assistant/auth";
import { getUserId } from "@/lib/supabase/user";

export const runtime = "nodejs";

const tickets = new MemoryTicketStore();

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  const key = userId ?? req.headers.get("x-forwarded-for") ?? "anon";
  const limited = await assistantRateLimit(key, "feedback", 10, 60_000);
  if (limited) return limited;

  const t = normalizeTicket({ app: "Translator", ...(await req.json().catch(() => ({}))) });
  if ("error" in t) return NextResponse.json(t, { status: 400 });
  await tickets.save(t);
  return NextResponse.json({ ok: true });
}
