import { useMemo } from 'react';
import { Recording, STATUS } from './types';
import { startStream } from './stream';
import { useRecorderState } from './store';

const DEFAULT_CONSTRAINTS: MediaTrackConstraints = {
  aspectRatio: 1.7,
  echoCancellation: true,
  height: 720,
  width: 1280,
};

export interface UseCamera {
  applyConstraints: (
    recordingId: string,
    constraints: MediaTrackConstraints
  ) => Promise<Recording | void>;
  closeCamera: (recordingId: string) => Recording | void;
  openCamera: (recordingId: string) => Promise<Recording | void>;
}

interface Options {
  mediaTrackConstraints?: Partial<MediaTrackConstraints>;
  onError: (functionName: string, error: unknown) => void;
}

export function useCamera({
  mediaTrackConstraints,
  onError,
}: Options): UseCamera {
  const { updateRecording, getRecording } = useRecorderState();

  const constraints: MediaTrackConstraints = useMemo(
    () => ({
      ...DEFAULT_CONSTRAINTS,
      ...mediaTrackConstraints,
    }),
    [mediaTrackConstraints]
  );

  const handleError = ({
    error,
    functionName,
    recordingId,
  }: {
    functionName: string;
    error: unknown;
    recordingId: string;
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

  const applyConstraints: UseCamera['applyConstraints'] = async (
    recordingId,
    constraints
  ) => {
    try {
      const recording = getRecording(recordingId);
      if (recording.webcamRef.current?.srcObject) {
        const stream = <MediaStream>recording.webcamRef.current?.srcObject;
        const tracks = stream.getTracks() || [];
        for (const track of tracks) {
          await track.applyConstraints({
            ...constraints,
          });
        }
      }
      return recording;
    } catch (error) {
      handleError({ functionName: 'applyConstraints', error, recordingId });
    }
  };

  const openCamera: UseCamera['openCamera'] = async (recordingId) => {
    try {
      const recording = getRecording(recordingId);

      const stream = await startStream(
        recording.videoId,
        recording.audioId,
        constraints
      );

      if (recording.webcamRef.current) {
        recording.webcamRef.current.srcObject = stream;
        await recording.webcamRef.current.play();
      }

      updateRecording(recordingId, {
        ...recording,
        status: STATUS.OPEN,
      });

      return recording;
    } catch (error) {
      onError('openCamera', error);
    }
  };

  const closeCamera: UseCamera['closeCamera'] = (recordingId) => {
    try {
      const recording = getRecording(recordingId);

      if (recording.webcamRef.current) {
        const stream = <MediaStream>recording.webcamRef.current.srcObject;
        stream?.getTracks().forEach((track) => track.stop());
        if (recording.recorder?.ondataavailable) {
          recording.recorder.ondataavailable = null;
        }
        recording.webcamRef.current.srcObject = null;
        recording.webcamRef.current.load();
      }
      updateRecording(recordingId, {
        ...recording,
        status: STATUS.CLOSED,
      });
      return recording;
    } catch (error) {
      handleError({ functionName: 'closeCamera', error, recordingId });
    }
  };

  return { openCamera, closeCamera, applyConstraints };
}
