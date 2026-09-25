import { adminClient } from "./supabase/admin";

export type MigrationHealth = {
  ok: boolean;
  rateLimit: boolean;
  charMeter: boolean;
  assistantChats: boolean;
  issues: string[];
};

const HEALTH_USER = "00000000-0000-0000-0000-000000000001";
const HEALTH_PERIOD = "2099-01";

/** Verify DB migrations/RPCs the app depends on — avoids silent quota/history degradation. */
export async function checkMigrationHealth(): Promise<MigrationHealth> {
  const issues: string[] = [];
  let rateLimit = false;
  let charMeter = false;
  let assistantChats = false;

  try {
    const db = adminClient();
    const { data, error } = await db.rpc("rate_limit_check", {
      p_bucket: "__health_probe__",
      p_limit: 10_000,
      p_window_seconds: 60,
    });
    rateLimit = !error && typeof data === "boolean";
    if (!rateLimit) issues.push("Rate limiting RPC unavailable — falling back to per-instance memory limits.");
  } catch {
    issues.push("Rate limiting RPC unavailable — falling back to per-instance memory limits.");
  }

  try {
    const db = adminClient();
    const { error } = await db.rpc("translator_meter_chars", {
      p_user: HEALTH_USER,
      p_period: HEALTH_PERIOD,
      p_chars: 0,
    });
    charMeter = !error;
    if (!charMeter) issues.push("Character metering RPC missing — translation quotas may not be enforced.");
  } catch {
    issues.push("Character metering RPC missing — translation quotas may not be enforced.");
  }

  try {
    const db = adminClient();
    const { error } = await db.from("translator_assistant_chats").select("id").limit(1);
    assistantChats = !error;
    if (!assistantChats) issues.push("Assistant chat history table missing — sync will not work.");
  } catch {
    issues.push("Assistant chat history table missing — sync will not work.");
  }

  return {
    ok: rateLimit && charMeter && assistantChats,
    rateLimit,
    charMeter,
    assistantChats,
    issues,
  };
}
