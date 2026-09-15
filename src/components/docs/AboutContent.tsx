export function AboutContent() {
  return (
    <>
      <section>
        <h2>What is Translator?</h2>
        <p>
          Translator is a progressive web app for real-time and batch translation. Speak, type,
          upload a recording, or scan text with your camera — get results in dozens of languages.
        </p>
      </section>

      <section>
        <h2>Built by 6x7.gr</h2>
        <p>
          Translator is part of the <a href="https://6x7.gr">6x7.gr</a> family of tools. One account
          signs you in everywhere. We focus on practical, fast utilities that work on any device.
        </p>
      </section>

      <section>
        <h2>Technology</h2>
        <ul>
          <li>Speech: browser Web Speech API and Groq Whisper</li>
          <li>Translation: tiered engines (DeepL, Google, LLM, open-source MT fallbacks)</li>
          <li>OCR: Tesseract.js in the browser</li>
          <li>Hosting: Vercel · Data: Supabase</li>
        </ul>
      </section>

      <section>
        <h2>Roadmap</h2>
        <p>Planned improvements include public API keys, export formats (SRT/VTT), team workspaces, and optional on-device translation models. Contact us if you want early access.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          <a href="mailto:support@6x7.gr">support@6x7.gr</a> ·{" "}
          <a href="https://6x7.gr" target="_blank" rel="noopener noreferrer">
            6x7.gr
          </a>
        </p>
      </section>
    </>
  );
}
