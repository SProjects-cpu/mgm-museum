import { AdminLayout } from "./admin-layout";
import { WebSocketProvider } from "@/lib/contexts/websocket-context";
import { RealtimeSyncProvider } from "@/lib/contexts/realtime-sync-context"; // Re-enabled with environment-based control
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
    <RealtimeSyncProvider>
      <WebSocketProvider>
        <AdminLayout>{children}</AdminLayout>
        <Toaster position="top-right" richColors />
      </WebSocketProvider>
    </RealtimeSyncProvider>
  );
}


