"use client";

import { WORKSPACE_MODES } from "@/lib/modes";
import type { WorkspaceMode } from "@/lib/settings";

/** Quick escape hatch between workspace modes (especially on camera). */
export function ModeSwitcher({ current }: { current: WorkspaceMode }) {
  return (
    <nav className="tr-mode-switch" aria-label="Switch translation mode">
      {WORKSPACE_MODES.map((m) => (
        <a
          key={m.id}
          href={m.href}
          className={current === m.id ? "on" : undefined}
          aria-current={current === m.id ? "page" : undefined}
        >
          {m.label}
        </a>
      ))}
    </nav>
  );
}
