import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/SettingsClient";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Settings | Translator",
  description: "Language defaults, usage quotas, and account settings.",
  path: "/settings",
  noIndex: true,
});

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return <SettingsClient email={data.user?.email ?? null} />;
}
