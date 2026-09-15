import { createClient } from "@supabase/supabase-js";
import { adminClient, JOBS_TABLE, UPLOAD_BUCKET } from "./supabase/admin";
import { ASSISTANT_CHATS_TABLE } from "./assistant/meta";

function authAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Delete all Translator data for a user, then remove the auth account. */
export async function deleteUserAccount(userId: string): Promise<void> {
  const db = adminClient();

  const jobs = await db.from(JOBS_TABLE).select("id, media_path").eq("user_id", userId);
  const paths = (jobs.data || []).map((j) => j.media_path).filter(Boolean) as string[];
  if (paths.length) {
    await db.storage.from(UPLOAD_BUCKET).remove(paths).then(() => {}, () => {});
  }

  await db.from(JOBS_TABLE).delete().eq("user_id", userId);
  await db.from("usage_monthly").delete().eq("user_id", userId);
  // Saved assistant chats live in public, not the translator schema. The auth.users FK would cascade too,
  // but delete explicitly so they go even if removing the login below fails.
  await db.schema("public").from(ASSISTANT_CHATS_TABLE).delete().eq("user_id", userId);

  const { error } = await authAdmin().auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}
