import { atom, useAtom } from 'jotai';
import { ERROR_MESSAGES, Recording } from './types';
import type { Devices } from './devices';
import { createRecording, SetRecording } from './utils';

export const devicesAtom = atom<Devices>({
  devicesById: null,
  devicesByType: null,
  initialDevices: null,
});

export const errorAtom = atom<string | null>();

export const activeRecordingsAtom = atom<Record<string, Recording>>({});

export const activeRecordingsAsArrayAtom = atom((get) => {
  const activeRecordings = get(activeRecordingsAtom);
  return Object.values(activeRecordings ?? {}) ?? [];
});

export const useRecorderState = () => {
  const [activeRecordings, setActiveRecordings] = useAtom(activeRecordingsAtom);

  const clearAllRecordings = () => {
    Object.values(activeRecordings).forEach((recording) => {
      const stream = <MediaStream>recording.webcamRef.current?.srcObject;

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    });
    setActiveRecordings({});
  };

  const setRecording = (params: SetRecording) => {
    const recording = createRecording(params);
    setActiveRecordings({
      ...activeRecordings,
      [recording.id]: recording,
    });
    return recording;
  };

  const updateRecording = (
    recordingId: string,
    updatedValues: Partial<Recording>
  ) => {
    const recording = activeRecordings[recordingId];
    const updatedRecording = {
      ...recording,
      ...updatedValues,
    };
    setActiveRecordings({
      ...activeRecordings,
      [recording.id]: updatedRecording,
    });
    return updatedRecording;
  };

  const deleteRecording = (recordingId: string) => {
    const newActiveRecordings = { ...activeRecordings };
    delete newActiveRecordings[recordingId];
    setActiveRecordings(newActiveRecordings);
  };

  const getRecording = (recordingId: string) => {
    const recording = activeRecordings[recordingId];
    if (!recording) {
      throw new Error(ERROR_MESSAGES.NO_RECORDING_WITH_ID);
    }
    return recording;
  };

  const isRecordingCreated = (recordingId: string) => {
    const isCreated = activeRecordings[recordingId];
    return Boolean(isCreated);
  };

  return {
    clearAllRecordings,
    setRecording,
    updateRecording,
    deleteRecording,
    getRecording,
    isRecordingCreated,
  };
};
