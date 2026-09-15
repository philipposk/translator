"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import type { WorkspaceMode } from "@/lib/settings";
import { setSettings } from "@/lib/settings";
import { modeMeta } from "@/lib/modes";
import { PageHeader } from "@/components/PageHeader";
import { TextTranslate } from "./TextTranslate";
import { UsageBar } from "./UsageBar";

const LiveTranslate = dynamic(() => import("./LiveTranslate").then((m) => m.LiveTranslate), {
  ssr: false,
  loading: () => <Loading label="Loading live mode…" />,
});
const FileTranslate = dynamic(() => import("./FileTranslate").then((m) => m.FileTranslate), {
  ssr: false,
  loading: () => <Loading label="Loading file mode…" />,
});
const CameraTranslate = dynamic(() => import("./CameraTranslate").then((m) => m.CameraTranslate), {
  ssr: false,
  loading: () => <Loading label="Loading camera…" />,
});

function Loading({ label }: { label: string }) {
  return <div style={{ padding: "3rem", textAlign: "center", color: "var(--fg-muted)" }}>{label}</div>;
}

export function Workspace({ mode }: { mode: WorkspaceMode }) {
  const meta = modeMeta(mode);

  useEffect(() => {
    setSettings({ mode });
  }, [mode]);

  return (
    <div className="tr-workspace">
      <div className="tr-workspace-top">
        <PageHeader title={meta.title} description={meta.description} />
        <UsageBar />
      </div>

      {mode === "text" && <TextTranslate />}
      {mode === "live" && <LiveTranslate />}
      {mode === "file" && <FileTranslate />}
      {mode === "camera" && <CameraTranslate />}
    </div>
  );
}
