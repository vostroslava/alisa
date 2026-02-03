import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'voicerecorder.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (db) return db;

    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await initializeSchema(db);
    return db;
}

async function initializeSchema(database: SQLite.SQLiteDatabase): Promise<void> {
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY NOT NULL,
      local_path TEXT NOT NULL,
      duration_sec REAL NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      upload_attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      remote_id TEXT,
      idempotency_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
    CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON recordings(created_at);
  `);
}

export async function closeDatabase(): Promise<void> {
    if (db) {
        await db.closeAsync();
        db = null;
    }
}
