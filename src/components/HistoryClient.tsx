"use client";

import { useEffect, useState } from "react";
import { labelOf } from "@/lib/langs";
import type { ExportSegment } from "@/lib/export";
import { PageHeader } from "@/components/PageHeader";
import { ExportMenu } from "@/components/ExportMenu";
import { ConfirmModal } from "@/components/ConfirmModal";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { IconLive, IconText, IconFile, IconCamera } from "@/components/icons";

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

type JobDetail = Job & { segments?: ExportSegment[] };

const KIND_ICON: Record<string, React.ReactNode> = {
  live: <IconLive size={16} />,
  text: <IconText size={16} />,
  file: <IconFile size={16} />,
  image: <IconCamera size={16} />,
};

function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function HistoryClient() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, JobDetail>>({});
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    setJobs(res.ok ? data.jobs || [] : []);
  }
  useEffect(() => {
    load();
  }, []);

  async function toggle(id: string) {
    if (open === id) {
      setOpen(null);
      return;
    }
    setOpen(id);
    if (!detail[id]) {
      const res = await fetch(`/api/jobs/${id}`);
      const data = await res.json();
      if (res.ok && data.job) setDetail((d) => ({ ...d, [id]: data.job }));
    }
  }

  async function del(id: string) {
    setJobs((j) => j?.filter((x) => x.id !== id) ?? null);
    if (open === id) setOpen(null);
    await fetch(`/api/jobs/${id}`, { method: "DELETE" }).catch(() => {});
    setConfirmDelete(null);
  }

  async function clearAll() {
    setBusy(true);
    await fetch("/api/jobs", { method: "DELETE" }).catch(() => {});
    setJobs([]);
    setOpen(null);
    setBusy(false);
    setConfirmClear(false);
  }

  return (
    <div className="tr-workspace" style={{ maxWidth: "48rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.5rem" }}>
        <PageHeader title="History" description="Your saved translations. Expand a row to see full text or export." />
        {!!jobs?.length && (
          <button onClick={() => setConfirmClear(true)} disabled={busy} className="btn btn-ghost" style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem", color: "#f87171", flexShrink: 0 }}>
            Clear all
          </button>
        )}
      </div>

      {jobs === null && <LoadingSkeleton lines={4} />}
      {jobs?.length === 0 && (
        <div className="glass" style={{ padding: "2.5rem 1.5rem", textAlign: "center", color: "var(--fg-muted)" }}>
          <p style={{ margin: "0 0 0.75rem" }}>No translations yet.</p>
          <a href="/app/text" className="btn btn-primary">Start translating</a>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {jobs?.map((j) => {
          const isOpen = open === j.id;
          const snippet = (j.target_text || j.source_text || "").slice(0, 120);
          const full = detail[j.id] || j;
          const segments = Array.isArray(full.segments) ? full.segments : null;
          return (
            <div key={j.id} className="glass" style={{ padding: "0.85rem 1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }} onClick={() => toggle(j.id)}>
                <span aria-hidden style={{ display: "flex", color: "var(--fg-muted)" }}>{KIND_ICON[j.kind || "text"] || <IconText size={16} />}</span>
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
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(j.id); }}
                  className="btn btn-ghost"
                  title="Delete"
                  style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                >
                  ✕
                </button>
              </div>
              {isOpen && (
                <>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.65rem" }}>
                    <ExportMenu
                      segments={segments}
                      sourceText={full.source_text || ""}
                      targetText={full.target_text || ""}
                      baseName={j.source_name?.replace(/\.[^.]+$/, "") || "translation"}
                    />
                  </div>
                  <div className="tr-two-pane" style={{ marginTop: "0.75rem" }}>
                    <div style={{ fontSize: "0.9rem", color: "var(--fg-muted)", whiteSpace: "pre-wrap" }}>{full.source_text || "—"}</div>
                    <div style={{ fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>{full.target_text || "—"}</div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={confirmClear}
        title="Clear all history?"
        message="Delete your entire translation history? This cannot be undone."
        confirmLabel="Delete all"
        danger
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
      />
      <ConfirmModal
        open={!!confirmDelete}
        title="Delete translation?"
        message="Remove this entry from your history?"
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDelete && del(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
