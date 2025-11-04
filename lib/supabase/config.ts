// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
                             supabaseAnonKey && 
                             !supabaseUrl.includes('placeholder') &&
                             !supabaseAnonKey.includes('placeholder') &&
                             supabaseUrl.startsWith('https://');

// DISABLE realtime - use polling instead
// WebSocket is failing because Supabase Realtime is not configured
// Polling provides reliable 30-second updates without errors
const shouldEnableRealtime = false;

// Export realtime status for components to check
export const isRealtimeEnabled = shouldEnableRealtime;

// Create a dummy client if not configured (prevents errors)
const createDummyClient = () => {
  const dummyQuery = {
    select: () => dummyQuery,
    insert: () => dummyQuery,
    update: () => dummyQuery,
    delete: () => dummyQuery,
    eq: () => dummyQuery,
    neq: () => dummyQuery,
    gt: () => dummyQuery,
    gte: () => dummyQuery,
    lt: () => dummyQuery,
    lte: () => dummyQuery,
    like: () => dummyQuery,
    ilike: () => dummyQuery,
    is: () => dummyQuery,
    in: () => dummyQuery,
    contains: () => dummyQuery,
    containedBy: () => dummyQuery,
    rangeGt: () => dummyQuery,
    rangeGte: () => dummyQuery,
    rangeLt: () => dummyQuery,
    rangeLte: () => dummyQuery,
    rangeAdjacent: () => dummyQuery,
    overlaps: () => dummyQuery,
    textSearch: () => dummyQuery,
    match: () => dummyQuery,
    not: () => dummyQuery,
    or: () => dummyQuery,
    filter: () => dummyQuery,
    order: () => dummyQuery,
    limit: () => dummyQuery,
    range: () => dummyQuery,
    single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    maybeSingle: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    then: (resolve: any) => resolve({ data: [], error: new Error('Supabase not configured') }),
  };

  return {
    from: () => dummyQuery,
    rpc: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as any;
};

const dummyClient = createDummyClient();

// Client-side Supabase client (browser) with REALTIME ENABLED
export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: shouldEnableRealtime ? 10 : 0, // Disabled - using polling
        },
      },
      global: {
        headers: {
          'x-client-info': 'mgm-museum-web',
        },
      },
    })
  : dummyClient;

// Log realtime status (helpful for debugging)
if (typeof window !== 'undefined' && isSupabaseConfigured) {
  console.log(`[Supabase] Realtime: ${shouldEnableRealtime ? 'ENABLED' : 'DISABLED'} - Using polling for updates (${process.env.NODE_ENV})`);
}

// Server-side Supabase client with service role
export function getServiceSupabase() {
  if (!isSupabaseConfigured || !supabaseServiceRoleKey) {
    console.warn('Supabase service role key not configured');
    return dummyClient;
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: shouldEnableRealtime ? 10 : 0, // Disabled - using polling
      },
    },
  });
}

// Database connection validation
export async function validateDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const client = getServiceSupabase();

    // Test basic connection by querying a simple table
    const { data, error } = await client
      .from('exhibitions')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return {
        success: false,
        message: `Database connection failed: ${error.message}`,
        details: error,
      };
    }

    return {
      success: true,
      message: 'Database connection successful',
      details: { recordCount: data },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection validation error: ${error.message}`,
      details: error,
    };
  }
}

// Real-time subscription helper with error handling
export function subscribeToChanges<T>(
  table: string,
  callback: (payload: T) => void,
  filter?: string
) {
  try {
    const channel = supabase.channel(`${table}-changes`);

    const subscription = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      (payload) => {
        try {
          callback(payload.new as T);
        } catch (error) {
          console.error(`Error in realtime callback for ${table}:`, error);
        }
      }
    );

    subscription.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Supabase] Successfully subscribed to ${table} changes`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Supabase] Error subscribing to ${table}:`, err);
        // Don't throw error, just log it
      } else if (status === 'TIMED_OUT') {
        console.warn(`[Supabase] Subscription to ${table} timed out, will retry`);
      } else if (status === 'CLOSED') {
        console.log(`[Supabase] Subscription to ${table} closed`);
      }
    });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error(`Error removing channel for ${table}:`, error);
      }
    };
  } catch (error) {
    console.error(`Error setting up realtime subscription for ${table}:`, error);
    return () => {}; // Return empty cleanup function
  }
}

// Helper to check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) return false;

    return data.role === 'admin' || data.role === 'super_admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Helper to get current user profile with error handling
export async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error getting current user profile:', error);
    return null;
  }
}

// Storage helpers for file uploads
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: File | Buffer,
  contentType?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const client = getServiceSupabase();

    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: { publicUrl } } = client.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Export configuration status
export const supabaseConfig = {
  isConfigured: isSupabaseConfigured,
  hasServiceRole: !!supabaseServiceRoleKey,
  realtimeEnabled: shouldEnableRealtime,
  environment: process.env.NODE_ENV,
};

// Export types
export type { Database };
