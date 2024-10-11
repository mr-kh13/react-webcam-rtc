import type { RefObject } from 'react';

export enum ERROR_MESSAGES {
  CODEC_NOT_SUPPORTED = 'CODEC_NOT_SUPPORTED',
  SESSION_EXISTS = 'SESSION_EXISTS',
  NO_RECORDING_WITH_ID = 'NO_RECORDING_WITH_ID',
  NO_USER_PERMISSION = 'NO_USER_PERMISSION',
}

export enum STATUS {
  INITIAL = 'INITIAL',
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  RECORDING = 'RECORDING',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR',
  PAUSED = 'PAUSED',
}

export type Status = keyof typeof STATUS;

export interface Recording {
  id: string;
  audioId: string;
  audioLabel?: string;
  blob?: Blob;
  blobChunks: Blob[];
  fileName: string;
  fileType: string;
  isMuted: boolean;
  mimeType: string;
  objectURL: string | null;
  recorder: MediaRecorder | null;
  status: Status;
  videoId: string;
  videoLabel?: string;
  webcamRef: RefObject<HTMLVideoElement>;
  previewRef: RefObject<HTMLVideoElement>;
}

export interface RecordingError {
  recordingId?: string;
  message: string;
}
