import type { PGlite } from '@electric-sql/pglite';

class OfflineDB {
  private db: PGlite | null = null;
  private readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = this.init();
  }

  private async init() {
    if (typeof window !== 'undefined') {
      const { PGlite } = await import('@electric-sql/pglite');
      this.db = new PGlite();
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          $id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT,
          priority TEXT,
          dueDate TEXT,
          $createdAt TEXT,
          $updatedAt TEXT,
          isDeleted BOOLEAN DEFAULT FALSE,
          subTasks JSON
        );
      `);
    }
  }

  public async query(query: string, params: unknown[] = []) {
    await this.readyPromise;
    if (!this.db) {
      return { rows: [] };
    }
    return this.db.query(query, params);
  }
}

export const offlineDB = new OfflineDB();
