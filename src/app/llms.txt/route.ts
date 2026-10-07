import { NextResponse } from "next/server";
import { generateLlmTxt } from "@page-assistant/core";
import { serverCapabilities } from "@/lib/assistant/capabilities-server";
import { assistantMeta } from "@/lib/assistant/meta";
import { llmTxtHeaders } from "@/lib/llm-txt";

export const runtime = "nodejs";

/** Alias for /llm.txt (llms.txt convention for AI crawlers). Not a second document. */
export async function GET() {
  const meta = assistantMeta();
  return new NextResponse(generateLlmTxt(meta, serverCapabilities()), {
    headers: {
      ...llmTxtHeaders(),
      "x-robots-tag": "noindex",
    },
  });
}
