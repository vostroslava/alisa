// Recording types
export interface Recording {
  id: string;
  localPath: string;
  durationSec: number;
  startedAt: string;
  endedAt: string;
  status: RecordingStatus;
  uploadAttempts: number;
  lastError: string | null;
  remoteId: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export type RecordingStatus =
  | 'queued'
  | 'uploading'
  | 'uploaded'
  | 'error'
  | 'too_short';

export interface RecordingResult {
  localPath: string;
  durationSec: number;
  startedAt: string;
  endedAt: string;
}

// Filter types for archive
export type RecordingFilter = 'all' | 'uploaded' | 'pending' | 'error';

// Config
export const THRESHOLD_SECONDS = 5;
export const MAX_UPLOAD_ATTEMPTS = 5;
export const INITIAL_RETRY_DELAY_MS = 1000;
