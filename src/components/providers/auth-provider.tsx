'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { convertAppwriteUserToFirebaseUser, getCurrentUser, type User } from '@/lib/appwrite/auth-services';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const appwriteUser = await getCurrentUser();
        const user = convertAppwriteUserToFirebaseUser(appwriteUser);
        setUser(user);
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
