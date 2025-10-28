// Admin Authentication Utilities
// Simple session-based auth for admin panel

const ADMIN_SESSION_KEY = 'mgm_admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Default admin credentials
export const DEFAULT_ADMIN = {
  email: 'admin@mgmmuseum.com',
  password: 'admin123', // In production, this should be hashed
  name: 'Admin User',
  role: 'admin'
};

export interface AdminSession {
  email: string;
  name: string;
  role: string;
  expiresAt: number;
}

// Validate admin credentials
export function validateAdminCredentials(email: string, password: string): boolean {
  return email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password;
}

// Create admin session
export function createAdminSession(email: string): AdminSession {
  const session: AdminSession = {
    email,
    name: DEFAULT_ADMIN.name,
    role: DEFAULT_ADMIN.role,
    expiresAt: Date.now() + SESSION_DURATION,
  };

  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

// Get current admin session
export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!sessionData) {
      return null;
    }

    const session: AdminSession = JSON.parse(sessionData);

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      clearAdminSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error reading admin session:', error);
    return null;
  }
}

// Check if admin is authenticated
export function isAdminAuthenticated(): boolean {
  const session = getAdminSession();
  return session !== null && session.expiresAt > Date.now();
}

// Clear admin session (logout)
export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

// Refresh session (extend expiration)
export function refreshAdminSession(): boolean {
  const session = getAdminSession();
  if (!session) {
    return false;
  }

  session.expiresAt = Date.now() + SESSION_DURATION;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  }

  return true;
}

