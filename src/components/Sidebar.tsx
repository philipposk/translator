"use client";

import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WORKSPACE_MODES } from "@/lib/modes";
import { InstallButton } from "@/components/InstallButton";
import { OnboardingTour } from "@/components/OnboardingTour";
import {
  LogoMark,
  IconLive,
  IconText,
  IconFile,
  IconCamera,
  IconHistory,
  IconSettings,
  IconHelp,
} from "@/components/icons";
import { SiteFooter } from "@/components/SiteFooter";

const MODE_ICONS = {
  live: IconLive,
  text: IconText,
  file: IconFile,
  camera: IconCamera,
} as const;

const SECONDARY = [
  { href: "/history", label: "History", Icon: IconHistory },
  { href: "/settings", label: "Settings", Icon: IconSettings },
  { href: "/help", label: "Help", Icon: IconHelp },
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
      <OnboardingTour />
      <a href="/app" className="tr-brand">
        <LogoMark />
        <div className="tr-brand-text">
          <span>Translator</span>
          <small>by 6x7.gr</small>
        </div>
      </a>

      <div className="tr-nav-section">
        <span className="tr-nav-label">Workspace</span>
        <nav className="tr-nav" aria-label="Translation modes">
          {WORKSPACE_MODES.map((m) => {
            const Icon = MODE_ICONS[m.id];
            return (
              <a key={m.href} href={m.href} className={`tr-nav-item ${active(m.href) ? "on" : ""}`}>
                <Icon />
                <span className="tr-nav-copy">
                  <span className="tr-nav-title">{m.label}</span>
                  <span className="tr-nav-hint">{m.description}</span>
                </span>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="tr-nav-section">
        <span className="tr-nav-label">Library</span>
        <nav className="tr-nav" aria-label="Library">
          {SECONDARY.map((n) => (
            <a key={n.href} href={n.href} className={`tr-nav-item compact ${active(n.href) ? "on" : ""}`}>
              <n.Icon />
              <span className="tr-nav-title">{n.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <div className="tr-sidefoot">
        <InstallButton />
        {email && (
          <div className="tr-user">
            <span className="tr-email" title={email}>
              {email}
            </span>
            <button type="button" onClick={signOut} className="btn btn-ghost tr-signout">
              Sign out
            </button>
          </div>
        )}
        <SiteFooter compact />
      </div>
    </aside>
  );
}
