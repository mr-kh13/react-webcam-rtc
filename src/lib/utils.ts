import { createRef } from 'react';
import { Recording, STATUS } from './types';
import { defaultCodec } from './codec';

export type SetRecording = Pick<
  Recording,
  'videoId' | 'audioId' | 'videoLabel' | 'audioLabel'
>;

export function createRecording({
  videoId,
  audioId,
  videoLabel,
  audioLabel,
}: SetRecording): Recording {
  const recordingId = `${videoId}-${audioId}`;
  return {
    id: recordingId,
    audioId,
    audioLabel,
    blobChunks: [],
    fileName: String(new Date().getTime()),
    fileType: 'webm',
    isMuted: false,
    mimeType: defaultCodec,
    objectURL: null,
    previewRef: createRef(),
    recorder: null,
    status: STATUS.INITIAL,
    videoId,
    videoLabel,
    webcamRef: createRef(),
  };
}
