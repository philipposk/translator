"use client";

import { useEffect, useState } from "react";
import { SOURCE_LANGS, TARGET_LANGS } from "@/lib/langs";
import { getSettings, setSettings, type LiveMode, type SttEngine, type WorkspaceMode } from "@/lib/settings";
import { WORKSPACE_MODES } from "@/lib/modes";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LangPicker } from "@/components/translate/LangPicker";
import { UsageBar } from "@/components/translate/UsageBar";

const ENGINES: { id: SttEngine; label: string; hint: string }[] = [
  { id: "auto", label: "Auto", hint: "Best available engine for your device" },
  { id: "webspeech", label: "On-device (free)", hint: "Instant, Chrome/Android only" },
  { id: "groq", label: "Whisper", hint: "Works everywhere, ~2-4s, metered" },
  { id: "deepgram", label: "Deepgram", hint: "Low-latency streaming when configured" },
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
  const [mode, setMode] = useState<WorkspaceMode>("live");
  const [liveMode, setLiveMode] = useState<LiveMode>("conversation");
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("en");
  const [engine, setEngine] = useState<SttEngine>("auto");
  const [convAuto, setConvAuto] = useState(false);
  const [convAlternate, setConvAlternate] = useState(true);
  const [flipSide, setFlipSide] = useState(false);
  const [engines, setEngines] = useState<{
    translation: { primary: string; available: string[]; deeplConfigured: boolean; googleConfigured: boolean };
    stt: { primary: string; groqConfigured: boolean; deepgramConfigured: boolean };
  } | null>(null);
  const [systemIssues, setSystemIssues] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSettings();
    setMode(s.mode);
    setLiveMode(s.liveMode);
    setSource(s.sourceLang);
    setTarget(s.targetLang === "auto" ? "en" : s.targetLang);
    setEngine(s.sttEngine);
    setConvAuto(s.convAuto);
    setConvAlternate(s.convAlternate);
    setFlipSide(s.flipSide);
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.engines) setEngines(d.engines);
        if (d?.system && !d.system.ok) setSystemIssues(d.system.issues || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const el = document.getElementById("pa-voice-settings");
      if (!el) return;
      const { mountVoiceSettingsPanel } = await import("@page-assistant/widget");
      if (cancelled) return;
      mountVoiceSettingsPanel(el, { title: "Translator assistant" });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/login";
  }

  async function deleteAccount() {
    if (deleteConfirm.trim() !== "DELETE") {
      setDeleteError('Type DELETE in the box to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deletion failed");
      await createClient().auth.signOut();
      window.location.href = "/";
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Deletion failed");
      setDeleting(false);
    }
  }

  return (
    <div className="tr-workspace" style={{ maxWidth: "40rem" }}>
      <PageHeader title="Settings" description="Defaults, usage limits, and account." />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {systemIssues.length > 0 && (
        <div className="tr-health-banner" role="status">
          <strong>Backend notice:</strong> {systemIssues[0]}
          {systemIssues.length > 1 && (
            <span title={systemIssues.join("\n")}> (+{systemIssues.length - 1} more)</span>
          )}
        </div>
      )}

      <section className="glass" style={{ padding: "1rem 1.25rem" }}>
        <h2 style={sectionTitle}>Plan & usage</h2>
        <UsageBar />
      </section>

      <section className="glass" style={{ padding: "1rem 1.25rem" }}>
        <h2 style={sectionTitle}>Translation engines</h2>
        {engines ? (
          <div style={{ fontSize: "0.85rem", color: "var(--fg-muted)", lineHeight: 1.55 }}>
            <p style={{ margin: "0 0 0.5rem" }}>
              Active: <strong style={{ color: "var(--fg)" }}>{engines.translation.primary}</strong>
              {engines.translation.deeplConfigured ? (
                <span style={{ color: "var(--accent)" }}> · DeepL enabled</span>
              ) : (
                <span>
                  {" "}
                  · DeepL not configured. Add <code>DEEPL_API_KEY</code> in Vercel for best quality.
                </span>
              )}
            </p>
            <p style={{ margin: "0 0 0.5rem" }}>Fallback chain: {engines.translation.available.join(" → ")}</p>
            <p style={{ margin: 0 }}>
              Live STT: <strong style={{ color: "var(--fg)" }}>{engines.stt.primary}</strong>
              {engines.stt.deepgramConfigured ? " · Deepgram ready" : " · add DEEPGRAM_API_KEY for streaming STT"}
            </p>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--fg-muted)" }}>Loading…</p>
        )}
      </section>

      <section id="assistant" className="glass" style={{ padding: "0.5rem 1.25rem 1rem" }}>
        <h2 style={sectionTitle}>Page assistant</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--fg-muted)", lineHeight: 1.5, margin: "0 0 0.75rem" }}>
          Voice and read-aloud for the floating assistant (gear icon in the widget).
        </p>
        <div id="pa-voice-settings" />
      </section>

      <section className="glass" style={{ padding: "0.5rem 1.25rem 1rem" }}>
        <h2 style={sectionTitle}>Defaults</h2>
        <p style={{ fontSize: "0.82rem", color: "var(--fg-muted)", margin: "0 0 0.5rem", lineHeight: 1.45 }}>
          Saved on this device. Languages and mode update automatically when you use the workspace.
        </p>
        <Row label="Open app in">
          <select
            value={mode}
            onChange={(e) => { const v = e.target.value as WorkspaceMode; setMode(v); setSettings({ mode: v }); }}
            style={selectStyle}
          >
            {WORKSPACE_MODES.map((m) => (
              <option key={m.id} value={m.id} style={{ background: "#15151c" }}>{m.label}</option>
            ))}
          </select>
        </Row>
        <Row label="Live mode default">
          <select
            value={liveMode}
            onChange={(e) => { const v = e.target.value as LiveMode; setLiveMode(v); setSettings({ liveMode: v }); }}
            style={selectStyle}
          >
            <option value="conversation" style={{ background: "#15151c" }}>Conversation</option>
            <option value="captions" style={{ background: "#15151c" }}>Captions</option>
          </select>
        </Row>
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
            {ENGINES.filter((x) => x.id !== "deepgram" || engines?.stt.deepgramConfigured).map((x) => (
              <option key={x.id} value={x.id} style={{ background: "#15151c" }}>{x.label}</option>
            ))}
          </select>
        </Row>
        <Row label="Conversation: auto-detect language">
          <button
            type="button"
            onClick={() => { const v = !convAuto; setConvAuto(v); setSettings({ convAuto: v }); }}
            className="btn"
            style={{ padding: "0.35rem 0.9rem", background: convAuto ? "var(--accent)" : "rgba(255,255,255,0.06)", color: convAuto ? "#000" : "var(--fg-muted)" }}
          >
            {convAuto ? "On" : "Off"}
          </button>
        </Row>
        <Row label="Conversation: auto-switch speaker">
          <button
            type="button"
            onClick={() => { const v = !convAlternate; setConvAlternate(v); setSettings({ convAlternate: v }); }}
            className="btn"
            style={{ padding: "0.35rem 0.9rem", background: convAlternate ? "var(--accent)" : "rgba(255,255,255,0.06)", color: convAlternate ? "#000" : "var(--fg-muted)" }}
            title="After each phrase, listen for the other language (manual mode)"
          >
            {convAlternate ? "On" : "Off"}
          </button>
        </Row>
        <Row label="Face-to-face flip (Live)">
          <button
            type="button"
            onClick={() => { const v = !flipSide; setFlipSide(v); setSettings({ flipSide: v }); }}
            className="btn"
            style={{ padding: "0.35rem 0.9rem", background: flipSide ? "var(--accent)" : "rgba(255,255,255,0.06)", color: flipSide ? "#000" : "var(--fg-muted)" }}
          >
            {flipSide ? "On" : "Off"}
          </button>
        </Row>
      </section>

      <section className="glass" style={{ padding: "0.5rem 1.25rem 1rem" }}>
        <h2 style={sectionTitle}>Account</h2>
        <Row label="Signed in as"><span style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>{email || "—"}</span></Row>
        <Row label="History">
          <a href="/history" className="btn btn-ghost" style={{ padding: "0.35rem 0.9rem", fontSize: "0.8rem" }}>
            Manage
          </a>
        </Row>
        <Row label="Help">
          <a href="/help" className="btn btn-ghost" style={{ padding: "0.35rem 0.9rem", fontSize: "0.8rem" }}>
            Documentation
          </a>
        </Row>
        <Row label="Privacy">
          <a href="/privacy" className="btn btn-ghost" style={{ padding: "0.35rem 0.9rem", fontSize: "0.8rem" }}>
            Policy
          </a>
        </Row>
        <div style={{ paddingTop: "0.85rem" }}>
          <button onClick={signOut} className="btn btn-ghost" style={{ padding: "0.45rem 1.1rem" }}>Sign out</button>
        </div>
      </section>

      <section className="glass tr-danger" style={{ padding: "1rem 1.25rem" }}>
        <h2 style={sectionTitle}>Danger zone</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--fg-muted)", lineHeight: 1.5, margin: "0 0 0.75rem" }}>
          Permanently delete your account, all history, and usage data. This cannot be undone.
        </p>
        <input
          type="text"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder='Type DELETE to confirm'
          aria-label="Confirm account deletion"
          style={{
            width: "100%",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.6rem",
            border: "1px solid rgba(248,113,113,0.35)",
            background: "rgba(248,113,113,0.06)",
            color: "var(--fg)",
            fontSize: "0.85rem",
            marginBottom: "0.65rem",
          }}
        />
        {deleteError && <p style={{ color: "#f87171", fontSize: "0.82rem", margin: "0 0 0.5rem" }}>{deleteError}</p>}
        <button
          type="button"
          onClick={deleteAccount}
          disabled={deleting || deleteConfirm.trim() !== "DELETE"}
          className="btn btn-ghost"
          style={{ padding: "0.45rem 1rem", color: "#f87171", borderColor: "rgba(248,113,113,0.35)" }}
        >
          {deleting ? "Deleting…" : "Delete my account"}
        </button>
      </section>
      </div>

      <SiteFooter compact />
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)", margin: "0.5rem 0 0.25rem", fontWeight: 700 };
const selectStyle: React.CSSProperties = { padding: "0.4rem 0.75rem", borderRadius: "0.6rem", border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "var(--fg)", fontSize: "0.85rem", fontWeight: 600 };
