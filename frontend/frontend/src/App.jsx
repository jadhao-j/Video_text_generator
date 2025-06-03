import React, { useRef, useState } from 'react';
import VideoCall from './VideoCall';
import axios from 'axios';

function App() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioURL, setAudioURL] = useState('');
  const chunksRef = useRef([]);

  const handleRecord = async () => {
    if (!recording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new window.MediaRecorder(stream);
      setMediaRecorder(recorder);
      chunksRef.current = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioURL(URL.createObjectURL(blob));
        const formData = new FormData();
        formData.append('file', blob, 'audio.wav');
        const res = await axios.post('/transcribe', formData);
        setTranscript(res.data.transcript || 'No transcript');
      };
      recorder.start();
      setRecording(true);
    } else {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1>Video Call Demo</h1>
      <VideoCall />
      <hr />
      <h2>Record & Transcribe (Single User)</h2>
      <button onClick={handleRecord}>
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {audioURL && <audio src={audioURL} controls />}
      {transcript && (
        <div>
          <h3>Transcript:</h3>
          <pre>{transcript}</pre>
          <button onClick={handleDownload}>Download Transcript</button>
        </div>
      )}
    </div>
  );
}

export default App;

