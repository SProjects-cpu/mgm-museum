'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateAdminCredentials, createAdminSession, DEFAULT_ADMIN } from '@/lib/auth/admin-auth';
import { toast } from 'sonner';
import { Loader } from "@/components/ui/loader";

export default function LoginCardBackup() {
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
    <div className="w-[310px] bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Login</h1>
        <p className="text-gray-400 text-sm">Enter your credentials to access your account.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white text-sm font-medium">Email</Label>
          <Input 
            id="email" 
            placeholder="Enter your email" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white text-sm font-medium">Password</Label>
          <Input
            id="password"
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500"
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => router.push('/')}
            disabled={loading}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={loading}
            className="bg-gray-200 text-black hover:bg-gray-100"
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
        </div>
      </form>
    </div>
  );
}






