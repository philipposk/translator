import { NextResponse } from "next/server";
import { getEngineStatus } from "@/lib/engines";
import { checkMigrationHealth } from "@/lib/migrations-health";
import { getUserId } from "@/lib/supabase/user";
import { getUsage } from "@/lib/usage";

export const runtime = "nodejs";

// GET -> plan, usage, and configured translation/STT engines.
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const [usage, system] = await Promise.all([getUsage(userId), checkMigrationHealth()]);
  return NextResponse.json({ ...usage, engines: getEngineStatus(), system });
}
