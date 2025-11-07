
'use client';

import { useState } from 'react';
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
import type { Task, ReviewFlowInput } from '@/lib/types';
import { generateReview } from '@/ai/flows/review-flow';

type AiReviewDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
};

type Period = 'Daily' | 'Weekly';

export function AiReviewDialog({ isOpen, onClose, tasks }: AiReviewDialogProps) {
  const { t, locale } = useI18n();
  const [period, setPeriod] = useState<Period>('Daily');
  const [review, setReview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setReview(null);

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

      const completedTasks = tasks.filter(task => task.completed && task.completedDate);
      
      const relevantTasks = completedTasks.filter(task => {
        if (!task.completedDate) return false;
        const completedDate = new Date(task.completedDate);
        if (period === 'Daily') {
          return completedDate >= today;
        } else { // Weekly
          return completedDate >= lastWeek;
        }
      });
      
      const result = await generateReview({ tasks: relevantTasks, locale, period });
      setReview(result);
    } catch (e: any) {
      console.error(e);
      setError(t('aiReview.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after a short delay to allow animation to finish
    setTimeout(() => {
        setReview(null);
        setError(null);
        setIsLoading(false);
        setPeriod('Daily');
    }, 300);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('aiReview.title')}
          </DialogTitle>
          <DialogDescription>{t('aiReview.description')}</DialogDescription>
        </DialogHeader>

        {!review && !isLoading && !error && (
            <div className="py-4">
                <RadioGroup defaultValue="Daily" onValueChange={(value: Period) => setPeriod(value)}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Daily" id="daily" />
                        <Label htmlFor="daily">{t('aiReview.daily')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Weekly" id="weekly" />
                        <Label htmlFor="weekly">{t('aiReview.weekly')}</Label>
                    </div>
                </RadioGroup>
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
          {!review && (
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? t('aiReview.generating') : t('aiReview.generate')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add react-markdown to dependencies
// "react-markdown": "^9.0.1"
