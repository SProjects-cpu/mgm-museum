"use client";

import { useWebSocketContext } from "@/lib/contexts/websocket-context";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

export function RealTimeIndicator({ className }: { className?: string }) {
  const { status, isConnected } = useWebSocketContext();

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
        isConnected
          ? "bg-success/10 text-success"
          : status === "connecting"
          ? "bg-warning/10 text-warning"
          : "bg-error/10 text-error",
        className
      )}
    >
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3" />
          <span>Live</span>
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        </>
      ) : status === "connecting" ? (
        <>
          <Wifi className="w-3 h-3 animate-pulse" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}















