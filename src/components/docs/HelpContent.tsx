import { FaqAccordion } from "@/components/FaqAccordion";

const FAQ = [
  {
    q: "How do I translate live between Portuguese and English?",
    a: "Open Live mode, switch to Conversation, set Portuguese and English, enable auto-detect, then tap Start listening. Use Flip for face-to-face seating or Show on phone for large fullscreen text.",
  },
  {
    q: "What is Captions mode?",
    a: "Captions mode shows one language pair with real-time subtitles. Good for lectures, videos, or single-speaker content.",
  },
  {
    q: "How does Text mode work?",
    a: "Paste or type text. Translation runs automatically after a short pause.",
  },
  {
    q: "What file types can I upload?",
    a: "m4a, mp3, wav, mp4, and webm up to 25 MB. The file is transcribed, then translated in batches.",
  },
  {
    q: "How do I use Camera mode?",
    a: "Point your camera at printed text or upload a photo. Use good lighting and hold steady. Select the text language manually if auto-detect struggles.",
  },
  {
    q: "What are the usage limits?",
    a: "Free plans include monthly caps on voice transcription seconds and translated characters. Check the usage bar on any workspace page or Settings.",
  },
  {
    q: "Can I install Translator as an app?",
    a: "On supported browsers, use Install app in the sidebar to add Translator to your home screen.",
  },
  {
    q: "What is the page assistant?",
    a: "The floating assistant can translate text, check usage, navigate modes, and read the page. It only performs real actions through grounded capabilities.",
  },
];

export function HelpContent() {
  return (
    <>
      <section>
        <h2>Getting started</h2>
        <p>
          Sign in with Google or a magic link. Your 6x7 account works across all 6x7 apps. Pick a
          mode from the left sidebar (Live, Text, Upload, or Camera) and choose source and target
          languages. Leave source on <strong>Detect language</strong> when you are unsure.
        </p>
      </section>

      <section>
        <h2>FAQ</h2>
        <FaqAccordion items={FAQ} />
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
        <h2>API (authenticated)</h2>
        <p>
          Translator exposes REST endpoints for signed-in users. There is no public API key today.
          Integrations use your session cookie after sign-in.
        </p>
        <ul>
          <li>
            <code>POST /api/translate</code>: text translation ({`{ text, source_lang, target_lang, mode }`})
          </li>
          <li>
            <code>POST /api/detect</code>: language detection ({`{ text }`})
          </li>
          <li>
            <code>POST /api/stt-chunk</code>: live speech chunk (multipart audio)
          </li>
          <li>
            <code>POST /api/file/transcribe</code> then <code>POST /api/file/translate-batch</code>
          </li>
          <li>
            <code>GET /api/jobs</code>: translation history
          </li>
          <li>
            <code>GET /api/usage</code>: monthly quota usage
          </li>
        </ul>
        <p>
          Rate limits and monthly quotas apply. Contact{" "}
          <a href="mailto:support@6x7.gr">support@6x7.gr</a> for higher limits.
        </p>
      </section>

      <section>
        <h2>Export</h2>
        <p>
          After file transcription, use <strong>Export</strong> for SRT, VTT, or bilingual TXT.
        </p>
      </section>

      <section>
        <h2>Support</h2>
        <p>
          Questions or bugs: <a href="mailto:support@6x7.gr">support@6x7.gr</a>. To delete your account,
          go to Settings and the Danger zone.
        </p>
        <p className="tr-doc-meta">Last updated: September 2026</p>
      </section>
    </>
  );
}
