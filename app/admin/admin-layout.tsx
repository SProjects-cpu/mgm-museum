"use client";

import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from "@/components/layout/enhanced-admin-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminFooter } from "@/components/layout/admin-footer";
import { useSidebarLayout } from "@/hooks/use-sidebar-layout";

function AdminContent({ children }: { children: React.ReactNode }) {
  const { sidebarWidth } = useSidebarLayout();

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <AdminHeader />
      <main
        className="flex-1 overflow-y-auto bg-muted/30 transition-all duration-200 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="container mx-auto max-w-[1920px] p-4 md:p-6 lg:p-8 xl:p-10 transition-all duration-200 ease-in-out">
          <div className="flex flex-col gap-6">
            {children}
          </div>
          <AdminFooter />
        </div>
      </main>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="admin-layout flex h-screen w-full overflow-hidden">
        <AdminSidebar />
        <AdminContent>{children}</AdminContent>
      </div>
    </SidebarProvider>
  );
}

