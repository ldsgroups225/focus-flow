'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import { useAuth } from '@/components/providers/auth-provider';
import { Loader2 } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className={`${inter.className} min-h-screen bg-background text-foreground flex items-center justify-center`}>
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render login page if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className={`${inter.className} min-h-screen bg-background text-foreground`}>
      {children}
    </div>
  );
}
