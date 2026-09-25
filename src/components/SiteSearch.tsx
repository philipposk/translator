"use client";

import { useEffect, useMemo, useState } from "react";

const PAGES = [
  { href: "/help", title: "Help", body: "Live conversation, text, file upload, camera OCR, quotas, settings" },
  { href: "/about", title: "About", body: "Translator by 6x7.gr — PT/EN live conversation focus" },
  { href: "/privacy", title: "Privacy", body: "Data we store, cookies, third-party APIs, retention" },
  { href: "/terms", title: "Terms", body: "Acceptable use, limits, liability" },
  { href: "/app/live", title: "Live translation", body: "Real-time captions and two-way conversation" },
  { href: "/app/text", title: "Text translation", body: "Paste or type to translate" },
  { href: "/app/file", title: "File upload", body: "Audio and video transcription with translation" },
  { href: "/app/camera", title: "Camera", body: "OCR signs and menus from photos" },
];

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return PAGES.slice(0, 6);
    return PAGES.filter(
      (p) => p.title.toLowerCase().includes(needle) || p.body.toLowerCase().includes(needle),
    );
  }, [q]);

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost tr-site-search-btn" onClick={() => setOpen(true)} aria-label="Search site">
        Search
      </button>
    );
  }

  return (
    <div className="tr-site-search-overlay" role="dialog" aria-modal="true" aria-label="Search site">
      <div className="tr-site-search-panel glass">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search help, modes, legal…"
          aria-label="Search query"
          autoFocus
        />
        <ul>
          {results.map((r) => (
            <li key={r.href}>
              <a href={r.href} onClick={() => setOpen(false)}>
                <strong>{r.title}</strong>
                <span>{r.body}</span>
              </a>
            </li>
          ))}
          {!results.length && <li className="muted">No matches.</li>}
        </ul>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
      </div>
      <button type="button" className="tr-site-search-backdrop" aria-label="Close search" onClick={() => setOpen(false)} />
    </div>
  );
}
