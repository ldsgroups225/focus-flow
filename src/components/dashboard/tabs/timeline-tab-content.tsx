'use client';

import { GanttChart } from '@/app/components/gantt-chart';
import { useDashboard } from '@/contexts/dashboard-context';
import { useI18n } from '@/app/components/i18n-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export function TimelineTabContent() {
  const { t } = useI18n();
  const { tasks, isLoadingTasks } = useDashboard();

  const tasksWithDates = tasks.filter(task => task.dueDate);

  if (isLoadingTasks) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground animate-pulse">{t('loading.data')}</p>
        </div>
      </div>
    );
  }

  if (tasksWithDates.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <Card className="border-dashed border-2 bg-muted/20">
          <CardHeader className="text-center pb-8 pt-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-8 ring-primary/5">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">No scheduled tasks</CardTitle>
            <CardDescription className="text-base mt-2 max-w-md mx-auto">
              Tasks with due dates will appear here in a timeline view.
              Add a due date to your tasks to start planning!
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-xs">
        <CardHeader className="pb-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Project Timeline
              </CardTitle>
              <CardDescription className="mt-1">
                Visual overview of your upcoming work schedule
              </CardDescription>
            </div>
            <div className="flex -space-x-2">
              {/* Maybe avatars here later */}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 bg-linear-to-b from-transparent to-muted/5">
          <GanttChart tasks={tasks} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
