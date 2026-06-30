"use client";

import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { InstallButton } from "@/components/InstallButton";

const Logo = (
  <svg width="24" height="24" viewBox="0 0 32 32" aria-hidden="true" style={{ flexShrink: 0 }}>
    <rect width="32" height="32" rx="8" fill="var(--accent)" />
    <g fill="#000">
      <rect x="7" y="8" width="18" height="4" rx="1.5" />
      <rect x="14" y="8" width="4" height="17" rx="1.5" />
    </g>
  </svg>
);

const NAV = [
  { href: "/app", label: "Translate", icon: "🌐" },
  { href: "/history", label: "History", icon: "🕘" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({ email }: { email?: string | null }) {
  const path = usePathname();
  const active = (href: string) => path === href || path.startsWith(href + "/");

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="tr-sidebar">
      <a href="/app" className="tr-brand">{Logo}<span>Translator</span></a>
      <nav className="tr-nav">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} className={`tr-nav-item ${active(n.href) ? "on" : ""}`}>
            <span aria-hidden>{n.icon}</span>
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
      <div className="tr-sidefoot">
        <InstallButton />
        {email && <span className="tr-email" title={email}>{email}</span>}
        <button onClick={signOut} className="btn btn-ghost" style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem" }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
