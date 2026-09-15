import { NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/user";
import { rateLimit } from "@/lib/ratelimit";

export async function requireAssistantUser(): Promise<{ userId: string } | NextResponse> {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return { userId };
}

export async function assistantRateLimit(userId: string, bucket: string, limit: number, windowMs: number) {
  const ok = await rateLimit(`pa:${bucket}:${userId}`, limit, windowMs);
  if (!ok) return NextResponse.json({ error: "Too many assistant requests" }, { status: 429 });
  return null;
}
