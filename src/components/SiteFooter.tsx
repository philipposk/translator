const LINKS = [
  { href: "/help", label: "Help" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter({ compact }: { compact?: boolean }) {
  return (
    <footer className={`tr-site-footer ${compact ? "compact" : ""}`}>
      <nav aria-label="Legal and help">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
      <span>
        Translator · part of{" "}
        <a href="https://6x7.gr" target="_blank" rel="noopener noreferrer">
          6x7.gr
        </a>
      </span>
    </footer>
  );
}
