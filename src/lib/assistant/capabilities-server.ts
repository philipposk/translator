import type { Capability } from "@page-assistant/core";
import { isValidLang, isValidSource } from "@/lib/langs";
import { translateText } from "@/lib/translate";
import { getUsage } from "@/lib/usage";

/** Server-side capabilities for /v1/agent and llm.txt (external agents). */
export function serverCapabilities(): Capability[] {
  return [
    {
      name: "translate_text",
      description: "Translate text between languages.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to translate" },
          source_lang: { type: "string", description: "Source ISO code or auto" },
          target_lang: { type: "string", description: "Target ISO code" },
        },
        required: ["text", "target_lang"],
      },
      tags: ["translation"],
      run: async ({ text, source_lang, target_lang }) => {
        const src = source_lang || "auto";
        const tgt = String(target_lang || "");
        if (!isValidLang(tgt)) throw new Error("Invalid target language");
        if (!isValidSource(src)) throw new Error("Invalid source language");
        return translateText(String(text), tgt, { sourceLang: src, mode: "document" });
      },
      render: (r) => r.translation,
    },
    {
      name: "get_usage",
      description: "Get monthly usage quotas for the authenticated user.",
      parameters: { type: "object", properties: {} },
      tags: ["account"],
      run: async (_args, ctx) => {
        const userId = (ctx.page.state as { userId?: string } | undefined)?.userId;
        if (!userId) throw new Error("Not authenticated");
        return getUsage(userId);
      },
      render: (r) =>
        `Voice/file: ${Math.round(r.usedSeconds / 60)}/${Math.round(r.capSeconds / 60)} min. Chars: ${r.usedChars}/${r.capChars}.`,
    },
  ];
}
