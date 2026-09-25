-- Newsletter signups + public RPC wrappers for PostgREST (service role).
-- Idempotent — safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) Marketing newsletter (same pattern as smoking_newsletter_subscribers)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.translator_newsletter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT translator_newsletter_email_unique UNIQUE (email)
);

ALTER TABLE public.translator_newsletter ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2) Public wrappers so supabase-js rpc() finds metering functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.translator_meter_chars(
  p_user uuid,
  p_period text,
  p_chars integer
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = translator
AS $$
  SELECT translator.translator_meter_chars(p_user, p_period, p_chars);
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'translator' AND routine_name = 'translator_meter'
  ) THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.translator_meter(
        p_user uuid,
        p_period text,
        p_seconds numeric
      ) RETURNS void
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = translator
      AS $body$
        SELECT translator.translator_meter(p_user, p_period, p_seconds);
      $body$;
    $fn$;
  END IF;
END $$;
