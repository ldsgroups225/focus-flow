import { databases, DATABASE_ID, TASKS_TABLE_ID } from './config';
import type { Task } from '@/lib/types';
import { ID, Models, Query } from 'appwrite';

type RawTask = Omit<Task, 'dueDate' | 'completedDate'> & {
  dueDate?: string;
  completedDate?: string;
};

const mapTaskFromAppwrite = (row: Models.Row): Task => {
  const rowData = row as unknown as RawTask & { $id: string };
  const { dueDate, completedDate, $id: rowId, ...rest } = rowData;

  return {
    ...rest,
    id: rowId,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    completedDate: completedDate ? new Date(completedDate) : undefined,
  };
};

const mapTaskToAppwrite = (task: Partial<Task>): Partial<RawTask> => {
  const { dueDate, completedDate, ...rest } = task;
  return {
    ...rest,
    dueDate: dueDate?.toISOString(),
    completedDate: completedDate?.toISOString(),
  };
};

export const getTasks = (
  userId: string,
  callback: (tasks: Task[]) => void
) => {
  const fetchTasks = async () => {
    try {
      const { rows } = await databases.listRows({
        databaseId: DATABASE_ID,
        tableId: TASKS_TABLE_ID,
        queries: [
          Query.equal("userId", userId),
        ],
      });

      const tasks = rows.map(row =>
        mapTaskFromAppwrite(row)
      );
      callback(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      callback([]);
    }
  };

  // Initial one-time fetch
  fetchTasks();
};

export const addTask = async (userId: string, taskData: Omit<Task, 'id' | 'completed' | 'completedPomodoros' | 'timeSpent' | 'completedDate'>) => {
  try {
    const newTask = {
      ...mapTaskToAppwrite(taskData),
      userId,
      completed: false,
      completedPomodoros: 0,
      timeSpent: 0,
      completedDate: null,
    };

    const response = await databases.createRow({
      databaseId: DATABASE_ID,
      tableId: TASKS_TABLE_ID,
      rowId: ID.unique(),
      data: newTask,
    });

    return response;
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};

export const updateTask = async (userId: string, taskId: string, taskData: Partial<Task>) => {
  try {
    const updatedData = mapTaskToAppwrite(taskData);
    delete updatedData.id;

    const response = await databases.updateRow({
      databaseId: DATABASE_ID,
      tableId: TASKS_TABLE_ID,
      rowId: taskId,
      data: updatedData,
    });

    return response;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (userId: string, taskId: string) => {
  try {
    await databases.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TASKS_TABLE_ID,
      rowId: taskId,
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};
