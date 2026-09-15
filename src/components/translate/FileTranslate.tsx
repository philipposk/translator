"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SOURCE_LANGS, TARGET_LANGS, labelOf } from "@/lib/langs";
import { getSettings, setSettings } from "@/lib/settings";
import { LangPicker } from "./LangPicker";
import { ExportMenu } from "@/components/ExportMenu";

const UPLOAD_BUCKET = "translator-uploads";
const TRANSLATE_BATCH = 8;

type Seg = { idx: number; start: number; end: number; text: string; translation: string };

function fmt(s: number) {
  const t = Math.floor(s || 0);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
function mb(n: number) {
  return (n / 1024 / 1024).toFixed(1) + " MB";
}

export function FileTranslate() {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("en");
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [segs, setSegs] = useState<Seg[] | null>(null);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [langMismatch, setLangMismatch] = useState<string | null>(null);

  useEffect(() => {
    const s = getSettings();
    setSource("auto");
    setTarget(s.targetLang === "auto" ? "en" : s.targetLang);
  }, []);

  async function handle(file: File) {
    setError("");
    setSegs(null);
    setDetectedLang(null);
    setLangMismatch(null);
    setBusy(true);
    try {
      const CAP = 25 * 1024 * 1024;
      if (file.size > CAP) {
        throw new Error(`This file is ${mb(file.size)} — over the 25 MB limit. Try a shorter clip.`);
      }
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();

      setStage("Starting upload…");
      const cRes = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "file", ext, source_lang: source, target_lang: target, source_name: file.name }),
      });
      const c = await cRes.json();
      if (!cRes.ok) throw new Error(c.error || "Could not start upload");

      setStage(`Uploading ${mb(file.size)}…`);
      const up = await supabase.storage.from(UPLOAD_BUCKET).uploadToSignedUrl(c.path, c.token, file, {
        contentType: file.type || "application/octet-stream",
      });
      if (up.error) throw new Error("Upload failed: " + up.error.message);

      setStage("Transcribing…");
      const trRes = await fetch("/api/file/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, source_lang: source }),
      });
      const tr = await trRes.json();
      if (!trRes.ok) throw new Error(tr.error || "Transcription failed");

      const total = Number(tr.total ?? tr.segments?.length ?? 0);
      if (tr.detected_lang) setDetectedLang(String(tr.detected_lang));
      if (tr.lang_mismatch) setLangMismatch(String(tr.lang_mismatch));
      setSegs((tr.segments as Seg[]) || []);

      let offset = 0;
      let done = total === 0;
      let segments: Seg[] = tr.segments ?? [];

      while (!done) {
        setStage(`Translating ${Math.min(offset + TRANSLATE_BATCH, total)} / ${total} segments…`);
        const txRes = await fetch("/api/file/translate-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: c.id, target_lang: target, offset, limit: TRANSLATE_BATCH }),
        });
        const tx = await txRes.json();
        if (!txRes.ok) throw new Error(tx.error || "Translation failed");
        segments = (tx.segments as Seg[]) ?? segments;
        setSegs([...segments]);
        done = !!tx.done;
        offset = Number(tx.next_offset ?? offset + TRANSLATE_BATCH);
        if (tx.detected_lang) setDetectedLang(String(tx.detected_lang));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>From</span>
        <LangPicker value={source} onChange={(c) => { setSource(c); }} options={SOURCE_LANGS} ariaLabel="Source language" />
        <span style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>to</span>
        <LangPicker
          value={target}
          onChange={(c) => { setTarget(c); setSettings({ targetLang: c }); }}
          options={TARGET_LANGS}
          ariaLabel="Target language"
        />
      </div>

      <div
        className="glass"
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!busy && e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); }}
        style={{
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          cursor: busy ? "default" : "pointer",
          border: `1.5px dashed ${over ? "var(--accent)" : "var(--border)"}`,
        }}
      >
        {busy ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", color: "var(--fg-muted)" }}>
            <span className="tr-spin" /> {stage}
          </div>
        ) : (
          <>
            <p style={{ fontSize: "1.05rem", margin: "0 0 0.4rem" }}>Drop an audio or video file, or click to choose</p>
            <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: "0.85rem" }}>
              m4a · mp3 · wav · mp4 · webm — up to 25 MB · leave source on Detect language
            </p>
          </>
        )}
      </div>

      {error && <p style={{ color: "#f87171", fontSize: "0.85rem" }}>{error}</p>}

      {langMismatch && <p style={{ color: "#fbbf24", fontSize: "0.85rem" }}>{langMismatch}</p>}

      {segs && (
        <div className="glass" style={{ padding: "1rem 1.1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              {segs.length} segments → {labelOf(target)}
              {detectedLang && <> · detected {labelOf(detectedLang)}</>}
            </p>
            <ExportMenu segments={segs} baseName="transcript" />
          </div>
          {segs.length === 0 && <p style={{ color: "var(--fg-muted)" }}>No speech detected.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {segs.map((s) => (
              <div key={s.idx} style={{ display: "grid", gridTemplateColumns: "3.2rem 1fr", gap: "0.6rem" }}>
                <span style={{ color: "var(--fg-muted)", fontSize: "0.75rem", fontVariantNumeric: "tabular-nums" }}>{fmt(s.start)}</span>
                <div>
                  <p style={{ margin: "0 0 0.2rem", color: "var(--fg-muted)", fontSize: "0.85rem" }}>{s.text}</p>
                  <p style={{ margin: 0, fontSize: "0.98rem", color: s.translation ? "var(--fg)" : "var(--fg-muted)" }}>
                    {s.translation || (busy ? "…" : "—")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*,.m4a,.mp3,.wav,.ogg,.webm,.mp4,.m4v,.mov"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
      />
    </div>
  );
}
