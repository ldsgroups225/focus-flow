"use client";

import * as React from "react";
import { BarChart3, CheckCircle2, Clock, Target, TrendingUp, AlertCircle, Calendar, Timer, Zap, Flame, Activity, Award, TrendingDown, Users, Layers, Link2, XCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/app/components/i18n-provider";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DashboardSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "primary";
  className?: string;
  trend?: "up" | "down" | "neutral";
  progress?: number;
}

function StatCard({ icon, label, value, subValue, variant = "default", className, trend, progress }: StatCardProps) {
  const variantStyles = {
    default: {
      bg: "bg-muted/50 hover:bg-muted/70",
      icon: "bg-background text-foreground",
      border: "border-border"
    },
    success: {
      bg: "bg-green-500/10 hover:bg-green-500/15",
      icon: "bg-green-500/20 text-green-600 dark:text-green-400",
      border: "border-green-500/20"
    },
    warning: {
      bg: "bg-amber-500/10 hover:bg-amber-500/15",
      icon: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
      border: "border-amber-500/20"
    },
    danger: {
      bg: "bg-red-500/10 hover:bg-red-500/15",
      icon: "bg-red-500/20 text-red-600 dark:text-red-400",
      border: "border-red-500/20"
    },
    info: {
      bg: "bg-blue-500/10 hover:bg-blue-500/15",
      icon: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
      border: "border-blue-500/20"
    },
    primary: {
      bg: "bg-primary/10 hover:bg-primary/15",
      icon: "bg-primary/20 text-primary",
      border: "border-primary/20"
    },
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === "up") return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
    return null;
  };

  return (
    <div className={cn(
      "group relative p-5 rounded-xl border transition-all duration-200",
      "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
      variantStyles[variant].bg,
      variantStyles[variant].border,
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "p-2.5 rounded-lg transition-transform duration-200 group-hover:scale-110",
          variantStyles[variant].icon
        )}>
          {icon}
        </div>
        {getTrendIcon()}
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subValue && (
            <span className="text-sm font-medium text-muted-foreground">{subValue}</span>
          )}
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-3 space-y-1">
          <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                variant === "success" && "bg-green-500",
                variant === "warning" && "bg-amber-500",
                variant === "danger" && "bg-red-500",
                variant === "info" && "bg-blue-500",
                variant === "primary" && "bg-primary",
                variant === "default" && "bg-foreground"
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardSheet({ isOpen, onClose, tasks }: DashboardSheetProps) {
  const { t } = useI18n();

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const inProgressTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Time tracking
  const totalPomodoros = tasks.reduce((sum, task) => sum + task.pomodoros, 0);
  const completedPomodoros = tasks.reduce((sum, task) => sum + task.completedPomodoros, 0);
  const remainingPomodoros = totalPomodoros - completedPomodoros;
  const totalTimeSpent = tasks.reduce((sum, task) => sum + task.timeSpent, 0);
  const totalTimeSpentHours = Math.round(totalTimeSpent / 3600 * 10) / 10;

  // Priority breakdown
  const highPriority = tasks.filter(t => t.priority === "high" && !t.completed).length;
  const mediumPriority = tasks.filter(t => t.priority === "medium" && !t.completed).length;
  const lowPriority = tasks.filter(t => t.priority === "low" && !t.completed).length;

  // Workspace distribution
  const personalTasks = tasks.filter(t => t.workspace === "personal").length;
  const workTasks = tasks.filter(t => t.workspace === "work").length;
  const sideProjectTasks = tasks.filter(t => t.workspace === "side-project").length;

  // Due dates
  const now = new Date();
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.completed) return false;
    const dueDate = new Date(t.dueDate);
    return dueDate < now;
  }).length;

  const upcomingTasks = tasks.filter(t => {
    if (!t.dueDate || t.completed) return false;
    const dueDate = new Date(t.dueDate);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= now && dueDate <= sevenDaysFromNow;
  }).length;

  // Tasks with dependencies
  const tasksWithDeps = tasks.filter(t => t.dependsOn && t.dependsOn.length > 0).length;
  const blockedTasks = tasks.filter(t => {
    if (!t.dependsOn || t.completed) return false;
    return t.dependsOn.some(depId => !tasks.find(task => task.id === depId && task.completed));
  }).length;

  // Recent completions (last 5)
  const recentCompletions = tasks
    .filter(t => t.completedDate)
    .sort((a, b) => {
      const dateA = a.completedDate ? new Date(a.completedDate).getTime() : 0;
      const dateB = b.completedDate ? new Date(b.completedDate).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t('dashboard.today');
    if (diffDays === 1) return t('dashboard.tomorrow');
    if (diffDays === -1) return t('dashboard.yesterday');
    return date.toLocaleDateString();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] sm:max-w-6xl mx-auto rounded-t-3xl">
        <SheetHeader className="pb-6 border-b px-6 pt-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              {t('dashboard.title')}
            </SheetTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>{totalTasks} {t('dashboard.totalTasks')}</span>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-8 space-y-8 overflow-y-auto h-[calc(90vh-10rem)] px-6 pb-6">
          {/* Overview Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-linear-to-br from-blue-500/20 to-purple-500/20">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t('dashboard.overview')}</h3>
                <p className="text-sm text-muted-foreground">Your productivity at a glance</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Layers className="h-5 w-5" />}
                label={t('dashboard.totalTasks')}
                value={totalTasks}
                variant="info"
              />
              <StatCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                label={t('dashboard.completed')}
                value={completedTasks}
                subValue={`${completionRate}%`}
                variant="success"
                progress={completionRate}
                trend={completionRate > 50 ? "up" : completionRate > 0 ? "neutral" : undefined}
              />
              <StatCard
                icon={<Activity className="h-5 w-5" />}
                label={t('dashboard.inProgress')}
                value={inProgressTasks}
                variant="primary"
              />
              <StatCard
                icon={<Timer className="h-5 w-5" />}
                label={t('dashboard.timeSpent')}
                value={totalTimeSpentHours}
                subValue={t('dashboard.hours')}
                variant="info"
              />
            </div>
          </section>

          {/* Time Tracking Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-linear-to-br from-red-500/20 to-orange-500/20">
                <Flame className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t('dashboard.timeTracking')}</h3>
                <p className="text-sm text-muted-foreground">Pomodoro progress tracking</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={<Award className="h-5 w-5" />}
                label={t('dashboard.completedPomodoros')}
                value={completedPomodoros}
                variant="success"
                progress={totalPomodoros > 0 ? (completedPomodoros / totalPomodoros) * 100 : 0}
              />
              <StatCard
                icon={<Zap className="h-5 w-5" />}
                label={t('dashboard.remainingPomodoros')}
                value={remainingPomodoros}
                variant="warning"
              />
              <StatCard
                icon={<Target className="h-5 w-5" />}
                label={t('dashboard.totalPomodoros')}
                value={totalPomodoros}
                subValue={t('dashboard.estimated')}
                variant="info"
              />
            </div>
          </section>

          {/* Priority Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-linear-to-br from-red-500/20 to-pink-500/20">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t('dashboard.priority')}</h3>
                <p className="text-sm text-muted-foreground">Task urgency breakdown</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={<Zap className="h-5 w-5" />}
                label={t('dashboard.highPriority')}
                value={highPriority}
                variant="danger"
                trend={highPriority > 0 ? "up" : undefined}
              />
              <StatCard
                icon={<AlertCircle className="h-5 w-5" />}
                label={t('dashboard.mediumPriority')}
                value={mediumPriority}
                variant="warning"
              />
              <StatCard
                icon={<Clock className="h-5 w-5" />}
                label={t('dashboard.lowPriority')}
                value={lowPriority}
                variant="info"
              />
            </div>
          </section>

          {/* Workspace Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-linear-to-br from-purple-500/20 to-indigo-500/20">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t('dashboard.workspaces')}</h3>
                <p className="text-sm text-muted-foreground">Task distribution by context</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label={t('workspace.personal')}
                value={personalTasks}
                variant="primary"
                progress={totalTasks > 0 ? (personalTasks / totalTasks) * 100 : 0}
              />
              <StatCard
                icon={<Target className="h-5 w-5" />}
                label={t('workspace.work')}
                value={workTasks}
                variant="info"
                progress={totalTasks > 0 ? (workTasks / totalTasks) * 100 : 0}
              />
              <StatCard
                icon={<Layers className="h-5 w-5" />}
                label={t('workspace.sideProject')}
                value={sideProjectTasks}
                variant="success"
                progress={totalTasks > 0 ? (sideProjectTasks / totalTasks) * 100 : 0}
              />
            </div>
          </section>

          {/* Deadlines Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-linear-to-br from-amber-500/20 to-yellow-500/20">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t('dashboard.deadlines')}</h3>
                <p className="text-sm text-muted-foreground">Time-sensitive tasks</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                icon={<XCircle className="h-5 w-5" />}
                label={t('dashboard.overdue')}
                value={overdueTasks}
                variant={overdueTasks > 0 ? "danger" : "success"}
                trend={overdueTasks > 0 ? "down" : undefined}
              />
              <StatCard
                icon={<Calendar className="h-5 w-5" />}
                label={t('dashboard.upcoming')}
                value={upcomingTasks}
                subValue={t('dashboard.next7Days')}
                variant={upcomingTasks > 0 ? "warning" : "info"}
              />
            </div>
          </section>

          {/* Dependencies Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-linear-to-br from-cyan-500/20 to-teal-500/20">
                <Link2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t('dashboard.dependencies')}</h3>
                <p className="text-sm text-muted-foreground">Task relationships and blockers</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                icon={<Link2 className="h-5 w-5" />}
                label={t('dashboard.tasksWithDeps')}
                value={tasksWithDeps}
                variant="info"
              />
              <StatCard
                icon={<XCircle className="h-5 w-5" />}
                label={t('dashboard.blockedTasks')}
                value={blockedTasks}
                variant={blockedTasks > 0 ? "warning" : "success"}
                trend={blockedTasks > 0 ? "down" : undefined}
              />
            </div>
          </section>

          {/* Recent Activity Section */}
          {recentCompletions.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-linear-to-br from-green-500/20 to-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t('dashboard.recentCompletions')}</h3>
                  <p className="text-sm text-muted-foreground">Latest achievements</p>
                </div>
              </div>
              <div className="space-y-3">
                {recentCompletions.map((task, index) => (
                  <div 
                    key={task.id} 
                    className="group flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:shadow-md"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-base">{task.title}</p>
                        {task.completedDate && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(task.completedDate)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Award className="h-5 w-5 text-amber-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
