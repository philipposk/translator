// Usage quota — enforce a monthly seconds cap on paid STT (Groq) so a signed-in
// user can't run unlimited transcription. Read via the service-role client
// (bypasses RLS). Best-effort metering is written by translator_meter.

import { adminClient } from "./supabase/admin";

// Monthly free allowance, in seconds of transcribed audio. Override via env.
export const QUOTA_SECONDS_MONTH = Number(process.env.QUOTA_SECONDS_MONTH || 10800); // 3h

export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM (UTC)
}

// Seconds the user has spent this month. Returns 0 if unknown.
export async function getMonthSeconds(userId: string): Promise<number> {
  try {
    const db = adminClient();
    const { data } = await db
      .from("usage_monthly")
      .select("seconds")
      .eq("user_id", userId)
      .eq("period", currentPeriod())
      .maybeSingle();
    return Number(data?.seconds || 0);
  } catch {
    return 0;
  }
}

// True if the user is at/over their monthly cap.
export async function overQuota(userId: string): Promise<boolean> {
  const used = await getMonthSeconds(userId);
  return used >= QUOTA_SECONDS_MONTH;
}

export type Usage = {
  plan: string;
  period: string;
  usedSeconds: number;
  capSeconds: number;
  remainingSeconds: number;
  overLimit: boolean;
};

// Usage summary for the UI. STT (transcription/live-fallback) is the metered cost;
// Web Speech live + text translation are effectively free and not counted here.
export async function getUsage(userId: string): Promise<Usage> {
  const used = await getMonthSeconds(userId);
  const cap = QUOTA_SECONDS_MONTH;
  return {
    plan: "Free",
    period: currentPeriod(),
    usedSeconds: used,
    capSeconds: cap,
    remainingSeconds: Math.max(0, cap - used),
    overLimit: used >= cap,
  };
}

// Record usage (best-effort; never throws).
export async function meter(userId: string, seconds: number): Promise<void> {
  try {
    const db = adminClient();
    await db.rpc("translator_meter", { p_user: userId, p_period: currentPeriod(), p_seconds: seconds });
  } catch {
    /* best-effort */
  }
}
