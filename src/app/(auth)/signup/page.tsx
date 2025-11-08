'use client';

import { useState } from 'react';
import { Orbit, User as UserIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signUpWithEmail, getCurrentUser } from '@/lib/appwrite/auth-services';

export default function SignupPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    try {
      setIsLoading(true);
      await signUpWithEmail(email, password, name);
      const me = await getCurrentUser();
      if (me) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign Up Error',
        description: 'Failed to create an account. Please try again.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center w-full px-4">
      <Orbit className="w-16 h-16 text-primary mb-6" />
      <h1 className="text-4xl font-bold mb-2">Create an Account</h1>
      <p className="text-lg text-muted-foreground mb-8">Join us and start your journey.</p>

      <div className="w-full max-w-sm space-y-4">
        <div className="text-left">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>
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
        <div className="text-left">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={handleSignup}
          size="lg"
          className="w-full"
          disabled={isLoading || !name || !email || !password}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <UserIcon className="mr-2 h-5 w-5" />
          )}
          Sign Up
        </Button>
      </div>
    </div>
  );
}
