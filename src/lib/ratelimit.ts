// Lightweight in-memory sliding-window rate limiter. Per serverless instance
// only (not distributed) — defense-in-depth on top of auth, not a hard global
// guarantee. For multi-instance hardening, swap for a DB/Redis limiter.

type Bucket = { hits: number[]; };
const buckets = new Map<string, Bucket>();

// Returns true if ALLOWED, false if the key is over `limit` within `windowMs`.
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key) || { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= limit) {
    buckets.set(key, b);
    return false;
  }
  b.hits.push(now);
  buckets.set(key, b);
  // opportunistic cleanup
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (!v.hits.length || now - v.hits[v.hits.length - 1] > windowMs) buckets.delete(k);
    }
  }
  return true;
}
