import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Deprecated — use /api/file/transcribe + /api/file/translate-batch (split pipeline for Vercel Hobby).
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error:
        "This endpoint is deprecated. The app now uses /api/file/transcribe and /api/file/translate-batch.",
    },
    { status: 410 },
  );
}
