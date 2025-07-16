// src/app/dashboard/layout.tsx
import { createClient } from "@/lib/supabase/server"; // Ensure server helper exists
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

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
    .select("full_name, avatar_url, is_admin")
    .eq("id", user.id)
    .single();

  // Secondary check in case middleware is ever bypassed
  if (profile?.is_admin !== true) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex bg-slate-800 text-slate-100">
      <AdminSidebar
        user={{
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          email: user.email,
        }}
      />
      <main className="flex-1 ml-64 p-8 min-h-screen">{children}</main>
    </div>
  );
}
