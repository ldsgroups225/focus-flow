'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Clock, CheckCircle2, BarChart3 } from 'lucide-react';
import { useDashboard } from '@/contexts/dashboard-context';
import { useI18n } from '@/app/components/i18n-provider';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from 'date-fns';

const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  personal: '#6366f1',
  work: '#f43f5e',
  'side-project': '#10b981',
};

export function AnalyticsTabContent() {
  const { t } = useI18n();
  const { tasks, isLoadingTasks } = useDashboard();

  const analyticsData = useMemo(() => {
    if (!tasks.length) {
      return {
        taskMetrics: {
          total: 0,
          completed: 0,
          inProgress: 0,
          completionRate: 0,
        },
        productivityTrend: [],
        pomodoroStats: {
          totalCompleted: 0,
          totalTime: 0,
          averagePerDay: 0,
        },
        workspaceDistribution: [],
        priorityDistribution: [],
        dailyCompletions: [],
      };
    }

    const now = new Date();
    const last7Days = eachDayOfInterval({
      start: startOfDay(subDays(now, 6)),
      end: endOfDay(now),
    });

    const completedTasks = tasks.filter((task) => task.completed);
    const inProgressTasks = tasks.filter((task) => !task.completed);

    const completionRate =
      tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    const productivityTrend = last7Days.map((day) => {
      const completedOnDay = completedTasks.filter((task) =>
        task.completedDate && isSameDay(new Date(task.completedDate), day)
      ).length;

      const createdOnDay = tasks.filter((task) =>
        task.startDate && isSameDay(new Date(task.startDate), day)
      ).length;

      return {
        date: format(day, 'MMM dd'),
        completed: completedOnDay,
        created: createdOnDay,
      };
    });

    const totalPomodoros = completedTasks.reduce(
      (sum, task) => sum + (task.completedPomodoros || 0),
      0
    );
    const totalTime = totalPomodoros * 25;

    const workspaceMap = new Map<string, number>();
    tasks.forEach((task) => {
      const workspace = task.workspace || 'personal';
      workspaceMap.set(workspace, (workspaceMap.get(workspace) || 0) + 1);
    });

    const workspaceDistribution = Array.from(workspaceMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: COLORS[name as keyof typeof COLORS] || COLORS.primary,
    }));

    const priorityMap = new Map<string, number>();
    tasks.forEach((task) => {
      const priority = task.priority || 'medium';
      priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
    });

    const priorityDistribution = Array.from(priorityMap.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color:
        name === 'high'
          ? COLORS.danger
          : name === 'medium'
            ? COLORS.warning
            : COLORS.success,
    }));

    const dailyCompletions = last7Days.map((day) => {
      const completedOnDay = completedTasks.filter((task) =>
        task.completedDate && isSameDay(new Date(task.completedDate), day)
      );
      const pomodoros = completedOnDay.reduce(
        (sum, task) => sum + (task.completedPomodoros || 0),
        0
      );
      return {
        date: format(day, 'MMM dd'),
        pomodoros,
        tasks: completedOnDay.length,
      };
    });

    return {
      taskMetrics: {
        total: tasks.length,
        completed: completedTasks.length,
        inProgress: inProgressTasks.length,
        completionRate,
      },
      productivityTrend,
      pomodoroStats: {
        totalCompleted: totalPomodoros,
        totalTime: Math.round(totalTime / 60),
        averagePerDay: Math.round(totalPomodoros / 7),
      },
      workspaceDistribution,
      priorityDistribution,
      dailyCompletions,
    };
  }, [tasks]);

  if (isLoadingTasks) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 animate-pulse text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">{t('loading.data')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Task Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasks Completed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.taskMetrics.completed}</div>
            <p className="text-xs text-muted-foreground">
              Rate: {analyticsData.taskMetrics.completionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              In Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.taskMetrics.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Created: {analyticsData.taskMetrics.total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pomodoros
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.pomodoroStats.totalCompleted}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg/Day: {analyticsData.pomodoroStats.averagePerDay}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.pomodoroStats.totalTime}h
            </div>
            <p className="text-xs text-muted-foreground">
              Completed: {analyticsData.pomodoroStats.totalCompleted}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity Trend</CardTitle>
          <CardDescription>Daily tasks completed and created</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.productivityTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="completed"
                stroke={COLORS.success}
                strokeWidth={2}
                name="Completed"
              />
              <Line
                type="monotone"
                dataKey="created"
                stroke={COLORS.primary}
                strokeWidth={2}
                name="Created"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workspace Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Workspace Distribution</CardTitle>
            <CardDescription>Time allocation across workspaces</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.workspaceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: { name?: string; percent?: number }) =>
                    `${entry.name ?? ''}: ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.workspaceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
            <CardDescription>Distribution of task priorities</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.priorityDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Pomodoro Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
          <CardDescription>Pomodoros and tasks completed per day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.dailyCompletions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="pomodoros" fill={COLORS.secondary} name="Pomodoros" />
              <Bar dataKey="tasks" fill={COLORS.primary} name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
