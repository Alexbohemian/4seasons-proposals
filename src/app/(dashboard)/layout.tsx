import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const { data: settings } = await supabase
    .from("company_settings")
    .select("logo_url, company_name")
    .single();

  return (
    <div className="flex min-h-screen">
      <AppSidebar profile={profile} logoUrl={settings?.logo_url ?? null} companyName={settings?.company_name ?? "4 Seasons Greens"} />
      <main className="flex-1 ml-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
