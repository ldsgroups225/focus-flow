'use client';

import { GanttChart } from '@/app/components/gantt-chart';
import { useDashboard } from '@/contexts/dashboard-context';
import { useI18n } from '@/app/components/i18n-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export function TimelineTabContent() {
  const { t } = useI18n();
  const { tasks, isLoadingTasks } = useDashboard();

  const tasksWithDates = tasks.filter(task => task.dueDate);

  if (isLoadingTasks) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('loading.data')}</p>
        </div>
      </div>
    );
  }

  if (tasksWithDates.length === 0) {
    return (
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
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Project Timeline</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Visual overview of your scheduled tasks and their durations
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        <GanttChart tasks={tasks} />
      </CardContent>
    </Card>
  );
}
