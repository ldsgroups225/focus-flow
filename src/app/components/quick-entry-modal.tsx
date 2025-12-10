'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap, Tag, Calendar, Flag, Clock, X, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { parseNaturalLanguageTask, type ParsedTask } from '@/lib/utils/natural-language-parser';
import { useI18n } from '@/app/components/i18n-provider';
import type { Priority, Workspace, TaskWithSubTasks } from '@/lib/types';
import { format } from 'date-fns';

type QuickEntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<TaskWithSubTasks>) => Promise<void>;
  activeWorkspace: Workspace;
};

export function QuickEntryModal({ isOpen, onClose, onSave, activeWorkspace }: QuickEntryModalProps) {
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse input on change
  useEffect(() => {
    if (input.trim()) {
      const parsed = parseNaturalLanguageTask(input);
      setParsedTask(parsed);
    } else {
      setParsedTask(null);
    }
  }, [input]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedTask?.title || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        title: parsedTask.title,
        tags: parsedTask.tags || [],
        priority: parsedTask.priority || 'medium',
        workspace: parsedTask.workspace || activeWorkspace,
        dueDate: parsedTask.dueDate,
        pomodoros: parsedTask.pomodoros || 2,
        completed: false,
        completedPomodoros: 0,
        timeSpent: 0,
        type: 'task',
      });
      setInput('');
      setParsedTask(null);
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/50';
    }
  };

  const getWorkspaceIcon = (workspace: Workspace) => {
    switch (workspace) {
      case 'work': return '💼';
      case 'personal': return '🏠';
      case 'side-project': return '🚀';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl mx-4"
        >
          <div className="bg-card border rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="font-semibold">{t('quickEntry.title')}</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded border">
                  <span className="text-[10px]">⌘</span>+<span className="text-[10px]">⇧</span>+T
                </kbd>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit}>
              <div className="p-4">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('quickEntry.placeholder')}
                  className="text-lg h-12 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                  autoComplete="off"
                />

                {/* Parsed Preview */}
                <AnimatePresence>
                  {parsedTask && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t"
                    >
                      {/* Task Title Preview */}
                      <p className="font-medium text-foreground mb-3">
                        {parsedTask.title || <span className="text-muted-foreground italic">{t('quickEntry.noTitle')}</span>}
                      </p>

                      {/* Parsed Elements */}
                      <div className="flex flex-wrap gap-2">
                        {/* Tags */}
                        {parsedTask.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </Badge>
                        ))}

                        {/* Priority */}
                        {parsedTask.priority && (
                          <Badge className={cn('gap-1', getPriorityColor(parsedTask.priority))}>
                            <Flag className="w-3 h-3" />
                            {t(`taskForm.${parsedTask.priority}`)}
                          </Badge>
                        )}

                        {/* Workspace */}
                        {parsedTask.workspace && (
                          <Badge variant="outline" className="gap-1">
                            <span>{getWorkspaceIcon(parsedTask.workspace)}</span>
                            {t(`workspace.${parsedTask.workspace === 'side-project' ? 'sideProject' : parsedTask.workspace}`)}
                          </Badge>
                        )}

                        {/* Due Date */}
                        {parsedTask.dueDate && (
                          <Badge variant="outline" className="gap-1 text-blue-400 border-blue-500/50">
                            <Calendar className="w-3 h-3" />
                            {format(parsedTask.dueDate, 'MMM d, yyyy')}
                          </Badge>
                        )}

                        {/* Pomodoros */}
                        {parsedTask.pomodoros && (
                          <Badge variant="outline" className="gap-1 text-orange-400 border-orange-500/50">
                            <Clock className="w-3 h-3" />
                            {parsedTask.pomodoros} 🍅
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick Tips */}
                {!parsedTask && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      {t('quickEntry.tips')}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div><code className="bg-muted px-1 rounded">#tag</code> {t('quickEntry.tipTag')}</div>
                      <div><code className="bg-muted px-1 rounded">!high</code> {t('quickEntry.tipPriority')}</div>
                      <div><code className="bg-muted px-1 rounded">@work</code> {t('quickEntry.tipWorkspace')}</div>
                      <div><code className="bg-muted px-1 rounded">tomorrow</code> {t('quickEntry.tipDate')}</div>
                      <div><code className="bg-muted px-1 rounded">~3</code> {t('quickEntry.tipPomodoros')}</div>
                      <div><code className="bg-muted px-1 rounded">at 3pm</code> {t('quickEntry.tipTime')}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t">
                <Button type="button" variant="ghost" onClick={onClose}>
                  {t('taskForm.cancel')}
                </Button>
                <Button type="submit" disabled={!parsedTask?.title || isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      {t('quickEntry.create')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
