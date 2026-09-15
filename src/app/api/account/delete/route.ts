import { NextRequest, NextResponse } from "next/server";
import { deleteUserAccount } from "@/lib/account";
import { rateLimit } from "@/lib/ratelimit";
import { getUserId } from "@/lib/supabase/user";

export const runtime = "nodejs";

// POST { confirm: "DELETE" } — permanently delete account and all data.
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await rateLimit(`acct-del:${userId}`, 3, 3600_000))) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  if (String(body.confirm || "").trim() !== "DELETE") {
    return NextResponse.json({ error: 'Type DELETE to confirm account deletion.' }, { status: 400 });
  }

  try {
    await deleteUserAccount(userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Account deletion failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
