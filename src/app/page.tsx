const LANGUAGES = ["Greek", "Spanish", "French", "Japanese", "Arabic", "German", "Portuguese", "Mandarin"];

const FEATURES = [
  { icon: "🎙️", title: "Live voice", body: "Point your mic at a speaker for instant captions, or run a two-sided conversation — one side flips 180° so you can sit opposite." },
  { icon: "⌨️", title: "Text & files", body: "Paste text for instant translation, or drop an audio/video file and get a translated transcript." },
  { icon: "📷", title: "Camera", body: "Point your camera at a sign, menu or document — it reads the text and translates it on the spot." },
  { icon: "📲", title: "Installable app", body: "Add it to your home screen. Works like a native app, online anywhere." },
];

export default function Home() {
  return (
    <>
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1.1rem" }}>Translator</span>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <a href="https://6x7.gr" style={{ color: "var(--fg-muted)", fontSize: "0.8rem" }}>by 6x7.gr</a>
          <a href="/app" className="btn btn-ghost" style={{ padding: "0.4rem 1rem" }}>Open app</a>
        </div>
      </nav>
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>
      <div style={{ marginBottom: "4rem" }}>
        <p style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.875rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1rem" }}>
          Voice translation
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "1.25rem" }}>
          Translate anything,
          <br />
          <span style={{ color: "var(--accent)" }}>in any language.</span>
        </h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "1.1rem", lineHeight: 1.6, maxWidth: "36rem", marginBottom: "1.5rem" }}>
          Live voice, a conversation across the table, text you paste, a file you drop, or text your
          camera sees — translated instantly. Install it and use it anywhere.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {LANGUAGES.map((lang) => (
            <span key={lang} style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.1)", color: "var(--fg-muted)" }}>
              {lang}
            </span>
          ))}
          <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", color: "var(--fg-muted)" }}>+ more</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a href="/app" className="btn btn-primary">Try translating →</a>
          <a href="https://6x7.gr" className="btn btn-ghost">More projects</a>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {FEATURES.map((f) => (
          <div key={f.title} className="glass" style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{f.icon}</div>
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{f.title}</h3>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>{f.body}</p>
          </div>
        ))}
      </div>
    </div>
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "var(--fg-muted)", fontSize: "0.75rem", textAlign: "center", padding: "1.5rem" }}>
        Translator · part of <a href="https://6x7.gr" style={{ color: "var(--accent)" }}>6x7.gr</a>
      </footer>
    </>
  );
}
