"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  LayoutGrid,
  Image,
  GraduationCap,
  Settings,
  HelpCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Logo } from "../ui/logo";

export function HomeSidebar() {
  const router = useRouter();

  return (
    <Sidebar>
      <SidebarHeader className="h-20 flex flex-row items-center">
        <div className="flex items-center gap-2 px-2">
          <Logo />
          <span className="text-2xl font-bold">MangaV0</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={true}>
              <Link href="/">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/templates">
                <LayoutGrid />
                <span>Templates</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/assets">
                <Image />
                <span>Assets</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/tutorials">
                <GraduationCap />
                <span>Tutorials</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-5">
        <Button onClick={() => router.push("/quick-start")}>
          <Plus />
          Create New Project
        </Button>

        <SidebarSeparator className="my-2" />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/help">
                <HelpCircle className="size-4" />
                <span>Help</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
