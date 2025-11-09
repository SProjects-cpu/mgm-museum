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
import { toast } from 'sonner';
import { Loader } from "@/components/ui/loader";
import { login } from '@/app/admin/login/actions';

export default function LoginCard() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await login(formData);

      if (result?.error) {
        throw new Error(result.error);
      }

      // If we get here, redirect was successful
      toast.success('Login successful!');
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
    <form onSubmit={handleSubmit}>
      <Card className="w-[310px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                name="email"
                placeholder="Enter your email" 
                type="email" 
                defaultValue="admin@mgmmuseum.com"
                required
                disabled={loading}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                placeholder="Enter your password"
                type="password"
                defaultValue="admin123"
                required
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => router.push('/')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
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
    </form>
  );
}
