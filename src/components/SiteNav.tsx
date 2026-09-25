import { LogoMark } from "@/components/icons";
import { AuthButton } from "@/components/AuthButton";
import { ThemeToggle } from "@/components/ThemeProvider";
import { MobileMenu } from "@/components/MobileMenu";
import { OutboundLink } from "@/components/OutboundLink";

const NAV_LINKS = [
  { href: "/help", label: "Help" },
  { href: "/about", label: "About" },
];

export function SiteNav({ showCta = true }: { showCta?: boolean }) {
  return (
    <header className="tr-site-nav">
      <a href="/" className="tr-site-brand">
        <LogoMark size={28} />
        <span>Translator</span>
      </a>
      <nav className="tr-site-links tr-site-links-desktop" aria-label="Site">
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href}>{l.label}</a>
        ))}
        <OutboundLink href="https://6x7.gr">6x7.gr</OutboundLink>
        <AuthButton />
        <ThemeToggle />
        {showCta && (
          <a href="/app" className="btn btn-primary" style={{ padding: "0.45rem 1.1rem" }}>
            Open app
          </a>
        )}
      </nav>
      <div className="tr-site-links-mobile">
        <MobileMenu links={NAV_LINKS} />
      </div>
    </header>
  );
}
