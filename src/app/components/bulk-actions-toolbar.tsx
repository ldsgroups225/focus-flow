'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Trash2, ArrowUp, ArrowDown, Minus, X } from 'lucide-react';
import type { Task, Priority } from '@/lib/types';
import { useI18n } from './i18n-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BulkActionsToolbarProps = {
  selectedTaskIds: Set<string>;
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
};

export function BulkActionsToolbar({ selectedTaskIds, setSelectedTaskIds, setTasks }: BulkActionsToolbarProps) {
  const { t } = useI18n();
  const selectedCount = selectedTaskIds.size;

  const handleBulkDelete = () => {
    setTasks(prev => prev.filter(task => !selectedTaskIds.has(task.id)));
    setSelectedTaskIds(new Set());
  };

  const handleBulkComplete = (completed: boolean) => {
    setTasks(prev => prev.map(task => selectedTaskIds.has(task.id) ? { ...task, completed } : task));
    setSelectedTaskIds(new Set());
  };

  const handleBulkPriorityChange = (priority: Priority) => {
    setTasks(prev => prev.map(task => selectedTaskIds.has(task.id) ? { ...task, priority } : task));
    setSelectedTaskIds(new Set());
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-auto bg-background border shadow-lg rounded-full flex items-center gap-2 p-2 z-40"
        >
          <span className="text-sm font-medium px-3">{`${selectedCount} ${t('filters.selected')}`}</span>
          <Button variant="ghost" size="icon" title={t('bulkActions.markComplete')} onClick={() => handleBulkComplete(true)}>
            <CheckCircle2 className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title={t('bulkActions.changePriority')}>
                <ArrowUp className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="mb-2">
              <DropdownMenuItem onClick={() => handleBulkPriorityChange('high')}><ArrowUp className="w-4 h-4 mr-2 text-red-500" /> {t('filters.high')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkPriorityChange('medium')}><Minus className="w-4 h-4 mr-2 text-yellow-500" /> {t('filters.medium')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkPriorityChange('low')}><ArrowDown className="w-4 h-4 mr-2 text-green-500" /> {t('filters.low')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title={t('bulkActions.delete')} onClick={handleBulkDelete}>
            <Trash2 className="w-5 h-5" />
          </Button>
          <div className="border-l h-6 mx-1" />
          <Button variant="ghost" size="icon" title={t('bulkActions.deselectAll')} onClick={() => setSelectedTaskIds(new Set())}>
            <X className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
