import { ERROR_MESSAGES } from './types';

interface ByIdDevice {
  label: string;
  type: 'videoinput' | 'audioinput';
}

export type ById = Record<string, ByIdDevice>;

function byId(devices: MediaDeviceInfo[]): ById {
  return devices.reduce<ById>(
    (result, { deviceId, kind, label }: MediaDeviceInfo) => {
      if (kind === 'videoinput' || kind === 'audioinput') {
        result[deviceId] = {
          label,
          type: kind,
        };
      }
      return result;
    },
    {}
  );
}

interface ByLabelDevice {
  label: string;
  deviceId: string;
}

export interface ByType {
  video: ByLabelDevice[];
  audio: ByLabelDevice[];
}

function byType(devices: MediaDeviceInfo[]): ByType {
  return devices.reduce<ByType>(
    (result, { deviceId, kind, label }: MediaDeviceInfo) => {
      if (kind === 'videoinput') {
        result.video.push({ label, deviceId });
      }
      if (kind === 'audioinput') {
        result.audio.push({ label, deviceId });
      }
      return result;
    },
    {
      video: [],
      audio: [],
    }
  );
}

async function getUserPermission(): Promise<MediaDeviceInfo[]> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    stream.getTracks().forEach((track) => {
      track.stop();
    });
    return mediaDevices;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error(ERROR_MESSAGES.NO_USER_PERMISSION);
  }
}

interface InitialDevice {
  deviceId: string;
  label: string;
}

export interface InitialDevices {
  video: InitialDevice | null;
  audio: InitialDevice | null;
}

export interface Devices {
  devicesByType?: ByType | null;
  devicesById?: ById | null;
  initialDevices?: InitialDevices | null;
}

export async function getDevices(): Promise<Devices> {
  let devicesByType: ByType = {
    video: [],
    audio: [],
  };
  let devicesById: ById = {};
  let initialDevices: InitialDevices = {
    video: null,
    audio: null,
  };

  if (typeof window !== 'undefined') {
    const mediaDevices = await getUserPermission();
    devicesById = byId(mediaDevices);
    devicesByType = byType(mediaDevices);
    initialDevices = {
      video: {
        deviceId: devicesByType.video[0].deviceId,
        label: devicesByType.video[0].label,
      },
      audio: {
        deviceId: devicesByType.audio[0].deviceId,
        label: devicesByType.audio[0].label,
      },
    };
  }

  return { devicesByType, devicesById, initialDevices };
}
