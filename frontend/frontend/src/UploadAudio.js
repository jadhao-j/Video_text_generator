import React, { useState } from 'react'; import axios from './api';

function UploadAudio() { const [file, setFile] = useState(null); const [loading, setLoading] = useState(false);

const handleChange = (e) => setFile(e.target.files[0]);

const handleUpload = async () => { if (!file) return; const formData = new FormData(); formData.append('file', file);

setLoading(true);
try {
  const res = await axios.post('/transcribe', formData);
  localStorage.setItem('transcript', res.data.transcript);
  localStorage.setItem('actions', JSON.stringify(res.data.action_points));
  window.dispatchEvent(new Event('storage'));
} catch (err) {
  console.error('Upload failed:', err);
} finally {
  setLoading(false);
}

};

return (
  <div>
    <input type="file" accept="audio/*,video/*" onChange={handleChange} />
    <button onClick={handleUpload} disabled={loading}>
      {loading ? 'Uploading...' : 'Upload and Transcribe'}
    </button>
  </div>
);
}

export default UploadAudio;
