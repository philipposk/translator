// Usage quota — monthly caps on STT seconds (Groq) and translation characters.
// Read/write via service-role client (bypasses RLS).

import { adminClient } from "./supabase/admin";

// Monthly free allowance. Override via env.
export const QUOTA_SECONDS_MONTH = Number(process.env.QUOTA_SECONDS_MONTH || 10800); // 3h
export const QUOTA_CHARS_MONTH = Number(process.env.QUOTA_CHARS_MONTH || 500000); // ~100k words

export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM (UTC)
}

type MonthlyRow = { seconds?: number | null; chars?: number | null };

async function getMonthRow(userId: string): Promise<MonthlyRow> {
  try {
    const db = adminClient();
    const { data } = await db
      .from("usage_monthly")
      .select("seconds, chars")
      .eq("user_id", userId)
      .eq("period", currentPeriod())
      .maybeSingle();
    return data ?? {};
  } catch {
    return {};
  }
}

export async function getMonthSeconds(userId: string): Promise<number> {
  const row = await getMonthRow(userId);
  return Number(row.seconds || 0);
}

export async function getMonthChars(userId: string): Promise<number> {
  const row = await getMonthRow(userId);
  return Number(row.chars || 0);
}

/** STT (Groq) monthly cap reached. */
export async function overSttQuota(userId: string): Promise<boolean> {
  return (await getMonthSeconds(userId)) >= QUOTA_SECONDS_MONTH;
}

/** @deprecated Use overSttQuota — kept for existing imports. */
export const overQuota = overSttQuota;

/** Translation character monthly cap reached. */
export async function overCharsQuota(userId: string): Promise<boolean> {
  return (await getMonthChars(userId)) >= QUOTA_CHARS_MONTH;
}

export type Usage = {
  plan: string;
  period: string;
  usedSeconds: number;
  capSeconds: number;
  remainingSeconds: number;
  overSttLimit: boolean;
  usedChars: number;
  capChars: number;
  remainingChars: number;
  overCharsLimit: boolean;
  /** Either quota exceeded. */
  overLimit: boolean;
};

export async function getUsage(userId: string): Promise<Usage> {
  const row = await getMonthRow(userId);
  const usedSeconds = Number(row.seconds || 0);
  const usedChars = Number(row.chars || 0);
  const overSttLimit = usedSeconds >= QUOTA_SECONDS_MONTH;
  const overCharsLimit = usedChars >= QUOTA_CHARS_MONTH;
  return {
    plan: "Free",
    period: currentPeriod(),
    usedSeconds,
    capSeconds: QUOTA_SECONDS_MONTH,
    remainingSeconds: Math.max(0, QUOTA_SECONDS_MONTH - usedSeconds),
    overSttLimit,
    usedChars,
    capChars: QUOTA_CHARS_MONTH,
    remainingChars: Math.max(0, QUOTA_CHARS_MONTH - usedChars),
    overCharsLimit,
    overLimit: overSttLimit || overCharsLimit,
  };
}

/** Record STT usage (best-effort; never throws). */
export async function meter(userId: string, seconds: number): Promise<void> {
  try {
    const db = adminClient();
    await db.rpc("translator_meter", { p_user: userId, p_period: currentPeriod(), p_seconds: seconds });
  } catch {
    /* best-effort */
  }
}

/** Record translation character usage (best-effort; never throws). */
export async function meterChars(userId: string, chars: number): Promise<void> {
  if (chars <= 0) return;
  try {
    const db = adminClient();
    await db.rpc("translator_meter_chars", {
      p_user: userId,
      p_period: currentPeriod(),
      p_chars: Math.round(chars),
    });
  } catch {
    /* best-effort — migration may not be applied yet */
  }
}
