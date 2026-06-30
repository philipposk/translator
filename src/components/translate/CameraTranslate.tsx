"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OCR_LANGS, TARGET_LANGS, ocrCodeOf, labelOf } from "@/lib/langs";
import { getSettings, setSettings } from "@/lib/settings";
import { LangPicker } from "./LangPicker";

type Stage = "idle" | "ocr" | "translating";

export function CameraTranslate() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [source, setSource] = useState("en");
  const [target, setTarget] = useState("en");
  const [stage, setStage] = useState<Stage>("idle");
  const [ocrText, setOcrText] = useState("");
  const [translation, setTranslation] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSettings();
    setSource(s.sourceLang === "auto" ? "en" : s.sourceLang);
    setTarget(s.targetLang === "auto" ? "en" : s.targetLang);
    return () => stopCam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCam() {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamOn(true);
    } catch {
      setCamError("Couldn't open the camera. You can upload a photo instead.");
    }
  }

  function stopCam() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }

  const runOcr = useCallback(
    async (image: CanvasImageSource | Blob, w?: number, h?: number) => {
      setError(null);
      setOcrText("");
      setTranslation("");
      setStage("ocr");
      try {
        const Tesseract: typeof import("tesseract.js") = await import("tesseract.js");
        const recognize = (Tesseract as unknown as { recognize: typeof import("tesseract.js").recognize }).recognize;

        let src: Blob | HTMLCanvasElement;
        if (image instanceof Blob) {
          src = image;
        } else {
          const canvas = document.createElement("canvas");
          canvas.width = w || 1280;
          canvas.height = h || 720;
          canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
          src = canvas;
        }

        const { data } = await recognize(src, ocrCodeOf(source));
        const text = (data.text || "").trim().slice(0, 4000); // cap before translating
        setOcrText(text);
        if (!text) {
          setError("No readable text found. Try getting closer or steadier.");
          setStage("idle");
          return;
        }

        setStage("translating");
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, source_lang: source, target_lang: target, mode: "document" }),
        });
        const tr = await res.json();
        if (!res.ok) throw new Error(tr.error || "Translation failed");
        setTranslation(tr.translation || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not read the image.");
      } finally {
        setStage("idle");
      }
    },
    [source, target],
  );

  function capture() {
    const v = videoRef.current;
    if (!v) return;
    runOcr(v, v.videoWidth || 1280, v.videoHeight || 720);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>Text is</span>
        <LangPicker value={source} onChange={(c) => { setSource(c); setSettings({ sourceLang: c }); }} options={OCR_LANGS} ariaLabel="Text language" />
        <span style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>→</span>
        <LangPicker value={target} onChange={(c) => { setTarget(c); setSettings({ targetLang: c }); }} options={TARGET_LANGS} ariaLabel="Translate to" />
      </div>

      <div className="glass" style={{ overflow: "hidden", position: "relative", aspectRatio: "4 / 3", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: camOn ? "block" : "none" }} />
        {!camOn && (
          <div style={{ textAlign: "center", color: "var(--fg-muted)", padding: "1.5rem" }}>
            <p style={{ margin: "0 0 0.75rem" }}>Point your camera at text, or upload a photo.</p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={startCam}>📷 Open camera</button>
              <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>Upload photo</button>
            </div>
            {camError && <p style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.75rem" }}>{camError}</p>}
          </div>
        )}
        {stage !== "idle" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", color: "#fff" }}>
            <span className="tr-spin" /> {stage === "ocr" ? "Reading text…" : "Translating…"}
          </div>
        )}
      </div>

      {camOn && (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={capture} disabled={stage !== "idle"} style={{ padding: "0.7rem 2rem" }}>
            ◉ Capture & translate
          </button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>Upload instead</button>
          <button className="btn btn-ghost" onClick={stopCam}>Close camera</button>
        </div>
      )}

      {error && <p style={{ color: "#f87171", fontSize: "0.85rem", textAlign: "center" }}>{error}</p>}

      {(ocrText || translation) && (
        <div className="tr-two-pane">
          <div className="glass" style={{ padding: "1rem 1.1rem" }}>
            <p style={titleStyle}>Detected ({labelOf(source)})</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--fg-muted)" }}>{ocrText || "—"}</p>
          </div>
          <div className="glass" style={{ padding: "1rem 1.1rem" }}>
            <p style={titleStyle}>Translation ({labelOf(target)})</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{translation || "—"}</p>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) runOcr(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  color: "var(--fg-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  margin: "0 0 0.6rem",
};
