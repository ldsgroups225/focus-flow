'use client';

 import { useState } from 'react';
 import { Calendar } from '@/components/ui/calendar';
 import type { Task } from '@/lib/types';
 import { Day, DayProps } from 'react-day-picker';

 interface TaskCalendarProps {
 tasks: Task[];
 }

 export function TaskCalendar({ tasks }: TaskCalendarProps) {
 const [date, setDate] = useState<Date | undefined>(new Date());

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

 function CustomDay(props: DayProps) {
  const dayTasks = tasksByDate[props.day.date.toDateString()] || [];
  return (
    <div className="relative h-full w-full">
      <Day {...props} />
      {dayTasks.length > 0 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          {dayTasks.slice(0, 3).map((task) => (
            <div key={task.id} className={`h-1.5 w-1.5 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

 return (
 <Calendar
 mode="single"
 selected={date}
 onSelect={setDate}
 className="rounded-md border"
 components={{
  Day: CustomDay
 }}
 />
 );
 }
