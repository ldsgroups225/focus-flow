import { getTasks, addTask, updateTask, deleteTask } from '@/lib/appwrite/task-services';
import {
  getSubTasksByTaskId,
  addSubTask,
  updateSubTask,
  deleteSubTask,
  deleteSubTasksByTaskId,
  bulkUpdateSubTasks
} from '@/lib/appwrite/subtask-services';
import type { Task, SubTask } from '@/lib/types';

// Extended Task type with subtasks loaded
export type TaskWithSubTasks = Task & {
  subTasks?: SubTask[];
};

export class TaskService {
  // Fetch tasks with their subtasks
  static fetchTasks(userId: string, callback: (tasks: TaskWithSubTasks[]) => void) {
    getTasks(userId, async (tasks) => {
      // Load subtasks for each task
      const tasksWithSubTasks = await Promise.all(
        tasks.map(async (task) => {
          const subTasks = await getSubTasksByTaskId(task.id);
          return { ...task, subTasks };
        })
      );
      callback(tasksWithSubTasks);
    });
  }

  // Create a new task
  static async createTask(
    userId: string,
    taskData: Omit<Task, 'id' | 'completed' | 'completedPomodoros' | 'timeSpent' | 'completedDate'> & { subTasks?: Omit<SubTask, 'id' | 'taskId'>[] }
  ) {
    const { subTasks, ...taskFields } = taskData;
    const newTask = await addTask(userId, taskFields);

    // Create subtasks if provided
    if (subTasks && subTasks.length > 0) {
      await Promise.all(
        subTasks.map((st, index) =>
          addSubTask({
            taskId: newTask.$id,
            title: st.title,
            completed: st.completed || false,
            order: st.order ?? index,
            parentSubTaskId: st.parentSubTaskId,
          })
        )
      );
    }

    return newTask;
  }

  // Update task data
  static async updateTaskData(userId: string, taskId: string, taskData: Partial<Task>) {
    return updateTask(userId, taskId, taskData);
  }

  // Toggle task completion
  static async toggleTaskCompletion(userId: string, taskId: string, currentCompleted: boolean) {
    return updateTask(userId, taskId, {
      completed: !currentCompleted,
      completedDate: !currentCompleted ? new Date() : undefined,
    });
  }

  // Delete task and its subtasks
  static async deleteTaskData(userId: string, taskId: string) {
    await deleteSubTasksByTaskId(taskId);
    return deleteTask(userId, taskId);
  }

  // Update pomodoro count
  static async updatePomodoroCount(userId: string, taskId: string, newCount: number) {
    return updateTask(userId, taskId, { completedPomodoros: newCount });
  }

  // Log time spent
  static async logTimeSpent(userId: string, taskId: string, additionalSeconds: number, currentTimeSpent: number) {
    return updateTask(userId, taskId, { timeSpent: currentTimeSpent + additionalSeconds });
  }

  // SubTask operations
  static async addSubTaskToTask(taskId: string, subTaskData: Omit<SubTask, 'id' | 'taskId'>) {
    return addSubTask({ ...subTaskData, taskId });
  }

  static async updateSubTaskData(subTaskId: string, subTaskData: Partial<SubTask>) {
    return updateSubTask(subTaskId, subTaskData);
  }

  static async toggleSubTaskCompletion(subTaskId: string, currentCompleted: boolean) {
    return updateSubTask(subTaskId, { completed: !currentCompleted });
  }

  static async deleteSubTaskData(subTaskId: string) {
    return deleteSubTask(subTaskId);
  }

  static async getSubTasksForTask(taskId: string) {
    return getSubTasksByTaskId(taskId);
  }

  static async reorderSubTasks(subTasks: SubTask[]) {
    return bulkUpdateSubTasks(subTasks);
  }

  // Filter and utility methods
  static filterTasksByWorkspace(tasks: TaskWithSubTasks[], workspace: string): TaskWithSubTasks[] {
    return tasks.filter(task => task.workspace === workspace);
  }

  static filterTasksByProject(tasks: TaskWithSubTasks[], projectId: string): TaskWithSubTasks[] {
    return tasks.filter(task => task.projectId === projectId);
  }

  static getUniqueTags(tasks: TaskWithSubTasks[]): string[] {
    const tagSet = new Set<string>();
    tasks.forEach(task => {
      task.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  static addTaskBlockingStatus(tasks: TaskWithSubTasks[]): (TaskWithSubTasks & { isBlocked?: number; blockingTasks?: string[] })[] {
    // Helper function to calculate blocking depth - recursively count uncompleted dependencies
    const calculateBlockingDepth = (taskId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(taskId)) return 0; // Prevent circular dependencies
      visited.add(taskId);

      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.dependsOn || task.dependsOn.length === 0) return 0;

      let maxDepth = 0;
      for (const depId of task.dependsOn) {
        const depTask = tasks.find(t => t.id === depId);
        if (depTask && !depTask.completed) {
          const newVisited = new Set(visited);
          const depth = 1 + calculateBlockingDepth(depId, newVisited);
          maxDepth = Math.max(maxDepth, depth);
        }
      }

      return maxDepth;
    };

    const tasksWithStatus = tasks.map(task => {
      if (!task.dependsOn || task.dependsOn.length === 0) {
        return task;
      }

      const blockingTasksTitles = task.dependsOn
        .map(depId => tasks.find(t => t.id === depId))
        .filter((t): t is TaskWithSubTasks => t !== undefined && !t.completed)
        .map(t => t.title);

      const blockingDepth = calculateBlockingDepth(task.id);

      return {
        ...task,
        isBlocked: blockingDepth,
        blockingTasks: blockingTasksTitles,
      };
    });

    // Sort to group blocked tasks near their dependencies
    return this.sortTasksByDependencies(tasksWithStatus);
  }

  /**
   * Sort tasks to place blocked tasks near their dependencies
   * Strategy: Group dependency chains together while preserving priority/due date order
   */
  static sortTasksByDependencies(
    tasks: (TaskWithSubTasks & { isBlocked?: number; blockingTasks?: string[] })[]
  ): (TaskWithSubTasks & { isBlocked?: number; blockingTasks?: string[] })[] {
    const processed = new Set<string>();
    const result: (TaskWithSubTasks & { isBlocked?: number; blockingTasks?: string[] })[] = [];

    // Helper to recursively add a task and its dependents
    const addTaskWithDependents = (task: TaskWithSubTasks & { isBlocked?: number; blockingTasks?: string[] }) => {
      if (processed.has(task.id)) return;

      processed.add(task.id);
      result.push(task);

      // Find tasks that depend on this one
      const dependents = tasks.filter(t =>
        t.dependsOn?.includes(task.id) && !processed.has(t.id)
      );

      // Add dependents immediately after (sorted by priority/dueDate)
      dependents.forEach(dep => addTaskWithDependents(dep));
    };

    // First pass: add tasks without dependencies (or with completed dependencies)
    tasks
      .filter(t => !t.isBlocked || t.isBlocked === 0)
      .forEach(task => addTaskWithDependents(task));

    // Second pass: add any remaining blocked tasks (circular dependencies or orphaned)
    tasks
      .filter(t => !processed.has(t.id))
      .forEach(task => addTaskWithDependents(task));

    return result;
  }

  static filterTasks(
    tasks: (TaskWithSubTasks & { isBlocked?: number; blockingTasks?: string[] })[],
    filters: {
      priorityFilter: string[];
      tagFilter: string[];
      searchQuery: string;
      typeFilter?: string[];
      selectedProjectId?: string;
    }
  ): (TaskWithSubTasks & { isBlocked?: number; blockingTasks?: string[] })[] {
    return tasks.filter(task => {
      // Priority filter
      if (filters.priorityFilter.length > 0 && !filters.priorityFilter.includes(task.priority)) {
        return false;
      }

      // Tag filter
      if (filters.tagFilter.length > 0 && !filters.tagFilter.some(tag => task.tags.includes(tag))) {
        return false;
      }

      // Type filter
      if (filters.typeFilter && filters.typeFilter.length > 0 && !filters.typeFilter.includes(task.type || 'task')) {
        return false;
      }

      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query);
        const matchesTags = task.tags.some(tag => tag.toLowerCase().includes(query));

        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      // Project filter
      if (filters.selectedProjectId && task.projectId !== filters.selectedProjectId) {
        return false;
      }

      return true;
    });
  }

  static filterTasksByType(tasks: TaskWithSubTasks[], types: string[]): TaskWithSubTasks[] {
    if (types.length === 0) return tasks;
    return tasks.filter(task => types.includes(task.type || 'task'));
  }

  static getMilestones(tasks: TaskWithSubTasks[]): TaskWithSubTasks[] {
    return tasks.filter(task => task.type === 'milestone');
  }

  static validateMilestone(task: Partial<Task>): boolean {
    if (task.type === 'milestone' && task.duration && task.duration !== 0) {
      throw new Error('Milestones must have zero duration');
    }
    return true;
  }
}
