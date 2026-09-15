"use client";

import { useEffect, useState } from "react";

const KEY = "tr_cookie_ok";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  function accept() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="tr-cookie" role="dialog" aria-label="Cookie notice">
      <p>
        We use essential cookies for sign-in and preferences. See our{" "}
        <a href="/privacy">Privacy Policy</a> for details.
      </p>
      <button type="button" onClick={accept} className="btn btn-primary" style={{ padding: "0.4rem 1rem", flexShrink: 0 }}>
        Got it
      </button>
    </div>
  );
}
