"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }

  if (!ready) return null;

  if (user) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.35rem 0.75rem",
          borderRadius: "9999px",
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: "0.8rem",
        }}
      >
        <span style={{ color: "var(--fg)", maxWidth: "10rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user.email}
        </span>
        <button
          onClick={signOut}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--fg-muted)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      style={{
        padding: "0.4rem 0.9rem",
        borderRadius: "9999px",
        border: "1px solid rgba(255,255,255,0.1)",
        fontSize: "0.8rem",
        color: "var(--fg)",
        textDecoration: "none",
      }}
    >
      Sign in
    </Link>
  );
}
