"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { modeMeta } from "@/lib/modes";

export function AppRedirect() {
  const router = useRouter();

  useEffect(() => {
    const saved = getSettings().mode;
    router.replace(modeMeta(saved).href);
  }, [router]);

  return (
    <div style={{ padding: "4rem 1rem", textAlign: "center", color: "var(--fg-muted)" }}>
      Opening workspace…
    </div>
  );
}
