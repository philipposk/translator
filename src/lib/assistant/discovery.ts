import { generateActionsJson } from "@page-assistant/core";
import { serverCapabilities } from "@/lib/assistant/capabilities-server";
import { assistantMeta } from "@/lib/assistant/meta";

export function llmActionsPayload() {
  const meta = assistantMeta();
  return { ...generateActionsJson(meta, serverCapabilities()), feedbackEndpoint: meta.feedbackEndpoint };
}
