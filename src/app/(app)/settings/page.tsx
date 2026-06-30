import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/SettingsClient";

export const metadata = { title: "Settings — Translator" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return <SettingsClient email={data.user?.email ?? null} />;
}
