'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Palette, Timer, Bell, Keyboard, Settings as SettingsIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useI18n } from '@/app/components/i18n-provider';
import type { Workspace, Priority } from '@/lib/types';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  const [defaultPriority, setDefaultPriority] = useState<Priority>('medium');
  const [defaultWorkspace, setDefaultWorkspace] = useState<Workspace>('personal');
  const [defaultPomodoros, setDefaultPomodoros] = useState(2);

  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [taskReminders, setTaskReminders] = useState(true);
  const [breakReminders, setBreakReminders] = useState(true);

  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('focusflow-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        // Use a single state update to avoid cascading renders
        Promise.resolve().then(() => {
          setDefaultPriority(settings.defaultPriority || 'medium');
          setDefaultWorkspace(settings.defaultWorkspace || 'personal');
          setDefaultPomodoros(settings.defaultPomodoros || 2);
          setWorkDuration(settings.workDuration || 25);
          setShortBreak(settings.shortBreak || 5);
          setLongBreak(settings.longBreak || 15);
          setLongBreakInterval(settings.longBreakInterval || 4);
          setNotificationsEnabled(settings.notificationsEnabled || false);
          setTaskReminders(settings.taskReminders !== false);
          setBreakReminders(settings.breakReminders !== false);
          setShortcutsEnabled(settings.shortcutsEnabled !== false);
        });
      }
    }
  }, []);

  const saveSettings = useCallback(() => {
    const settings = {
      defaultPriority,
      defaultWorkspace,
      defaultPomodoros,
      workDuration,
      shortBreak,
      longBreak,
      longBreakInterval,
      notificationsEnabled,
      taskReminders,
      breakReminders,
      shortcutsEnabled,
    };
    localStorage.setItem('focusflow-settings', JSON.stringify(settings));
  }, [
    defaultPriority,
    defaultWorkspace,
    defaultPomodoros,
    workDuration,
    shortBreak,
    longBreak,
    longBreakInterval,
    notificationsEnabled,
    taskReminders,
    breakReminders,
    shortcutsEnabled,
  ]);

  useEffect(() => {
    saveSettings();
  }, [saveSettings]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-5xl p-4 sm:p-6 md:p-8">
        <header className="flex items-center gap-3 mb-6 md:mb-8">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">{t('navigation.back')}</span>
            </Link>
          </Button>
          <div className="flex items-center gap-3 min-w-0">
            <SettingsIcon className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">
                {t('settings.title')}
              </h1>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>{t('settings.theme.title')}</CardTitle>
              </div>
              <CardDescription>{t('settings.theme.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="h-12"
                >
                  {t('settings.theme.light')}
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="h-12"
                >
                  {t('settings.theme.dark')}
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setTheme('system')}
                  className="h-12"
                >
                  {t('settings.theme.system')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Default Task Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                <CardTitle>{t('settings.defaults.title')}</CardTitle>
              </div>
              <CardDescription>{t('settings.defaults.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-priority">{t('settings.defaults.priority')}</Label>
                  <Select value={defaultPriority} onValueChange={(v: Priority) => setDefaultPriority(v)}>
                    <SelectTrigger id="default-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('taskForm.low')}</SelectItem>
                      <SelectItem value="medium">{t('taskForm.medium')}</SelectItem>
                      <SelectItem value="high">{t('taskForm.high')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-workspace">{t('settings.defaults.workspace')}</Label>
                  <Select
                    value={defaultWorkspace}
                    onValueChange={(v: Workspace) => setDefaultWorkspace(v)}
                  >
                    <SelectTrigger id="default-workspace">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">{t('workspace.personal')}</SelectItem>
                      <SelectItem value="work">{t('workspace.work')}</SelectItem>
                      <SelectItem value="side-project">{t('workspace.sideProject')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-pomodoros">{t('settings.defaults.pomodoros')}</Label>
                  <Select
                    value={defaultPomodoros.toString()}
                    onValueChange={(v) => setDefaultPomodoros(parseInt(v))}
                  >
                    <SelectTrigger id="default-pomodoros">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pomodoro Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                <CardTitle>{t('settings.pomodoro.title')}</CardTitle>
              </div>
              <CardDescription>{t('settings.pomodoro.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work-duration">{t('settings.pomodoro.workDuration')}</Label>
                  <Select
                    value={workDuration.toString()}
                    onValueChange={(v) => setWorkDuration(parseInt(v))}
                  >
                    <SelectTrigger id="work-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="45">45</SelectItem>
                      <SelectItem value="60">60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short-break">{t('settings.pomodoro.shortBreak')}</Label>
                  <Select
                    value={shortBreak.toString()}
                    onValueChange={(v) => setShortBreak(parseInt(v))}
                  >
                    <SelectTrigger id="short-break">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="long-break">{t('settings.pomodoro.longBreak')}</Label>
                  <Select
                    value={longBreak.toString()}
                    onValueChange={(v) => setLongBreak(parseInt(v))}
                  >
                    <SelectTrigger id="long-break">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="long-break-interval">
                    {t('settings.pomodoro.longBreakInterval')}
                  </Label>
                  <Select
                    value={longBreakInterval.toString()}
                    onValueChange={(v) => setLongBreakInterval(parseInt(v))}
                  >
                    <SelectTrigger id="long-break-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>{t('settings.notifications.title')}</CardTitle>
              </div>
              <CardDescription>{t('settings.notifications.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-notifications">
                    {t('settings.notifications.enableNotifications')}
                  </Label>
                </div>
                <Switch
                  id="enable-notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>

              {notificationsEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="task-reminders">
                        {t('settings.notifications.taskReminders')}
                      </Label>
                    </div>
                    <Switch
                      id="task-reminders"
                      checked={taskReminders}
                      onCheckedChange={setTaskReminders}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="break-reminders">
                        {t('settings.notifications.breakReminders')}
                      </Label>
                    </div>
                    <Switch
                      id="break-reminders"
                      checked={breakReminders}
                      onCheckedChange={setBreakReminders}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                <CardTitle>{t('settings.keyboard.title')}</CardTitle>
              </div>
              <CardDescription>{t('settings.keyboard.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-shortcuts">
                    {t('settings.keyboard.enableShortcuts')}
                  </Label>
                </div>
                <Switch
                  id="enable-shortcuts"
                  checked={shortcutsEnabled}
                  onCheckedChange={setShortcutsEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
