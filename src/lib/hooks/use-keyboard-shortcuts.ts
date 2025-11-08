'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onNewTask?: () => void;
  onOpenSearch?: () => void;
  onShowShortcuts?: () => void;
  onClearSelection?: () => void;
}

export function useKeyboardShortcuts(
  handlers: ShortcutHandlers,
  isEditing: boolean
) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
      // Don't trigger shortcuts while editing
      if (isEditing) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrMeta = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K: Open search
      if (isCtrlOrMeta && e.key === 'k') {
        e.preventDefault();
        handlers.onOpenSearch?.();
      }

      // ?: Show shortcuts
      if (e.key === '?') {
        e.preventDefault();
        handlers.onShowShortcuts?.();
      }

      // N: New task
      if (e.key === 'n') {
        e.preventDefault();
        handlers.onNewTask?.();
      }

      // Escape: Clear selection
      if (e.key === 'Escape') {
        handlers.onClearSelection?.();
      }
  }, [handlers, isEditing]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);
}
