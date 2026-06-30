"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getSettings, setSettings, type WorkspaceMode } from "@/lib/settings";
import { ModeSwitcher } from "./ModeSwitcher";
import { TextTranslate } from "./TextTranslate";
import { UsageBar } from "./UsageBar";

// Feature components that touch heavy browser APIs (mic, camera, WASM) are loaded
// on demand so the initial bundle stays small and SSR doesn't choke on them.
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

export function Workspace() {
  const [mode, setMode] = useState<WorkspaceMode>("text");

  useEffect(() => {
    setMode(getSettings().mode);
  }, []);

  function change(m: WorkspaceMode) {
    setMode(m);
    setSettings({ mode: m });
  }

  return (
    <div style={{ maxWidth: "60rem", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <UsageBar />
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
        <ModeSwitcher mode={mode} onChange={change} />
      </div>

      {mode === "text" && <TextTranslate />}
      {mode === "live" && <LiveTranslate />}
      {mode === "file" && <FileTranslate />}
      {mode === "camera" && <CameraTranslate />}
    </div>
  );
}
