"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useMockWebSocket, WebSocketStatus, WebSocketMessage } from "@/lib/hooks/useWebSocket";
import { toast } from "sonner";

interface WebSocketContextType {
  status: WebSocketStatus;
  lastMessage: WebSocketMessage | null;
  sendMessage: (type: string, data: any) => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { status, lastMessage, sendMessage, isConnected } = useMockWebSocket();
  const [hasShownConnected, setHasShownConnected] = useState(false);

  // Show connection status notifications
  useEffect(() => {
    if (status === "connected" && !hasShownConnected) {
      toast.success("Real-time updates connected", {
        duration: 2000,
      });
      setHasShownConnected(true);
    } else if (status === "error") {
      toast.error("Connection error - retrying...", {
        duration: 3000,
      });
    }
  }, [status, hasShownConnected]);

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case "booking":
          // Handle new booking notification
          break;
        case "visitor":
          // Handle visitor count update
          break;
        case "show_update":
          // Handle show capacity update
          break;
        default:
          break;
      }
    }
  }, [lastMessage]);

  return (
    <WebSocketContext.Provider value={{ status, lastMessage, sendMessage, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
}















