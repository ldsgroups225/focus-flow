'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw, Coffee } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Task } from '@/lib/types';
import { useI18n } from './i18n-provider';

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

type TimerMode = 'work' | 'break';

type PomodoroTimerProps = {
  task: Task;
  onPomodoroComplete: () => void;
};

export function PomodoroTimer({ task, onPomodoroComplete }: PomodoroTimerProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<TimerMode>('work');
  const [isActive, setIsActive] = useState(false);
  
  const initialTime = useMemo(() => (mode === 'work' ? WORK_MINUTES * 60 : BREAK_MINUTES * 60), [mode]);
  const [secondsLeft, setSecondsLeft] = useState(initialTime);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = 100 - (secondsLeft / initialTime) * 100;

  const handleNextSession = useCallback(() => {
    setIsActive(false);
    if (mode === 'work') {
      onPomodoroComplete();
      setMode('break');
      setSecondsLeft(BREAK_MINUTES * 60);
    } else {
      setMode('work');
      setSecondsLeft(WORK_MINUTES * 60);
    }
  }, [mode, onPomodoroComplete]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(seconds => seconds - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      handleNextSession();
      new Audio('/notification.mp3').play().catch(e => console.error("Error playing sound:", e));
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, handleNextSession]);

  useEffect(() => {
    setSecondsLeft(initialTime);
    setIsActive(false);
  }, [mode, initialTime]);
  
  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(initialTime);
  };
  
  return (
    <div className="flex items-end justify-between w-full">
        <div className="w-48">
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums">
                    {`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
                </span>
                <span className="text-muted-foreground text-sm">
                   {mode === 'work' ? t('pomodoro.focusSession') : t('pomodoro.takeBreak')}
                </span>
            </div>
            <Progress value={progress} className="h-1 mt-2" />
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={resetTimer} aria-label={t('pomodoro.resetTimer')}>
                <RefreshCw className="w-5 h-5" />
            </Button>
            <Button size="icon" className="w-12 h-12 rounded-full" onClick={() => setIsActive(!isActive)} aria-label={isActive ? t('pomodoro.pauseTimer') : t('pomodoro.startTimer')}>
                {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextSession} aria-label={mode === 'work' ? t('pomodoro.startBreak') : t('pomodoro.startWork')}>
                <Coffee className="w-5 h-5" />
            </Button>
        </div>
    </div>
  );
}
