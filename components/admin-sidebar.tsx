"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Image,
  Ticket,
  Calendar,
  DollarSign,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const adminData = {
  user: {
    name: "Admin User",
    email: "admin@mgmmuseum.org",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Exhibitions",
      url: "/admin/exhibitions",
      icon: Image,
    },
    {
      title: "Shows",
      url: "/admin/shows",
      icon: Ticket,
    },
    {
      title: "Bookings",
      url: "/admin/bookings",
      icon: Calendar,
    },
    {
      title: "Events",
      url: "/admin/events",
      icon: Calendar,
    },
    {
      title: "Pricing",
      url: "/admin/pricing",
      icon: DollarSign,
    },

    {
      title: "Content",
      url: "/admin/content",
      icon: FileText,
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: "Feedbacks",
      url: "/admin/feedbacks",
      icon: Sparkles,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
    },
  ],
};

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-zinc-800/50 bg-black transition-all duration-200 ease-in-out"
      {...props}
    >
      <SidebarHeader className="border-b border-zinc-800/50 bg-zinc-950/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin" className="group">
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-300">
                  <Sparkles className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-white">MGM Admin</span>
                  <span className="truncate text-xs text-zinc-400 font-medium">
                    Science Centre
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="p-2 bg-black">
        <NavMain items={adminData.navMain} />
      </SidebarContent>

      <SidebarFooter className="border-t border-zinc-800/50 bg-zinc-950/50">
        <NavUser user={adminData.user} />
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}


