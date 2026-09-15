import { NextResponse } from "next/server";
import { generateLlmTxt } from "@page-assistant/core";
import { serverCapabilities } from "@/lib/assistant/capabilities-server";
import { assistantMeta } from "@/lib/assistant/meta";

export const runtime = "nodejs";

export async function GET() {
  const meta = assistantMeta();
  return new NextResponse(generateLlmTxt(meta, serverCapabilities()), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
