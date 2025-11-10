'use client';

import { GanttChart } from '@/app/components/gantt-chart';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useAuth } from '@/components/providers/auth-provider';
import { useI18n } from '@/app/components/i18n-provider';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Orbit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TimelinePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { tasks, isLoading, fetchTasks } = useTasks(user?.uid ?? null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const tasksWithDates = tasks.filter(task => task.dueDate);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-7xl p-3 sm:p-4 md:p-6 lg:p-8">
        <header className="flex items-center gap-3 mb-4 md:mb-6">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">{t('navigation.back')}</span>
            </Link>
          </Button>
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">{t('dashboard.timeline')}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                {tasksWithDates.length} {tasksWithDates.length === 1 ? 'task' : 'tasks'} scheduled
              </p>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <Orbit className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">{t('loading.data')}</p>
            </div>
          </div>
        ) : tasksWithDates.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>No scheduled tasks</CardTitle>
              <CardDescription>
                Tasks with due dates will appear in your timeline view
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <Button asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl">Project Timeline</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Visual overview of your scheduled tasks and their durations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              <GanttChart tasks={tasks} />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
