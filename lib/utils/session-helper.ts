import { supabase } from '@/lib/supabase/config';

export interface SessionWaitResult {
  success: boolean;
  session: any | null;
  error?: string;
}

/**
 * Waits for Supabase session to be fully established and verified
 * Uses exponential backoff with retries
 */
export async function waitForSession(
  maxAttempts: number = 5,
  initialDelay: number = 1000
): Promise<SessionWaitResult> {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxAttempts) {
    attempt++;
    
    // Wait before checking (except first attempt)
    if (attempt > 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, 5000); // Exponential backoff, max 5s
    } else {
      // First attempt: wait initial delay
      await new Promise(resolve => setTimeout(resolve, initialDelay));
    }

    try {
      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error(`Session check attempt ${attempt} failed:`, sessionError);
        continue;
      }

      if (!session) {
        console.warn(`Session check attempt ${attempt}: No session found`);
        continue;
      }

      // Verify session by getting user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error(`User verification attempt ${attempt} failed:`, userError);
        continue;
      }

      if (!user) {
        console.warn(`User verification attempt ${attempt}: No user found`);
        continue;
      }

      // Test API connectivity with a simple request
      try {
        const testResponse = await fetch('/api/cart/load', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        // If we get 401, session not ready yet
        if (testResponse.status === 401) {
          console.warn(`API test attempt ${attempt}: Got 401, session not ready`);
          continue;
        }

        // Any other response (including 500) means session is established
        // 500 might just mean empty cart, which is fine
        console.log(`Session established successfully on attempt ${attempt}`);
        return {
          success: true,
          session,
        };
      } catch (apiError) {
        console.error(`API test attempt ${attempt} failed:`, apiError);
        // Network error, but session might be valid, continue
        continue;
      }
    } catch (error: any) {
      console.error(`Session wait attempt ${attempt} error:`, error);
      continue;
    }
  }

  return {
    success: false,
    session: null,
    error: `Failed to establish session after ${maxAttempts} attempts`,
  };
}

/**
 * Executes a cart operation with retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<{ success: boolean; data?: T; error?: string }> {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error: any) {
      console.error(`Operation attempt ${attempt} failed:`, error);

      // If it's an auth error, don't retry
      if (error.message?.includes('Authentication') || 
          error.message?.includes('Unauthorized')) {
        return {
          success: false,
          error: 'Authentication failed. Please login again.',
        };
      }

      // If it's the last attempt, return error
      if (attempt >= maxAttempts) {
        return {
          success: false,
          error: error.message || 'Operation failed after multiple attempts',
        };
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  return {
    success: false,
    error: 'Operation failed',
  };
}
