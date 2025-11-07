'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';

type FocusViewProps = {
  task: Task;
  onExit: () => void;
};

export function FocusView({ task, onExit }: FocusViewProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onExit}
      >
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-full max-w-2xl text-center"
            onClick={(e) => e.stopPropagation()}
        >
          <p className="text-lg text-muted-foreground mb-4">Focusing on</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">{task.title}</h1>
          {task.description && (
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">{task.description}</p>
          )}
          <Button onClick={onExit} className="mt-12">
            <X className="mr-2 h-4 w-4" /> End Focus Session
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
