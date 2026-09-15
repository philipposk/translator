// Rate limiter — durable (Supabase sliding window) with in-memory fallback
// when the DB RPC is unavailable (local dev before migration is applied).

import { adminClient } from "./supabase/admin";

type Bucket = { hits: number[] };
const memory = new Map<string, Bucket>();

function rateLimitMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = memory.get(key) || { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= limit) {
    memory.set(key, b);
    return false;
  }
  b.hits.push(now);
  memory.set(key, b);
  if (memory.size > 5000) {
    for (const [k, v] of memory) {
      if (!v.hits.length || now - v.hits[v.hits.length - 1] > windowMs) memory.delete(k);
    }
  }
  return true;
}

/** Returns true if ALLOWED, false if over limit within the sliding window. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  try {
    const db = adminClient();
    const { data, error } = await db.rpc("rate_limit_check", {
      p_bucket: key,
      p_limit: limit,
      p_window_seconds: windowSec,
    });
    if (!error && typeof data === "boolean") return data;
  } catch {
    /* fall through to memory */
  }
  return rateLimitMemory(key, limit, windowMs);
}
