import { LogoMark } from "@/components/icons";

export function SiteNav({ showCta = true }: { showCta?: boolean }) {
  return (
    <header className="tr-site-nav">
      <a href="/" className="tr-site-brand">
        <LogoMark size={28} />
        <span>Translator</span>
      </a>
      <nav className="tr-site-links" aria-label="Site">
        <a href="/help">Help</a>
        <a href="/about">About</a>
        <a href="https://6x7.gr" target="_blank" rel="noopener noreferrer">
          6x7.gr
        </a>
        {showCta && (
          <a href="/app" className="btn btn-primary" style={{ padding: "0.45rem 1.1rem" }}>
            Open app
          </a>
        )}
      </nav>
    </header>
  );
}
