import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Server-side client with the service role — bypasses RLS. NEVER expose to the browser.
// Scoped to the `translator` Postgres schema so queries hit translator.* tables.
export function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: "translator" },
  });
}

export const UPLOAD_BUCKET = "translator-uploads";
export const JOBS_TABLE = "jobs";
