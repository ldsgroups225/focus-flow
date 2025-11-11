'use client';

import React, { useState, memo } from 'react';
import { TaskItem } from './task-item';
import type { TaskWithSubTasks } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { ListX } from 'lucide-react';
import { useI18n } from './i18n-provider';

type ExtendedTask = TaskWithSubTasks & {
  isBlocked?: number;
  blockingTasks?: string[];
};

type TaskListProps = {
  tasks: ExtendedTask[];
  setTasks: React.Dispatch<React.SetStateAction<TaskWithSubTasks[]>>;
  onEdit: (task: TaskWithSubTasks) => void;
  onDelete: (taskId: string) => void;
  onToggle: (taskId: string) => void;
  onFocus: (task: TaskWithSubTasks) => void;
  selectedTaskIds: Set<string>;
  onSelectTask: (taskId: string) => void;
  onSubTaskToggle: (subTaskId: string) => void;
};

const TaskList = memo(function TaskList({ tasks, setTasks, onEdit, onDelete, onToggle, onFocus, selectedTaskIds, onSelectTask, onSubTaskToggle }: TaskListProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const { t } = useI18n();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: TaskWithSubTasks) => {
    // Only allow dragging if not clicking on an interactive element
    if ((e.target as HTMLElement).closest('button, a, input, [role=checkbox]')) {
      e.preventDefault();
      return;
    }
    setDraggedItemId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetTask: TaskWithSubTasks) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetTask.id) return;

    setTasks(currentTasks => {
      const draggedIndex = currentTasks.findIndex(t => t.id === draggedItemId);
      const targetIndex = currentTasks.findIndex(t => t.id === targetTask.id);

      if (draggedIndex === -1 || targetIndex === -1) return currentTasks;

      // Find the full task objects in the original unfiltered array
      const fullTasks = [...currentTasks];
      const draggedTask = fullTasks.find(t => t.id === draggedItemId);
      if (!draggedTask) return currentTasks;

      const tasksWithoutDragged = fullTasks.filter(t => t.id !== draggedItemId);
      const newTargetIndex = tasksWithoutDragged.findIndex(t => t.id === targetTask.id);

      if (newTargetIndex === -1) return currentTasks;

      tasksWithoutDragged.splice(newTargetIndex, 0, draggedTask);

      return tasksWithoutDragged;
    });
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center h-80">
        <ListX className="text-muted-foreground h-12 w-12 mb-4" />
        <h3 className="text-xl font-semibold text-foreground">{t('taskList.allClear')}</h3>
        <p className="text-muted-foreground mt-2">{t('taskList.noTasks')}</p>
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
              isSelected={selectedTaskIds.has(task.id)}
              onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, task)}
              onDragOver={(e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, task)}
              onDragEnd={handleDragEnd}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
              onFocus={onFocus}
              onSelect={onSelectTask}
              onSubTaskToggle={onSubTaskToggle}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

TaskList.displayName = 'TaskList';

export { TaskList };
