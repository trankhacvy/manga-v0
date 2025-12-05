import { QuickStartHeader } from "@/components/quick-start/header";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function QuickStartLayout({
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

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background">
      <QuickStartHeader user={user} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
