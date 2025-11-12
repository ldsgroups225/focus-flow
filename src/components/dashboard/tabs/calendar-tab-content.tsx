'use client';

import { useMemo, useState } from 'react';
import { TaskCalendar } from '@/app/components/task-calendar';
import { useDashboard } from '@/contexts/dashboard-context';
import { useI18n } from '@/app/components/i18n-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Calendar as CalendarIcon } from 'lucide-react';
import type { Task } from '@/lib/types';

export function CalendarTabContent() {
  const { t } = useI18n();
  const { tasks, isLoadingTasks } = useDashboard();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const tasksWithDates = useMemo(() => tasks.filter(task => task.dueDate), [tasks]);

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    return tasksWithDates
      .filter(task => new Date(task.dueDate!) >= now && !task.completed)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
  }, [tasksWithDates]);

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toDateString();
    return tasks.filter(task => task.dueDate && new Date(task.dueDate).toDateString() === dateKey);
  }, [tasks, selectedDate]);

  const stats = useMemo(() => {
    const now = new Date();
    const overdue = tasksWithDates.filter(
      task => new Date(task.dueDate!) < now && !task.completed
    ).length;
    const dueToday = tasksWithDates.filter(
      task => new Date(task.dueDate!).toDateString() === now.toDateString() && !task.completed
    ).length;
    const completed = tasksWithDates.filter(task => task.completed).length;

    return { overdue, dueToday, completed };
  }, [tasksWithDates]);

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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">Overdue</p>
                <p className="text-2xl font-bold mt-1">{stats.overdue}</p>
              </div>
              <Clock className="h-8 w-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">Due Today</p>
                <p className="text-2xl font-bold mt-1">{stats.dueToday}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">Completed</p>
                <p className="text-2xl font-bold mt-1">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Task Calendar</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Click on a date to view tasks. Colored dots indicate task priority.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-3 md:p-6">
            <TaskCalendar tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </CardContent>
        </Card>

        {/* Selected Date Tasks or Upcoming Tasks */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {selectedDate && selectedDateTasks.length > 0
                ? `Tasks on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : 'Upcoming Tasks'}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {selectedDate && selectedDateTasks.length > 0
                ? `${selectedDateTasks.length} task${selectedDateTasks.length !== 1 ? 's' : ''} scheduled`
                : 'Next 5 scheduled tasks'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            {(selectedDate && selectedDateTasks.length > 0 ? selectedDateTasks : upcomingTasks).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {selectedDate && selectedDateTasks.length === 0
                  ? 'No tasks on this date'
                  : 'No upcoming tasks'}
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {(selectedDate && selectedDateTasks.length > 0 ? selectedDateTasks : upcomingTasks).map((task: Task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm leading-tight line-clamp-2">
                        {task.title}
                      </h4>
                      {task.priority && (
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${task.priority === 'high'
                            ? 'border-red-500 text-red-500 bg-red-500/10'
                            : task.priority === 'medium'
                              ? 'border-orange-500 text-orange-500 bg-orange-500/10'
                              : 'border-green-500 text-green-500 bg-green-500/10'
                            }`}
                        >
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <p className="text-muted-foreground">
                        {new Date(task.dueDate!).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      {task.completed && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Done
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="lg:col-span-3 bg-linear-to-r from-card to-accent/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm">
              <span className="font-semibold text-foreground">Priority Legend:</span>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
                <span className="text-muted-foreground">High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
                <span className="text-muted-foreground">Medium Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" />
                <span className="text-muted-foreground">Low Priority</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
