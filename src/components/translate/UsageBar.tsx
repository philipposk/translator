"use client";

import { useEffect, useState } from "react";

type Usage = {
  plan: string;
  period: string;
  usedSeconds: number;
  capSeconds: number;
  remainingSeconds: number;
  overLimit: boolean;
};

function fmtMins(sec: number) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function UsageBar() {
  const [u, setU] = useState<Usage | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && d && setU(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!u) return null;
  const pct = Math.min(100, Math.round((u.usedSeconds / Math.max(1, u.capSeconds)) * 100));
  const danger = pct >= 90;

  return (
    <div className="glass" style={{ padding: "0.7rem 0.9rem", display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.55rem", borderRadius: "9999px", background: "var(--accent)", color: "#000" }}>
        {u.plan}
      </span>
      <div style={{ flex: 1, minWidth: "8rem" }}>
        <div style={{ height: 6, borderRadius: 9999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: danger ? "#f87171" : "var(--accent)", transition: "width 0.3s" }} />
        </div>
      </div>
      <span style={{ fontSize: "0.75rem", color: danger ? "#f87171" : "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }} title="Voice & file translation use speech-to-text, which is metered. Typed text and camera translation are unlimited.">
        {fmtMins(u.usedSeconds)} / {fmtMins(u.capSeconds)} voice &amp; file translation this month
      </span>
      {u.overLimit && <span style={{ fontSize: "0.72rem", color: "#f87171" }}>Limit reached</span>}
    </div>
  );
}
