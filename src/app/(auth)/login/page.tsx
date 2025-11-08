'use client';

import { useState, useEffect } from 'react';
import { Orbit, User as UserIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/app/components/i18n-provider';
import { useToast } from '@/hooks/use-toast';
import { requestEmailOtp, verifyEmailOtp, getCurrentUser } from '@/lib/appwrite/auth-services';

export default function LoginPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [phrase, setPhrase] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Check for error in URL params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      if (error === 'auth_failed') {
        toast({
          variant: 'destructive',
          title: 'Authentication Failed',
          description: 'Unable to sign in with Google. Please try again.',
        });
        // Clean up URL
        window.history.replaceState({}, '', '/');
      }
    }
  }, [toast]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const token = await requestEmailOtp(email, { phrase: true });
      setUserId(token.userId);
      setPhrase(token.phrase);
      setStep('code');
      setCode('');
      setIsLoading(false); // allow entering the code
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign In Error',
        description: 'Failed to send code. Verify your email and try again.',
      });
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      await verifyEmailOtp(userId, code);
      // Confirm session is active; if yes, reload to render the app
      const me = await getCurrentUser();
      if (me) {
        window.location.href = '/';
        return;
      }
    } catch (error) {
      console.error('Verify error:', error);
      toast({
        variant: 'destructive',
        title: 'Invalid code',
        description: 'Please check the 6-digit code and try again.',
      });
    } finally {
      // Ensure UI unlocks even if auth provider polling needs more time
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center w-full px-4">
      <Orbit className="w-16 h-16 text-primary mb-6" />
      <h1 className="text-4xl font-bold mb-2">{t('header.title')}</h1>
      <p className="text-lg text-muted-foreground mb-8">Sign in with a one-time code sent to your email.</p>

      {step === 'email' && (
        <div className="w-full max-w-sm space-y-4">
          <div className="text-left">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleLogin}
            size="lg"
            className="w-full"
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <UserIcon className="mr-2 h-5 w-5" />
            )}
            Send code
          </Button>
        </div>
      )}

      {step === 'code' && (
        <div className="w-full max-w-sm space-y-4">
          {phrase && (
            <p className="text-sm text-muted-foreground">
              Security phrase: <span className="font-medium">{phrase}</span>
            </p>
          )}
          <div className="text-left">
            <Label htmlFor="code">Enter 6-digit code</Label>
            <Input
              id="code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="w-1/3"
              onClick={() => {
                setStep('email');
                setIsLoading(false);
              }}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              onClick={handleVerify}
              className="w-2/3"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <UserIcon className="mr-2 h-5 w-5" />
              )}
              Verify & Sign in
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
