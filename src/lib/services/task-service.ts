import type { Task } from '@/lib/types';
import { addTask, deleteTask, getTasks, updateTask } from '@/lib/appwrite/task-services';

/**
 * Task Service - Handles all task-related business logic
 * Separates business logic from state management and UI
 */
export class TaskService {
  /**
   * Fetch all tasks for a user
   */
  static async fetchTasks(
    userId: string,
    callback: (tasks: Task[]) => void
  ): Promise<void> {
    try {
      getTasks(userId, callback);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      callback([]);
    }
  }

  /**
   * Create a new task
   */
  static async createTask(
    userId: string,
    taskData: Omit<Task, 'id' | 'completed' | 'completedPomodoros' | 'timeSpent' | 'completedDate'>
  ): Promise<void> {
    try {
      await addTask(userId, taskData);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Update an existing task
   */
  static async updateTaskData(
    userId: string,
    taskId: string,
    updates: Partial<Task>
  ): Promise<void> {
    try {
      await updateTask(userId, taskId, updates);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Delete a task
   */
  static async deleteTaskData(
    userId: string,
    taskId: string
  ): Promise<void> {
    try {
      await deleteTask(userId, taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Toggle task completion status
   */
  static async toggleTaskCompletion(
    userId: string,
    taskId: string,
    currentStatus: boolean
  ): Promise<void> {
    try {
      await updateTask(userId, taskId, {
        completed: !currentStatus,
        completedDate: !currentStatus ? new Date() : undefined
      });
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  }

  /**
   * Update pomodoro count for a task
   */
  static async updatePomodoroCount(
    userId: string,
    taskId: string,
    newCount: number
  ): Promise<void> {
    try {
      await updateTask(userId, taskId, { completedPomodoros: newCount });
    } catch (error) {
      console.error('Error updating pomodoro count:', error);
      throw error;
    }
  }

  /**
   * Log time spent on a task
   */
  static async logTimeSpent(
    userId: string,
    taskId: string,
    additionalSeconds: number,
    currentTimeSpent: number
  ): Promise<void> {
    try {
      const newTime = currentTimeSpent + additionalSeconds;
      await updateTask(userId, taskId, { timeSpent: newTime });
    } catch (error) {
      console.error('Error logging time:', error);
      throw error;
    }
  }

  /**
   * Filter tasks by workspace
   */
  static filterTasksByWorkspace(
    tasks: Task[],
    workspace: 'personal' | 'work' | 'side-project'
  ): Task[] {
    return tasks.filter(task => task.workspace === workspace);
  }

  /**
   * Filter tasks by project
   */
  static filterTasksByProject(
    tasks: Task[],
    projectId: string
  ): Task[] {
    return tasks.filter(task => task.projectId === projectId);
  }

  /**
   * Get unique tags from tasks
   */
  static getUniqueTags(tasks: Task[]): string[] {
    const allTags = tasks.flatMap(task => task.tags);
    return [...new Set(allTags)];
  }

  /**
   * Filter tasks based on criteria
   */
  static filterTasks(
    tasks: Task[],
    filters: {
      priorityFilter?: string[];
      tagFilter?: string[];
      searchQuery?: string;
    }
  ): Task[] {
    return tasks.filter(task => {
      const { priorityFilter, tagFilter, searchQuery } = filters;

      const priorityMatch = !priorityFilter?.length || priorityFilter.includes(task.priority);
      const tagMatch = !tagFilter?.length || task.tags.some(tag => tagFilter.includes(tag));
      const searchMatch = !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      return priorityMatch && tagMatch && searchMatch;
    });
  }

  /**
   * Calculate task blocking status
   */
  static addTaskBlockingStatus(tasks: Task[]): (Task & { isBlocked: boolean; blockingTasks: string[] })[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    return tasks.map(task => {
      const blockingTasks = (task.dependsOn ?? [])
        .map(depId => taskMap.get(depId))
        .filter((dep): dep is Task => !!dep && !dep.completed);

      return {
        ...task,
        isBlocked: blockingTasks.length > 0,
        blockingTasks: blockingTasks.map(t => t.title),
      };
    });
  }

  /**
   * Restore a deleted task (for undo functionality)
   */
  static async restoreTask(
    userId: string,
    taskData: {
      title: string;
      description?: string;
      priority: 'low' | 'medium' | 'high';
      tags: string[];
      dueDate?: Date;
      pomodoros: number;
      dependsOn?: string[];
      workspace: 'personal' | 'work' | 'side-project';
    }
  ): Promise<void> {
    try {
      await this.createTask(userId, taskData);
    } catch (error) {
      console.error('Error restoring task:', error);
      throw error;
    }
  }
}
