 import React, { useEffect, useState } from 'react';

function TranscriptView() { const [transcript, setTranscript] = useState(''); const [actions, setActions] = useState([]);

useEffect(() => { const loadData = () => { setTranscript(localStorage.getItem('transcript') || ''); setActions(JSON.parse(localStorage.getItem('actions') || '[]')); }; loadData(); window.addEventListener('storage', loadData); return () => window.removeEventListener('storage', loadData); }, []);

return ( <div> <h2>Transcript</h2> <p>{transcript}</p> <h2>Action Points</h2> <ul> {actions.map((point, i) => <li key={i}>{point}</li>)} </ul> </div> ); }

export default TranscriptView;
