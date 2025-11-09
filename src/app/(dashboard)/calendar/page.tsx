'use client';

import { TaskCalendar } from '@/app/components/task-calendar';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useAuth } from '@/components/providers/auth-provider';
import { useEffect } from 'react';


export default function CalendarPage() {
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
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      <TaskCalendar tasks={tasks} />
        {/* We can add a task detail view here */}
    </div>
  );
}
