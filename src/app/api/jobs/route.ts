import { NextResponse } from "next/server";
import { adminClient, JOBS_TABLE } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/supabase/user";

export const runtime = "nodejs";

// GET -> the signed-in user's recent translations (history list).
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const db = adminClient();
  const { data, error } = await db
    .from(JOBS_TABLE)
    .select("id, kind, status, source_lang, target_lang, source_text, target_text, source_name, duration, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data || [] });
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
