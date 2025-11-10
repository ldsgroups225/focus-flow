'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getCurrentUser } from '@/lib/appwrite/auth-services';
import { useI18n } from '@/app/components/i18n-provider';

export default function AuthCallback() {
  const router = useRouter();
  const { t } = useI18n();
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
          throw new Error(t('login.noSession'));
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : t('login.authFailedDesc'));
        
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
          <p className="text-lg text-muted-foreground">{t('login.completingSignIn')}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <p className="text-lg text-foreground font-semibold">{t('login.success')}</p>
          <p className="text-sm text-muted-foreground mt-2">{t('login.redirecting')}</p>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="h-16 w-16 text-red-500 mb-4" />
          <p className="text-lg text-foreground font-semibold">{t('login.signInFailed')}</p>
          <p className="text-sm text-muted-foreground mt-2">{errorMessage}</p>
          <p className="text-xs text-muted-foreground mt-4">{t('login.redirectingBack')}</p>
        </>
      )}
    </div>
  );
}
