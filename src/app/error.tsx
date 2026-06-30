"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ maxWidth: "32rem", margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</h1>
      <p style={{ color: "var(--fg-muted)", marginBottom: "1.5rem" }}>An unexpected error occurred. Try again.</p>
      <button onClick={reset} className="btn btn-primary">Retry</button>
    </div>
  );
}
