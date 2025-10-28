"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationPanel } from "@/components/admin/notification-panel";
import { RealTimeIndicator } from "@/components/admin/real-time-indicator";
import { clearAdminSession } from "@/lib/auth/admin-auth";
import { toast } from "sonner";

export function AdminHeader() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    clearAdminSession();
    toast.success("Logged out successfully");
    router.push('/admin/login');
  };

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showNotifications]);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-zinc-800/50 bg-black/95 backdrop-blur-xl">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-4 lg:px-6">
        {/* Hamburger Trigger */}
        <SidebarTrigger className="p-2 hover:bg-zinc-900 rounded-lg transition-all duration-200 text-zinc-400 hover:text-white" />
        
        <Separator orientation="vertical" className="h-6 bg-zinc-800" />

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search admin panel..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Real-time Indicator */}
          <RealTimeIndicator className="hidden md:flex" />

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </Button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 z-50 animate-slideInDown">
                <NotificationPanel
                  onClose={() => setShowNotifications(false)}
                />
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            className="rounded-lg border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white" 
            asChild
          >
            <Link href="/">View Site</Link>
          </Button>

          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-red-400"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}


