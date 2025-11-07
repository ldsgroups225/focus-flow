'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { PomodoroTimer } from './pomodoro-timer';
import { useI18n } from './i18n-provider';
import { useState } from 'react';

type FocusViewProps = {
  task: Task;
  onExit: () => void;
  onPomodoroComplete: (taskId: string) => void;
};

export function FocusView({ task, onExit, onPomodoroComplete }: FocusViewProps) {
  const { t } = useI18n();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex flex-col p-4 sm:p-8"
      >
        <header className="w-full flex justify-end">
             <Button onClick={onExit} variant="ghost" className="text-muted-foreground">
              <X className="mr-2 h-4 w-4" /> {t('focusView.endSession')}
            </Button>
        </header>

        <main 
            className="flex-1 flex flex-col items-center justify-center text-center -mt-16"
        >
            <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
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
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full"
        >
          <PomodoroTimer 
            task={task}
            onPomodoroComplete={() => onPomodoroComplete(task.id)}
          />
        </motion.footer>
      </motion.div>
    </AnimatePresence>
  );
}
