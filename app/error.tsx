'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-muted-foreground mb-6">
          We're sorry, but something unexpected happened. Please try again.
        </p>
        <div className="space-y-3">
          <Button onClick={() => reset()} className="w-full">
            Try again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'} 
            className="w-full"
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
