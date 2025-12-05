import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { HomeSidebar } from "@/components/home/home-sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <HomeSidebar />
        <SidebarInset>{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
