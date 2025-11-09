"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/config";
import { Loader } from "@/components/ui/loader";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setIsChecking(false);
      setIsAuthenticated(true);
      return;
    }

    // Check authentication with Supabase
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          router.replace('/admin/login');
          return;
        }

        // Verify admin role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
          // Not an admin, sign out and redirect
          await supabase.auth.signOut();
          router.replace('/admin/login');
          return;
        }

        setIsAuthenticated(true);
        setIsChecking(false);
      } catch (err) {
        console.error('Auth check error:', err);
        router.replace('/admin/login');
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/admin/login');
      } else if (event === 'SIGNED_IN' && session) {
        // Verify admin role on sign in
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userData && ['admin', 'super_admin'].includes(userData.role)) {
          setIsAuthenticated(true);
          setIsChecking(false);
        } else {
          await supabase.auth.signOut();
          router.replace('/admin/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader variant="spiral" size="lg" className="text-primary" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Show children if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show nothing while redirecting
  return null;
}

