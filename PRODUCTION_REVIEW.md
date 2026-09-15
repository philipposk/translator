# Production Review — Translator

Multi-agent review (16 agents, find → adversarially verify → prioritize). Verdict: **NO-GO** until the cost/privacy blockers are closed. This file is the working list for any session.

Status legend: ✅ fixed · 🟡 partial · ⬜ open

## BLOCKERS (must fix before prod)

1. ✅ **`/api/translate` unauthenticated → unbounded LLM cost.** Auth gate + durable DB rate limit (with in-memory fallback) + monthly char cap + per-request char cap.
2. ✅ **`translator-uploads` bucket public, no storage RLS → anyone reads any user's media.** Fix: bucket set `public=false` + `file_size_limit=25MB` + mime allowlist; media downloaded server-side via service role; `jobs/[id]` no longer returns `media_path`; media deleted after processing.
3. ✅ **Usage meter recorded but enforced.** STT seconds + translation chars capped monthly (`QUOTA_SECONDS_MONTH`, `QUOTA_CHARS_MONTH`). Returns 429 over cap.
4. ✅ **Live STT fired on silence/noise; blind 4.5s cycle.** Fix: all Groq live now goes through VAD (blind `cycleGroq` removed); raised RMS threshold + min-voiced-duration gate; idle tab sends nothing.
5. ✅ **No server-side upload caps.** Fix: bucket `file_size_limit`/mime (blocker 2); per-user active-job cap in `jobs/create`; input (kind/lang) validation.
6. ✅ **No lang validation + no fetch timeouts.** Fix: `isValidLang`/`isValidSource` in `langs.ts`, validated in routes; `AbortSignal.timeout` on every external fetch (llm, transcribe, free MT).

## Usage / limits UI

✅ Added `GET /api/usage` + `UsageBar` (plan badge + voice/file STT bar + translation chars bar). Caps = `QUOTA_SECONDS_MONTH` (default 3h) + `QUOTA_CHARS_MONTH` (default 500k chars).

## SHOULD-FIX-SOON

- ✅ **`file/process` Hobby timeout.** Split pipeline: `/api/file/transcribe` + `/api/file/translate-batch` (8 segs/request). Works on Vercel Hobby 60s limit.
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
- ✅ MyMemory fallback forces `source='en'` on `auto` → detect-first via `detect.ts`; MyMemory refuses raw auto.
- ✅ `convAuto` lang-picker change mid-session can mis-route — pickers disabled while listening.
- ⬜ Add `favicon.ico`; manifest `start_url` — ✅ start_url set to `/`.
- ⬜ Decorative emoji in some control labels not `aria-hidden` — ✅ replaced with SVG icons in nav/history.
- ⬜ Legal/compliance pages — ✅ Privacy, Terms, cookie banner, login consent.
- ⬜ Help & documentation — ✅ `/help` with mode guide + API reference.
- ⬜ Professional app shell — ✅ sidebar modes (Live/Text/Upload/Camera), per-mode routes, page headers.
- ⬜ Public API keys / MCP server — agent endpoint at `/api/assistant/v1/agent` + `llm.txt`; no public API keys yet.
- ✅ Page Assistant — vendored from [page-assistant](https://github.com/philipposk/page-assistant) in `packages/`; widget on authenticated shell; Next.js API backend.
- ✅ Account deletion self-service — Settings → Danger zone; `POST /api/account/delete`.
- ✅ Export formats (SRT/VTT/TXT) — File upload + History.
- ✅ First-run onboarding — welcome overlay on first visit.
- ⬜ DeepL in production — set `DEEPL_API_KEY` in Vercel env; Settings shows engine status.
- ⬜ Lawyer review of Privacy/Terms — templates with legal-notice banner; counsel review still required.
- ⬜ E2E test matrix — partial (unit tests incl. export).

## Architecture (for context)

Next 16 (webpack prod build via `next build --webpack`, turbopack dev), Supabase shared 6x7 auth, Postgres schema `translator`, RLS owner = `auth.uid()=user_id`. Translation = OpenRouter Gemini Flash + free MT fallback. STT = browser Web Speech (free) + Groq Whisper (files + iOS/auto-detect). Cost ceiling: live < $0.50/hr. PWA via Serwist.
