'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Network, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useI18n } from './i18n-provider';
import type { Task } from '@/lib/types';
import { Alert, AlertDescription } from "@/components/ui/alert";

type AiDependencyDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
};

type SerializableTask = Omit<Task, 'completedDate' | 'dueDate' | 'startDate'> & {
  completedDate?: string;
  dueDate?: string;
  startDate?: string;
  dependsOn?: string[];
};

const serializeTask = (task: Task): SerializableTask => {
  const {
    completedDate,
    dueDate,
    startDate,
    tags,
    dependsOn,
    pomodoros,
    completedPomodoros,
    timeSpent,
    id,
    title,
    description,
    completed,
    priority,
    workspace,
    projectId,
    duration,
  } = task;

  const rawTags = tags as unknown;
  const normalizedTags = Array.isArray(rawTags)
    ? rawTags.filter((tag): tag is string => typeof tag === 'string')
    : typeof rawTags === 'string' && rawTags.length > 0
      ? [rawTags]
      : [];

  const rawDependsOn = dependsOn as unknown;
  const normalizedDependsOn = Array.isArray(rawDependsOn)
    ? rawDependsOn.filter((id): id is string => typeof id === 'string')
    : typeof rawDependsOn === 'string' && rawDependsOn.length > 0
      ? [rawDependsOn]
      : [];

  const normalizedPomodoros = Number.isFinite(pomodoros) ? pomodoros : Number(pomodoros ?? 0);
  const normalizedCompletedPomodoros = Number.isFinite(completedPomodoros)
    ? completedPomodoros
    : Number(completedPomodoros ?? 0);
  const normalizedTimeSpent = Number.isFinite(timeSpent) ? timeSpent : Number(timeSpent ?? 0);
  const normalizedDuration = Number.isFinite(duration as number) ? (duration as number) : undefined;

  const baseTask: SerializableTask = {
    id,
    title,
    completed: Boolean(completed),
    priority: priority as SerializableTask['priority'],
    workspace: workspace as SerializableTask['workspace'],
    tags: normalizedTags,
    pomodoros: normalizedPomodoros,
    completedPomodoros: normalizedCompletedPomodoros,
    timeSpent: normalizedTimeSpent,
  };

  if (typeof description === 'string' && description.length > 0) {
    baseTask.description = description;
  }

  if (normalizedDependsOn.length) {
    baseTask.dependsOn = normalizedDependsOn;
  }

  if (typeof normalizedDuration === 'number') {
    baseTask.duration = normalizedDuration;
  }

  if (typeof projectId === 'string' && projectId.length > 0) {
    baseTask.projectId = projectId;
  }

  return {
    ...baseTask,
    ...(completedDate ? { completedDate: completedDate.toISOString() } : {}),
    ...(dueDate ? { dueDate: dueDate.toISOString() } : {}),
    ...(startDate ? { startDate: startDate.toISOString() } : {}),
  };
};

export function AiDependencyDialog({
  isOpen,
  onClose,
  tasks,
}: AiDependencyDialogProps) {
  const { t, locale } = useI18n();
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const response = await fetch('/api/ai/dependency-refinement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: tasks.map(serializeTask),
          locale,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message ?? 'Failed to generate dependency suggestions');
      }

      const data: { suggestions: string } = await response.json();
      setSuggestions(data.suggestions);
    } catch (e: unknown) {
      console.error(e);
      setError(t('aiDependency.error'));
    } finally {
      setIsLoading(false);
    }
  }, [locale, tasks, t]);

  const handleClose = useCallback(() => {
    onClose();
    const reset = window.setTimeout(() => {
      setSuggestions(null);
      setError(null);
      setIsLoading(false);
    }, 300);

    return () => window.clearTimeout(reset);
  }, [onClose]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      handleClose();
    }
  }, [handleClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            {t('aiDependency.title')}
          </DialogTitle>
          <DialogDescription>{t('aiDependency.description')}</DialogDescription>
        </DialogHeader>

        {!suggestions && !isLoading && !error && (
          <div className="py-4 space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('aiDependency.info')}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              {t('aiDependency.taskCount', { count: String(tasks.length) })}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="py-4 text-center text-destructive">
            <p>{error}</p>
          </div>
        )}

        {suggestions && (
          <div className="prose prose-sm dark:prose-invert overflow-y-auto rounded-md border p-4 my-4 flex-1">
            <ReactMarkdown>{suggestions}</ReactMarkdown>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>{t('taskForm.cancel')}</Button>
          {!suggestions && (
            <Button
              onClick={handleGenerate}
              disabled={isLoading || tasks.length === 0}
            >
              {isLoading ? t('aiDependency.analyzing') : t('aiDependency.analyze')}
            </Button>
          )}
          {suggestions && (
            <Button onClick={handleGenerate} variant="secondary" disabled={isLoading}>
              {t('aiDependency.regenerate')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
