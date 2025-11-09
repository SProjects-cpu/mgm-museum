import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Verify that the current user is authenticated and has admin role
 * Returns the session if successful, or a NextResponse error if not
 */
export async function verifyAdminAuth() {
  const supabase = await createClient();
  
  // Verify authentication
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      ),
      session: null,
      supabase: null
    };
  }

  // Verify admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    console.error('Admin verification failed:', profileError);
    return {
      error: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      ),
      session: null,
      supabase: null
    };
  }

  return {
    error: null,
    session,
    supabase
  };
}
