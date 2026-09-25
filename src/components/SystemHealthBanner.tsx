"use client";

import { useEffect, useState } from "react";

type Health = {
  ok: boolean;
  system?: { ok: boolean; issues: string[] };
};

export function SystemHealthBanner() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setHealth(d))
      .catch(() => {});
  }, []);

  if (!health?.system || health.system.ok) return null;

  return (
    <div className="tr-health-banner" role="status">
      <strong>Service notice:</strong>{" "}
      {health.system.issues[0] || "Some backend features may be degraded."}
      {health.system.issues.length > 1 && (
        <span title={health.system.issues.join("\n")}> (+{health.system.issues.length - 1} more)</span>
      )}
    </div>
  );
}
