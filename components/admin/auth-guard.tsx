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

    // Simplified auth check - trust middleware for route protection
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // If we got here and have a session, middleware already verified admin role
        if (session) {
          setIsAuthenticated(true);
          setIsChecking(false);
        } else {
          // No session, redirect to login
          window.location.href = '/admin/login';
        }
      } catch (err) {
        console.error('Auth check error:', err);
        window.location.href = '/admin/login';
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        window.location.href = '/admin/login';
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        setIsChecking(false);
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

