'use client';

import { useState, useCallback, useTransition } from 'react';
import { useOptimistic } from 'react';
import type { Task } from '@/lib/types';
import { TaskService } from '@/lib/services/task-service';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/app/components/i18n-provider';

type OptimisticAction =
  | { type: 'add'; task: Task }
  | { type: 'update'; id: string; patch: Partial<Task> }
  | { type: 'delete'; id: string };

export function useTasks(userId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  // Optimistic updates
  const [optimisticTasks, addOptimistic] = useOptimistic(tasks, (current, action: OptimisticAction) => {
    switch (action.type) {
      case 'add':
        return [action.task, ...current];
      case 'update':
        return current.map(taskItem => (taskItem.id === action.id ? { ...taskItem, ...action.patch } : taskItem));
      case 'delete':
        return current.filter(taskItem => taskItem.id !== action.id);
      default:
        return current;
    }
  });

  // Fetch tasks
  const fetchTasks = useCallback(() => {
    if (!userId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    TaskService.fetchTasks(userId, (newTasks) => {
      setTasks(newTasks);
      setIsLoading(false);
    });
  }, [userId]);

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
            setTasks(prev => prev.map(taskItem => (taskItem.id === taskToSave.id ? { ...taskItem, ...patch } : taskItem)));
          });
        } catch {
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
          // Refresh from server to get the real ID
          TaskService.fetchTasks(userId, (newTasks) => {
            startTransition(() => setTasks(newTasks));
          });
        } catch {
          startTransition(() => {
            setTasks(prev => prev.filter(t => t.id !== tempId));
          });
          toast({ variant: 'destructive', title: t('toast.createError'), description: t('toast.createErrorDesc') });
        }
      });
    }
  }, [userId, tasks, addOptimistic, toast, t]);

  // Toggle task completion
  const toggleComplete = useCallback(async (taskId: string) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const original = [...tasks];
      startTransition(async () => {
        addOptimistic({
          type: 'update',
          id: taskId,
          patch: { completed: !task.completed, completedDate: !task.completed ? new Date() : undefined },
        });
        try {
          await TaskService.toggleTaskCompletion(userId, taskId, task.completed);
          startTransition(() => {
            setTasks(prev => prev.map(taskItem => (
              taskItem.id === taskId
                ? {
                  ...taskItem,
                  completed: !task.completed,
                  completedDate: !task.completed ? new Date() : undefined,
                }
                : taskItem
            )));
          });
        } catch {
          startTransition(() => {
            setTasks(original);
          });
          toast({ variant: 'destructive', title: t('toast.updateError'), description: t('toast.updateErrorDesc') });
        }
      });
    }
  }, [userId, tasks, addOptimistic, toast, t]);

  // Delete task with undo
  const deleteTaskWithUndo = useCallback(async (taskId: string) => {
    if (!userId) return;

    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    const originalTasks = [...tasks];

    // Optimistic deletion
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
  }, [userId, tasks, toast, t, addOptimistic, startTransition]);

  // Update pomodoro count
  const updatePomodoro = useCallback(async (taskId: string) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const newCount = task.completedPomodoros + 1;
      await TaskService.updatePomodoroCount(userId, taskId, newCount);
    }
  }, [userId, tasks]);

  // Log time
  const logTime = useCallback(async (taskId: string, seconds: number) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await TaskService.logTimeSpent(userId, taskId, seconds, task.timeSpent);
    }
  }, [userId, tasks]);

  // Toggle subtask
  const toggleSubTask = useCallback(async (taskId: string, subTaskIndex: number) => {
    // TODO: implement in database
    // This is a placeholder for future implementation
  }, []);

  return {
    tasks: optimisticTasks,
    isLoading,
    isPending,
    saveTask,
    toggleComplete,
    deleteTask: deleteTaskWithUndo,
    updatePomodoro,
    logTime,
    toggleSubTask,
    fetchTasks,
    setTasks,
  };
}
