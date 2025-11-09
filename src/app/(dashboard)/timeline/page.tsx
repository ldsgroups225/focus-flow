'use client';

import { GanttChart } from '@/app/components/gantt-chart';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useAuth } from '@/components/providers/auth-provider';
import { useEffect } from 'react';

export default function TimelinePage() {
  const { user } = useAuth();
  const { tasks, isLoading, fetchTasks } = useTasks(user?.uid ?? null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);


  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Timeline</h1>
      <GanttChart tasks={tasks} />
    </div>
  );
}
