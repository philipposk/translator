import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Workspace } from "@/components/translate/Workspace";

// Auth-gated route. Anyone without a 6x7 session bounces to /login.
export default async function AppPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return <Workspace />;
}
