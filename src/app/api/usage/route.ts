import { NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/user";
import { getUsage } from "@/lib/usage";

export const runtime = "nodejs";

// GET -> the signed-in user's plan + this month's transcription usage.
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json(await getUsage(userId));
}
