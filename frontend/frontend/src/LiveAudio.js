import React, { useRef, useState } from 'react';
import axios from './api';
import AudioRecorder from 'audio-recorder-polyfill';
window.MediaRecorder = window.MediaRecorder || AudioRecorder;

function LiveAudio() {
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        const formData = new FormData();
        formData.append('file', e.data, 'chunk.wav');
        try {
          await axios.post('/transcribe', formData);
          // Optionally handle/display partial transcript here
        } catch (err) {
          console.error('Chunk upload failed:', err);
        }
      }
    };

    mediaRecorderRef.current.start(5000); // 5 seconds per chunk
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <div>
      <button onClick={startRecording} disabled={recording}>Start Live Recording</button>
      <button onClick={stopRecording} disabled={!recording}>Stop</button>
    </div>
  );
}

export default LiveAudio;
