/**
 * Focus Session Service
 * 
 * Tracks focus sessions, streaks, and productivity statistics.
 * Data is persisted to localStorage for offline-first functionality.
 * 
 * @module FocusSessionService
 */

/** Represents a single focus session */
export type FocusSession = {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  pomodorosCompleted: number;
  wasInterrupted: boolean;
  ambientSound?: string;
};

/** Aggregated statistics for a single day */
export type DailyStats = {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Total minutes spent in focus mode */
  totalFocusMinutes: number;
  /** Number of focus sessions */
  sessionsCount: number;
  /** Number of pomodoros completed */
  pomodorosCompleted: number;
  /** Number of tasks marked complete */
  tasksCompleted: number;
  /** Longest session duration in minutes */
  longestSession: number;
  /** Most productive hour (0-23) */
  mostProductiveHour?: number;
};

/** Tracks user's focus streak */
export type FocusStreak = {
  /** Current consecutive days with focus activity */
  currentStreak: number;
  /** All-time longest streak */
  longestStreak: number;
  /** Last active date in YYYY-MM-DD format */
  lastActiveDate: string;
};

const STORAGE_KEY = 'focusflow-focus-sessions';
const STREAK_KEY = 'focusflow-focus-streak';
const DAILY_STATS_KEY = 'focusflow-daily-stats';
const MS_PER_DAY = 86400000;

export class FocusSessionService {
  private static getStorageItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      console.warn(`Failed to parse localStorage key: ${key}`);
      return null;
    }
  }

  private static setStorageItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn(`Failed to save to localStorage key: ${key}`);
    }
  }

  static getSessions(): FocusSession[] {
    const sessions = this.getStorageItem<FocusSession[]>(STORAGE_KEY);
    return sessions || [];
  }

  static saveSession(session: Omit<FocusSession, 'id'>): FocusSession {
    const sessions = this.getSessions();
    const newSession: FocusSession = {
      ...session,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    sessions.push(newSession);
    this.setStorageItem(STORAGE_KEY, sessions);

    // Update daily stats
    this.updateDailyStats(newSession);

    // Update streak
    this.updateStreak();

    return newSession;
  }

  static getStreak(): FocusStreak {
    const streak = this.getStorageItem<FocusStreak>(STREAK_KEY);
    return streak || { currentStreak: 0, longestStreak: 0, lastActiveDate: '' };
  }

  private static updateStreak(): void {
    const streak = this.getStreak();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - MS_PER_DAY).toISOString().split('T')[0];

    if (streak.lastActiveDate === today) {
      // Already active today, no change
      return;
    }

    if (streak.lastActiveDate === yesterday) {
      // Continuing streak
      streak.currentStreak += 1;
    } else if (streak.lastActiveDate !== today) {
      // Streak broken, start new
      streak.currentStreak = 1;
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastActiveDate = today;
    this.setStorageItem(STREAK_KEY, streak);
  }

  static getDailyStats(date?: string): DailyStats | null {
    const allStats = this.getStorageItem<Record<string, DailyStats>>(DAILY_STATS_KEY) || {};
    const targetDate = date || new Date().toISOString().split('T')[0];
    return allStats[targetDate] || null;
  }

  static getAllDailyStats(): Record<string, DailyStats> {
    return this.getStorageItem<Record<string, DailyStats>>(DAILY_STATS_KEY) || {};
  }

  private static updateDailyStats(session: FocusSession): void {
    const allStats = this.getAllDailyStats();
    const dateKey = new Date(session.startTime).toISOString().split('T')[0];
    const hour = new Date(session.startTime).getHours();

    const existing = allStats[dateKey] || {
      date: dateKey,
      totalFocusMinutes: 0,
      sessionsCount: 0,
      pomodorosCompleted: 0,
      tasksCompleted: 0,
      longestSession: 0,
    };

    const sessionMinutes = Math.round(session.duration / 60);

    existing.totalFocusMinutes += sessionMinutes;
    existing.sessionsCount += 1;
    existing.pomodorosCompleted += session.pomodorosCompleted;
    existing.longestSession = Math.max(existing.longestSession, sessionMinutes);
    existing.mostProductiveHour = hour; // Simplified - could be more sophisticated

    allStats[dateKey] = existing;
    this.setStorageItem(DAILY_STATS_KEY, allStats);
  }

  static incrementTasksCompleted(date?: string): void {
    const allStats = this.getAllDailyStats();
    const dateKey = date || new Date().toISOString().split('T')[0];

    const existing = allStats[dateKey] || {
      date: dateKey,
      totalFocusMinutes: 0,
      sessionsCount: 0,
      pomodorosCompleted: 0,
      tasksCompleted: 0,
      longestSession: 0,
    };

    existing.tasksCompleted += 1;
    allStats[dateKey] = existing;
    this.setStorageItem(DAILY_STATS_KEY, allStats);
  }

  static getWeeklyStats(): DailyStats[] {
    const allStats = this.getAllDailyStats();
    const stats: DailyStats[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * MS_PER_DAY).toISOString().split('T')[0];
      stats.push(allStats[date] || {
        date,
        totalFocusMinutes: 0,
        sessionsCount: 0,
        pomodorosCompleted: 0,
        tasksCompleted: 0,
        longestSession: 0,
      });
    }

    return stats;
  }

  static getMonthlyStats(): DailyStats[] {
    const allStats = this.getAllDailyStats();
    const stats: DailyStats[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * MS_PER_DAY).toISOString().split('T')[0];
      stats.push(allStats[date] || {
        date,
        totalFocusMinutes: 0,
        sessionsCount: 0,
        pomodorosCompleted: 0,
        tasksCompleted: 0,
        longestSession: 0,
      });
    }

    return stats;
  }

  static getProductiveHours(): { hour: number; minutes: number }[] {
    const sessions = this.getSessions();
    const hourlyMinutes: number[] = Array(24).fill(0);

    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourlyMinutes[hour] += Math.round(session.duration / 60);
    });

    return hourlyMinutes.map((minutes, hour) => ({ hour, minutes }));
  }

  static getAchievements(): { id: string; name: string; description: string; earned: boolean; earnedDate?: string }[] {
    const sessions = this.getSessions();
    const streak = this.getStreak();
    const totalPomodoros = sessions.reduce((sum, s) => sum + s.pomodorosCompleted, 0);
    const totalMinutes = sessions.reduce((sum, s) => sum + Math.round(s.duration / 60), 0);

    const achievements = [
      {
        id: 'first_focus',
        name: 'First Focus',
        description: 'Complete your first focus session',
        earned: sessions.length >= 1,
      },
      {
        id: 'streak_3',
        name: 'Consistent',
        description: 'Maintain a 3-day focus streak',
        earned: streak.longestStreak >= 3,
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day focus streak',
        earned: streak.longestStreak >= 7,
      },
      {
        id: 'streak_30',
        name: 'Focus Master',
        description: 'Maintain a 30-day focus streak',
        earned: streak.longestStreak >= 30,
      },
      {
        id: 'pomodoro_10',
        name: 'Pomodoro Starter',
        description: 'Complete 10 pomodoros',
        earned: totalPomodoros >= 10,
      },
      {
        id: 'pomodoro_100',
        name: 'Pomodoro Pro',
        description: 'Complete 100 pomodoros',
        earned: totalPomodoros >= 100,
      },
      {
        id: 'focus_hours_10',
        name: 'Deep Worker',
        description: 'Accumulate 10 hours of focus time',
        earned: totalMinutes >= 600,
      },
      {
        id: 'focus_hours_100',
        name: 'Focus Legend',
        description: 'Accumulate 100 hours of focus time',
        earned: totalMinutes >= 6000,
      },
      {
        id: 'sessions_50',
        name: 'Session Master',
        description: 'Complete 50 focus sessions',
        earned: sessions.length >= 50,
      },
    ];

    return achievements;
  }

  static getFocusVsNormalCompletion(): { focusCompletions: number; normalCompletions: number } {
    // This would need to be integrated with task completion tracking
    // For now, return placeholder based on sessions
    const sessions = this.getSessions();
    return {
      focusCompletions: sessions.filter(s => s.pomodorosCompleted > 0).length,
      normalCompletions: Math.max(0, sessions.length - sessions.filter(s => s.pomodorosCompleted > 0).length),
    };
  }
}
