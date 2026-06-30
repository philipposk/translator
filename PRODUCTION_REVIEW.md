# Production Review — Translator

Multi-agent review (16 agents, find → adversarially verify → prioritize). Verdict: **NO-GO** until the cost/privacy blockers are closed. This file is the working list for any session.

Status legend: ✅ fixed · 🟡 partial · ⬜ open

## BLOCKERS (must fix before prod)

1. ✅ **`/api/translate` unauthenticated → unbounded LLM cost.** Anyone could script it (~$5-15/min). Fix applied: `getUserId()` 401 gate + per-user in-memory rate limit + char cap + lang validation. *Follow-up:* in-memory limiter is per-instance only — add a durable (DB/Redis) limiter for multi-instance hardening.
2. ✅ **`translator-uploads` bucket public, no storage RLS → anyone reads any user's media.** Fix: bucket set `public=false` + `file_size_limit=25MB` + mime allowlist; media downloaded server-side via service role; `jobs/[id]` no longer returns `media_path`; media deleted after processing.
3. ✅ **Usage meter recorded but never enforced.** Fix: `lib/usage.ts` `overQuota()` gate added before Groq in `file/process` and `stt-chunk` (monthly seconds cap, env `QUOTA_SECONDS_MONTH`, default 10800 = 3h). Returns 429 over cap.
4. ✅ **Live STT fired on silence/noise; blind 4.5s cycle.** Fix: all Groq live now goes through VAD (blind `cycleGroq` removed); raised RMS threshold + min-voiced-duration gate; idle tab sends nothing.
5. ✅ **No server-side upload caps.** Fix: bucket `file_size_limit`/mime (blocker 2); per-user active-job cap in `jobs/create`; input (kind/lang) validation.
6. ✅ **No lang validation + no fetch timeouts.** Fix: `isValidLang`/`isValidSource` in `langs.ts`, validated in routes; `AbortSignal.timeout` on every external fetch (llm, transcribe, free MT).

## Usage / limits UI

✅ Added `GET /api/usage` + `UsageBar` (plan badge + monthly transcription bar, shown atop the workspace). Cap = `QUOTA_SECONDS_MONTH` (default 3h). One tier ("Free") for now — no Stripe/paid tiers wired yet (future work if monetizing).

## SHOULD-FIX-SOON

- ⬜ **`file/process` `maxDuration=300` needs Vercel Pro.** On Hobby it dies at 60s → jobs stuck in `translating`. Confirm plan, or move to a background job + client polling.
- ✅ **`file/process` not idempotent.** Short-circuits when `status='done'`.
- ✅ **Error boundaries.** `app/error.tsx`, `app/not-found.tsx`, `app/global-error.tsx` all added.
- ✅ **Public-demo path.** Dropped the `public demo read` policy; `jobs/[id]` GET is owner-only + never returns `media_path`.
- ✅ **Live session abort/superseding.** `runRef` bumps on start/stop; late `translateLine` results are dropped.
- ✅ **Never deletes uploaded media.** Removed after successful processing.
- ✅ **Camera OCR length cap.** OCR text capped to 4000 chars before translating; capture disabled while in flight.
- ✅ **Pin Node.** `engines.node: "22.x"` + `.nvmrc`. (Do NOT pin 26.)
- ✅ **LLM raw provider error.** Mapped to a generic client message; detail stays server-side.

## NICE-TO-HAVE

- ✅ Web Speech `onerror` busy-loop — fatal errors now clear `wantRef` so `onend` stops restarting.
- ✅ VAD `AudioContext` closed in `stop()`; recorder/meta refs nulled.
- ✅ Auth callback `next` validated — same-origin `^/[^/]` only.
- ✅ `proxy.ts` narrowed (excludes `/api`, sw, manifest, icons, assets) + documented per-route auth.
- ✅ FileTranslate uses segments returned by `process` (redundant GET removed).
- ⬜ MyMemory fallback forces `source='en'` on `auto` → mistranslates non-English when NO LLM key set (rare; LLM path covers it). Use LibreTranslate `auto` or detect first.
- ⬜ `convAuto` lang-picker change mid-session can mis-route — disable pickers while listening.
- ⬜ Add `favicon.ico`; manifest `start_url=/app` (redirects to /login when logged out — acceptable, consider `/`).
- ⬜ Decorative emoji in some control labels not `aria-hidden`.

## Architecture (for context)

Next 16 (webpack prod build via `next build --webpack`, turbopack dev), Supabase shared 6x7 auth, Postgres schema `translator`, RLS owner = `auth.uid()=user_id`. Translation = OpenRouter Gemini Flash + free MT fallback. STT = browser Web Speech (free) + Groq Whisper (files + iOS/auto-detect). Cost ceiling: live < $0.50/hr. PWA via Serwist.
