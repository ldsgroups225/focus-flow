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

  static addTaskBlockingStatus(tasks: TaskWithSubTasks[]): (TaskWithSubTasks & { isBlocked?: boolean; blockingTasks?: string[] })[] {
    return tasks.map(task => {
      if (!task.dependsOn || task.dependsOn.length === 0) {
        return task;
      }

      const blockingTasks = task.dependsOn
        .map(depId => tasks.find(t => t.id === depId))
        .filter((t): t is TaskWithSubTasks => t !== undefined && !t.completed)
        .map(t => t.title);

      return {
        ...task,
        isBlocked: blockingTasks.length > 0,
        blockingTasks,
      };
    });
  }

  static filterTasks(
    tasks: (TaskWithSubTasks & { isBlocked?: boolean; blockingTasks?: string[] })[],
    filters: {
      priorityFilter: string[];
      tagFilter: string[];
      searchQuery: string;
    }
  ): (TaskWithSubTasks & { isBlocked?: boolean; blockingTasks?: string[] })[] {
    return tasks.filter(task => {
      // Priority filter
      if (filters.priorityFilter.length > 0 && !filters.priorityFilter.includes(task.priority)) {
        return false;
      }

      // Tag filter
      if (filters.tagFilter.length > 0 && !filters.tagFilter.some(tag => task.tags.includes(tag))) {
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

      return true;
    });
  }
}
