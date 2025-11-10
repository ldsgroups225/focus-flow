
'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useI18n } from './i18n-provider';
import type { Task } from '@/lib/types';
import { cn } from '@/lib/utils';

type AiReviewDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
};

type Period = 'Daily' | 'Weekly';

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

export function AiReviewDialog({ isOpen, onClose, tasks }: AiReviewDialogProps) {
  const { t, locale } = useI18n();
  const [period, setPeriod] = useState<Period>('Daily');
  const [review, setReview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relevantTasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

    return tasks
      .filter((task) => task.completed && task.completedDate)
      .filter((task) => {
        if (!task.completedDate) return false;
        const completedDate = new Date(task.completedDate);
        return period === 'Daily' ? completedDate >= today : completedDate >= lastWeek;
      });
  }, [tasks, period]);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setReview(null);

    try {
      const response = await fetch('/api/ai/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: relevantTasks.map(serializeTask),
          locale,
          period,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message ?? 'Failed to generate review');
      }

      const data: { review: string } = await response.json();
      setReview(data.review);
    } catch (e: unknown) {
      console.error(e);
      setError(t('aiReview.error'));
    } finally {
      setIsLoading(false);
    }
  }, [locale, period, relevantTasks, t]);

  const handleClose = useCallback(() => {
    onClose();
    const reset = window.setTimeout(() => {
      setReview(null);
      setError(null);
      setIsLoading(false);
      setPeriod('Daily');
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('aiReview.title')}
          </DialogTitle>
          <DialogDescription>{t('aiReview.description')}</DialogDescription>
        </DialogHeader>

        {!review && !isLoading && !error && (
          <div className="py-4 space-y-3">
            <RadioGroup value={period} onValueChange={(value: Period) => setPeriod(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Daily" id="daily" />
                <Label htmlFor="daily">{t('aiReview.daily')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Weekly" id="weekly" />
                <Label htmlFor="weekly">{t('aiReview.weekly')}</Label>
              </div>
            </RadioGroup>
            {relevantTasks.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {period === 'Daily'
                  ? t('aiReview.noDailyTasks') ?? t('aiReview.noTasksFallback')
                  : t('aiReview.noWeeklyTasks') ?? t('aiReview.noTasksFallback')}
              </p>
            )}
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

        {review && (
          <div className="prose prose-sm dark:prose-invert max-h-[50vh] overflow-y-auto rounded-md border p-4 my-4">
            <ReactMarkdown>{review}</ReactMarkdown>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>{t('taskForm.cancel')}</Button>
          <Button
            onClick={handleGenerate}
            disabled={isLoading || relevantTasks.length === 0}
            className={cn({ 'invisible pointer-events-none': !!review })}
          >
            {isLoading ? t('aiReview.generating') : t('aiReview.generate')}
          </Button>
          {review && (
            <Button onClick={handleGenerate} variant="secondary" disabled={isLoading}>
              {t('aiReview.generate')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add react-markdown to dependencies
// "react-markdown": "^9.0.1"
