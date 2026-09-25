import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { PageAssistantWidget } from "@/components/PageAssistantWidget";
import { SystemHealthBanner } from "@/components/SystemHealthBanner";

// Shared shell for all signed-in app pages: auth gate + sidebar nav.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <div className="tr-shell">
      <Sidebar email={data.user.email} />
      <main id="main-content" className="tr-main">
        <SystemHealthBanner />
        {children}
      </main>
      <PageAssistantWidget />
    </div>
  );
}
