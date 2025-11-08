import type { Task } from '@/lib/types';

/**
 * Server-side task utilities
 * These run on the server and can fetch data directly
 */

export interface TaskListProps {
  tasks: Task[];
}

/**
 * Server component for displaying a list of tasks
 * This is a presentational component that can run on the server
 */
export function TaskListServer({ tasks }: TaskListProps) {
  // This would render on the server
  // In a real implementation, you might use this for SEO or initial HTML
  return null; // Placeholder - actual rendering is done by client component
}

/**
 * Server-side data transformation utilities
 */
export class TaskServerService {
  /**
   * Process tasks on the server (e.g., for SSR)
   */
  static processTasksForSSR(tasks: Task[]): Task[] {
    // Server-side processing
    // Add computed properties, sort, filter, etc.
    return tasks
      .sort((a, b) => {
        // Sort by priority, then by creation date
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.dueDate || 0).getTime() - new Date(a.dueDate || 0).getTime();
      });
  }

  /**
   * Get task statistics
   */
  static getTaskStats(tasks: Task[]) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const inProgress = total - completed;

    return {
      total,
      completed,
      inProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}
