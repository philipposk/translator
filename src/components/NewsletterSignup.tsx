"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="tr-newsletter glass tr-newsletter-done">
        <p>Thanks — you&apos;re on the list.</p>
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
          disabled={busy}
        />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "…" : "Subscribe"}
        </button>
      </div>
      {error && <p className="tr-newsletter-error">{error}</p>}
    </form>
  );
}
