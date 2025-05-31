import React, { useRef, useState, useEffect } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5001');

function VideoCall() {
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const myVideo = useRef();
  const partnerVideo = useRef();

  useEffect(() => {
    socket.emit('join');
    socket.on('your-id', id => setMyId(id));
    socket.on('signal', async ({ from, data }) => {
      if (peer) {
        peer.signal(data);
      } else {
        await answerCall(data, from);
      }
    });
    // eslint-disable-next-line
  }, []);

  const startCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    myVideo.current.srcObject = stream;

    const audioStream = new MediaStream(stream.getAudioTracks());
    const mediaRecorder = new MediaRecorder(audioStream);

    mediaRecorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        const formData = new FormData();
        formData.append('file', e.data, 'chunk.wav');
        await axios.post('/transcribe-chunk', formData);
        // Update transcript in state as needed
      }
    };
    mediaRecorder.start(5000); // every 5 seconds

    const p = new Peer({ initiator: true, trickle: false, stream });
    setPeer(p);

    p.on('signal', data => {
      if (partnerId) {
        socket.emit('signal', { to: partnerId, data });
      }
    });

    p.on('stream', partnerStream => {
      partnerVideo.current.srcObject = partnerStream;
    });
  };

  const answerCall = async (signalData, fromId) => {
    setPartnerId(fromId);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    myVideo.current.srcObject = stream;

    const audioStream = new MediaStream(stream.getAudioTracks());
    const mediaRecorder = new MediaRecorder(audioStream);

    mediaRecorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        const formData = new FormData();
        formData.append('file', e.data, 'chunk.wav');
        await axios.post('/transcribe-chunk', formData);
        // Update transcript in state as needed
      }
    };
    mediaRecorder.start(5000); // every 5 seconds

    const p = new Peer({ initiator: false, trickle: false, stream });
    setPeer(p);

    p.on('signal', data => {
      socket.emit('signal', { to: fromId, data });
    });

    p.on('stream', partnerStream => {
      partnerVideo.current.srcObject = partnerStream;
    });

    p.signal(signalData);
  };

  return (
    <div>
      <div>
        <input
          placeholder="Partner ID"
          value={partnerId}
          onChange={e => setPartnerId(e.target.value)}
        />
        <button onClick={startCall}>Start Call</button>
      </div>
      <div>
        <video ref={myVideo} autoPlay playsInline muted style={{ width: 200 }} />
        <video ref={partnerVideo} autoPlay playsInline style={{ width: 200 }} />
      </div>
      <div>
        <p>Your ID: {myId}</p>
        <p>Share your ID with your partner!</p>
      </div>
    </div>
  );
}

export default VideoCall;