"use client";

import { useState } from "react";
import { AuthButton } from "./AuthButton";
import { ThemeToggle } from "./ThemeProvider";

type Link = { href: string; label: string };

export function MobileMenu({ links }: { links: Link[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="tr-mobile-menu-btn btn btn-ghost"
        aria-expanded={open}
        aria-controls="tr-mobile-nav"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕" : "☰"}
      </button>
      {open && (
        <nav id="tr-mobile-nav" className="tr-mobile-nav" aria-label="Mobile">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="/app" className="btn btn-primary" onClick={() => setOpen(false)}>Open app</a>
          <div className="tr-mobile-nav-meta">
            <AuthButton />
            <ThemeToggle />
          </div>
        </nav>
      )}
    </>
  );
}
