"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ASSISTANT_BASE, ASSISTANT_KNOWLEDGE, ASSISTANT_SUGGESTIONS } from "@/lib/assistant/meta";
import { clientCapabilities } from "@/lib/assistant/capabilities-client";
import { hasSupabaseConfig, translatorChatHistory } from "@/lib/assistant/chat-history";
import { createClient } from "@/lib/supabase/client";

/** Floating grounded assistant — powered by @page-assistant/widget. */
export function PageAssistantWidget() {
  const path = usePathname();
  const pathRef = useRef(path);
  pathRef.current = path;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { PageAssistant, supabaseChatHistoryAdapter } = await import("@page-assistant/widget");
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
        getPageState: () => {
          const p = pathRef.current;
          return { path: p, mode: p.match(/\/app\/(\w+)/)?.[1] ?? null };
        },
        settingsPageUrl: "/settings#assistant",
        chatHistoryMode: "account",
        chatHistoryAdapter: translatorChatHistory(supabaseChatHistoryAdapter),
        chatHistoryFallbackMode: "device",
        onChatHistoryError: (err: unknown) =>
          console.warn("[page-assistant] chat history:", (err as { message?: string })?.message || err),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const supabase = createClient();
    let lastUserId: string | null | undefined;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const id = session?.user?.id ?? null;
      if (event === "INITIAL_SESSION") {
        lastUserId = id;
        return;
      }
      if (id === lastUserId) return;
      lastUserId = id;
      setTimeout(() => {
        void import("@page-assistant/widget").then(({ PageAssistant }) => PageAssistant.refreshChatHistory());
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
