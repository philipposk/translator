"use client";

// Catches errors in the root layout itself; must render its own <html>/<body>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#07070a", color: "#ededed", fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", margin: 0 }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</h1>
          <p style={{ color: "#999", marginBottom: "1.25rem" }}>The app hit an unexpected error.</p>
          <button
            onClick={reset}
            style={{ background: "#34d399", color: "#000", border: 0, borderRadius: 9999, padding: "0.6rem 1.5rem", fontWeight: 600, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
