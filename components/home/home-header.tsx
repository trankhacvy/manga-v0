"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell } from "lucide-react";
import { ProfileDropdown } from "@/components/ui/profile-dropdown";
import type { User } from "@supabase/supabase-js";

export function HomeHeader({ user }: { user: User }) {
  return (
    <header className="flex bg-background z-50 fixed left-[var(--sidebar-width)] right-0 top-0 h-20 items-center justify-between border-b px-5">
      <div className="flex items-center gap-4">
        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
          My Projects
        </h2>
      </div>
      <div className="flex flex-1 justify-end items-center gap-4">
        <div className="flex w-full max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search projects..."
              className="w-full h-10 pl-10 bg-slate-800 border-none text-white placeholder:text-slate-400"
            />
          </div>
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          <span className="absolute top-1.5 right-1.5 size-2 bg-primary rounded-full" />
        </Button>

        <ProfileDropdown user={user} />
      </div>
    </header>
  );
}
