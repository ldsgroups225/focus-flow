'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame, Target, TrendingUp, Award, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/app/components/i18n-provider';
import { FocusSessionService } from '@/lib/services/focus-session-service';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';

type FocusAnalyticsProps = {
  className?: string;
};

export function FocusAnalytics({ className }: FocusAnalyticsProps) {
  const { t } = useI18n();

  // Get data from service
  const weeklyStats = useMemo(() => FocusSessionService.getWeeklyStats(), []);
  const streak = useMemo(() => FocusSessionService.getStreak(), []);
  const achievements = useMemo(() => FocusSessionService.getAchievements(), []);
  const productiveHours = useMemo(() => FocusSessionService.getProductiveHours(), []);
  const todayStats = useMemo(() => FocusSessionService.getDailyStats(), []);

  // Calculate totals
  const totalFocusMinutes = weeklyStats.reduce((sum, day) => sum + day.totalFocusMinutes, 0);
  const totalPomodoros = weeklyStats.reduce((sum, day) => sum + day.pomodorosCompleted, 0);
  const avgFocusPerDay = Math.round(totalFocusMinutes / 7);

  // Find most productive hour
  const mostProductiveHour = productiveHours.reduce(
    (max, h) => (h.minutes > max.minutes ? h : max),
    { hour: 0, minutes: 0 }
  );

  // Earned achievements count
  const earnedAchievements = achievements.filter(a => a.earned).length;

  // Format chart data
  const chartData = weeklyStats.map(day => ({
    date: format(new Date(day.date), 'EEE'),
    minutes: day.totalFocusMinutes,
    pomodoros: day.pomodorosCompleted,
    sessions: day.sessionsCount,
  }));

  const hourlyData = productiveHours
    .filter(h => h.minutes > 0)
    .map(h => ({
      hour: `${h.hour}:00`,
      minutes: h.minutes,
    }));

  return (
    <div className={className}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('focusAnalytics.totalFocusTime')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
              </div>
              <p className="text-xs text-muted-foreground">
                {t('focusAnalytics.thisWeek')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                {t('focusAnalytics.currentStreak')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {streak.currentStreak} {t('focusAnalytics.days')}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('focusAnalytics.best')}: {streak.longestStreak} {t('focusAnalytics.days')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-red-500" />
                {t('focusAnalytics.pomodoros')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPomodoros}</div>
              <p className="text-xs text-muted-foreground">
                {t('focusAnalytics.avgPerDay')}: {Math.round(totalPomodoros / 7)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                {t('focusAnalytics.avgFocus')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgFocusPerDay}m</div>
              <p className="text-xs text-muted-foreground">
                {t('focusAnalytics.perDay')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Weekly Focus Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('focusAnalytics.weeklyTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    name={t('focusAnalytics.minutes')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Most Productive Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('focusAnalytics.productiveHours')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {hourlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey="minutes"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                      name={t('focusAnalytics.minutes')}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {t('focusAnalytics.noData')}
                </div>
              )}
            </div>
            {mostProductiveHour.minutes > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {t('focusAnalytics.mostProductive')}: <strong>{mostProductiveHour.hour}:00</strong>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" />
            {t('focusAnalytics.achievements')} ({earnedAchievements}/{achievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3 rounded-lg border text-center transition-all ${achievement.earned
                  ? 'bg-primary/10 border-primary/50'
                  : 'bg-muted/30 border-muted opacity-50'
                  }`}
              >
                <div className="text-2xl mb-1">
                  {achievement.earned ? '🏆' : '🔒'}
                </div>
                <h4 className="font-medium text-sm">{achievement.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {achievement.description}
                </p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      {todayStats && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">{t('focusAnalytics.todaySummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl font-bold">{todayStats.totalFocusMinutes}m</div>
                <p className="text-muted-foreground text-sm">{t('focusAnalytics.focusTime')}</p>
              </div>
              <div className="h-12 border-l" />
              <div>
                <div className="text-3xl font-bold">{todayStats.pomodorosCompleted}</div>
                <p className="text-muted-foreground text-sm">{t('focusAnalytics.pomodoros')}</p>
              </div>
              <div className="h-12 border-l" />
              <div>
                <div className="text-3xl font-bold">{todayStats.sessionsCount}</div>
                <p className="text-muted-foreground text-sm">{t('focusAnalytics.sessions')}</p>
              </div>
              <div className="h-12 border-l" />
              <div>
                <div className="text-3xl font-bold">{todayStats.tasksCompleted}</div>
                <p className="text-muted-foreground text-sm">{t('focusAnalytics.tasksCompleted')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
