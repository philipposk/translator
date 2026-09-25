import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteNav showCta />
      <main id="main-content" style={{ maxWidth: "32rem", margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "4rem", fontWeight: 800, color: "var(--accent)", margin: "0 0 0.5rem", lineHeight: 1 }}>404</p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Page not found</h1>
        <p style={{ color: "var(--fg-muted)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
          That page doesn&apos;t exist. Try the workspace or help docs.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/app/live" className="btn btn-primary">Open Live translation</a>
          <a href="/help" className="btn btn-ghost">Help</a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
