import { NextRequest, NextResponse } from "next/server";
import { adminClient, JOBS_TABLE } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/supabase/user";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// GET -> the signed-in user's recent translations (history list).
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(req.nextUrl.searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
  );
  const cursor = req.nextUrl.searchParams.get("cursor");

  const db = adminClient();
  let query = db
    .from(JOBS_TABLE)
    .select("id, kind, status, source_lang, target_lang, source_text, target_text, source_name, duration, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data || [];
  const hasMore = rows.length > limit;
  const jobs = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && jobs.length ? jobs[jobs.length - 1].created_at : null;

  return NextResponse.json({ jobs, nextCursor, hasMore });
}

// DELETE -> clear ALL of the user's history.
export async function DELETE() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const db = adminClient();
  const { error } = await db.from(JOBS_TABLE).delete().eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
