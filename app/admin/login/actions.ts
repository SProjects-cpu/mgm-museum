'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  // Verify admin role
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'No user found' };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
    await supabase.auth.signOut();
    return { error: 'Access denied. Admin role required.' };
  }

  revalidatePath('/', 'layout');
  redirect('/admin');
}
