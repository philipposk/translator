"use client";

import type { WorkspaceMode } from "@/lib/settings";

const MODES: { id: WorkspaceMode; label: string; icon: string }[] = [
  { id: "live", label: "Live", icon: "🎙️" },
  { id: "text", label: "Text", icon: "⌨️" },
  { id: "file", label: "File", icon: "📄" },
  { id: "camera", label: "Camera", icon: "📷" },
];

export function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: WorkspaceMode;
  onChange: (m: WorkspaceMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Translation mode"
      style={{
        display: "flex",
        gap: "0.4rem",
        flexWrap: "wrap",
        padding: "0.3rem",
        borderRadius: "9999px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border)",
      }}
    >
      {MODES.map((m) => {
        const active = m.id === mode;
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.id)}
            className="btn"
            style={{
              padding: "0.45rem 1rem",
              background: active ? "var(--accent)" : "transparent",
              color: active ? "#000" : "var(--fg-muted)",
              fontWeight: 600,
            }}
          >
            <span aria-hidden>{m.icon}</span>
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
