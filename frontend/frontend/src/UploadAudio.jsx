import React, { useState } from 'react';
import axios from 'axios';

function UploadAudio() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState('');

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post('/transcribe-chunk', formData);
    setTranscript(res.data.transcript); // Update transcript
  };

  return (
    <div>
      <input
        type="file"
        accept="audio/*,video/*"
        onChange={handleChange}
      />
      <button onClick={handleUpload}>Upload</button>
      <div>
        <h3>Transcript:</h3>
        <p>{transcript}</p>
      </div>
    </div>
  );
}

export default UploadAudio;