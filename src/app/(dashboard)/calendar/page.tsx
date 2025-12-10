'use client';

import { TaskCalendar } from '@/app/components/task-calendar';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useAuth } from '@/components/providers/auth-provider';
import { useI18n } from '@/app/components/i18n-provider';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar as CalendarIcon, Orbit, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/lib/types';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

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
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4 md:mb-6"
        >
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">{t('navigation.back')}</span>
            </Link>
          </Button>
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarIcon className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate tracking-tight">{t('dashboard.calendar')}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                {tasksWithDates.length} {tasksWithDates.length === 1 ? 'task' : 'tasks'} scheduled
              </p>
            </div>
          </div>
        </motion.header>

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <Orbit className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">{t('loading.data')}</p>
            </div>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <motion.div variants={item}>
                <Card className="border-none bg-linear-to-br from-red-500/10 via-background to-background border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">Overdue</p>
                        <p className="text-3xl md:text-4xl font-black mt-2 text-red-500">{stats.overdue}</p>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded-full">
                        <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="border-none bg-linear-to-br from-orange-500/10 via-background to-background border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">Due Today</p>
                        <p className="text-3xl md:text-4xl font-black mt-2 text-orange-500">{stats.dueToday}</p>
                      </div>
                      <div className="p-3 bg-orange-500/10 rounded-full">
                        <Clock className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="border-none bg-linear-to-br from-green-500/10 via-background to-background border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">Completed</p>
                        <p className="text-3xl md:text-4xl font-black mt-2 text-green-500">{stats.completed}</p>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded-full">
                        <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Calendar */}
              <motion.div variants={item} className="lg:col-span-2">
                <Card className="h-full border-none shadow-xl bg-card/50 backdrop-blur-xs">
                  <CardHeader className="pb-3 md:pb-6 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg md:text-xl font-bold">Task Calendar</CardTitle>
                        <CardDescription className="text-xs md:text-sm mt-1">
                          Overview of your scheduled tasks
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Live
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-center p-3 md:p-6">
                    <TaskCalendar tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                  </CardContent>
                  {/* Legend */}
                  <div className="px-6 pb-6 pt-2 border-t border-border/50 bg-muted/20">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs md:text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm ring-2 ring-red-500/20" />
                        <span className="text-muted-foreground font-medium">High</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm ring-2 ring-orange-500/20" />
                        <span className="text-muted-foreground font-medium">Medium</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm ring-2 ring-green-500/20" />
                        <span className="text-muted-foreground font-medium">Low</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Selected Date Tasks */}
              <motion.div variants={item} className="lg:col-span-1">
                <Card className="h-full border-none shadow-xl bg-card/50 backdrop-blur-xs flex flex-col">
                  <CardHeader className="pb-3 md:pb-4 border-b border-border/50 shrink-0">
                    <CardTitle className="text-lg md:text-xl font-bold wrap-break-word">
                      {selectedDate && selectedDateTasks.length > 0
                        ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                        : 'Upcoming'}
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm mt-1">
                      {selectedDate && selectedDateTasks.length > 0
                        ? `${selectedDateTasks.length} task${selectedDateTasks.length !== 1 ? 's' : ''} for this day`
                        : 'Your next 5 scheduled tasks'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 pt-4 flex-1 overflow-hidden flex flex-col min-h-[300px]">
                    {(selectedDate && selectedDateTasks.length > 0 ? selectedDateTasks : upcomingTasks).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground">
                        <div className="p-4 bg-muted/50 rounded-full mb-3">
                          <CalendarIcon className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="font-medium">No tasks scheduled</p>
                        <p className="text-xs mt-1 opacity-70">Enjoy your free time!</p>
                      </div>
                    ) : (
                      <div className="space-y-3 overflow-y-auto pr-1 flex-1 -mr-2 scrollbar-hide hover:scrollbar-default">
                        {(selectedDate && selectedDateTasks.length > 0 ? selectedDateTasks : upcomingTasks).map((task: Task, index) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group p-3 rounded-xl border bg-card hover:bg-accent hover:border-accent transition-all cursor-pointer relative overflow-hidden"
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-orange-500' :
                                'bg-green-500'
                              }`}
                            />
                            <div className="pl-2.5">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-accent-foreground transition-colors">
                                  {task.title}
                                </h4>
                              </div>
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2 group-hover:text-muted-foreground/80">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs mt-2">
                                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(task.dueDate!).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                                {task.completed && (
                                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-500/20">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Done
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
