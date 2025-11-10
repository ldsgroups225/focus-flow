import { offlineDB } from './offline-db';
import { databases, DATABASE_ID, TASKS_TABLE_ID } from '../appwrite/config';
import { AppwriteException, Query } from 'appwrite';
import { Task } from '../types';

const COLLECTION_ID = TASKS_TABLE_ID;

class SyncService {
  private isSyncing = false;

  constructor() {
    window.addEventListener('online', this.sync);
  }

  public async sync() {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      await this.syncDeleted();
      await this.syncOfflineChanges();
      await this.fetchLatest();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncDeleted() {
    const deletedTasks = await offlineDB.query('SELECT * FROM tasks WHERE isDeleted = TRUE');

    for (const task of deletedTasks.rows as Task[]) {
      try {
        await databases.deleteRow({databaseId: DATABASE_ID, tableId: COLLECTION_ID, rowId: task.$id});
        await offlineDB.query('DELETE FROM tasks WHERE $id = $1', [task.$id]);
      } catch (error) {
        if (error instanceof AppwriteException && error.code === 404) {
          // Document already deleted on the server, remove from local DB
          await offlineDB.query('DELETE FROM tasks WHERE $id = $1', [task.$id]);
        } else {
          throw error;
        }
      }
    }
  }

  private async syncOfflineChanges() {
    const lastSync = (await offlineDB.query('SELECT MAX($updatedAt) as lastSync FROM tasks')).rows[0] as { lastsync: string };
    const offlineTasks = await offlineDB.query('SELECT * FROM tasks WHERE $updatedAt > $1', [lastSync.lastsync]);

    for (const task of offlineTasks.rows as Task[]) {
        const { $id, ...data } = task;
        try {
            await databases.updateRow({databaseId: DATABASE_ID, tableId: COLLECTION_ID, rowId: $id, data});
        } catch (error) {
            if (error instanceof AppwriteException && error.code === 404) {
                // Document doesn't exist on the server, create it
                await databases.createRow({databaseId: DATABASE_ID, tableId: COLLECTION_ID, rowId: $id, data});
            } else {
                throw error;
            }
        }
    }
  }

  private async fetchLatest() {
    const result = await offlineDB.query('SELECT MAX($updatedAt) as lastSync FROM tasks');
    const lastSync = result.rows.length > 0 ? (result.rows[0] as { lastsync: string }).lastsync : new Date(0).toISOString();
    const response = await databases.listRows({databaseId: DATABASE_ID, tableId: COLLECTION_ID, queries: [Query.greaterThan('$updatedAt', lastSync)]});

    for (const document of response.rows) {
      const { $id, ...data } = document as unknown as Task;
      await offlineDB.query(
        `
        INSERT INTO tasks ($id, title, description, status, priority, dueDate, $createdAt, $updatedAt, isDeleted, subTasks)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT ($id) DO UPDATE SET
          title = $2,
          description = $3,
          status = $4,
          priority = $5,
          dueDate = $6,
          $createdAt = $7,
          $updatedAt = $8,
          isDeleted = $9,
          subTasks = $10
        `,
        [$id, data.title, data.description, data.status, data.priority, data.dueDate, data.$createdAt, data.$updatedAt, data.isDeleted, data.subTasks]
      );
    }
  }
}

export const syncService = new SyncService();
