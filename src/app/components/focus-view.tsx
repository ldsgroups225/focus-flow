
'use client';

import { X, Play, Pause, RefreshCw, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { PomodoroTimer, type PomodoroTimerHandles } from './pomodoro-timer';
import { useI18n } from './i18n-provider';
import { useState, useRef, useCallback, useEffect } from 'react';

type FocusViewProps = {
  task: Task;
  onExit: () => void;
  onPomodoroComplete: (taskId: string) => void;
};

export function FocusView({ task, onExit, onPomodoroComplete }: FocusViewProps) {
  const { t } = useI18n();
  const timerRef = useRef<PomodoroTimerHandles>(null);
  const [timerState, setTimerState] = useState<{mode: 'work' | 'break', isActive: boolean}>({mode: 'work', isActive: false});
  const [isIdle, setIsIdle] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimeout = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    setIsIdle(false);
    if (timerState.isActive) {
      idleTimeoutRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 3000); 
    }
  }, [timerState.isActive]);
  
  const handleTimerUpdate = useCallback((mode: 'work' | 'break', isActive: boolean) => {
    setTimerState({mode, isActive});
    if (isActive) {
      resetIdleTimeout();
    } else {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      setIsIdle(false);
    }
  }, [resetIdleTimeout]);

  useEffect(() => {
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];
    activityEvents.forEach(event => window.addEventListener(event, resetIdleTimeout));

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, resetIdleTimeout));
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [resetIdleTimeout]);


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex flex-col p-4 sm:p-8"
      >
        <motion.header 
          animate={{ opacity: isIdle ? 0.33 : 1 }}
          transition={{ duration: 0.5 }}
          className="w-full flex justify-end relative z-10"
        >
             <Button onClick={onExit} variant="ghost" size="icon" className="text-muted-foreground" aria-label={t('focusView.endSession')}>
              <X className="h-6 w-6" />
            </Button>
        </motion.header>

        <main 
            className="flex-1 flex flex-col items-center justify-center text-center -mt-16"
        >
            <motion.p 
                animate={{ opacity: isIdle ? 0 : 1, y: isIdle ? -20 : 0 }}
                transition={{ duration: 0.5 }}
                className="text-lg text-muted-foreground mb-4">{t('focusView.focusingOn')}
            </motion.p>
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl md:text-6xl font-bold mb-6">{task.title}
            </motion.h1>
            {task.description && (
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-xl text-muted-foreground max-w-2xl mx-auto">{task.description}
                </motion.p>
            )}
        </main>
        
        <motion.footer 
            animate={{ opacity: isIdle ? 0.33 : 1 }}
            transition={{ duration: 0.5 }}
            className="w-full flex items-end justify-between"
        >
          <PomodoroTimer 
            onPomodoroComplete={() => onPomodoroComplete(task.id)}
            onTimerUpdate={handleTimerUpdate}
            timerRef={timerRef}
          />
           <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => timerRef.current?.reset()} aria-label={t('pomodoro.resetTimer')}>
                  <RefreshCw className="w-5 h-5" />
              </Button>
              <Button size="icon" className="w-12 h-12 rounded-full" onClick={() => timerRef.current?.toggle()} aria-label={timerState.isActive ? t('pomodoro.pauseTimer') : t('pomodoro.startTimer')}>
                  {timerState.isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => timerRef.current?.next()} aria-label={timerState.mode === 'work' ? t('pomodoro.startBreak') : t('pomodoro.startWork')}>
                  <Coffee className="w-5 h-5" />
              </Button>
          </div>
        </motion.footer>
      </motion.div>
    </AnimatePresence>
  );
}
