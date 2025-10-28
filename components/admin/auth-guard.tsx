"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAdminAuthenticated, refreshAdminSession } from "@/lib/auth/admin-auth";
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

    // Check authentication
    const checkAuth = () => {
      const authenticated = isAdminAuthenticated();
      
      if (authenticated) {
        // Refresh session to extend expiration
        refreshAdminSession();
        setIsAuthenticated(true);
        setIsChecking(false);
      } else {
        // Redirect to login
        router.replace('/admin/login');
      }
    };

    checkAuth();

    // Recheck authentication every 5 minutes
    const interval = setInterval(() => {
      if (!isAdminAuthenticated()) {
        router.replace('/admin/login');
      } else {
        refreshAdminSession();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
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

