"use client";

import { useEffect, useState } from "react";
import { SOURCE_LANGS, TARGET_LANGS } from "@/lib/langs";
import { getSettings, setSettings, type SttEngine } from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";
import { LangPicker } from "@/components/translate/LangPicker";
import { UsageBar } from "@/components/translate/UsageBar";

const ENGINES: { id: SttEngine; label: string; hint: string }[] = [
  { id: "auto", label: "Auto", hint: "Web Speech where supported, else Whisper" },
  { id: "webspeech", label: "On-device (free)", hint: "Instant, Chrome/Android only" },
  { id: "groq", label: "Whisper", hint: "Works everywhere, ~2-4s, metered" },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.75rem 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: "0.9rem" }}>{label}</span>
      {children}
    </div>
  );
}

export function SettingsClient({ email }: { email: string | null }) {
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("en");
  const [engine, setEngine] = useState<SttEngine>("auto");
  const [convAuto, setConvAuto] = useState(false);

  useEffect(() => {
    const s = getSettings();
    setSource(s.sourceLang);
    setTarget(s.targetLang === "auto" ? "en" : s.targetLang);
    setEngine(s.sttEngine);
    setConvAuto(s.convAuto);
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "2rem 1.25rem 4rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Settings</h1>

      <section className="glass" style={{ padding: "1rem 1.25rem" }}>
        <h2 style={sectionTitle}>Plan & usage</h2>
        <UsageBar />
      </section>

      <section className="glass" style={{ padding: "0.5rem 1.25rem 1rem" }}>
        <h2 style={sectionTitle}>Defaults</h2>
        <Row label="Default source language">
          <LangPicker value={source} options={SOURCE_LANGS} ariaLabel="Default source" onChange={(c) => { setSource(c); setSettings({ sourceLang: c }); }} />
        </Row>
        <Row label="Default target language">
          <LangPicker value={target} options={TARGET_LANGS} ariaLabel="Default target" onChange={(c) => { setTarget(c); setSettings({ targetLang: c }); }} />
        </Row>
        <Row label="Live speech engine">
          <select
            value={engine}
            onChange={(e) => { const v = e.target.value as SttEngine; setEngine(v); setSettings({ sttEngine: v }); }}
            style={selectStyle}
            title={ENGINES.find((x) => x.id === engine)?.hint}
          >
            {ENGINES.map((x) => <option key={x.id} value={x.id} style={{ background: "#15151c" }}>{x.label}</option>)}
          </select>
        </Row>
        <Row label="Conversation: auto-detect language">
          <button
            onClick={() => { const v = !convAuto; setConvAuto(v); setSettings({ convAuto: v }); }}
            className="btn"
            style={{ padding: "0.35rem 0.9rem", background: convAuto ? "var(--accent)" : "rgba(255,255,255,0.06)", color: convAuto ? "#000" : "var(--fg-muted)" }}
          >
            {convAuto ? "On" : "Off"}
          </button>
        </Row>
      </section>

      <section className="glass" style={{ padding: "0.5rem 1.25rem 1rem" }}>
        <h2 style={sectionTitle}>Account</h2>
        <Row label="Signed in as"><span style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>{email || "—"}</span></Row>
        <Row label="History"><a href="/history" className="btn btn-ghost" style={{ padding: "0.35rem 0.9rem", fontSize: "0.8rem" }}>Manage</a></Row>
        <div style={{ paddingTop: "0.85rem" }}>
          <button onClick={signOut} className="btn btn-ghost" style={{ padding: "0.45rem 1.1rem" }}>Sign out</button>
        </div>
      </section>

      <p style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--fg-muted)" }}>
        Translator · part of <a href="https://6x7.gr" style={{ color: "var(--accent)" }}>6x7.gr</a>
      </p>
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)", margin: "0.5rem 0 0.25rem", fontWeight: 700 };
const selectStyle: React.CSSProperties = { padding: "0.4rem 0.75rem", borderRadius: "0.6rem", border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "var(--fg)", fontSize: "0.85rem", fontWeight: 600 };
