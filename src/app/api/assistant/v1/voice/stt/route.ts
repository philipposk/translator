import { NextRequest, NextResponse } from "next/server";
import { transcribe as groqTranscribe } from "@/lib/transcribe";
import { transcribe as openaiTranscribe } from "@page-assistant/server";
import { assistantRateLimit, requireAssistantUser } from "@/lib/assistant/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/** STT for the page assistant — uses Groq Whisper when configured, else OpenAI via page-assistant server. */
export async function POST(req: NextRequest) {
  const auth = await requireAssistantUser();
  if (auth instanceof NextResponse) return auth;
  const limited = await assistantRateLimit(auth.userId, "voice", 20, 60_000);
  if (limited) return limited;

  try {
    const buf = Buffer.from(await req.arrayBuffer());
    if (!buf.length) return NextResponse.json({ error: "audio body required" }, { status: 400 });

    if (process.env.GROQ_API_KEY) {
      const file = new File([buf], "audio.webm", { type: "audio/webm" });
      const tr = await groqTranscribe(file, "audio.webm");
      return NextResponse.json({ text: tr.text || "" });
    }

    const text = await openaiTranscribe(buf, "audio.webm");
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
