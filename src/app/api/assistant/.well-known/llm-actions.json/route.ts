import { NextResponse } from "next/server";
import { llmActionsPayload } from "@/lib/assistant/discovery";

export const runtime = "nodejs";

/** Same manifest as `/.well-known/llm-actions.json` — widget discovery uses serverUrl-relative path. */
export async function GET() {
  return NextResponse.json(llmActionsPayload());
}
