"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=/app` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function signInWithGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=/app` },
    });
    if (error) setError(error.message);
  }

  return (
    <div style={{ maxWidth: "26rem", margin: "0 auto", padding: "5rem 1.5rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Sign in to Translator
        </h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem" }}>
          One 6x7 account works on every app. If you signed in at 6x7.gr you may
          already be in.
        </p>
      </div>

      {sent ? (
        <div className="glass" style={{ padding: "1.25rem", textAlign: "center", fontSize: "0.9rem" }}>
          Check your email for a sign-in link.
        </div>
      ) : (
        <>
          <button
            onClick={signInWithGoogle}
            className="btn"
            style={{ width: "100%", background: "white", color: "black", marginBottom: "1rem" }}
          >
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.7rem", color: "var(--fg-muted)", margin: "1rem 0" }}>
            <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            or
            <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          <form onSubmit={signInWithEmail} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                padding: "0.7rem 0.9rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                color: "var(--fg)",
                fontSize: "0.9rem",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              {loading ? "Sending…" : "Email me a magic link"}
            </button>
          </form>
        </>
      )}

      {error && (
        <p style={{ marginTop: "1rem", textAlign: "center", color: "#f87171", fontSize: "0.85rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
