import { NextResponse } from "next/server";
import { llmActionsPayload } from "@/lib/assistant/discovery";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(llmActionsPayload());
}
