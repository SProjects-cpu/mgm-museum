"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/admin/account/verify-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setStatus('success');
      setMessage(data.message);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/admin/login');
      }, 3000);
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {status === 'verifying' && 'Verifying your email address...'}
            {status === 'success' && 'Email verified successfully'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-4">
              <Loader variant="classic" size="lg" />
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-green-900 dark:text-green-100">
                  Email Verified Successfully!
                </p>
                <p className="text-sm text-muted-foreground">
                  {message}
                </p>
                <p className="text-xs text-muted-foreground">
                  Redirecting to login page in 3 seconds...
                </p>
              </div>
              <Button onClick={() => router.push('/admin/login')} className="w-full">
                Go to Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-red-900 dark:text-red-100">
                  Verification Failed
                </p>
                <p className="text-sm text-muted-foreground">
                  {message}
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Button onClick={() => router.push('/admin/settings/account')} className="w-full">
                  Request New Link
                </Button>
                <Button onClick={() => router.push('/admin/login')} variant="outline" className="w-full">
                  Back to Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader variant="classic" size="lg" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
