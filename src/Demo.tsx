import { useRecordWebcam } from './lib/useRecordWebcam';
import { useEffect, useState } from 'react';

export default function Demo() {
  const {
    activeRecordings,
    cancelRecording,
    clearAllRecordings,
    clearError,
    clearPreview,
    closeCamera,
    createRecording,
    devicesById,
    devicesByType,
    download,
    errorMessage,
    muteRecording,
    openCamera,
    pauseRecording,
    resumeRecording,
    startRecording,
    stopRecording,
  } = useRecordWebcam();
  const [videoDeviceId, setVideoDeviceId] = useState<string>('');
  const [audioDeviceId, setAudioDeviceId] = useState<string>('');
  const [recording, setRecording] = useState(null);

  const handleSelect: React.ChangeEventHandler<HTMLSelectElement> = async (
    event
  ) => {
    const deviceId = event.target.value;
    if (devicesById?.[deviceId].type === 'videoinput') {
      setVideoDeviceId(deviceId);
    }
    if (devicesById?.[deviceId].type === 'audioinput') {
      setAudioDeviceId(deviceId);
    }
  };

  const quickDemo = async () => {
    try {
      const recording = await createRecording();
      if (!recording) return;
      await openCamera(recording.id);
      await startRecording(recording.id);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await stopRecording(recording.id);
      await closeCamera(recording.id);
    } catch (error) {
      console.log({ error });
    }
  };

  const create = () => {
    const rec = createRecording(videoDeviceId, audioDeviceId);
    if (rec) setRecording(rec);
  };

  const start = async (recording) => {
    if (recording) await openCamera(recording.id);
  };

  useEffect(() => {
    if (recording != null) {
      console.log('created', recording);
      start(recording);
    }
  }, [recording]);

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold">React Record Webcam demo</h1>
      <div className="space-y-2 my-4">
        <div className="flex">
          <h4>Select video input</h4>
          <select value={videoDeviceId} onChange={handleSelect}>
            {(devicesByType?.video || []).map(({ deviceId, label }) => {
              return (
                <option key={deviceId} value={deviceId}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
        <div className="flex">
          <h4>Select audio input</h4>
          <select value={audioDeviceId} onChange={handleSelect}>
            {(devicesByType?.audio || []).map(({ deviceId, label }) => {
              return (
                <option key={deviceId} value={deviceId}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <div className="space-x-2">
        <button onClick={quickDemo}>Record 3s video</button>
        <button onClick={create}>Create Recording</button>
        <button onClick={start}>Open camera</button>
        <button onClick={() => clearAllRecordings()}>Clear all</button>
        <button onClick={() => clearError()}>Clear error</button>
      </div>
      <div className="my-2">
        <p>{errorMessage ? `Error: ${errorMessage}` : ''}</p>
      </div>
      <div className="grid grid-cols-custom gap-4 my-4">
        {activeRecordings?.map((recording) => (
          <div className="bg-white rounded-lg px-4 py-4" key={recording.id}>
            <div className="text-black grid grid-cols-1">
              <p>Live</p>
              <small>Status: {recording.status}</small>
              <small>Video: {recording.videoLabel}</small>
              <small>Audio: {recording.audioLabel}</small>
            </div>
            <video ref={recording.webcamRef} loop autoPlay playsInline />
            <div className="space-x-1 space-y-1 my-2">
              <button
                disabled={
                  recording.status === 'RECORDING' ||
                  recording.status === 'PAUSED'
                }
                onClick={() => startRecording(recording.id)}
              >
                Record
              </button>
              <button
                disabled={
                  recording.status !== 'RECORDING' &&
                  recording.status !== 'PAUSED'
                }
                onClick={() =>
                  recording.status === 'PAUSED'
                    ? resumeRecording(recording.id)
                    : pauseRecording(recording.id)
                }
              >
                {recording.status === 'PAUSED' ? 'Resume' : 'Pause'}
              </button>
              <button onClick={() => muteRecording(recording.id)}>
                {recording.isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={() => stopRecording(recording.id)}>Stop</button>
              <button onClick={() => cancelRecording(recording.id)}>
                Cancel
              </button>
            </div>

            <div
              className={`${
                recording.previewRef.current?.src.startsWith('blob:')
                  ? 'visible'
                  : 'hidden'
              }`}
            >
              <p>Preview</p>
              <video ref={recording.previewRef} autoPlay loop playsInline />
              <div className="space-x-2 my-2">
                <button onClick={() => download(recording.id)}>Download</button>
                <button onClick={() => clearPreview(recording.id)}>
                  Clear preview
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
