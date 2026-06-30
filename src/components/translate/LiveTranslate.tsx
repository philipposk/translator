"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SOURCE_LANGS, TARGET_LANGS, labelOf, detectedToCode } from "@/lib/langs";
import { getSettings, setSettings, type LiveMode } from "@/lib/settings";
import { useLiveTranscript } from "@/lib/useLiveTranscript";
import { LangPicker } from "./LangPicker";

type Turn = {
  id: number;
  speaker: "A" | "B"; // for conversation; captions always "A"
  original: string;
  translation: string;
};

let _tid = 0;

async function translateLine(text: string, source: string, target: string): Promise<string> {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source_lang: source, target_lang: target, mode: "caption" }),
    });
    const data = await res.json();
    return res.ok ? data.translation || "" : "";
  } catch {
    return "";
  }
}

export function LiveTranslate() {
  const [mode, setMode] = useState<LiveMode>("captions");
  const [flip, setFlip] = useState(false);
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [active, setActive] = useState<"A" | "B">("A"); // conversation: who's speaking
  const [convAuto, setConvAuto] = useState(false); // auto-detect spoken language
  const [turns, setTurns] = useState<Turn[]>([]);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0); // bumped on start/stop; drops late async results

  // langA / langB for conversation map onto sourceLang / targetLang
  const langA = sourceLang;
  const langB = targetLang;

  useEffect(() => {
    const s = getSettings();
    setMode(s.liveMode);
    setFlip(s.flipSide);
    setConvAuto(s.convAuto);
    setSourceLang(s.sourceLang === "auto" ? "en" : s.sourceLang);
    setTargetLang(s.targetLang === "auto" ? "es" : s.targetLang);
  }, []);

  const onFinal = useCallback(
    (text: string, detLang?: string | null) => {
      if (!text) return;
      const run = runRef.current;
      if (mode === "captions") {
        const id = ++_tid;
        setTurns((t) => [...t, { id, speaker: "A", original: text, translation: "" }]);
        translateLine(text, sourceLang, targetLang).then((tr) => {
          if (runRef.current !== run) return; // session stopped/reset — drop
          setTurns((t) => t.map((x) => (x.id === id ? { ...x, translation: tr } : x)));
        });
        return;
      }
      // conversation: pick the speaking side + direction.
      let spk: "A" | "B";
      let from: string;
      let to: string;
      if (convAuto) {
        // Translate FROM the language Whisper actually detected (not an assumed
        // side), TO the other chosen language. Robust to a 3rd language too.
        const code = detectedToCode(detLang) || langA;
        spk = code === langB ? "B" : "A";
        from = code;
        to = code === langB ? langA : langB;
        setActive(spk);
      } else {
        spk = active;
        from = spk === "A" ? langA : langB;
        to = spk === "A" ? langB : langA;
      }
      const id = ++_tid;
      setTurns((t) => [...t, { id, speaker: spk, original: text, translation: "" }]);
      translateLine(text, from, to).then((tr) => {
        if (runRef.current !== run) return;
        setTurns((t) => t.map((x) => (x.id === id ? { ...x, translation: tr } : x)));
      });
    },
    [mode, sourceLang, targetLang, active, langA, langB, convAuto],
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
      if (mode === "conversation" && convAuto) {
        // auto-detect: force Whisper + VAD; language is chosen per utterance.
        live.start(langA, "groq", { detect: true });
      } else {
        const lang = mode === "captions" ? sourceLang : active === "A" ? langA : langB;
        live.start(lang, getSettings().sttEngine);
      }
    }
  }

  function switchSide(side: "A" | "B") {
    setActive(side);
    if (listening) live.setLang(side === "A" ? langA : langB);
  }

  const engineLabel = live.engine === "webspeech" ? "On-device · free" : "Whisper";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* controls */}
      <div className="glass" style={{ padding: "0.85rem 1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <button
            className="btn"
            onClick={() => { setMode("captions"); setSettings({ liveMode: "captions" }); }}
            style={pill(mode === "captions")}
          >
            Captions
          </button>
          <button
            className="btn"
            onClick={() => { setMode("conversation"); setSettings({ liveMode: "conversation" }); }}
            style={pill(mode === "conversation")}
          >
            Conversation
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
          <LangPicker
            value={sourceLang}
            onChange={(c) => { setSourceLang(c); setSettings({ sourceLang: c }); }}
            options={SOURCE_LANGS.filter((l) => l.code !== "auto")}
            ariaLabel={mode === "conversation" ? "Side A language" : "Spoken language"}
          />
          <span style={{ color: "var(--fg-muted)" }}>→</span>
          <LangPicker
            value={targetLang}
            onChange={(c) => { setTargetLang(c); setSettings({ targetLang: c }); }}
            options={TARGET_LANGS}
            ariaLabel={mode === "conversation" ? "Side B language" : "Translate to"}
          />
          {mode === "conversation" && (
            <button
              className="btn btn-ghost"
              onClick={() => { setFlip((f) => { setSettings({ flipSide: !f }); return !f; }); }}
              title="Rotate the top panel 180° for face-to-face seating"
              style={{ padding: "0.4rem 0.7rem" }}
            >
              ⟳ Flip {flip ? "on" : "off"}
            </button>
          )}
        </div>
      </div>

      {/* conversation: auto-detect toggle + (manual) whose-turn */}
      {mode === "conversation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
          <button
            className="btn"
            onClick={() => { const v = !convAuto; setConvAuto(v); setSettings({ convAuto: v }); }}
            disabled={listening}
            title="Detect the spoken language automatically (uses Whisper; ~2-4s slower, no button pressing)"
            style={{ ...pill(convAuto), opacity: listening ? 0.5 : 1 }}
          >
            ✨ Auto-detect language {convAuto ? "on" : "off"}
          </button>
          {convAuto ? (
            <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)", margin: 0, textAlign: "center" }}>
              Just talk — it detects {labelOf(langA)} vs {labelOf(langB)} per turn.
              {listening && <> Now hearing: <b style={{ color: "var(--accent)" }}>{labelOf(active === "A" ? langA : langB)}</b></>}
            </p>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
              <button className="btn" onClick={() => switchSide("A")} style={pill(active === "A")}>
                🗣 {labelOf(langA)}
              </button>
              <button className="btn" onClick={() => switchSide("B")} style={pill(active === "B")}>
                🗣 {labelOf(langB)}
              </button>
            </div>
          )}
        </div>
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
