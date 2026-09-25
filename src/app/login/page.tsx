"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/icons";
import { SiteFooter } from "@/components/SiteFooter";

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
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=/app/live` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function signInWithGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=/app/live` },
    });
    if (error) setError(error.message);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none", color: "var(--fg)", fontWeight: 700 }}>
          <LogoMark size={28} />
          Translator
        </a>
      </header>
      <main id="main-content" style={{ flex: 1, maxWidth: "26rem", margin: "0 auto", padding: "2rem 1.5rem 4rem", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Sign in to Translator
          </h1>
          <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
            One 6x7 account works on every app. If you signed in at 6x7.gr you may already be in.
          </p>
        </div>

        {sent ? (
          <div className="glass" style={{ padding: "1.25rem", textAlign: "center", fontSize: "0.9rem" }}>
            Check your email for a sign-in link.
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="btn btn-ghost"
              style={{ width: "100%", marginBottom: "1rem", justifyContent: "center" }}
            >
              Continue with Google
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1rem 0", color: "var(--fg-muted)", fontSize: "0.8rem" }}>
              <hr style={{ flex: 1, border: 0, borderTop: "1px solid var(--border)" }} />
              or
              <hr style={{ flex: 1, border: 0, borderTop: "1px solid var(--border)" }} />
            </div>
            <form onSubmit={signInWithEmail}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--fg-muted)", marginBottom: "0.35rem" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "var(--btn-radius)",
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--fg)",
                  marginBottom: "0.75rem",
                  fontSize: "0.9rem",
                }}
              />
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
                {loading ? "Sending…" : "Send magic link"}
              </button>
            </form>
          </>
        )}
        {error && <p style={{ color: "#f87171", fontSize: "0.85rem", marginTop: "1rem", textAlign: "center" }}>{error}</p>}
      </main>
      <SiteFooter />
    </div>
  );
}
