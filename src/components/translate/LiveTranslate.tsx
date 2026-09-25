"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSttHallucination, resolveConvLang } from "@/lib/bilingual";
import { SOURCE_LANGS, TARGET_LANGS, labelOf, detectedToCode } from "@/lib/langs";
import { DEFAULTS, getSettings, setSettings, type LiveMode } from "@/lib/settings";
import { useLiveTranscript } from "@/lib/useLiveTranscript";
import { CopyButton } from "@/components/CopyButton";
import { LangPicker } from "./LangPicker";

type Turn = {
  id: number;
  speaker: "A" | "B";
  original: string;
  translation: string;
  detectedLang?: string | null;
};

let _tid = 0;

async function translateLine(text: string, source: string, target: string): Promise<string> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source_lang: source, target_lang: target, mode: "caption" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Translation failed");
  return data.translation || "";
}

export function LiveTranslate() {
  const [mode, setMode] = useState<LiveMode>(DEFAULTS.liveMode);
  const [flip, setFlip] = useState(DEFAULTS.flipSide);
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [active, setActive] = useState<"A" | "B">("A");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const presentRef = useRef<HTMLDivElement>(null);
  const presentTriggerRef = useRef<HTMLElement | null>(null);
  const runRef = useRef(0); // bumped on start/stop; drops late async results
  const lastSpeakerRef = useRef<"A" | "B" | null>(null);

  // langA / langB for conversation map onto sourceLang / targetLang
  const langA = sourceLang;
  const langB = targetLang;

  useEffect(() => {
    const s = getSettings();
    setMode(s.liveMode);
    setFlip(s.flipSide);
    setSourceLang(s.sourceLang);
    setTargetLang(s.targetLang === "auto" ? DEFAULTS.targetLang : s.targetLang);
  }, []);

  useEffect(() => {
    if (!presenting) return;
    presentTriggerRef.current = document.activeElement as HTMLElement | null;
    const root = presentRef.current;
    const closeBtn = root?.querySelector<HTMLElement>(".tr-presentation-close");
    closeBtn?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPresenting(false);
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      presentTriggerRef.current?.focus();
    };
  }, [presenting]);

  const lastTurn = turns[turns.length - 1];
  const presentText =
    mode === "conversation" && lastTurn
      ? lastTurn.speaker === "A"
        ? lastTurn.translation || lastTurn.original
        : lastTurn.translation || lastTurn.original
      : lastTurn?.translation || lastTurn?.original || "";

  const onFinal = useCallback(
    (text: string, detLang?: string | null) => {
      if (!text || isSttHallucination(text)) return;
      const run = runRef.current;
      if (mode === "captions") {
        const from =
          sourceLang === "auto" ? detectedToCode(detLang) || "en" : sourceLang;
        const id = ++_tid;
        setTurns((t) => [
          ...t,
          { id, speaker: "A", original: text, translation: "", detectedLang: from },
        ]);
        translateLine(text, from, targetLang)
          .then((tr) => {
            if (runRef.current !== run) return;
            setTurns((t) => t.map((x) => (x.id === id ? { ...x, translation: tr } : x)));
          })
          .catch((e) => {
            if (runRef.current !== run) return;
            setError(e instanceof Error ? e.message : "Translation failed");
          });
        return;
      }
      // conversation: pick the speaking side + direction.
      let spk: "A" | "B";
      let from: string;
      let to: string;
      const resolved = resolveConvLang(text, detLang, langA, langB, lastSpeakerRef.current);
      spk = resolved.speaker;
      from = resolved.code;
      to = from === langB ? langA : langB;
      setActive(spk);
      lastSpeakerRef.current = spk;
      const id = ++_tid;
      setTurns((t) => [
        ...t,
        { id, speaker: spk, original: text, translation: "", detectedLang: from },
      ]);
      translateLine(text, from, to)
        .then((tr) => {
          if (runRef.current !== run) return;
          setTurns((t) => t.map((x) => (x.id === id ? { ...x, translation: tr } : x)));
        })
        .catch((e) => {
          if (runRef.current !== run) return;
          setError(e instanceof Error ? e.message : "Translation failed");
        });
    },
    [mode, sourceLang, targetLang, langA, langB],
  );

  const live = useLiveTranscript({
    onFinal,
    onInterim: setInterim,
    onError: (m) => setError(m),
    onState: setListening,
  });
  // keep the transcript scrolled to the newest line
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, interim]);

  function toggle() {
    setError(null);
    runRef.current++; // invalidate any in-flight translations from a prior run
    if (listening) {
      // save the session to history (best-effort)
      if (turns.length) {
        fetch("/api/jobs/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "live",
            source_lang: sourceLang,
            target_lang: targetLang,
            source_text: turns.map((t) => t.original).join("\n"),
            target_text: turns.map((t) => t.translation).filter(Boolean).join("\n"),
            segments: turns,
          }),
        }).catch(() => {});
      }
      live.stop();
    } else {
      setTurns([]);
      const handsFree = mode === "conversation";
      const useDetect = handsFree || (mode === "captions" && sourceLang === "auto");
      lastSpeakerRef.current = null;
      if (useDetect) {
        const pair: [string, string] | undefined =
          handsFree && langA !== "auto" && langB !== "auto" ? [langA, langB] : undefined;
        live.start(langA === "auto" ? "en" : langA, getSettings().sttEngine, {
          detect: true,
          langPair: pair,
        });
      } else {
        const lang =
          mode === "captions"
            ? sourceLang === "auto"
              ? "en"
              : sourceLang
            : active === "A"
              ? langA
              : langB;
        live.start(lang, getSettings().sttEngine);
      }
    }
  }

  const engineLabel =
    live.engine === "webspeech"
      ? "On-device · free"
      : live.engine === "deepgram"
        ? "Deepgram · streaming"
        : "Whisper";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* controls */}
      <div className="glass" style={{ padding: "0.85rem 1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <button
            type="button"
            className="btn"
            aria-pressed={mode === "captions"}
            onClick={() => { setMode("captions"); setSettings({ liveMode: "captions" }); }}
            style={pill(mode === "captions")}
          >
            Captions
          </button>
          <button
            type="button"
            className="btn"
            aria-pressed={mode === "conversation"}
            onClick={() => {
              setMode("conversation");
              setSettings({ liveMode: "conversation" });
              if (sourceLang === "auto") setSourceLang("el");
            }}
            style={pill(mode === "conversation")}
          >
            Conversation
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
          <LangPicker
            value={sourceLang}
            onChange={(c) => { setSourceLang(c); setSettings({ sourceLang: c }); }}
            options={
              mode === "conversation"
                ? SOURCE_LANGS.filter((l) => l.code !== "auto")
                : SOURCE_LANGS
            }
            ariaLabel={mode === "conversation" ? "Side A language" : "Spoken language"}
            disabled={listening}
          />
          <span style={{ color: "var(--fg-muted)" }}>→</span>
          <LangPicker
            value={targetLang}
            onChange={(c) => { setTargetLang(c); setSettings({ targetLang: c }); }}
            options={TARGET_LANGS}
            ariaLabel={mode === "conversation" ? "Side B language" : "Translate to"}
            disabled={listening}
          />
          {mode === "conversation" && (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => { setFlip((f) => { setSettings({ flipSide: !f }); return !f; }); }}
                title="Rotate the top panel 180° for face-to-face seating"
                style={{ padding: "0.4rem 0.7rem" }}
              >
                ⟳ Flip {flip ? "on" : "off"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setPresenting(true)}
                disabled={!presentText}
                title="Fullscreen large text to show your phone to the other person"
                style={{ padding: "0.4rem 0.7rem" }}
              >
                <span aria-hidden="true">📱</span> Show on phone
              </button>
            </>
          )}
        </div>
      </div>

      {/* conversation: hands-free — no tapping during the chat */}
      {mode === "conversation" && (
        <p style={{ fontSize: "0.85rem", color: "var(--fg-muted)", margin: 0, textAlign: "center", lineHeight: 1.5 }}>
          Hands-free — place the phone nearby and talk. {labelOf(langA)} and {labelOf(langB)} are detected automatically.
          {listening && (
            <>
              {" "}Last heard: <b style={{ color: "var(--accent)" }}>{labelOf(active === "A" ? langA : langB)}</b>
            </>
          )}
        </p>
      )}

      {/* start / stop */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
        <button onClick={toggle} className={`btn ${listening ? "btn-ghost" : "btn-primary"}`} style={{ padding: "0.7rem 2rem" }}>
          {listening ? "■ Stop" : "● Start listening"}
        </button>
        {listening && <span style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>{engineLabel}</span>}
      </div>

      {error && <p style={{ color: "#f87171", fontSize: "0.85rem", textAlign: "center" }}>{error}</p>}

      {/* display */}
      {mode === "captions" ? (
        <CaptionsView turns={turns} interim={interim} sourceLang={sourceLang} targetLang={targetLang} scrollRef={scrollRef} />
      ) : (
        <ConversationView turns={turns} interim={interim} active={active} langA={langA} langB={langB} flip={flip} />
      )}

      {presenting && (
        <div ref={presentRef} className="tr-presentation" role="dialog" aria-modal="true" aria-label="Presentation mode">
          <button type="button" className="tr-presentation-close btn btn-ghost" onClick={() => setPresenting(false)} aria-label="Close">
            ✕
          </button>
          <p className="tr-presentation-text">{presentText}</p>
          <div className="tr-presentation-actions">
            <CopyButton text={presentText} label="Copy" />
          </div>
        </div>
      )}
    </div>
  );
}

function CaptionsView({
  turns,
  interim,
  sourceLang,
  targetLang,
  scrollRef,
}: {
  turns: Turn[];
  interim: string;
  sourceLang: string;
  targetLang: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="tr-two-pane">
      <div className="glass" style={paneBox} ref={scrollRef}>
        <PaneTitle>{labelOf(sourceLang)} (spoken)</PaneTitle>
        {turns.map((t) => (
          <p key={t.id} style={lineStyle}>{t.original}</p>
        ))}
        {interim && <p style={{ ...lineStyle, color: "var(--fg-muted)" }} className="tr-pulse">{interim}</p>}
        {!turns.length && !interim && <Empty>Press start and speak…</Empty>}
      </div>
      <div className="glass" style={paneBox}>
        <PaneTitle>{labelOf(targetLang)} (translation)</PaneTitle>
        {turns.map((t) => (
          <p key={t.id} style={t.translation ? lineStyle : { ...lineStyle, color: "var(--fg-muted)" }}>
            {t.translation || "…"}
          </p>
        ))}
        {!turns.length && <Empty>Translation appears here.</Empty>}
      </div>
    </div>
  );
}

function ConversationView({
  turns,
  interim,
  active,
  langA,
  langB,
  flip,
}: {
  turns: Turn[];
  interim: string;
  active: "A" | "B";
  langA: string;
  langB: string;
  flip: boolean;
}) {
  // Each panel shows the whole conversation in that side's language:
  // the speaker's own turns as originals, the other side's turns as translations.
  const renderFor = (side: "A" | "B") =>
    turns.map((t) => {
      const text = t.speaker === side ? t.original : t.translation || "…";
      const own = t.speaker === side;
      return (
        <p key={t.id} style={own ? lineStyle : { ...lineStyle, color: "var(--accent)" }}>
          {text}
        </p>
      );
    });

  return (
    <div className="tr-live-stack">
      {/* top panel = side A; rotate 180° when flip is on so the person opposite reads it upright */}
      <div className={`glass ${flip ? "tr-flip" : ""}`} style={paneBox}>
        <PaneTitle>{labelOf(langA)} {active === "A" && <Dot />}</PaneTitle>
        {renderFor("A")}
        {active === "A" && interim && <p style={{ ...lineStyle, color: "var(--fg-muted)" }} className="tr-pulse">{interim}</p>}
        {!turns.length && <Empty>Side A</Empty>}
      </div>
      <div className="glass" style={paneBox}>
        <PaneTitle>{labelOf(langB)} {active === "B" && <Dot />}</PaneTitle>
        {renderFor("B")}
        {active === "B" && interim && <p style={{ ...lineStyle, color: "var(--fg-muted)" }} className="tr-pulse">{interim}</p>}
        {!turns.length && <Empty>Side B</Empty>}
      </div>
    </div>
  );
}

// --- little presentational helpers ---
function PaneTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.7rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.6rem", position: "sticky", top: 0 }}>
      {children}
    </p>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem" }}>{children}</p>;
}
function Dot() {
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: "var(--accent)", marginLeft: 6 }} className="tr-pulse" />;
}

function pill(active: boolean): React.CSSProperties {
  return {
    padding: "0.4rem 1rem",
    background: active ? "var(--accent)" : "rgba(255,255,255,0.05)",
    color: active ? "#000" : "var(--fg-muted)",
    border: "1px solid var(--border)",
  };
}
const paneBox: React.CSSProperties = {
  padding: "1rem 1.1rem",
  overflow: "auto",
  minHeight: "30vh",
  maxHeight: "60vh",
};
const lineStyle: React.CSSProperties = { margin: "0 0 0.55rem", fontSize: "1.05rem", lineHeight: 1.5 };
