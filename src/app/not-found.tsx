export default function NotFound() {
  return (
    <div style={{ maxWidth: "32rem", margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Page not found</h1>
      <p style={{ color: "var(--fg-muted)", marginBottom: "1.5rem" }}>That page doesn&apos;t exist.</p>
      <a href="/app" className="btn btn-primary">Open Translator</a>
    </div>
  );
}
