'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { PomodoroTimer } from './pomodoro-timer';
import { useI18n } from './i18n-provider';
import { useState, useEffect, useCallback } from 'react';

type FocusViewProps = {
  task: Task;
  onExit: () => void;
  onPomodoroComplete: (taskId: string) => void;
};

export function FocusView({ task, onExit, onPomodoroComplete }: FocusViewProps) {
  const { t } = useI18n();
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  const handleActivity = useCallback(() => {
    setIsIdle(false);
  }, []);

  useEffect(() => {
    let idleTimeout: NodeJS.Timeout | null = null;
    
    const resetIdleTimeout = () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      handleActivity();
      if (isTimerActive) {
        idleTimeout = setTimeout(() => setIsIdle(true), 3000);
      }
    };
    
    resetIdleTimeout();
    
    window.addEventListener('mousemove', resetIdleTimeout);
    window.addEventListener('mousedown', resetIdleTimeout);
    window.addEventListener('keypress', resetIdleTimeout);
    window.addEventListener('touchstart', resetIdleTimeout);

    return () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      window.removeEventListener('mousemove', resetIdleTimeout);
      window.removeEventListener('mousedown', resetIdleTimeout);
      window.removeEventListener('keypress', resetIdleTimeout);
      window.removeEventListener('touchstart', resetIdleTimeout);
    };
  }, [isTimerActive, handleActivity]);


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex flex-col items-center justify-center p-4"
        onClick={onExit}
      >
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-full max-w-3xl text-center flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
        >
          <motion.p 
            animate={{ opacity: isIdle ? 0 : 1 }}
            transition={{ duration: 0.5 }}
            className="text-lg text-muted-foreground mb-4">{t('focusView.focusingOn')}
          </motion.p>
          <motion.h1 
            animate={{ 
                scale: isIdle ? 1.2 : 1,
                y: isIdle ? -60 : 0,
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="text-4xl md:text-6xl font-bold mb-6">{task.title}
          </motion.h1>
          {task.description && (
            <motion.p 
              animate={{ 
                scale: isIdle ? 0.8 : 1,
                y: isIdle ? -60 : 0,
                opacity: isIdle ? 0.7 : 1,
              }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              className="text-xl text-muted-foreground max-w-xl mx-auto mb-12">{task.description}
            </motion.p>
          )}
          
          <motion.div
            animate={{ opacity: isIdle ? 0 : 1, scale: isIdle ? 0.7 : 1, y: isIdle ? 80 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <PomodoroTimer 
              task={task}
              onPomodoroComplete={() => onPomodoroComplete(task.id)}
              onTimerActiveChange={setIsTimerActive}
            />
          </motion.div>

          <motion.div
             animate={{ opacity: isIdle ? 0 : 1 }}
             transition={{ duration: 0.5 }}
          >
            <Button onClick={onExit} variant="ghost" className="mt-16 text-muted-foreground">
              <X className="mr-2 h-4 w-4" /> {t('focusView.endSession')}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
