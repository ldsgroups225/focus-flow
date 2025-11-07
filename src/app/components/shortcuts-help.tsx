'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useI18n } from './i18n-provider';

type ShortcutsHelpProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[12px] font-medium text-muted-foreground opacity-100">
    {children}
  </kbd>
);

export function ShortcutsHelp({ isOpen, setIsOpen }: ShortcutsHelpProps) {
  const { t } = useI18n();

  const shortcuts = [
    { key: 'N', description: t('shortcuts.newTask') },
    { key: '?', description: t('shortcuts.showShortcuts') },
    { key: 'Ctrl + K', description: t('shortcuts.openSearch') },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('shortcuts.title')}</DialogTitle>
          <DialogDescription>{t('shortcuts.description')}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-2">
          {shortcuts.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between">
              <p className="text-sm text-foreground">{description}</p>
              <Kbd>{key}</Kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
