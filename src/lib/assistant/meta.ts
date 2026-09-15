import type { LlmTxtMeta } from "@page-assistant/core";

export const ASSISTANT_BASE = "/api/assistant";

export function appOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function assistantMeta(): LlmTxtMeta {
  const base = appOrigin();
  return {
    appName: "Translator",
    appUrl: base,
    description:
      "Live voice, text, file and camera translation. Grounded assistant can translate text, check usage, and navigate the workspace.",
    agentEndpoint: `${base}${ASSISTANT_BASE}/v1/agent`,
    feedbackEndpoint: `${base}${ASSISTANT_BASE}/v1/feedback`,
  };
}

export const ASSISTANT_KNOWLEDGE = `Translator is a progressive web app for real-time and batch translation.

Workspace modes (left sidebar):
- Live (/app/live): real-time captions and two-way conversation
- Text (/app/text): paste or type to translate
- Upload (/app/file): transcribe and translate audio/video files up to 25 MB
- Camera (/app/camera): OCR + translate signs and documents
- History (/history): saved translations
- Settings (/settings): defaults, usage, account

Leave source language on "Detect language" when unsure. Monthly quotas apply to voice/file seconds and translation characters.`;

export const ASSISTANT_SUGGESTIONS = [
  "Translate this for me",
  "How much of my monthly quota is left?",
  "Take me to live translation",
  "What can you do in this app?",
];
