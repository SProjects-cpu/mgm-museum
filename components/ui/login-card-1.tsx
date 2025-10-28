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
import { validateAdminCredentials, createAdminSession, DEFAULT_ADMIN } from '@/lib/auth/admin-auth';
import { toast } from 'sonner';
import { Loader } from "@/components/ui/loader";

export default function LoginCard() {
  const router = useRouter();
  const [email, setEmail] = useState(DEFAULT_ADMIN.email);
  const [password, setPassword] = useState(DEFAULT_ADMIN.password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate credentials
    if (validateAdminCredentials(email, password)) {
      // Create session
      createAdminSession(email);
      
      // Show success message
      toast.success('Login successful!', {
        description: 'Redirecting to admin dashboard...',
        duration: 2000,
      });

      // Redirect to admin dashboard
      setTimeout(() => {
        router.push('/admin');
      }, 500);
    } else {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      toast.error('Login failed', {
        description: 'Invalid credentials',
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
                <strong>Default Credentials:</strong><br />
                Email: {DEFAULT_ADMIN.email}<br />
                Password: {DEFAULT_ADMIN.password}
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
