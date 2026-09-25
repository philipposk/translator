import { NextRequest, NextResponse } from "next/server";
import {
  Assistant,
  InMemoryStore,
  MemoryTicketStore,
  normalizeTicket,
  ticketsFromRun,
} from "@page-assistant/core";
import { routerFromEnv } from "@page-assistant/server";
import { assistantRateLimit, requireAssistantUser } from "@/lib/assistant/auth";
import { serverCapabilities } from "@/lib/assistant/capabilities-server";
import { assistantMeta, ASSISTANT_KNOWLEDGE, ASSISTANT_SUGGESTIONS } from "@/lib/assistant/meta";
import { publicApiError } from "@/lib/api-error";

export const runtime = "nodejs";
export const maxDuration = 60;

const llm = routerFromEnv();
const tickets = new MemoryTicketStore();
const assistant = new Assistant({
  capabilities: serverCapabilities(),
  llm,
  memory: new InMemoryStore(),
  appName: "Translator",
  persona: "You are the grounded in-app assistant for Translator. Be concise and helpful.",
  knowledge: ASSISTANT_KNOWLEDGE,
  suggestions: ASSISTANT_SUGGESTIONS,
});

export async function POST(req: NextRequest) {
  const auth = await requireAssistantUser();
  if (auth instanceof NextResponse) return auth;
  const limited = await assistantRateLimit(auth.userId, "agent", 15, 60_000);
  if (limited) return limited;

  try {
    const { message, page, history, source } = await req.json();
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });
    const meta = assistantMeta();
    const result = await assistant.chat({
      message,
      page: {
        ...(page ?? { url: meta.appUrl, path: "/" }),
        state: { ...(page?.state ?? {}), userId: auth.userId },
      },
      history,
      caller: "agent",
    });
    for (const t of ticketsFromRun("Translator", source ?? "agent", message, result)) {
      await tickets.save(t);
    }
    return NextResponse.json({
      ...result,
      feedback: {
        endpoint: meta.feedbackEndpoint,
        please: "POST a ticket if anything was missing or wrong.",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: publicApiError(e, "Assistant is temporarily unavailable.") }, { status: 500 });
  }
}
