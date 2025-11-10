'use client';

import { useState, useCallback, useTransition } from 'react';
import { useOptimistic } from 'react';
import type { Task, TaskWithSubTasks } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/app/components/i18n-provider';
import { offlineDB } from '../services/offline-db';
import { syncService } from '../services/sync';
import { ID } from 'appwrite';

type OptimisticAction =
  | { type: 'add'; task: TaskWithSubTasks }
  | { type: 'update'; id: string; patch: Partial<TaskWithSubTasks> }
  | { type: 'delete'; id: string };

export function useTasks(userId: string | null) {
  const [tasks, setTasks] = useState<TaskWithSubTasks[]>([]);
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
  const fetchTasks = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    const localTasks = await offlineDB.query('SELECT * FROM tasks WHERE isDeleted = FALSE');
    setTasks(localTasks.rows as TaskWithSubTasks[]);
    setIsLoading(false);

    await syncService.sync();
    const updatedLocalTasks = await offlineDB.query('SELECT * FROM tasks WHERE isDeleted = FALSE');
    setTasks(updatedLocalTasks.rows as TaskWithSubTasks[]);
  }, [userId]);


  // Save task (create or update)
  const saveTask = useCallback(async (
    taskToSave: Partial<Task> & { subTasks?: { title: string; completed?: boolean; order?: number }[] },
    activeWorkspace: 'personal' | 'work' | 'side-project'
  ) => {
    if (!userId) return;

    if (taskToSave.id) {
      // Update existing task
      const patch: Partial<Task> = { ...taskToSave, workspace: activeWorkspace, $updatedAt: new Date().toISOString() };
      startTransition(async () => {
        addOptimistic({ type: 'update', id: taskToSave.id!, patch });
        await offlineDB.query(
          `UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, dueDate = $5, $updatedAt = $6, subTasks = $7 WHERE $id = $8`,
          [patch.title, patch.description, patch.status, patch.priority, patch.dueDate, patch.$updatedAt, JSON.stringify(taskToSave.subTasks), taskToSave.id]
        );
        await syncService.sync();
      });
    } else {
      // Create new task
      const newId = ID.unique();
      const newTask: TaskWithSubTasks = {
        id: newId,
        $id: newId,
        title: taskToSave.title || '',
        description: taskToSave.description,
        completed: false,
        priority: taskToSave.priority || 'medium',
        tags: taskToSave.tags ?? [],
        dueDate: taskToSave.dueDate,
        pomodoros: taskToSave.pomodoros || 0,
        completedPomodoros: 0,
        timeSpent: 0,
        dependsOn: taskToSave.dependsOn,
        workspace: activeWorkspace,
        subTasks: [],
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
      };
      startTransition(async () => {
        addOptimistic({ type: 'add', task: newTask });
        await offlineDB.query(
            `INSERT INTO tasks ($id, title, description, status, priority, dueDate, $createdAt, $updatedAt, subTasks) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [newTask.$id, newTask.title, newTask.description, newTask.status, newTask.priority, newTask.dueDate, newTask.$createdAt, newTask.$updatedAt, JSON.stringify(newTask.subTasks)]
        );
        await syncService.sync();
      });
    }
  }, [userId, addOptimistic]);

  // Toggle task completion
  const toggleComplete = useCallback(async (taskId: string) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const patch = { completed: !task.completed, completedDate: !task.completed ? new Date() : undefined, $updatedAt: new Date().toISOString() };
      startTransition(async () => {
        addOptimistic({ type: 'update', id: taskId, patch });
        await offlineDB.query(
          `UPDATE tasks SET completed = $1, completedDate = $2, $updatedAt = $3 WHERE $id = $4`,
          [patch.completed, patch.completedDate, patch.$updatedAt, taskId]
        );
        await syncService.sync();
      });
    }
  }, [userId, tasks, addOptimistic]);

  // Delete task with undo
  const deleteTaskWithUndo = useCallback(async (taskId: string) => {
    if (!userId) return;

    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    startTransition(() => {
      addOptimistic({ type: 'delete', id: taskId });
    });

    toast({
      title: t('toast.taskDeleted'),
      description: taskToDelete.title,
    });

    startTransition(async () => {
        await offlineDB.query('UPDATE tasks SET isDeleted = TRUE, $updatedAt = $1 WHERE $id = $2', [new Date().toISOString(), taskId]);
        await syncService.sync();
    });
  }, [userId, tasks, toast, t, addOptimistic, startTransition]);

  // Update pomodoro count
  const updatePomodoro = useCallback(async (taskId: string) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const newCount = task.completedPomodoros + 1;
        await offlineDB.query('UPDATE tasks SET completedPomodoros = $1, $updatedAt = $2 WHERE $id = $3', [newCount, new Date().toISOString(), taskId]);
        await syncService.sync();
    }
  }, [userId, tasks]);

  // Log time
  const logTime = useCallback(async (taskId: string, seconds: number) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const newTimeSpent = task.timeSpent + seconds;
        await offlineDB.query('UPDATE tasks SET timeSpent = $1, $updatedAt = $2 WHERE $id = $3', [newTimeSpent, new Date().toISOString(), taskId]);
        await syncService.sync();
    }
  }, [userId, tasks]);

  // Toggle subtask
  const toggleSubTask = useCallback(async (subTaskId: string) => {
    if (!userId) return;

    const task = tasks.find(t => t.subTasks?.some(st => st.id === subTaskId));
    if (task && task.subTasks) {
        const subTask = task.subTasks.find(st => st.id === subTaskId);
        if (subTask) {
            const updatedSubTasks = task.subTasks.map(st => st.id === subTaskId ? { ...st, completed: !st.completed } : st);
            await offlineDB.query('UPDATE tasks SET subTasks = $1, $updatedAt = $2 WHERE $id = $3', [JSON.stringify(updatedSubTasks), new Date().toISOString(), task.id]);
            await syncService.sync();
            fetchTasks();
        }
    }
  }, [userId, tasks, fetchTasks]);

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
