'use client';

import React, { useState } from 'react';
import { TaskItem } from './task-item';
import type { Task } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { ListX } from 'lucide-react';

type TaskListProps = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggle: (taskId: string) => void;
  onFocus: (task: Task) => void;
};

export function TaskList({ tasks, setTasks, onEdit, onDelete, onToggle, onFocus }: TaskListProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedItemId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetTask: Task) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetTask.id) return;
    
    setTasks(currentTasks => {
      const draggedIndex = currentTasks.findIndex(t => t.id === draggedItemId);
      const targetIndex = currentTasks.findIndex(t => t.id === targetTask.id);

      if (draggedIndex === -1 || targetIndex === -1) return currentTasks;

      const newTasks = [...currentTasks];
      const [draggedItem] = newTasks.splice(draggedIndex, 1);
      newTasks.splice(targetIndex, 0, draggedItem);
      return newTasks;
    });
  };
  
  const handleDragEnd = () => {
    setDraggedItemId(null);
  };
  
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center h-80">
        <ListX className="text-muted-foreground h-12 w-12 mb-4" />
        <h3 className="text-xl font-semibold text-foreground">All Clear!</h3>
        <p className="text-muted-foreground mt-2">No tasks match your current filters. Or maybe you're just that good.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {tasks.map(task => (
           <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
           >
            <TaskItem
              task={task}
              isDragging={draggedItemId === task.id}
              onDragStart={(e) => handleDragStart(e, task)}
              onDragOver={(e) => handleDragOver(e, task)}
              onDragEnd={handleDragEnd}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
              onFocus={onFocus}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
