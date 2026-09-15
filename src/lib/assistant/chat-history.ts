/**
 * Where the assistant keeps its chats.
 *
 * Signed in, chats are saved to the user's account in public.translator_assistant_chats
 * (supabase/migrations/20260915_assistant_chats.sql), so they follow the user across devices. Row-level
 * security limits every read and write to the user's own rows; only the browser session client is used,
 * never the service role. Without Supabase config (or signed out) the widget falls back to this device.
 *
 * The widget is loaded lazily, so its adapter factory is passed in rather than imported here — importing it
 * would pull the whole widget into the page bundle.
 */
import type {
  ChatHistoryAdapter,
  SupabaseChatHistoryOptions,
  SupabaseClientLike,
} from "@page-assistant/widget";
import { createClient } from "@/lib/supabase/client";
import {
  ASSISTANT_CHATS_APP,
  ASSISTANT_CHATS_RETENTION_MONTHS,
  ASSISTANT_CHATS_TABLE,
} from "@/lib/assistant/meta";

type AdapterFactory = (client: SupabaseClientLike, opts?: SupabaseChatHistoryOptions) => ChatHistoryAdapter;

export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** The account adapter, or undefined when this deployment has no Supabase config. */
export function translatorChatHistory(makeAdapter: AdapterFactory): ChatHistoryAdapter | undefined {
  if (!hasSupabaseConfig()) return undefined;
  const supabase = createClient();
  // The app's client defaults to the `translator` schema; the chat table is in `public` (see the migration).
  const client: SupabaseClientLike = {
    from: (table: string) => supabase.schema("public").from(table),
    auth: supabase.auth,
  };
  return makeAdapter(client, {
    table: ASSISTANT_CHATS_TABLE,
    app: ASSISTANT_CHATS_APP,
    retentionMonths: ASSISTANT_CHATS_RETENTION_MONTHS,
  });
}
