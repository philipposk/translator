"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ASSISTANT_BASE, ASSISTANT_KNOWLEDGE, ASSISTANT_SUGGESTIONS } from "@/lib/assistant/meta";
import { clientCapabilities } from "@/lib/assistant/capabilities-client";
import { hasSupabaseConfig, translatorChatHistory } from "@/lib/assistant/chat-history";
import { createClient } from "@/lib/supabase/client";

/** Floating grounded assistant — powered by @page-assistant/widget. */
export function PageAssistantWidget() {
  const path = usePathname();

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
        getPageState: () => ({
          path,
          mode: path.match(/\/app\/(\w+)/)?.[1] ?? null,
        }),
        settingsPageUrl: "/settings#assistant",
        // Chat history. Default "account": chats are saved to the user's account (translator_assistant_chats,
        // readable only by their owner via RLS, deleted after 12 months without activity) so they follow the
        // user across devices. In the assistant's settings (Data tab) the user can switch to "this device" or
        // "off", and delete one chat or all of them. Signed out, or with no Supabase config, chats stay on this
        // device. The adapter reports the user id, so device chats are kept per user on a shared browser.
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
  }, [path]);

  // Re-key chat history when the signed-in user changes without a reload. INITIAL_SESSION is the user init()
  // already loaded.
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
      // Deferred a tick: supabase-js asks that its own calls wait until this callback has returned, and the
      // widget's check reads the session.
      setTimeout(() => {
        void import("@page-assistant/widget").then(({ PageAssistant }) => PageAssistant.refreshChatHistory());
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
