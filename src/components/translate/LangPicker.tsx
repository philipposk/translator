"use client";

import type { Lang } from "@/lib/langs";

export function LangPicker({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (code: string) => void;
  options: Lang[];
  ariaLabel?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        appearance: "none",
        padding: "0.4rem 1.75rem 0.4rem 0.75rem",
        borderRadius: "0.6rem",
        border: "1px solid var(--border)",
        background:
          "rgba(255,255,255,0.04) url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\") no-repeat right 0.6rem center",
        color: "var(--fg)",
        fontSize: "0.85rem",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {options.map((l) => (
        <option key={l.code} value={l.code} style={{ background: "#15151c", color: "var(--fg)" }}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
