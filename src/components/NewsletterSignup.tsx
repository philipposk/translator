"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    // Opens mailto for now; wire to a list provider when ready.
    window.location.href = `mailto:support@6x7.gr?subject=Translator%20newsletter&body=Please%20add%20${encodeURIComponent(email)}%20to%20the%20newsletter.`;
    setDone(true);
  }

  if (done) {
    return (
      <div className="tr-newsletter glass tr-newsletter-done">
        <p>Thanks! We received your request.</p>
      </div>
    );
  }

  return (
    <form className="tr-newsletter glass" onSubmit={submit}>
      <div>
        <p className="tr-newsletter-title">Stay updated</p>
        <p className="tr-newsletter-desc">New languages, features, and tips. No spam.</p>
      </div>
      <div className="tr-newsletter-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          aria-label="Email for newsletter"
          required
        />
        <button type="submit" className="btn btn-primary">Subscribe</button>
      </div>
      {error && <p className="tr-newsletter-error">{error}</p>}
    </form>
  );
}
