import { getDatabase } from '../database';
import { Recording, RecordingStatus, RecordingFilter } from '../types';

/**
 * RecordingsRepository - Data access layer for Recording entities
 * Uses SQLite for persistence
 */
export class RecordingsRepository {
    /**
     * Create a new recording in the database
     */
    async create(recording: Recording): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(
            `INSERT INTO recordings (
        id, local_path, duration_sec, started_at, ended_at,
        status, upload_attempts, last_error, remote_id,
        idempotency_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                recording.id,
                recording.localPath,
                recording.durationSec,
                recording.startedAt,
                recording.endedAt,
                recording.status,
                recording.uploadAttempts,
                recording.lastError,
                recording.remoteId,
                recording.idempotencyKey,
                recording.createdAt,
                recording.updatedAt,
            ]
        );
    }

    /**
     * Get a recording by ID
     */
    async getById(id: string): Promise<Recording | null> {
        const db = await getDatabase();
        const row = await db.getFirstAsync<RecordingRow>(
            'SELECT * FROM recordings WHERE id = ?',
            [id]
        );
        return row ? this.mapRowToRecording(row) : null;
    }

    /**
     * Get all recordings, optionally filtered
     */
    async getAll(filter: RecordingFilter = 'all', search?: string): Promise<Recording[]> {
        const db = await getDatabase();
        let query = 'SELECT * FROM recordings';
        const params: (string | number)[] = [];
        const conditions: string[] = [];

        // Apply status filter
        if (filter !== 'all') {
            if (filter === 'pending') {
                conditions.push("status IN ('queued', 'uploading')");
            } else {
                conditions.push('status = ?');
                params.push(filter);
            }
        }

        // Apply search (by date for now, can extend to other fields)
        if (search) {
            conditions.push('(started_at LIKE ? OR id LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        const rows = await db.getAllAsync<RecordingRow>(query, params);
        return rows.map(this.mapRowToRecording);
    }

    /**
     * Get recordings pending upload (queued or error with retries left)
     */
    async getPendingUpload(maxAttempts: number): Promise<Recording[]> {
        const db = await getDatabase();
        const rows = await db.getAllAsync<RecordingRow>(
            `SELECT * FROM recordings 
       WHERE status IN ('queued', 'error') 
       AND upload_attempts < ?
       ORDER BY created_at ASC`,
            [maxAttempts]
        );
        return rows.map(this.mapRowToRecording);
    }

    /**
     * Update recording status
     */
    async updateStatus(
        id: string,
        status: RecordingStatus,
        error?: string | null
    ): Promise<void> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        await db.runAsync(
            `UPDATE recordings 
       SET status = ?, last_error = ?, updated_at = ?
       WHERE id = ?`,
            [status, error ?? null, now, id]
        );
    }

    /**
     * Increment upload attempts
     */
    async incrementAttempts(id: string): Promise<void> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        await db.runAsync(
            `UPDATE recordings 
       SET upload_attempts = upload_attempts + 1, updated_at = ?
       WHERE id = ?`,
            [now, id]
        );
    }

    /**
     * Set remote ID after successful upload
     */
    async setRemoteId(id: string, remoteId: string): Promise<void> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        await db.runAsync(
            `UPDATE recordings 
       SET remote_id = ?, status = 'uploaded', updated_at = ?
       WHERE id = ?`,
            [remoteId, now, id]
        );
    }

    /**
     * Delete a recording
     */
    async delete(id: string): Promise<void> {
        const db = await getDatabase();
        await db.runAsync('DELETE FROM recordings WHERE id = ?', [id]);
    }

    /**
     * Map database row to Recording entity
     */
    private mapRowToRecording(row: RecordingRow): Recording {
        return {
            id: row.id,
            localPath: row.local_path,
            durationSec: row.duration_sec,
            startedAt: row.started_at,
            endedAt: row.ended_at,
            status: row.status as RecordingStatus,
            uploadAttempts: row.upload_attempts,
            lastError: row.last_error,
            remoteId: row.remote_id,
            idempotencyKey: row.idempotency_key,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}

// Internal type for database row
interface RecordingRow {
    id: string;
    local_path: string;
    duration_sec: number;
    started_at: string;
    ended_at: string;
    status: string;
    upload_attempts: number;
    last_error: string | null;
    remote_id: string | null;
    idempotency_key: string;
    created_at: string;
    updated_at: string;
}

// Singleton instance
export const recordingsRepository = new RecordingsRepository();
