'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useI18n } from './i18n-provider';

type CommandSearchProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
};

export function CommandSearch({ isOpen, setIsOpen, setSearchQuery }: CommandSearchProps) {
  const { t } = useI18n();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 300); // Debounce search input
    return () => clearTimeout(timeoutId);
  }, [inputValue, setSearchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setSearchQuery('');
    }
  }, [isOpen, setSearchQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="sr-only">{t('search.placeholder')}</DialogTitle>
          <DialogDescription className="sr-only">{t('search.description')}</DialogDescription>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('search.placeholder')}
              className="border-0 h-auto p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </DialogHeader>
        <div className="p-4 text-sm text-center text-muted-foreground">
          {t('search.description')}
        </div>
      </DialogContent>
    </Dialog>
  );
}
