export function PrivacyContent() {
  return (
    <>
      <p className="tr-legal-notice">
        <strong>Legal notice:</strong> This document is provided for transparency and is not legal advice.
        Have qualified counsel review it before relying on it for GDPR or commercial compliance, especially
        if you operate in the EU or process sensitive content.
      </p>

      <p className="tr-doc-meta">Last updated: September 2026 · Operator: 6x7.gr</p>

      <section>
        <h2>Who we are</h2>
        <p>
          Translator is operated by 6x7.gr (&quot;we&quot;, &quot;us&quot;). This policy explains how we
          process personal data when you use translator.6x7.gr and related services (the
          &quot;Service&quot;).
        </p>
      </section>

      <section>
        <h2>Data we collect</h2>
        <ul>
          <li>
            <strong>Account:</strong> email address and authentication identifiers via Supabase Auth
            (Google OAuth or magic link).
          </li>
          <li>
            <strong>Translation content:</strong> text, transcripts, and translations you submit or
            save to History. Uploaded audio/video is processed server-side and deleted after
            processing completes.
          </li>
          <li>
            <strong>Usage:</strong> monthly transcription seconds and character counts for quota
            enforcement.
          </li>
          <li>
            <strong>Technical:</strong> essential session cookies, IP address and request logs
            retained by our host (Vercel) for security and operations.
          </li>
          <li>
            <strong>Preferences:</strong> language defaults and UI settings stored in your browser
            (localStorage).
          </li>
        </ul>
      </section>

      <section>
        <h2>Why we process data</h2>
        <ul>
          <li>Provide translation, transcription, and OCR features you request.</li>
          <li>Authenticate you and enforce usage limits.</li>
          <li>Maintain security, prevent abuse, and improve reliability.</li>
          <li>Comply with legal obligations.</li>
        </ul>
        <p>
          Legal bases (GDPR): contract performance (providing the Service), legitimate interests
          (security, abuse prevention), and consent where required (non-essential cookies — we only
          use essential cookies today).
        </p>
      </section>

      <section>
        <h2>Processors &amp; third parties</h2>
        <p>We send content to subprocessors only to deliver the Service:</p>
        <ul>
          <li>Supabase — authentication, database, file storage (EU/US depending on project region).</li>
          <li>Vercel — application hosting.</li>
          <li>Groq — speech-to-text (Whisper) when enabled.</li>
          <li>
            Translation providers configured by us — e.g. OpenRouter/OpenAI, DeepL, Google Cloud
            Translation, LibreTranslate, MyMemory — depending on engine availability.
          </li>
        </ul>
        <p>We do not sell your personal data.</p>
      </section>

      <section>
        <h2>Assistant chats</h2>
        <p>
          By default, your conversations with the in-app assistant are saved to your account so they are
          there on any device you sign in on. We store the chat text, its title and the model used in our
          database (Supabase), and only your account can read them. A saved chat is deleted automatically
          once it has had no activity for 12 months. In the assistant&apos;s settings (Data tab) you can
          instead keep chats only in this browser (localStorage), or not save them at all, and you can
          delete one chat or all of them at any time. Deleting your account deletes them too.
        </p>
      </section>

      <section>
        <h2>Retention</h2>
        <ul>
          <li>History entries remain until you delete them or clear all history.</li>
          <li>Uploaded media is removed after successful processing.</li>
          <li>Saved assistant chats are deleted after 12 months without activity.</li>
          <li>Account data is kept while your account is active.</li>
        </ul>
      </section>

      <section>
        <h2>Your rights (EEA/UK)</h2>
        <p>You may request access, correction, deletion, restriction, portability, or object to processing. Contact <a href="mailto:privacy@6x7.gr">privacy@6x7.gr</a>. You may lodge a complaint with your local supervisory authority.</p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          We use strictly necessary cookies for sign-in sessions. Preference data may be stored in
          localStorage. See the cookie notice on first visit.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>The Service is not directed at children under 16. We do not knowingly collect their data.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>We may update this policy. Material changes will be reflected on this page with a new date.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Privacy: <a href="mailto:privacy@6x7.gr">privacy@6x7.gr</a> · General:{" "}
          <a href="mailto:support@6x7.gr">support@6x7.gr</a>
        </p>
      </section>
    </>
  );
}
