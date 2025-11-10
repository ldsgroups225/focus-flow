'use client';

import { GanttChart } from '@/app/components/gantt-chart';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useAuth } from '@/components/providers/auth-provider';
import { useI18n } from '@/app/components/i18n-provider';
import { useEffect } from 'react';

export default function TimelinePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { tasks, isLoading, fetchTasks } = useTasks(user?.uid ?? null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);


  if (isLoading) {
    return <div>{t('loading.data')}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{t('dashboard.timeTracking')}</h1>
      <GanttChart tasks={tasks} />
    </div>
  );
}
