import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServiceSupabase } from './config';
import type { Database } from '@/types/database';

// Create a Supabase client that reads from cookies (for authenticated requests)
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Export service role client for admin operations that don't need user context
export const createServiceClient = getServiceSupabase;

// Re-export other utilities
export * from './config';
