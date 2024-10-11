import { useEffect } from 'react';
import { getDevices, type ById, type ByType } from './devices';
import { useRecorder, type UseRecorder } from './useRecorder';
import { useCamera, type UseCamera } from './useCamera';
import { useAtom } from 'jotai';
import { devicesAtom, errorAtom } from './store';

export interface Options {
  fileName: string;
  fileType: string;
  timeSlice: number;
}

export interface UseRecordWebcamArgs {
  mediaTrackConstraints?: Partial<MediaTrackConstraints>;
  mediaRecorderOptions?: Partial<MediaRecorderOptions>;
  options?: Partial<Options>;
}

export interface UseRecordWebcam extends UseCamera, UseRecorder {
  clearError: () => void;
  devicesById: ById | undefined | null;
  devicesByType: ByType | undefined | null;
  errorMessage: string | null;
}

const isDevMode = false;

export function useRecordWebcam({
  mediaRecorderOptions,
  mediaTrackConstraints,
  options,
}: Partial<UseRecordWebcamArgs> = {}): UseRecordWebcam {
  const [devices, setDevices] = useAtom(devicesAtom);
  const [errorMessage, setErrorMessage] = useAtom(errorAtom);

  const handleError = (functionName: string, error: unknown | Error): void => {
    if (isDevMode) {
      console.error(`@${functionName}: `, error);
    }
    let message = '';
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    }
    setErrorMessage(message);
  };

  const clearError = (): void => {
    setErrorMessage(null);
  };

  const { applyConstraints, closeCamera, openCamera } = useCamera({
    mediaTrackConstraints,
    onError: handleError,
  });

  const {
    activeRecordings,
    applyRecordingOptions,
    cancelRecording,
    clearAllRecordings,
    clearPreview,
    createRecording,
    download,
    muteRecording,
    pauseRecording,
    resumeRecording,
    startRecording,
    stopRecording,
  } = useRecorder({
    mediaRecorderOptions,
    options,
    devices,
    onError: handleError,
  });

  async function init() {
    try {
      const devices = await getDevices();
      setDevices(devices);
    } catch (error) {
      handleError('init', error);
    }
  }

  useEffect(() => {
    init();
    return () => {
      clearAllRecordings();
    };
  }, []);

  return {
    activeRecordings,
    applyConstraints,
    applyRecordingOptions,
    cancelRecording,
    clearAllRecordings,
    clearError,
    clearPreview,
    closeCamera,
    createRecording,
    devicesById: devices?.devicesById,
    devicesByType: devices?.devicesByType,
    download,
    errorMessage,
    muteRecording,
    openCamera,
    pauseRecording,
    resumeRecording,
    startRecording,
    stopRecording,
  };
}
