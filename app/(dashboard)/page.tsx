import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { HomeHeader } from "@/components/home/home-header";
import { ProjectList } from "@/components/home/project-list";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <HomeHeader user={user} />
      <ProjectList />
    </>
  );
}
