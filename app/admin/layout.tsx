import { AdminLayout } from "./admin-layout";
import { WebSocketProvider } from "@/lib/contexts/websocket-context";
// import { RealtimeSyncProvider } from "@/lib/contexts/realtime-sync-context"; // DISABLED - causing WebSocket errors
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
      <WebSocketProvider>
        <AdminLayout>{children}</AdminLayout>
        <Toaster position="top-right" richColors />
      </WebSocketProvider>
    </AuthGuard>
  );
}


