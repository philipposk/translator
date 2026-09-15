"use client";

import { useEffect, useState } from "react";

const KEY = "tr_onboarding_v1";

export function OnboardingTour() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="tr-onboard" role="dialog" aria-label="Welcome">
      <div className="tr-onboard-inner glass">
        <p className="tr-onboard-kicker">Welcome</p>
        <h2>Pick a tool on the left</h2>
        <p>
          <strong>Live</strong> for real-time speech · <strong>Text</strong> to paste ·{" "}
          <strong>Upload</strong> for recordings · <strong>Camera</strong> for signs and menus.
          Leave source on <em>Detect language</em> when unsure.
        </p>
        <div className="tr-onboard-actions">
          <a href="/help" className="btn btn-ghost" style={{ padding: "0.4rem 0.9rem", fontSize: "0.82rem" }}>
            Read the guide
          </a>
          <button type="button" onClick={dismiss} className="btn btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
