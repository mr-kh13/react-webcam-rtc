import { useMemo } from 'react';
import { type Devices } from './devices';
import { ERROR_MESSAGES, type Recording, STATUS } from './types';
import { type Options } from './useRecordWebcam';
import { defaultCodec } from './codec';
import { activeRecordingsAsArrayAtom, useRecorderState } from './store';
import { useAtomValue } from 'jotai';

const DEFAULT_RECORDER_OPTIONS: MediaRecorderOptions = {
  audioBitsPerSecond: 128000,
  videoBitsPerSecond: 2500000,
  mimeType: defaultCodec,
} as const;

export interface UseRecorder {
  activeRecordings: Recording[];
  clearAllRecordings: () => void;
  applyRecordingOptions: (recordingId: string) => Recording | void;
  cancelRecording: (recordingId: string) => void;
  clearPreview: (recordingId: string) => Recording | void;
  download: (recordingId: string) => void;
  pauseRecording: (recordingId: string) => Recording | void;
  resumeRecording: (recordingId: string) => Recording | void;
  startRecording: (recordingId: string) => Promise<Recording | void>;
  stopRecording: (recordingId: string) => Promise<Recording | void>;
  muteRecording: (recordingId: string) => Recording | void;
  createRecording: (videoId?: string, audioId?: string) => Recording | void;
}

export function useRecorder({
  mediaRecorderOptions,
  options,
  devices,
  onError,
}: {
  mediaRecorderOptions?: MediaRecorderOptions;
  options?: Partial<Options>;
  devices?: Devices;
  onError: (functionName: string, error: unknown) => void;
}): UseRecorder {
  const {
    updateRecording,
    deleteRecording,
    isRecordingCreated,
    setRecording,
    clearAllRecordings,
    getRecording,
  } = useRecorderState();
  const activeRecordings = useAtomValue(activeRecordingsAsArrayAtom);

  const recorderOptions: MediaRecorderOptions = useMemo(
    () => ({
      ...DEFAULT_RECORDER_OPTIONS,
      ...mediaRecorderOptions,
    }),
    [mediaRecorderOptions]
  );

  const handleError = ({
    error,
    functionName,
    recordingId,
  }: {
    recordingId: string;
    functionName: string;
    error: unknown;
  }) => {
    const recording = getRecording(recordingId);
    if (recording) {
      updateRecording(recordingId, {
        ...recording,
        status: STATUS.ERROR,
      });
    }
    onError(functionName, error);
  };

  const startRecording: UseRecorder['startRecording'] = async (recordingId) => {
    try {
      const recording = getRecording(recordingId);
      const stream = <MediaStream>recording.webcamRef.current?.srcObject;
      recording.mimeType = recorderOptions.mimeType || recording.mimeType;
      const isCodecSupported = MediaRecorder.isTypeSupported(
        recording.mimeType
      );

      if (!isCodecSupported) {
        console.warn('Codec not supported: ', recording.mimeType);
        onError('startRecording', ERROR_MESSAGES.CODEC_NOT_SUPPORTED);
      }

      recording.recorder = new MediaRecorder(stream, recorderOptions);

      return await new Promise<Recording>((resolve) => {
        if (recording.recorder) {
          recording.recorder.ondataavailable = (event: BlobEvent) => {
            if (event.data.size) {
              recording.blobChunks.push(event.data);
            }
          };

          recording.recorder.onstart = async () => {
            updateRecording(recordingId, {
              ...recording,
              status: STATUS.RECORDING,
            });
            resolve(recording);
          };

          recording.recorder.onerror = (error: Event) => {
            handleError({
              error,
              functionName: 'startRecording',
              recordingId,
            });
          };

          recording.recorder?.start(options?.timeSlice);
        }
      });
    } catch (error) {
      handleError({ error, functionName: 'startRecording', recordingId });
    }
  };

  const pauseRecording: UseRecorder['pauseRecording'] = (recordingId) => {
    try {
      const recording = getRecording(recordingId);
      recording.recorder?.pause();

      if (recording.recorder?.state === 'paused') {
        updateRecording(recordingId, {
          ...recording,
          status: STATUS.PAUSED,
        });
        return recording;
      }
    } catch (error) {
      handleError({ functionName: 'pauseRecording', error, recordingId });
    }
  };

  const resumeRecording: UseRecorder['resumeRecording'] = (recordingId) => {
    try {
      const recording = getRecording(recordingId);
      recording.recorder?.resume();

      if (recording.recorder?.state === 'recording') {
        updateRecording(recordingId, {
          ...recording,
          status: STATUS.RECORDING,
        });
        return recording;
      }
    } catch (error) {
      handleError({ functionName: 'resumeRecording', error, recordingId });
    }
  };

  const stopRecording: UseRecorder['stopRecording'] = async (recordingId) => {
    try {
      const recording = getRecording(recordingId);

      recording.recorder?.stop();

      return await new Promise<Recording>((resolve) => {
        if (recording.recorder) {
          recording.recorder.onstop = async () => {
            const blob = new Blob(recording.blobChunks, {
              type: recording.mimeType,
            });
            const url = URL.createObjectURL(blob);
            recording.blob = blob;
            recording.objectURL = url;

            if (recording.previewRef.current) {
              recording.previewRef.current.src = url;
            }
            updateRecording(recordingId, {
              ...recording,
              status: STATUS.STOPPED,
            });
            resolve(recording);
          };
        }
      });
    } catch (error) {
      handleError({ functionName: 'stopRecording', error, recordingId });
    }
  };

  const muteRecording: UseRecorder['muteRecording'] = (recordingId) => {
    try {
      const recording = getRecording(recordingId);
      recording.recorder?.stream
        .getAudioTracks()
        .forEach((track: MediaStreamTrack) => {
          track.enabled = !track.enabled;
        });
      updateRecording(recordingId, {
        ...recording,
        isMuted: !recording.isMuted,
      });
      return recording;
    } catch (error) {
      handleError({ functionName: 'muteRecording', error, recordingId });
    }
  };

  const cancelRecording: UseRecorder['cancelRecording'] = (recordingId) => {
    try {
      const recording = getRecording(recordingId);
      const tracks = recording?.recorder?.stream.getTracks();
      recording?.recorder?.stop();
      tracks?.forEach((track) => track.stop());
      if (recording.recorder?.ondataavailable) {
        recording.recorder.ondataavailable = null;
      }

      if (recording.webcamRef.current) {
        const stream = <MediaStream>recording.webcamRef.current.srcObject;
        stream?.getTracks().forEach((track) => track.stop());

        recording.webcamRef.current.srcObject = null;
        recording.webcamRef.current.load();
      }
      URL.revokeObjectURL(<string>recording.objectURL);
      deleteRecording(recordingId);
    } catch (error) {
      handleError({ functionName: 'cancelRecording', error, recordingId });
    }
  };

  const createRecording: UseRecorder['createRecording'] = (
    videoId,
    audioId
  ) => {
    try {
      const { devicesById, initialDevices } = devices || {};

      const videoLabel = videoId
        ? devicesById?.[videoId].label
        : initialDevices?.video?.label;

      const audioLabel = audioId
        ? devicesById?.[audioId].label
        : initialDevices?.audio?.label;

      const recordingId = `${videoId || initialDevices?.video?.deviceId}-${
        audioId || initialDevices?.audio?.deviceId
      }`;

      const isCreated = isRecordingCreated(recordingId);
      if (isCreated) throw new Error(ERROR_MESSAGES.SESSION_EXISTS);

      return setRecording({
        videoId: <string>videoId || <string>initialDevices?.video?.deviceId,
        audioId: <string>audioId || <string>initialDevices?.audio?.deviceId,
        videoLabel,
        audioLabel,
      });
    } catch (error) {
      onError('createRecording', error);
    }
  };

  const applyRecordingOptions: UseRecorder['applyRecordingOptions'] = (
    recordingId
  ) => {
    try {
      const recording = getRecording(recordingId);

      updateRecording(recordingId, {
        ...recording,
        fileName: options?.fileName ? options.fileName : recording.fileName,
        fileType: options?.fileType ? options.fileType : recording.fileType,
      });
      return recording;
    } catch (error) {
      handleError({
        functionName: 'applyRecordingOptions',
        error,
        recordingId,
      });
    }
  };

  const clearPreview: UseRecorder['clearPreview'] = (recordingId) => {
    try {
      const recording = getRecording(recordingId);
      if (recording.previewRef.current) recording.previewRef.current.src = '';
      URL.revokeObjectURL(<string>recording.objectURL);
      updateRecording(recordingId, {
        ...recording,
        status: STATUS.INITIAL,
        blobChunks: [],
      });
      return recording;
    } catch (error) {
      handleError({ functionName: 'clearPreview', error, recordingId });
    }
  };

  const download: UseRecorder['download'] = (recordingId) => {
    try {
      const recording = getRecording(recordingId);

      const downloadElement = document.createElement('a');

      if (recording?.objectURL) {
        downloadElement.href = recording.objectURL;
      }

      downloadElement.download = `${recording.fileName}.${recording.fileType}`;
      downloadElement.click();
    } catch (error) {
      handleError({ functionName: 'download', error, recordingId });
    }
  };

  return {
    activeRecordings,
    applyRecordingOptions,
    clearAllRecordings: () => {
      clearAllRecordings();
    },
    clearPreview,
    download,
    cancelRecording,
    createRecording,
    muteRecording,
    pauseRecording,
    resumeRecording,
    startRecording,
    stopRecording,
  };
}
