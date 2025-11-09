'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/config';
import { toast } from 'sonner';
import { Loader } from "@/components/ui/loader";

export default function LoginCard() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@mgmmuseum.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error('No user returned from sign in');
      }

      // Verify user has admin role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        throw new Error('Failed to verify admin role');
      }

      if (!['admin', 'super_admin'].includes(userData.role)) {
        // Sign out if not admin
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin role required.');
      }

      // Show success message
      toast.success('Login successful!', {
        description: 'Redirecting to admin dashboard...',
        duration: 1500,
      });

      // Wait a bit longer to ensure cookies are set, then redirect
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1000);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
      setLoading(false);
      toast.error('Login failed', {
        description: err.message || 'Invalid credentials',
      });
    }
  };

  return (
    <Card className="w-[310px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-md p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Default Credentials Info */}
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-md p-3">
              <p className="text-blue-400 text-sm">
                <strong>Admin Credentials:</strong><br />
                Email: admin@mgmmuseum.com<br />
                Password: admin123
              </p>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                placeholder="Enter your email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push('/')}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader variant="classic" size="sm" className="mr-2" />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
