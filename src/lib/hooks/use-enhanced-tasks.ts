'use client';

import { use, useState, useCallback, useTransition, useEffect, useMemo } from 'react';
import { useOptimistic } from 'react';
import type { Task } from '@/lib/types';
import { TaskService } from '@/lib/services/task-service';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/app/components/i18n-provider';

/**
 * Enhanced useTasks hook using React 19 use() hook
 * This version uses the use() hook for native Suspense integration
 */

type OptimisticAction =
  | { type: 'add'; task: Task }
  | { type: 'update'; id: string; patch: Partial<Task> }
  | { type: 'delete'; id: string };

/**
 * Hook for managing tasks with React 19 use() hook
 * @param tasksPromise - Promise that resolves to an array of tasks (from server component)
 */
export function useEnhancedTasks(tasksPromise: Promise<Task[]> | null) {
  const resolvedTasks = tasksPromise ? use(tasksPromise) : null;
  const [tasks, setTasks] = useState<Task[]>(() => resolvedTasks ?? []);
  const { toast } = useToast();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!resolvedTasks) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setTasks(resolvedTasks);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedTasks]);

  const userId = useMemo(() => (tasksPromise ? 'current-user' : null), [tasksPromise]);
  const isLoading = resolvedTasks === null && tasks.length === 0;

  // Optimistic updates
  const [optimisticTasks, addOptimistic] = useOptimistic(tasks, (current, action: OptimisticAction) => {
    switch (action.type) {
      case 'add':
        return [action.task, ...current];
      case 'update':
        return current.map(task => (task.id === action.id ? { ...task, ...action.patch } : task));
      case 'delete':
        return current.filter(task => task.id !== action.id);
      default:
        return current;
    }
  });

  // Save task (create or update)
  const saveTask = useCallback(async (
    taskToSave: Omit<Task, 'id' | 'completed' | 'completedPomodoros' | 'timeSpent' | 'completedDate'> & { id?: string },
    activeWorkspace: 'personal' | 'work' | 'side-project'
  ) => {
    if (!userId) return;

    if (taskToSave.id) {
      // Update existing task
      const original = [...tasks];
      const { id: _ignoredId, ...taskPatch } = taskToSave;
      const patch: Partial<Task> = { ...taskPatch, workspace: activeWorkspace };
      startTransition(async () => {
        addOptimistic({ type: 'update', id: taskToSave.id!, patch });
        try {
          await TaskService.updateTaskData(userId, taskToSave.id!, patch);
          startTransition(() => {
            setTasks(prev => prev.map(task => (task.id === taskToSave.id ? { ...task, ...patch } : task)));
          });
        } catch (e) {
          startTransition(() => {
            setTasks(original);
          });
          toast({ variant: 'destructive', title: t('toast.updateError'), description: t('toast.updateErrorDesc') });
        }
      });
    } else {
      // Create new task
      const tempId = `temp-${Date.now()}`;
      const tempTask: Task = {
        id: tempId,
        title: taskToSave.title,
        description: taskToSave.description,
        completed: false,
        priority: taskToSave.priority,
        tags: taskToSave.tags ?? [],
        dueDate: taskToSave.dueDate,
        pomodoros: taskToSave.pomodoros,
        completedPomodoros: 0,
        timeSpent: 0,
        dependsOn: taskToSave.dependsOn,
        workspace: activeWorkspace,
        subTasks: taskToSave.subTasks,
      };
      startTransition(async () => {
        addOptimistic({ type: 'add', task: tempTask });
        try {
          const { id: _ignoredId, ...newTaskData } = taskToSave;
          await TaskService.createTask(userId, { ...newTaskData, workspace: activeWorkspace });
        } catch (e) {
          startTransition(() => {
            setTasks(prev => prev.filter(task => task.id !== tempId));
          });
          toast({ variant: 'destructive', title: t('toast.createError'), description: t('toast.createErrorDesc') });
        }
      });
    }
  }, [tasks, addOptimistic, toast, t, userId, startTransition]);

  // Toggle task completion
  const toggleComplete = useCallback(async (taskId: string) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const original = [...tasks];
      startTransition(async () => {
        addOptimistic({ type: 'update', id: taskId, patch: { completed: !task.completed, completedDate: !task.completed ? new Date() : undefined } });
        try {
          await TaskService.toggleTaskCompletion(userId, taskId, task.completed);
          startTransition(() => {
            setTasks(prev => prev.map(currentTask => (
              currentTask.id === taskId
                ? {
                  ...currentTask,
                  completed: !task.completed,
                  completedDate: !task.completed ? new Date() : undefined,
                }
                : currentTask
            )));
          });
        } catch (e) {
          startTransition(() => {
            setTasks(original);
          });
          toast({ variant: 'destructive', title: t('toast.updateError'), description: t('toast.updateErrorDesc') });
        }
      });
    }
  }, [tasks, addOptimistic, toast, t, userId, startTransition]);

  // Delete task
  const deleteTask = useCallback(async (taskId: string) => {
    if (!userId) return;

    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    const originalTasks = [...tasks];

    startTransition(() => {
      addOptimistic({ type: 'delete', id: taskId });
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    });

    toast({
      title: t('toast.taskDeleted'),
      description: taskToDelete.title,
    });

    startTransition(async () => {
      try {
        await TaskService.deleteTaskData(userId, taskId);
      } catch (e) {
        console.error("Failed to delete task: ", e);
        startTransition(() => {
          setTasks(originalTasks);
        });
        toast({
          variant: "destructive",
          title: t('toast.deleteError'),
          description: t('toast.deleteErrorDesc'),
        });
      }
    });
  }, [tasks, toast, t, addOptimistic, startTransition, userId]);

  // Update pomodoro count
  const updatePomodoro = useCallback(async (taskId: string) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const newCount = task.completedPomodoros + 1;
      await TaskService.updatePomodoroCount(userId, taskId, newCount);
    }
  }, [tasks, userId]);

  // Log time
  const logTime = useCallback(async (taskId: string, seconds: number) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await TaskService.logTimeSpent(userId, taskId, seconds, task.timeSpent);
    }
  }, [tasks, userId]);

  // Toggle subtask
  const toggleSubTask = useCallback(async (taskId: string, subTaskIndex: number) => {
    // TODO: implement in database
  }, []);

  return {
    tasks: optimisticTasks,
    isLoading,
    isPending,
    saveTask,
    toggleComplete,
    deleteTask,
    updatePomodoro,
    logTime,
    toggleSubTask,
  };
}
