"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase, subscribeToChanges, isRealtimeEnabled } from "@/lib/supabase/config";
import { toast } from "sonner";

export interface RealtimeUpdate {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  old: Record<string, any> | null;
  new: Record<string, any> | null;
  timestamp: number;
}

interface RealtimeSyncContextType {
  isConnected: boolean;
  lastUpdate: RealtimeUpdate | null;
  subscribeToTable: (table: string, callback: (update: RealtimeUpdate) => void) => () => void;
  broadcastChange: (table: string, action: string, data: any) => void;
  refreshData: (tables: string[]) => void;
}

const RealtimeSyncContext = createContext<RealtimeSyncContextType | undefined>(undefined);

export function RealtimeSyncProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null);
  // Use ref instead of state to avoid infinite re-renders
  const subscriptionsRef = useRef<Map<string, Set<(update: RealtimeUpdate) => void>>>(new Map());

  // Initialize real-time connection
  useEffect(() => {
    // Use the centralized realtime configuration
    if (!isRealtimeEnabled) {
      console.log('[RealtimeSync] Realtime is disabled');
      setIsConnected(false);
      return;
    }

    console.log('[RealtimeSync] Initializing real-time sync...');
    setIsConnected(true);

    // Subscribe to all relevant tables
    const tables = ['exhibitions', 'events', 'pricing', 'shows', 'bookings'];
    const unsubscribeFunctions: (() => void)[] = [];

    tables.forEach(table => {
      try {
        const unsubscribe = setupTableSubscription(table);
        unsubscribeFunctions.push(unsubscribe);
      } catch (error) {
        console.error(`Error subscribing to ${table}:`, error);
      }
    });

    return () => {
      console.log('Cleaning up real-time subscriptions...');
      unsubscribeFunctions.forEach(unsub => unsub());
      setIsConnected(false);
    };
  }, []);

  // Setup subscription for a specific table
  const setupTableSubscription = (table: string) => {
    console.log(`Setting up real-time subscription for ${table}`);

    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          console.log(`Real-time update received for ${table}:`, payload);

          const update: RealtimeUpdate = {
            table,
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            old: payload.old || null,
            new: payload.new || null,
            timestamp: Date.now(),
          };

          setLastUpdate(update);

          // Notify all subscribers for this table
          const tableSubscribers = subscriptionsRef.current.get(table);
          if (tableSubscribers) {
            tableSubscribers.forEach(callback => {
              try {
                callback(update);
              } catch (error) {
                console.error(`Error in subscriber callback for ${table}:`, error);
              }
            });
          }

          // Show toast notification for important updates
          if (table === 'exhibitions' || table === 'events') {
            const actionText = payload.eventType === 'INSERT' ? 'added' :
                             payload.eventType === 'UPDATE' ? 'updated' : 'removed';
            const itemName = (payload.new as any)?.name || (payload.new as any)?.title || (payload.old as any)?.name || (payload.old as any)?.title || 'Item';
            
            toast.success(`${table.slice(0, -1).charAt(0).toUpperCase() + table.slice(1, -1)} ${actionText}`, {
              description: itemName,
              duration: 3000,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✓ Successfully subscribed to ${table} changes`);
        }
        // Silently ignore errors - expected when Supabase not configured
      });

    return () => {
      console.log(`Unsubscribing from ${table}`);
      channel.unsubscribe();
    };
  };

  // Subscribe to a specific table with custom callback
  const subscribeToTable = useCallback((table: string, callback: (update: RealtimeUpdate) => void) => {
    console.log(`Adding subscriber for ${table}`);
    
    // Use ref to avoid re-renders
    if (!subscriptionsRef.current.has(table)) {
      subscriptionsRef.current.set(table, new Set());
    }
    subscriptionsRef.current.get(table)!.add(callback);

    // Return unsubscribe function
    return () => {
      console.log(`Removing subscriber for ${table}`);
      const tableSubscribers = subscriptionsRef.current.get(table);
      if (tableSubscribers) {
        tableSubscribers.delete(callback);
        if (tableSubscribers.size === 0) {
          subscriptionsRef.current.delete(table);
        }
      }
    };
  }, []);

  // Broadcast a change (for optimistic updates)
  const broadcastChange = useCallback((table: string, action: string, data: any) => {
    console.log(`Broadcasting ${action} for ${table}:`, data);
    
    const update: RealtimeUpdate = {
      table,
      eventType: action as 'INSERT' | 'UPDATE' | 'DELETE',
      old: null,
      new: data,
      timestamp: Date.now(),
    };

    setLastUpdate(update);

    // Notify subscribers
    const tableSubscribers = subscriptionsRef.current.get(table);
    if (tableSubscribers) {
      tableSubscribers.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error(`Error in subscriber callback for ${table}:`, error);
        }
      });
    }
  }, []);

  // Trigger data refresh for specific tables
  const refreshData = useCallback((tables: string[]) => {
    console.log('Triggering data refresh for tables:', tables);
    
    tables.forEach(table => {
      const update: RealtimeUpdate = {
        table,
        eventType: 'UPDATE',
        old: null,
        new: { _refresh: true },
        timestamp: Date.now(),
      };

      const tableSubscribers = subscriptionsRef.current.get(table);
      if (tableSubscribers) {
        tableSubscribers.forEach(callback => {
          try {
            callback(update);
          } catch (error) {
            console.error(`Error in subscriber callback for ${table}:`, error);
          }
        });
      }
    });
  }, []);

  return (
    <RealtimeSyncContext.Provider
      value={{
        isConnected,
        lastUpdate,
        subscribeToTable,
        broadcastChange,
        refreshData,
      }}
    >
      {children}
    </RealtimeSyncContext.Provider>
  );
}

export function useRealtimeSync() {
  const context = useContext(RealtimeSyncContext);
  if (context === undefined) {
    throw new Error("useRealtimeSync must be used within a RealtimeSyncProvider");
  }
  return context;
}

// Hook for subscribing to specific table changes
export function useTableSync<T = any>(
  table: string,
  onUpdate: (data: T | null, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) {
  const { subscribeToTable } = useRealtimeSync();

  useEffect(() => {
    const unsubscribe = subscribeToTable(table, (update) => {
      if (update.eventType === 'DELETE') {
        onUpdate(update.old as T, 'DELETE');
      } else {
        onUpdate(update.new as T, update.eventType);
      }
    });

    return unsubscribe;
  }, [table, onUpdate, subscribeToTable]);
}

