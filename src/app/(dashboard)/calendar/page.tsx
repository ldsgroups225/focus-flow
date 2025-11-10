'use client';

import { TaskCalendar } from '@/app/components/task-calendar';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useAuth } from '@/components/providers/auth-provider';
import { useI18n } from '@/app/components/i18n-provider';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar as CalendarIcon, Orbit, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/lib/types';

export default function CalendarPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { tasks, isLoading, fetchTasks } = useTasks(user?.uid ?? null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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
            <CalendarIcon className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">{t('dashboard.calendar')}</h1>
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
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground font-medium">Overdue</p>
                      <p className="text-2xl md:text-3xl font-bold mt-1">{stats.overdue}</p>
                    </div>
                    <Clock className="h-8 w-8 md:h-10 md:w-10 text-red-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground font-medium">Due Today</p>
                      <p className="text-2xl md:text-3xl font-bold mt-1">{stats.dueToday}</p>
                    </div>
                    <CalendarIcon className="h-8 w-8 md:h-10 md:w-10 text-orange-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground font-medium">Completed</p>
                      <p className="text-2xl md:text-3xl font-bold mt-1">{stats.completed}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 md:h-10 md:w-10 text-green-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Calendar */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3 md:pb-6">
                  <CardTitle className="text-lg md:text-xl">Task Calendar</CardTitle>
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
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="text-lg md:text-xl">
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
                <CardContent className="p-4 md:p-6">
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
          </>
        )}
      </main>
    </div>
  );
}
