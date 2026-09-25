"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OCR_SOURCE_LANGS, TARGET_LANGS, ocrCodeOf, labelOf } from "@/lib/langs";
import { looksLikeGibberish, preprocessForOcr } from "@/lib/ocr";
import { getSettings, setSettings } from "@/lib/settings";
import { CopyButton } from "@/components/CopyButton";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { LangPicker } from "./LangPicker";

type Stage = "idle" | "ocr" | "translating";

const OCR_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      onTimeout();
      reject(new Error("Reading took too long. Try a clearer photo or upload instead."));
    }, ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

export function CameraTranslate() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [source, setSource] = useState("auto");
  const [resolvedSource, setResolvedSource] = useState("en");
  const [target, setTarget] = useState("en");
  const [stage, setStage] = useState<Stage>("idle");
  const [ocrText, setOcrText] = useState("");
  const [translation, setTranslation] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSettings();
    setSource(s.sourceLang === "auto" || OCR_SOURCE_LANGS.some((l) => l.code === s.sourceLang) ? s.sourceLang : "auto");
    setTarget(s.targetLang === "auto" ? "en" : s.targetLang);
    return () => stopCam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (stage !== "idle") cancelProcessing();
      else if (camOn) stopCam();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, camOn]);

  function cancelProcessing() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStage("idle");
    setError("Cancelled.");
  }

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

  async function detectFromText(text: string, signal?: AbortSignal): Promise<string | null> {
    const res = await fetch("/api/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal,
    });
    const data = await res.json();
    return res.ok && data.code ? String(data.code) : null;
  }

  const runOcr = useCallback(
    async (image: CanvasImageSource | Blob, w?: number, h?: number) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setError(null);
      setOcrText("");
      setTranslation("");
      setStage("ocr");
      try {
        const Tesseract: typeof import("tesseract.js") = await import("tesseract.js");
        const recognize = (Tesseract as unknown as { recognize: typeof import("tesseract.js").recognize }).recognize;

        let canvas: HTMLCanvasElement;
        if (image instanceof Blob) {
          const bmp = await createImageBitmap(image);
          canvas = preprocessForOcr(bmp, bmp.width, bmp.height);
          bmp.close();
        } else {
          const width = w || 1280;
          const height = h || 720;
          canvas = preprocessForOcr(image, width, height);
        }

        if (ac.signal.aborted) return;

        const ocrLang = source === "auto" ? "eng" : ocrCodeOf(source);
        let { data } = await withTimeout(
          recognize(canvas, ocrLang),
          OCR_TIMEOUT_MS,
          () => ac.abort(),
        );
        let text = (data.text || "").trim().slice(0, 4000);

        let effectiveSource = source === "auto" ? "en" : source;
        if (source === "auto" && text) {
          const detected = await detectFromText(text, ac.signal);
          if (detected) {
            effectiveSource = detected;
            if (looksLikeGibberish(text)) {
              const retry = await withTimeout(
                recognize(canvas, ocrCodeOf(detected)),
                OCR_TIMEOUT_MS,
                () => ac.abort(),
              );
              const retryText = (retry.data.text || "").trim().slice(0, 4000);
              if (retryText && !looksLikeGibberish(retryText)) {
                text = retryText;
                data = retry.data;
              }
            }
          }
        }

        if (ac.signal.aborted) return;

        setResolvedSource(effectiveSource);
        setOcrText(text);
        if (!text) {
          setError("No readable text found. Try getting closer, steadier, or pick the text language.");
          setStage("idle");
          return;
        }
        if (looksLikeGibberish(text)) {
          setError("Text hard to read. Try better lighting or select the text language manually.");
        }

        setStage("translating");
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            source_lang: effectiveSource,
            target_lang: target,
            mode: "document",
          }),
          signal: ac.signal,
        });
        const tr = await res.json();
        if (!res.ok) throw new Error(tr.error || "Translation failed");
        setTranslation(tr.translation || "");
        if (tr.translation) {
          fetch("/api/jobs/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "image",
              source_lang: effectiveSource,
              target_lang: target,
              source_text: text,
              target_text: tr.translation,
            }),
          }).catch(() => {});
        }
      } catch (e) {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Could not read the image.");
      } finally {
        if (abortRef.current === ac) abortRef.current = null;
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

  const sourceLabel = source === "auto" ? `Detected (${labelOf(resolvedSource)})` : labelOf(source);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <ModeSwitcher current="camera" />
      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--fg-muted)", textAlign: "center" }}>
        Use Live or Text above anytime — camera is optional. Press <kbd>Esc</kbd> to close the camera.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>Text is</span>
        <LangPicker
          value={source}
          onChange={(c) => { setSource(c); setSettings({ sourceLang: c }); }}
          options={OCR_SOURCE_LANGS}
          ariaLabel="Text language"
        />
        <span style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>→</span>
        <LangPicker
          value={target}
          onChange={(c) => { setTarget(c); setSettings({ targetLang: c }); }}
          options={TARGET_LANGS}
          ariaLabel="Translate to"
        />
      </div>

      <div className="glass" style={{ overflow: "hidden", position: "relative", aspectRatio: "4 / 3", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: camOn ? "block" : "none" }} />
        {!camOn && (
          <div style={{ textAlign: "center", color: "var(--fg-muted)", padding: "1.5rem" }}>
            <p style={{ margin: "0 0 0.75rem" }}>Point your camera at text, or upload a photo.</p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={startCam}>Open camera</button>
              <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>Upload photo</button>
            </div>
            {camError && <p style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.75rem" }}>{camError}</p>}
          </div>
        )}
        {stage !== "idle" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", color: "#fff", zIndex: 2 }}>
            <span className="tr-spin" /> {stage === "ocr" ? "Reading text…" : "Translating…"}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button type="button" className="btn btn-ghost" onClick={cancelProcessing}>Cancel</button>
              <a href="/app/live" className="btn btn-primary" onClick={() => { cancelProcessing(); stopCam(); }}>Switch to Live</a>
            </div>
          </div>
        )}
      </div>

      {camOn && (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={capture} disabled={stage !== "idle"} style={{ padding: "0.7rem 2rem" }}>
            Capture & translate
          </button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>Upload instead</button>
          <button className="btn btn-ghost" onClick={stopCam}>Close camera</button>
          <a href="/app/live" className="btn btn-ghost" onClick={stopCam}>Leave → Live</a>
        </div>
      )}

      {error && <p style={{ color: "#f87171", fontSize: "0.85rem", textAlign: "center" }}>{error}</p>}

      {(ocrText || translation) && (
        <>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            <CopyButton text={translation} label="Copy translation" />
            <button type="button" className="btn btn-ghost" onClick={() => { setOcrText(""); setTranslation(""); setError(null); }}>
              Clear
            </button>
            {camOn && (
              <button type="button" className="btn btn-ghost" onClick={capture} disabled={stage !== "idle"}>
                Try again
              </button>
            )}
          </div>
          <div className="tr-two-pane">
            <div className="glass" style={{ padding: "1rem 1.1rem" }}>
              <p style={titleStyle}>{sourceLabel}</p>
              <p style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--fg-muted)" }}>{ocrText || "…"}</p>
            </div>
            <div className="glass" style={{ padding: "1rem 1.1rem" }}>
              <p style={titleStyle}>Translation ({labelOf(target)})</p>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{translation || "…"}</p>
            </div>
          </div>
        </>
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
