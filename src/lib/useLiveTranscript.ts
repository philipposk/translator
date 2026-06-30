/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useRef, useState } from "react";
import { speechCodeOf } from "./langs";
import type { SttEngine } from "./settings";

export type Engine = "webspeech" | "groq";

export function webSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

export function resolveEngine(prefer: SttEngine): Engine {
  if (prefer === "groq") return "groq";
  if (prefer === "webspeech") return "webspeech";
  return webSpeechSupported() ? "webspeech" : "groq";
}

export type LiveCallbacks = {
  // detectedLang is the language Whisper detected (auto-detect path only); null otherwise.
  onFinal: (text: string, detectedLang?: string | null) => void;
  onInterim: (text: string) => void;
  onError: (msg: string) => void;
  onState?: (listening: boolean) => void;
};

export type StartOpts = { detect?: boolean };

export function useLiveTranscript(cb: LiveCallbacks) {
  const cbRef = useRef(cb);
  cbRef.current = cb;

  const [listening, setListening] = useState(false);
  const [engine, setEngine] = useState<Engine>("webspeech");

  const wantRef = useRef(false); // the user wants to be listening
  const detectRef = useRef(false); // auto-detect language (omit lang, use VAD)
  const langRef = useRef("en");
  const recogRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recMetaRef = useRef<{ chunks: Blob[]; hadVoice: boolean; voicedMs: number } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const vadRafRef = useRef<number | null>(null);
  const mimeRef = useRef("audio/webm");

  function pickMime() {
    return MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
  }

  const setOn = useCallback((v: boolean) => {
    setListening(v);
    cbRef.current.onState?.(v);
  }, []);

  // ---------- Web Speech API ----------
  const startWebSpeech = useCallback(
    (langCode: string) => {
      const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SR();
      rec.lang = speechCodeOf(langCode);
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          const txt = (r[0]?.transcript || "").trim();
          if (r.isFinal) {
            if (txt) cbRef.current.onFinal(txt);
          } else {
            interim += " " + txt;
          }
        }
        cbRef.current.onInterim(interim.trim());
      };
      rec.onerror = (e: any) => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        // Fatal errors: stop wanting to listen so onend doesn't busy-loop restarts.
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          wantRef.current = false;
          cbRef.current.onError("Microphone permission was denied.");
        } else if (e.error === "network") {
          wantRef.current = false;
          cbRef.current.onError("Speech recognition hit a network error.");
        }
      };
      rec.onend = () => {
        // Chrome auto-stops after a pause — restart while the user still wants it.
        if (wantRef.current) {
          try {
            rec.start();
          } catch {
            /* already starting */
          }
        } else {
          setOn(false);
        }
      };

      recogRef.current = rec;
      try {
        rec.start();
        setOn(true);
      } catch {
        /* already started */
      }
    },
    [setOn],
  );

  // ---------- Groq-chunk fallback (cycle a recorder to get complete files) ----------
  const sendChunk = useCallback(async (blob: Blob) => {
    if (!blob.size) return;
    try {
      const fd = new FormData();
      fd.append("audio", blob, "chunk.webm");
      // Auto-detect: omit lang so Whisper detects it and we route by the result.
      const q = detectRef.current ? "" : `?lang=${encodeURIComponent(langRef.current)}`;
      const res = await fetch(`/api/stt-chunk${q}`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.text) cbRef.current.onFinal(data.text, data.language ?? null);
      else if (!res.ok) cbRef.current.onError(data.error || "Transcription failed.");
    } catch {
      /* network blip — keep going */
    }
  }, []);

  // ---------- VAD chunking (auto-detect): cut on end-of-utterance silence ----------
  const startGroqVad = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    mimeRef.current = pickMime();
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    setOn(true);

    const SILENCE = 0.02; // RMS threshold for "voice present" (above room noise)
    const SILENCE_MS = 700; // silence after speech => utterance ended
    const MIN_VOICED_MS = 350; // ignore brief noise blips (don't send to Groq)
    const MAX_MS = 12000; // force-flush very long speech

    const newRecorder = () => {
      const r = new MediaRecorder(stream, { mimeType: mimeRef.current });
      const meta = { chunks: [] as Blob[], hadVoice: false, voicedMs: 0 };
      r.ondataavailable = (e) => {
        if (e.data.size) meta.chunks.push(e.data);
      };
      r.onstop = () => {
        // Only send if there was real, sustained voice — not a click or hum.
        if (meta.hadVoice && meta.voicedMs >= MIN_VOICED_MS && meta.chunks.length) {
          sendChunk(new Blob(meta.chunks, { type: mimeRef.current }));
        }
        if (wantRef.current) newRecorder();
      };
      recMetaRef.current = meta;
      recorderRef.current = r;
      r.start();
    };
    newRecorder();

    let speaking = false;
    let lastVoice = 0;
    let startedAt = Date.now();
    let lastFrame = Date.now();

    const loop = () => {
      if (!wantRef.current) return;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      const now = Date.now();
      const dt = now - lastFrame;
      lastFrame = now;
      const rec = recorderRef.current;
      const meta = recMetaRef.current;

      if (rms > SILENCE) {
        if (meta) {
          meta.hadVoice = true;
          meta.voicedMs += dt; // accumulate sustained voice
        }
        if (!speaking) {
          speaking = true;
          startedAt = now;
        }
        lastVoice = now;
      } else if (speaking && now - lastVoice > SILENCE_MS) {
        speaking = false;
        if (rec && rec.state === "recording") rec.stop(); // flush utterance -> onstop sends + restarts
      }
      if (speaking && now - startedAt > MAX_MS && rec && rec.state === "recording") {
        speaking = false;
        rec.stop();
      }
      vadRafRef.current = requestAnimationFrame(loop);
    };
    vadRafRef.current = requestAnimationFrame(loop);
  }, [sendChunk, setOn]);

  // ---------- public controls ----------
  const start = useCallback(
    async (langCode: string, prefer: SttEngine, opts: StartOpts = {}) => {
      detectRef.current = !!opts.detect;
      // Auto-detect requires Whisper (Web Speech can't detect language) → force groq.
      const eng: Engine = opts.detect ? "groq" : resolveEngine(prefer);
      setEngine(eng);
      langRef.current = langCode;
      wantRef.current = true;
      cbRef.current.onInterim("");
      if (eng === "webspeech") {
        startWebSpeech(langCode);
      } else {
        // All Groq live goes through VAD (silence-cut): an idle/quiet tab sends
        // nothing, so it can't rack up Groq cost. detectRef controls the lang param.
        try {
          await startGroqVad();
        } catch {
          wantRef.current = false;
          cbRef.current.onError("Could not access the microphone.");
        }
      }
    },
    [startGroqVad, startWebSpeech],
  );

  const stop = useCallback(() => {
    wantRef.current = false;
    if (vadRafRef.current != null) {
      cancelAnimationFrame(vadRafRef.current);
      vadRafRef.current = null;
    }
    try {
      recogRef.current?.stop();
    } catch {
      /* noop */
    }
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    } catch {
      /* noop */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try {
      audioCtxRef.current?.close();
    } catch {
      /* noop */
    }
    audioCtxRef.current = null;
    recorderRef.current = null;
    recMetaRef.current = null;
    cbRef.current.onInterim("");
    setOn(false);
  }, [setOn]);

  // Change the recognition language mid-session (conversation mode).
  const setLang = useCallback((langCode: string) => {
    langRef.current = langCode;
    const rec = recogRef.current;
    if (rec && wantRef.current) {
      rec.lang = speechCodeOf(langCode);
      try {
        rec.stop(); // onend will restart with the new language
      } catch {
        /* noop */
      }
    }
  }, []);

  return { listening, engine, start, stop, setLang };
}
