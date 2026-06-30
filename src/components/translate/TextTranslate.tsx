"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SOURCE_LANGS, TARGET_LANGS } from "@/lib/langs";
import { getSettings, setSettings } from "@/lib/settings";
import { LangPicker } from "./LangPicker";

export function TextTranslate() {
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("en");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  // hydrate from saved settings
  useEffect(() => {
    const s = getSettings();
    setSource(s.sourceLang);
    setTarget(s.targetLang === "auto" ? "en" : s.targetLang);
  }, []);

  const run = useCallback(
    async (text: string, src: string, tgt: string) => {
      if (!text.trim()) {
        setOutput("");
        setBusy(false);
        return;
      }
      const id = ++reqId.current;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, source_lang: src, target_lang: tgt, mode: "document" }),
        });
        const data = await res.json();
        if (id !== reqId.current) return; // a newer request superseded this one
        if (!res.ok) throw new Error(data.error || "Translation failed");
        setOutput(data.translation || "");
      } catch (e) {
        if (id === reqId.current) setError(e instanceof Error ? e.message : "Translation failed");
      } finally {
        if (id === reqId.current) setBusy(false);
      }
    },
    [],
  );

  // debounce on input / language change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => run(input, source, target), 550);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, source, target, run]);

  function swap() {
    if (source === "auto") return; // can't put "detect" as a target
    setSource(target);
    setTarget(source);
    setInput(output);
    setOutput(input);
    setSettings({ sourceLang: target, targetLang: source });
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  async function save() {
    if (!input.trim() || !output.trim()) return;
    setSaved(true);
    await fetch("/api/jobs/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "text", source_lang: source, target_lang: target, source_text: input, target_text: output }),
    }).catch(() => {});
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <LangPicker
          value={source}
          onChange={(c) => {
            setSource(c);
            setSettings({ sourceLang: c });
          }}
          options={SOURCE_LANGS}
          ariaLabel="Source language"
        />
        <button
          onClick={swap}
          aria-label="Swap languages"
          title="Swap"
          className="btn btn-ghost"
          disabled={source === "auto"}
          style={{ padding: "0.4rem 0.7rem", opacity: source === "auto" ? 0.4 : 1 }}
        >
          ⇄
        </button>
        <LangPicker
          value={target}
          onChange={(c) => {
            setTarget(c);
            setSettings({ targetLang: c });
          }}
          options={TARGET_LANGS}
          ariaLabel="Target language"
        />
      </div>

      <div className="tr-two-pane">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or paste text…"
          className="glass"
          style={paneStyle}
        />
        <div className="glass" style={{ ...paneStyle, position: "relative", whiteSpace: "pre-wrap", overflow: "auto" }}>
          <span style={{ color: output ? "var(--fg)" : "var(--fg-muted)" }}>
            {output || (busy ? "Translating…" : "Translation appears here.")}
          </span>
          {output && (
            <button
              onClick={copy}
              className="btn btn-ghost"
              style={{ position: "absolute", top: "0.6rem", right: "0.6rem", padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "1.1rem" }}>
        <span style={{ fontSize: "0.8rem", color: error ? "#f87171" : "var(--fg-muted)" }}>
          {error ? error : busy ? "Translating…" : `${input.length} chars`}
        </span>
        {output && !busy && (
          <button onClick={save} className="btn btn-ghost" style={{ padding: "0.3rem 0.8rem", fontSize: "0.78rem" }}>
            {saved ? "Saved ✓" : "Save to history"}
          </button>
        )}
      </div>
    </div>
  );
}

const paneStyle: React.CSSProperties = {
  minHeight: "16rem",
  padding: "1rem 1.1rem",
  fontSize: "1rem",
  lineHeight: 1.55,
  color: "var(--fg)",
  background: "rgba(20,20,28,0.6)",
  border: "1px solid var(--border)",
  borderRadius: "1rem",
  resize: "vertical",
  width: "100%",
};
