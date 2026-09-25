# Translator agent notes

**Manual ops (GSC, Google OAuth):** user personal store `6x7-gsc-oauth.md`.

Prod `https://translator.6x7.gr` · Supabase `fmrnqepyyjucnfbrqawl`.

## Still needs dashboards (agent can't finish alone)
1. **GSC** — create property → HTML tag token → set Vercel `GOOGLE_SITE_VERIFICATION` → deploy → Verify → submit `sitemap.xml`
2. **OAuth** — Supabase redirect URLs + Google Cloud redirect = `https://fmrnqepyyjucnfbrqawl.supabase.co/auth/v1/callback` (app code already correct)
3. **Deepgram** — copy `DEEPGRAM_API_KEY` from transcriber Vercel project to translator (optional)
