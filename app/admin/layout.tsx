import { AdminLayout } from "./admin-layout";
import { WebSocketProvider } from "@/lib/contexts/websocket-context";
import { RealtimeSyncProvider } from "@/lib/contexts/realtime-sync-context";
import { AuthGuard } from "@/components/admin/auth-guard";
import { Toaster } from "sonner";

export const metadata = {
  title: {
    default: "Admin Panel | MGM Museum",
    template: "%s | Admin Panel",
  },
  description: "Administration panel for MGM Science Centre",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <RealtimeSyncProvider>
        <WebSocketProvider>
          <AdminLayout>{children}</AdminLayout>
          <Toaster position="top-right" richColors />
        </WebSocketProvider>
      </RealtimeSyncProvider>
    </AuthGuard>
  );
}


