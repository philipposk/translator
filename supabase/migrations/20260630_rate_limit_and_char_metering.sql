-- Durable rate limiting + translation character metering for the Translator app.
-- Run against the shared 6x7 Supabase project (schema: translator).
-- Idempotent — safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) Sliding-window rate limit (shared across all Vercel instances)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS translator.rate_limit_hits (
  id bigserial PRIMARY KEY,
  bucket text NOT NULL,
  hit_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limit_hits_bucket_hit_at_idx
  ON translator.rate_limit_hits (bucket, hit_at DESC);

-- Returns true when allowed, false when over limit. Records a hit when allowed.
CREATE OR REPLACE FUNCTION translator.rate_limit_check(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = translator
AS $$
DECLARE
  cnt integer;
BEGIN
  DELETE FROM translator.rate_limit_hits
  WHERE bucket = p_bucket
    AND hit_at < now() - make_interval(secs => p_window_seconds);

  SELECT count(*)::integer INTO cnt
  FROM translator.rate_limit_hits
  WHERE bucket = p_bucket
    AND hit_at >= now() - make_interval(secs => p_window_seconds);

  IF cnt >= p_limit THEN
    RETURN false;
  END IF;

  INSERT INTO translator.rate_limit_hits (bucket, hit_at) VALUES (p_bucket, now());
  RETURN true;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2) Monthly translation character metering (extends usage_monthly)
-- ---------------------------------------------------------------------------

ALTER TABLE translator.usage_monthly
  ADD COLUMN IF NOT EXISTS chars bigint NOT NULL DEFAULT 0;

-- Increment chars for the current billing period (upsert row like translator_meter).
CREATE OR REPLACE FUNCTION translator.translator_meter_chars(
  p_user uuid,
  p_period text,
  p_chars integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = translator
AS $$
BEGIN
  INSERT INTO translator.usage_monthly (user_id, period, seconds, chars)
  VALUES (p_user, p_period, 0, GREATEST(0, p_chars))
  ON CONFLICT (user_id, period) DO UPDATE
    SET chars = translator.usage_monthly.chars + GREATEST(0, p_chars);
END;
$$;

-- Optional: periodic cleanup of old rate-limit rows (older than 2 hours).
-- Schedule via pg_cron or run manually:
-- DELETE FROM translator.rate_limit_hits WHERE hit_at < now() - interval '2 hours';
