'use client';

import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import type { Task } from '@/lib/types';
import { DayButton } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface TaskCalendarProps {
  tasks: Task[];
  selectedDate?: Date;
  onSelectDate?: (date: Date | undefined) => void;
}

export function TaskCalendar({ tasks, selectedDate, onSelectDate }: TaskCalendarProps) {

  const tasksByDate = tasks.reduce((acc, task) => {
    if (task.dueDate) {
      const dateKey = new Date(task.dueDate).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(task);
    }
    return acc;
  }, {} as Record<string, Task[]>);

  function CustomDayButton(props: React.ComponentProps<typeof DayButton>) {
    const dayTasks = tasksByDate[props.day.date.toDateString()] || [];
    const hasHighPriority = dayTasks.some(t => t.priority === 'high');
    const hasTasks = dayTasks.length > 0;

    return (
      <CalendarDayButton
        {...props}
        className={cn(
          props.className,
          'relative',
          hasTasks && 'font-semibold',
          hasHighPriority && 'ring-1 ring-red-500/30'
        )}
      >
        {props.children}
        {hasTasks && (
          <>
            {/* Task count badge */}
            {dayTasks.length > 1 && (
              <div className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-[8px] md:text-[9px] font-bold rounded-full h-3 w-3 md:h-3.5 md:w-3.5 flex items-center justify-center">
                {dayTasks.length}
              </div>
            )}
            {/* Priority dots */}
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
              {dayTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'h-1 w-1 md:h-1.5 md:w-1.5 rounded-full shadow-sm',
                    task.priority === 'high' && 'bg-red-500',
                    task.priority === 'medium' && 'bg-orange-500',
                    task.priority === 'low' && 'bg-green-500',
                    !task.priority && 'bg-blue-500'
                  )}
                />
              ))}
            </div>
          </>
        )}
      </CalendarDayButton>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        className="rounded-lg border-0 shadow-none p-0 [--cell-size:--spacing(12)] md:[--cell-size:--spacing(14)]"
        components={{
          DayButton: CustomDayButton
        }}
      />
    </div>
  );
}
