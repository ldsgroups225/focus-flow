'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getCurrentUser } from '@/lib/appwrite/auth-services';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait a moment for the session to be fully established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify the user is authenticated
        const user = await getCurrentUser();
        
        if (user) {
          setStatus('success');
          // Redirect to home after a brief success message
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          throw new Error('Authentication failed - no user session found');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
        
        // Redirect to login after showing error
        setTimeout(() => {
          router.push('/?error=auth_failed');
        }, 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      {status === 'loading' && (
        <>
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Completing sign in...</p>
        </>
      )}
      
      {status === 'success' && (
        <>
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <p className="text-lg text-foreground font-semibold">Sign in successful!</p>
          <p className="text-sm text-muted-foreground mt-2">Redirecting to your tasks...</p>
        </>
      )}
      
      {status === 'error' && (
        <>
          <XCircle className="h-16 w-16 text-red-500 mb-4" />
          <p className="text-lg text-foreground font-semibold">Sign in failed</p>
          <p className="text-sm text-muted-foreground mt-2">{errorMessage}</p>
          <p className="text-xs text-muted-foreground mt-4">Redirecting back to login...</p>
        </>
      )}
    </div>
  );
}
