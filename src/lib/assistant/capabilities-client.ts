import type { Capability } from "@page-assistant/core";
import { capability } from "@page-assistant/widget";

/** Capabilities that run in the browser — call Translator APIs and navigate. */
export function clientCapabilities(): Capability[] {
  return [
    capability({
      name: "translate_text",
      description: "Translate text between languages using the Translator API.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to translate" },
          source_lang: { type: "string", description: "Source ISO code or auto" },
          target_lang: { type: "string", description: "Target ISO code e.g. en, el, es" },
        },
        required: ["text", "target_lang"],
      },
      tags: ["translation"],
      run: async ({ text, source_lang, target_lang }) => {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            source_lang: source_lang || "auto",
            target_lang,
            mode: "document",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Translation failed");
        return data as { translation: string; engine?: string; detected_source_lang?: string | null };
      },
      render: (r, a) => {
        const det = r.detected_source_lang ? ` (detected ${r.detected_source_lang})` : "";
        return `Translation${det}${r.engine ? ` via ${r.engine}` : ""}:\n${r.translation}`;
      },
    }),
    capability({
      name: "get_usage",
      description: "Get the signed-in user's monthly usage quotas and remaining limits.",
      parameters: { type: "object", properties: {} },
      tags: ["account"],
      run: async () => {
        const res = await fetch("/api/usage");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load usage");
        return data;
      },
      render: (r) =>
        `Plan: ${r.plan}. Voice/file: ${Math.round((r.usedSeconds || 0) / 60)} / ${Math.round((r.capSeconds || 0) / 60)} minutes. Translation: ${r.usedChars || 0} / ${r.capChars || 0} characters.`,
    }),
    capability({
      name: "navigate",
      description: "Navigate to a Translator workspace mode or page.",
      parameters: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            enum: ["live", "text", "file", "camera", "history", "settings", "help"],
            description: "Destination",
          },
        },
        required: ["mode"],
      },
      tags: ["navigation"],
      run: ({ mode }) => {
        const paths: Record<string, string> = {
          live: "/app/live",
          text: "/app/text",
          file: "/app/file",
          camera: "/app/camera",
          history: "/history",
          settings: "/settings",
          help: "/help",
        };
        const href = paths[mode] || "/app/text";
        window.location.href = href;
        return { ok: true, href };
      },
      render: (_r, a) => `Opening ${a.mode}.`,
    }),
  ];
}
