"use client";

import { User } from "@supabase/supabase-js";
import { ProfileDropdown } from "../ui/profile-dropdown";
import { Logo } from "../ui/logo";

export function QuickStartHeader({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo and Brand */}
        <div className="flex items-center gap-2 px-2">
          <Logo />
          <span className="text-2xl font-bold">MangaAI</span>
        </div>

        <ProfileDropdown user={user} />
      </div>
    </header>
  );
}
