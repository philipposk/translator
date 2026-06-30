export const metadata = { title: "Offline — Translator" };

export default function OfflinePage() {
  return (
    <div style={{ maxWidth: "32rem", margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📡</div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>You&apos;re offline</h1>
      <p style={{ color: "var(--fg-muted)", lineHeight: 1.6 }}>
        Translator needs a connection to translate. The app stays installed — reconnect and
        it&apos;ll pick up right where you left off.
      </p>
    </div>
  );
}
