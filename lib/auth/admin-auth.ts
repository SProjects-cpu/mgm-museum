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
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (userError || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    console.error('Admin verification failed:', userError);
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
