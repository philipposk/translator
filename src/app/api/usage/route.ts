import { NextResponse } from "next/server";
import { getEngineStatus } from "@/lib/engines";
import { getUserId } from "@/lib/supabase/user";
import { getUsage } from "@/lib/usage";

export const runtime = "nodejs";

// GET -> plan, usage, and configured translation/STT engines.
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ ...(await getUsage(userId)), engines: getEngineStatus() });
}
