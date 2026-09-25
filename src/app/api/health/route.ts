import { NextResponse } from "next/server";
import { checkMigrationHealth } from "@/lib/migrations-health";

export const runtime = "nodejs";

/** Public health + migration probe for ops and in-app warnings. */
export async function GET() {
  const system = await checkMigrationHealth();
  return NextResponse.json({
    ok: system.ok,
    system,
    site: process.env.NEXT_PUBLIC_SITE_URL || null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
  });
}
