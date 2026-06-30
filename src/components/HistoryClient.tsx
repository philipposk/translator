"use client";

import { useEffect, useState } from "react";
import { labelOf } from "@/lib/langs";

type Job = {
  id: string;
  kind: string | null;
  status: string | null;
  source_lang: string | null;
  target_lang: string | null;
  source_text: string | null;
  target_text: string | null;
  source_name: string | null;
  duration: number | null;
  created_at: string;
};

const KIND_ICON: Record<string, string> = { live: "🎙️", text: "⌨️", file: "📄", image: "📷" };

function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function HistoryClient() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    setJobs(res.ok ? data.jobs || [] : []);
  }
  useEffect(() => {
    load();
  }, []);

  async function del(id: string) {
    setJobs((j) => j?.filter((x) => x.id !== id) ?? null);
    await fetch(`/api/jobs/${id}`, { method: "DELETE" }).catch(() => {});
  }

  async function clearAll() {
    if (!confirm("Delete your entire translation history? This can't be undone.")) return;
    setBusy(true);
    await fetch("/api/jobs", { method: "DELETE" }).catch(() => {});
    setJobs([]);
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>History</h1>
        {!!jobs?.length && (
          <button onClick={clearAll} disabled={busy} className="btn btn-ghost" style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem", color: "#f87171" }}>
            Clear all
          </button>
        )}
      </div>

      {jobs === null && <p style={{ color: "var(--fg-muted)" }}>Loading…</p>}
      {jobs?.length === 0 && (
        <div className="glass" style={{ padding: "2.5rem 1.5rem", textAlign: "center", color: "var(--fg-muted)" }}>
          <p style={{ margin: "0 0 0.75rem" }}>No translations yet.</p>
          <a href="/app" className="btn btn-primary">Start translating</a>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {jobs?.map((j) => {
          const isOpen = open === j.id;
          const snippet = (j.target_text || j.source_text || "").slice(0, 120);
          return (
            <div key={j.id} className="glass" style={{ padding: "0.85rem 1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }} onClick={() => setOpen(isOpen ? null : j.id)}>
                <span aria-hidden style={{ fontSize: "1.1rem" }}>{KIND_ICON[j.kind || "text"] || "🌐"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>
                    {labelOf(j.source_lang || "auto")} → {labelOf(j.target_lang || "")} · {when(j.created_at)}
                    {j.source_name ? ` · ${j.source_name}` : ""}
                  </div>
                  <div style={{ fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isOpen ? "normal" : "nowrap" }}>
                    {snippet || "—"}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); del(j.id); }}
                  className="btn btn-ghost"
                  title="Delete"
                  style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                >
                  ✕
                </button>
              </div>
              {isOpen && (
                <div className="tr-two-pane" style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.9rem", color: "var(--fg-muted)", whiteSpace: "pre-wrap" }}>{j.source_text || "—"}</div>
                  <div style={{ fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>{j.target_text || "—"}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
