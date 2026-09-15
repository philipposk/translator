"use client";

import { useEffect, useState } from "react";

type Usage = {
  plan: string;
  period: string;
  usedSeconds: number;
  capSeconds: number;
  remainingSeconds: number;
  overSttLimit: boolean;
  usedChars: number;
  capChars: number;
  remainingChars: number;
  overCharsLimit: boolean;
  overLimit: boolean;
  engines?: {
    translation: { primary: string; available: string[]; deeplConfigured: boolean; googleConfigured: boolean };
    stt: { primary: string; groqConfigured: boolean };
  };
};

function fmtMins(sec: number) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function fmtChars(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

function MeterBar({ pct, danger }: { pct: number; danger: boolean }) {
  return (
    <div style={{ height: 6, borderRadius: 9999, background: "rgba(255,255,255,0.08)", overflow: "hidden", flex: 1, minWidth: "6rem" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: danger ? "#f87171" : "var(--accent)",
          transition: "width 0.3s",
        }}
      />
    </div>
  );
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

  const sttPct = Math.min(100, Math.round((u.usedSeconds / Math.max(1, u.capSeconds)) * 100));
  const charPct = Math.min(100, Math.round((u.usedChars / Math.max(1, u.capChars)) * 100));
  const sttDanger = sttPct >= 90;
  const charDanger = charPct >= 90;

  return (
    <div className="glass" style={{ padding: "0.7rem 0.9rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            padding: "0.15rem 0.55rem",
            borderRadius: "9999px",
            background: "var(--accent)",
            color: "#000",
          }}
        >
          {u.plan}
        </span>
        {u.engines && (
          <span style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }} title={`Engines: ${u.engines.translation.available.join(", ")}`}>
            MT: {u.engines.translation.primary}
            {u.engines.translation.deeplConfigured && " · DeepL"}
          </span>
        )}
        {u.overLimit && <span style={{ fontSize: "0.72rem", color: "#f87171" }}>Monthly limit reached</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.72rem", color: sttDanger ? "#f87171" : "var(--fg-muted)", minWidth: "5.5rem" }} title="Live Groq + file uploads">
          Voice/file
        </span>
        <MeterBar pct={sttPct} danger={sttDanger} />
        <span style={{ fontSize: "0.72rem", color: sttDanger ? "#f87171" : "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>
          {fmtMins(u.usedSeconds)} / {fmtMins(u.capSeconds)}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.72rem", color: charDanger ? "#f87171" : "var(--fg-muted)", minWidth: "5.5rem" }} title="Typed, camera, and translated text characters">
          Translation
        </span>
        <MeterBar pct={charPct} danger={charDanger} />
        <span style={{ fontSize: "0.72rem", color: charDanger ? "#f87171" : "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>
          {fmtChars(u.usedChars)} / {fmtChars(u.capChars)} chars
        </span>
      </div>
    </div>
  );
}
