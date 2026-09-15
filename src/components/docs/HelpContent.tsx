export function HelpContent() {
  return (
    <>
      <section>
        <h2>Getting started</h2>
        <p>
          Sign in with Google or a magic link. Your 6x7 account works across all 6x7 apps. Pick a
          mode from the left sidebar — Live, Text, Upload, or Camera — and choose source/target
          languages. Leave source on <strong>Detect language</strong> when you are unsure.
        </p>
      </section>

      <section>
        <h2>Modes</h2>
        <dl className="tr-faq">
          <div>
            <dt>Live</dt>
            <dd>
              Captions mode shows one language pair with real-time subtitles. Conversation mode runs
              a two-sided dialog — flip the top panel 180° for face-to-face seating. Auto-detect is
              available in Settings for conversation mode.
            </dd>
          </div>
          <div>
            <dt>Text</dt>
            <dd>Paste or type text. Translation runs automatically after a short pause.</dd>
          </div>
          <div>
            <dt>Upload</dt>
            <dd>
              Drop audio or video (m4a, mp3, wav, mp4, webm, up to 25 MB). The file is transcribed,
              then translated in batches. Detected language is shown when it differs from your
              selection.
            </dd>
          </div>
          <div>
            <dt>Camera</dt>
            <dd>
              Point your camera at printed text or upload a photo. For best results use good lighting
              and hold steady; select the text language manually if auto-detect struggles.
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>Language detection</h2>
        <p>
          File uploads and live speech use Whisper when available to detect the spoken language.
          Text and OCR use dedicated detection before translation. If results look wrong, pick the
          source language manually instead of Detect language.
        </p>
      </section>

      <section>
        <h2>Usage limits</h2>
        <p>
          Free plans include monthly caps on voice/file transcription seconds and translated
          characters. Check the usage bar at the top of any workspace page or open Settings → Plan
          &amp; usage.
        </p>
      </section>

      <section>
        <h2>Install as an app</h2>
        <p>
          On supported browsers, use <strong>Install app</strong> in the sidebar to add Translator
          to your home screen. It works offline for cached pages; translation requires a network
          connection.
        </p>
      </section>

      <section>
        <h2>API (authenticated)</h2>
        <p>
          Translator exposes REST endpoints for signed-in users. There is no public API key or MCP
          server today — integrations use your session cookie after sign-in.
        </p>
        <ul>
          <li>
            <code>POST /api/translate</code> — text translation ({`{ text, source_lang, target_lang, mode }`})
          </li>
          <li>
            <code>POST /api/detect</code> — language detection ({`{ text }`})
          </li>
          <li>
            <code>POST /api/stt-chunk</code> — live speech chunk (multipart audio)
          </li>
          <li>
            <code>POST /api/file/transcribe</code> then <code>POST /api/file/translate-batch</code>{" "}
            — file pipeline
          </li>
          <li>
            <code>GET /api/jobs</code> — translation history
          </li>
          <li>
            <code>GET /api/usage</code> — monthly quota usage
          </li>
        </ul>
        <p>
          Rate limits and monthly quotas apply. Contact{" "}
          <a href="mailto:support@6x7.gr">support@6x7.gr</a> if you need higher limits or a
          dedicated integration.
        </p>
      </section>

      <section>
        <h2>Page assistant</h2>
        <p>
          A floating assistant (bottom-right) can translate text, check your usage, navigate modes, and
          read the page. It uses grounded capabilities — it only performs real actions, never fakes
          results. Voice uses your browser mic by default; server TTS/STT when configured.
        </p>
        <p>
          For external AI agents: <a href="/llm.txt">/llm.txt</a> and{" "}
          <a href="/.well-known/llm-actions.json">/.well-known/llm-actions.json</a>. Drive the assistant via{" "}
          <code>POST /api/assistant/v1/agent</code> (authenticated).
        </p>
      </section>

      <section>
        <h2>Export</h2>
        <p>
          After file transcription, use <strong>Export</strong> for SRT, VTT, or bilingual TXT. History
          entries with timed segments support the same formats; plain text jobs export as TXT.
        </p>
      </section>

      <section>
        <h2>Support</h2>
        <p>
          Questions or bugs: <a href="mailto:support@6x7.gr">support@6x7.gr</a>. To delete your account,
          go to Settings → Danger zone (or clear History first if you only want translations removed).
        </p>
      </section>
    </>
  );
}
