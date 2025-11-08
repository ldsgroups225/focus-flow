import { Loader2, Orbit } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Orbit className="w-16 h-16 text-primary mb-6 animate-pulse mx-auto" />
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-lg text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  );
}
