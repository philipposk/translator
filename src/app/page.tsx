import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { WORKSPACE_MODES } from "@/lib/modes";

const LANGUAGES = ["Portuguese", "English", "Greek", "Spanish", "French", "Japanese", "Arabic", "German"];

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="main-content" style={{ maxWidth: "56rem", margin: "0 auto", padding: "3rem 1.5rem 4rem" }}>
        <div style={{ marginBottom: "3.5rem" }}>
          <p
            style={{
              color: "var(--accent)",
              fontWeight: 600,
              fontSize: "0.875rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            Voice &amp; text translation
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "1.25rem",
            }}
          >
            Talk across languages,
            <br />
            <span style={{ color: "var(--accent)" }}>in real time.</span>
          </h1>
          <p
            style={{
              color: "var(--fg-muted)",
              fontSize: "1.1rem",
              lineHeight: 1.6,
              maxWidth: "36rem",
              marginBottom: "1.5rem",
            }}
          >
            Live conversation mode for Portuguese and English across the table. Paste text, upload
            recordings, or scan signs with your camera. Install it and use it anywhere.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            {LANGUAGES.map((lang) => (
              <span
                key={lang}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "var(--btn-radius)",
                  border: "1px solid var(--border)",
                  color: "var(--fg-muted)",
                }}
              >
                {lang}
              </span>
            ))}
            <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem", color: "var(--fg-muted)" }}>
              + more
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a href="/app/live" className="btn btn-primary">
              Start live translation
            </a>
            <a href="/help" className="btn btn-ghost">
              How it works
            </a>
          </div>
        </div>

        <h2 style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-muted)", marginBottom: "1rem", fontWeight: 700 }}>
          Workspace
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {WORKSPACE_MODES.map((f) => (
            <a key={f.id} href={f.href} className="glass tr-mode-card" style={{ padding: "1.35rem", textDecoration: "none", color: "inherit", display: "block" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "0.45rem" }}>{f.label}</h3>
              <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>{f.description}</p>
            </a>
          ))}
        </div>

        <NewsletterSignup />
      </main>
      <SiteFooter />
    </>
  );
}
