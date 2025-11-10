'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/app/components/i18n-provider';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold mb-4">{t('error.http404')}</h1>
        <h2 className="text-2xl font-bold mb-4">{t('error.pageNotFound')}</h2>
        <p className="text-muted-foreground mb-6">
          {t('error.pageNotFoundDesc')}
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild variant="default">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              {t('error.goHome')}
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('error.goBack')}
          </Button>
        </div>
      </div>
    </div>
  );
}
