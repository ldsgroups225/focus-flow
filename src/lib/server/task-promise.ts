import { getCurrentUser } from '@/lib/appwrite/auth-services';
import { getTasks } from '@/lib/appwrite/task-services';
import type { AppwriteUser } from '@/lib/appwrite/auth-services';
import type { Task } from '@/lib/types';

/**
 * Server-side promise creators for React 19 use() hook
 * These run on the server and can be passed to client components
 */

/**
 * Create a promise to fetch tasks for a user
 * This runs on the server side (in a Server Component)
 */
export async function createTasksPromise(userId: string): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    try {
      getTasks(userId, (tasks: Task[]) => {
        resolve(tasks);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Create a promise to get the current user
 * This runs on the server side
 */
export async function createUserPromise(): Promise<AppwriteUser | null> {
  try {
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    throw error;
  }
}

/**
 * Type definition for the task-related promises
 */
export interface TaskPromises {
  tasks: Promise<Task[]>;
  user: Promise<AppwriteUser | null>;
}

/**
 * Create all task-related promises at once
 * This should be called in a Server Component
 */
export function createTaskPromises(userId: string): TaskPromises {
  return {
    tasks: createTasksPromise(userId),
    user: createUserPromise(),
  };
}
