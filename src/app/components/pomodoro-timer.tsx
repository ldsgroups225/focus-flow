'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw, Coffee, BrainCircuit } from 'lucide-react';
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
  const progress = (secondsLeft / initialTime) * 100;

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
      // Play a sound
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

  const timerLabel = mode === 'work' ? t('pomodoro.focusSession') : t('pomodoro.takeBreak');
  const pomodorosTextValue = task.pomodoros > 0 ? task.pomodoros : t('pomodoro.infinite');
  const pomodoroText = t('pomodoro.pomodorosOf').replace('{completed}', task.completedPomodoros.toString()).replace('{total}', pomodorosTextValue.toString());
  
  return (
    <div className="relative w-80 h-80 flex flex-col items-center justify-center">
      <motion.svg className="absolute inset-0" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" className="stroke-current text-border" strokeWidth="4" fill="transparent"/>
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          className="stroke-current text-primary"
          strokeWidth="4"
          fill="transparent"
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          initial={{ strokeDashoffset: 283 }}
          animate={{ strokeDashoffset: 283 - (progress / 100) * 283 }}
          transition={{ duration: 1, ease: "linear" }}
          style={{ strokeDasharray: 283 }}
        />
      </motion.svg>
      <div className="z-10 text-center">
        <p className="text-muted-foreground mb-2">{timerLabel}</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={secondsLeft}
            initial={{ opacity: 0.5, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0.5, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-6xl font-bold tabular-nums"
          >
            {`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground" title={pomodoroText}>
            <BrainCircuit className="w-4 h-4 text-primary/80" />
            <span>{task.completedPomodoros} / {pomodorosTextValue}</span>
        </div>
      </div>
      <div className="absolute bottom-0 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={resetTimer} aria-label={t('pomodoro.resetTimer')}>
          <RefreshCw className="w-5 h-5" />
        </Button>
        <Button size="lg" className="rounded-full w-20 h-20" onClick={() => setIsActive(!isActive)} aria-label={isActive ? t('pomodoro.pauseTimer') : t('pomodoro.startTimer')}>
          {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleNextSession} aria-label={mode === 'work' ? t('pomodoro.startBreak') : t('pomodoro.startWork')}>
          {mode === 'work' ? <Coffee className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}
