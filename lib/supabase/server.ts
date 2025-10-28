import { getServiceSupabase } from './config';

// Export the server-side client function
export const createClient = getServiceSupabase;

// Re-export other utilities
export * from './config';
