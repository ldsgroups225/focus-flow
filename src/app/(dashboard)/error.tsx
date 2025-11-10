'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '@/app/components/i18n-provider';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertCircle className="w-16 h-16 text-destructive mb-6 mx-auto" />
        <h2 className="text-2xl font-bold mb-4">{t('error.somethingWentWrong')}</h2>
        <p className="text-muted-foreground mb-6">
          {error.message || t('error.unexpectedError')}
        </p>
        <Button onClick={reset} variant="default">
          {t('error.tryAgain')}
        </Button>
      </div>
    </div>
  );
}
