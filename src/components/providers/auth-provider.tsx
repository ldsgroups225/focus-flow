'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { convertAppwriteUserToFirebaseUser, getCurrentUser, signOut as appwriteSignOut, type User } from '@/lib/appwrite/auth-services';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => { },
  refreshUser: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const appwriteUser = await getCurrentUser();
      const convertedUser = convertAppwriteUserToFirebaseUser(appwriteUser);
      setUser(convertedUser);
    } catch (error) {
      console.error('Auth refresh error:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const appwriteUser = await getCurrentUser();
        const convertedUser = convertAppwriteUserToFirebaseUser(appwriteUser);
        setUser(convertedUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleSignOut = useCallback(async () => {
    // Optimistically clear user state first to prevent any data fetching
    setUser(null);

    try {
      await appwriteSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
      // Continue with redirect even if API call fails
    }

    // Force redirect to login page
    router.replace('/login');
  }, [router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

