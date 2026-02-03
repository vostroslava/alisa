export type RecordingStatus = 'saved' | 'posted' | 'won';

export interface MockRecording {
    id: string;
    name: string; // "Recording #24342"
    date: string; // "16 October 15:17"
    duration: string; // "01:06:51"
    startTime: string; // "10:15"
    endTime: string; // "11:22"
    status: RecordingStatus;
    localUri?: string; // local file path for playback
}

export interface MockRecordingInput {
    localUri: string;
    durationSec: number;
    startedAt: Date;
    endedAt: Date;
}
