"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/config";
import { Loader } from "@/components/ui/loader";
import LoginCard from "@/components/ui/login-card-1";

export default function AdminLoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if user has admin role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userData && ['admin', 'super_admin'].includes(userData.role)) {
          router.replace('/admin');
          return;
        }
      }
      
      setChecking(false);
    };

    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader variant="spiral" size="lg" className="text-foreground" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Login Card */}
      <div className="relative z-10">
        <LoginCard />
      </div>
    </div>
  );
}

