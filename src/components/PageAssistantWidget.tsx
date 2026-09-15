"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ASSISTANT_BASE, ASSISTANT_KNOWLEDGE, ASSISTANT_SUGGESTIONS } from "@/lib/assistant/meta";
import { clientCapabilities } from "@/lib/assistant/capabilities-client";

/** Floating grounded assistant — powered by @page-assistant/widget. */
export function PageAssistantWidget() {
  const path = usePathname();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { PageAssistant } = await import("@page-assistant/widget");
      if (cancelled) return;

      PageAssistant.init({
        serverUrl: ASSISTANT_BASE,
        appName: "Translator",
        persona:
          "You help users translate with Live, Text, Upload, and Camera modes. Only use registered capabilities. Be brief.",
        capabilities: clientCapabilities(),
        knowledge: ASSISTANT_KNOWLEDGE,
        knowledgeUrl: "/llm.txt",
        suggestions: ASSISTANT_SUGGESTIONS,
        greeting: "Hi! I can translate text, check your usage, or open a workspace mode. Try the mic or pick a suggestion.",
        voice: true,
        autoScan: true,
        autoSpeak: false,
        memory: "persistent",
        getPageState: () => ({
          path,
          mode: path.match(/\/app\/(\w+)/)?.[1] ?? null,
        }),
        settingsPageUrl: "/settings#assistant",
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [path]);

  return null;
}
