"use client";

import { useEffect, useSyncExternalStore } from "react";

const KEY = "tr_theme";
export type ThemeMode = "light" | "dark" | "auto";

export { THEME_BOOT } from "@/lib/theme-boot";

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function read(): ThemeMode {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "auto";
  } catch {
    return "auto";
  }
}
function apply(mode: ThemeMode) {
  const light = mode === "light" || (mode === "auto" && window.matchMedia("(prefers-color-scheme: light)").matches);
  if (light) document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
}
export function setThemeMode(mode: ThemeMode) {
  try {
    if (mode === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
  apply(mode);
  listeners.forEach((l) => l());
}
export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, read, () => "auto" as ThemeMode);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeMode();
  useEffect(() => {
    apply(mode);
    if (mode !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const on = () => apply("auto");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [mode]);
  return <>{children}</>;
}

/** Header button: cycles Dark -> Light -> Auto. */
export function ThemeToggle() {
  const mode = useThemeMode();
  const next: ThemeMode = mode === "dark" ? "light" : mode === "light" ? "auto" : "dark";
  const label = mode === "dark" ? "Dark" : mode === "light" ? "Light" : "Auto";
  return (
    <button
      type="button"
      onClick={() => setThemeMode(next)}
      className="btn btn-ghost tr-theme-toggle"
      aria-label={`Theme: ${label}. Switch to ${next}.`}
      title={`Theme: ${label}`}
    >
      {mode === "light" ? "☀" : mode === "dark" ? "☾" : "◐"}
    </button>
  );
}

/** Settings > Appearance. Auto follows the phone or computer. */
export function ThemeSegments() {
  const mode = useThemeMode();
  return (
    <div role="radiogroup" aria-label="Theme" style={{ display: "flex", gap: "0.5rem" }}>
      {(["light", "dark", "auto"] as ThemeMode[]).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => setThemeMode(m)}
          className={`btn ${mode === m ? "btn-primary" : "btn-ghost"}`}
        >
          {m === "light" ? "Light" : m === "dark" ? "Dark" : "Auto"}
        </button>
      ))}
    </div>
  );
}
