"use client";

import { useEffect, useState } from "react";

const KEY = "tr_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "light") document.documentElement.setAttribute("data-theme", "light");
      else document.documentElement.removeAttribute("data-theme");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  if (!ready) return <>{children}</>;
  return <>{children}</>;
}

export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.getAttribute("data-theme") === "light");
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "light");
      try { localStorage.setItem(KEY, "light"); } catch { /* ignore */ }
    } else {
      document.documentElement.removeAttribute("data-theme");
      try { localStorage.setItem(KEY, "dark"); } catch { /* ignore */ }
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost tr-theme-toggle"
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      title={light ? "Dark mode" : "Light mode"}
    >
      {light ? "☀" : "☾"}
    </button>
  );
}
