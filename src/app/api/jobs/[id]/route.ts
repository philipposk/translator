import { NextRequest, NextResponse } from "next/server";
import { adminClient, JOBS_TABLE } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/supabase/user";

export const runtime = "nodejs";

// GET a single job — owner only.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const db = adminClient();
  const got = await db.from(JOBS_TABLE).select("*").eq("id", id).single();
  if (got.error || !got.data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (got.data.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Never expose the storage path of the raw media.
  const { media_path, ...job } = got.data;
  void media_path;
  return NextResponse.json({ job });
}
