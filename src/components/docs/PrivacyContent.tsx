export function PrivacyContent() {
  return (
    <>
      <p className="tr-doc-meta">Last updated: September 2026 · Data controller: 6x7.gr</p>

      <section>
        <h2>Overview</h2>
        <p>
          Translator at translator.6x7.gr (&quot;Service&quot;) is operated by 6x7.gr. This Privacy Policy
          explains what personal data we collect, why we use it, how long we keep it, and your rights.
        </p>
      </section>

      <section>
        <h2>Data we collect</h2>
        <ul>
          <li><strong>Account data:</strong> email address, user ID, and sign-in method (Google or magic link) via Supabase Auth.</li>
          <li><strong>Translation content:</strong> text, audio transcripts, translations, and OCR text you submit or save to History.</li>
          <li><strong>Uploaded media:</strong> audio and video files during processing. Deleted after transcription completes.</li>
          <li><strong>Usage metrics:</strong> monthly transcription seconds and translated character counts for quota enforcement.</li>
          <li><strong>Assistant chats:</strong> conversation text, titles, and model metadata when account sync is enabled.</li>
          <li><strong>Technical data:</strong> IP address, browser type, and request logs from our host for security and reliability.</li>
          <li><strong>Device preferences:</strong> language defaults, workspace mode, and UI settings in your browser localStorage.</li>
        </ul>
      </section>

      <section>
        <h2>How we use your data</h2>
        <ul>
          <li>Provide translation, live speech, file transcription, and camera OCR features.</li>
          <li>Authenticate you and keep your session secure across 6x7 apps.</li>
          <li>Enforce fair usage limits and prevent abuse.</li>
          <li>Improve reliability and fix errors.</li>
          <li>Respond to support requests and legal obligations.</li>
        </ul>
        <p>
          <strong>Legal basis (GDPR):</strong> performance of our contract with you (providing the Service),
          legitimate interests (security, fraud prevention), and consent where required.
        </p>
      </section>

      <section>
        <h2>Subprocessors</h2>
        <p>We use trusted providers to run the Service. Content may be processed by:</p>
        <ul>
          <li><strong>Supabase</strong> (auth, database, storage)</li>
          <li><strong>Vercel</strong> (hosting)</li>
          <li><strong>Groq</strong> (speech-to-text via Whisper)</li>
          <li><strong>OpenRouter / OpenAI / Anthropic</strong> (translation and assistant, when configured)</li>
          <li><strong>DeepL / Google Cloud Translation</strong> (translation, when configured)</li>
          <li><strong>LibreTranslate / MyMemory</strong> (free translation fallback)</li>
        </ul>
        <p>We do not sell your personal data to advertisers or data brokers.</p>
      </section>

      <section>
        <h2>International transfers</h2>
        <p>
          Your data may be processed in the EU, US, or other countries where our providers operate.
          We rely on standard contractual safeguards and provider compliance programs where transfers
          occur outside your country.
        </p>
      </section>

      <section>
        <h2>Assistant chat history</h2>
        <p>
          By default, assistant conversations sync to your account so they follow you across devices.
          Only you can access your chats (row-level security). Chats with no activity for 12 months are
          auto-deleted. In the assistant settings (Data tab) you can switch to device-only storage or
          turn saving off. Deleting your account removes all assistant chats.
        </p>
      </section>

      <section>
        <h2>Retention</h2>
        <ul>
          <li><strong>History:</strong> until you delete entries or your account.</li>
          <li><strong>Uploaded files:</strong> deleted after processing.</li>
          <li><strong>Assistant chats:</strong> 12 months without activity, or until you delete them.</li>
          <li><strong>Account:</strong> while active; deleted on account deletion request.</li>
          <li><strong>Server logs:</strong> typically 30 days (Vercel default).</li>
        </ul>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          If you are in the EEA, UK, or similar jurisdictions, you may request access, correction,
          deletion, restriction, portability, or object to processing. Contact{" "}
          <a href="mailto:privacy@6x7.gr">privacy@6x7.gr</a>. You may also complain to your local
          data protection authority.
        </p>
        <p>
          You can delete individual history entries, clear all history, or delete your entire account
          from Settings.
        </p>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <p>
          We use essential cookies for authentication. Preferences and assistant device-only chats may
          use localStorage. We do not use advertising or tracking cookies. See our cookie notice on
          first visit.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>The Service is not intended for users under 16. We do not knowingly collect data from children.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>We may update this policy. The &quot;Last updated&quot; date will change when we do.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Privacy: <a href="mailto:privacy@6x7.gr">privacy@6x7.gr</a><br />
          Support: <a href="mailto:support@6x7.gr">support@6x7.gr</a>
        </p>
      </section>
    </>
  );
}
