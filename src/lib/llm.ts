// Generic OpenAI-compatible LLM call (OpenRouter primary, OpenAI fallback).
// Ported from the transcriber. Used as the translation brain in translate.ts.

const REFERER = "https://translator.6x7.gr";
const TITLE = "Translator";

type Provider = { baseURL: string; apiKey: string; model: string };

// Returns the configured providers in priority order. `kind` picks the model env var.
export function providers(kind: "chat" = "chat"): Provider[] {
  void kind;
  const out: Provider[] = [];
  const or = process.env.OPENROUTER_API_KEY;
  const oa = process.env.OPENAI_API_KEY;
  if (or) {
    out.push({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: or,
      model: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
    });
  }
  if (oa) {
    out.push({
      baseURL: "https://api.openai.com/v1",
      apiKey: oa,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
  }
  return out;
}

export function hasLLM(): boolean {
  return providers().length > 0;
}

// Low-level call. jsonMode=true forces a JSON object response.
async function callOnce(
  p: Provider,
  system: string,
  user: string,
  jsonMode: boolean,
): Promise<string> {
  const body: Record<string, unknown> = {
    model: p.model,
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  const res = await fetch(`${p.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${p.apiKey}`,
      "HTTP-Referer": REFERER,
      "X-Title": TITLE,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`LLM call failed (${res.status}): ${txt.slice(0, 300)}`);
  }
  const data: { choices?: { message?: { content?: string } }[] } = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// Plain-text completion with provider fallback. Returns "" if no provider configured.
export async function llmText(system: string, user: string): Promise<string> {
  let lastErr: unknown;
  for (const p of providers()) {
    try {
      const out = await callOnce(p, system, user, false);
      if (out) return out;
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) throw lastErr;
  return "";
}

// JSON completion with provider fallback.
export async function llmJson<T = unknown>(system: string, user: string): Promise<T> {
  let lastErr: unknown;
  for (const p of providers()) {
    try {
      const out = await callOnce(p, system, user, true);
      if (out) return parseJson<T>(out);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("No LLM provider configured");
}

// Tolerant JSON parse (strips code fences / leading prose the model sometimes adds).
export function parseJson<T = unknown>(raw: string): T {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const a = trimmed.indexOf("{");
    const b = trimmed.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(trimmed.slice(a, b + 1)) as T;
    throw new Error("Could not parse LLM JSON output");
  }
}
