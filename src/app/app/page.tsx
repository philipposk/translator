import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Auth-gated route. Anyone without a 6x7 session bounces to /login. After the
// real translator UI is built this is where it will live.
export default async function AppPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "4rem 1.5rem" }}>
      <p style={{ color: "var(--accent)", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
        Signed in
      </p>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Hi {data.user.email}.
      </h1>
      <p style={{ color: "var(--fg-muted)", marginBottom: "2rem" }}>
        The translator UI lives here once it&apos;s built. Your history,
        glossaries and API keys will all be tied to this account.
      </p>

      <div className="glass" style={{ padding: "1.5rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
        <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>What&apos;s wired up</p>
        <ul style={{ color: "var(--fg-muted)", paddingLeft: "1.25rem" }}>
          <li>Shared 6x7 login (same session as the hub and other apps)</li>
          <li>Per-user storage in the <code>translator</code> Postgres schema</li>
          <li>Row-level security — only you see your jobs, glossaries, keys</li>
        </ul>
      </div>
    </div>
  );
}
