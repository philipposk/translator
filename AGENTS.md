# Translator agent notes

Prod `https://translator.6x7.gr` · Supabase `fmrnqepyyjucnfbrqawl` · Vercel `translator`

## Check first
Latest Vercel prod deploy must be **READY**. If ERROR, prod is stale — nothing you push (GSC meta, env vars) is live. Known fail: `opengraph-image` Edge Function >1MB (`NOW_SANDBOX_WORKER_MAX_MIDDLEWARE_SIZE`).

## GSC (browser works if user is logged into Google)
1. Add property → **URL prefix** `https://translator.6x7.gr/` (right panel Continue — not empty Domain on the left)
2. HTML tag token → Vercel `GOOGLE_SITE_VERIFICATION` (+ `public/google*.html` from GSC file method if shown)
3. Deploy READY → `curl -s https://translator.6x7.gr/ | rg google-site-verification` → Verify → Sitemaps: `sitemap.xml`

## OAuth (dashboards only; app code OK)
- Supabase redirect: `https://translator.6x7.gr/auth/callback`
- Google redirect URI: `https://fmrnqepyyjucnfbrqawl.supabase.co/auth/v1/callback` (not the app URL)

## Optional
`DEEPGRAM_API_KEY` on Vercel — copy from transcriber project manually (CLI can't pull secrets).
