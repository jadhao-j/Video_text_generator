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
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

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

    return () => {
      socket.off('your-id');
      socket.off('signal');
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
    // eslint-disable-next-line
  }, [peer]);

  const startCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (myVideo.current) {
      myVideo.current.srcObject = stream;
      myVideo.current.play();
    }

    const audioStream = new MediaStream(stream.getAudioTracks());
    const mediaRecorder = new MediaRecorder(audioStream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        const formData = new FormData();
        formData.append('file', e.data, 'chunk.wav');
        await axios.post('/transcribe-chunk', formData);
      }
    };
    mediaRecorder.start(5000);

    const p = new Peer({ initiator: true, trickle: false, stream });
    setPeer(p);

    p.on('signal', data => {
      if (partnerId) {
        socket.emit('signal', { to: partnerId, data });
      }
    });

    p.on('stream', partnerStream => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = partnerStream;
        partnerVideo.current.play();
      }
    });
  };

  const answerCall = async (signalData, fromId) => {
    setPartnerId(fromId);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (myVideo.current) {
      myVideo.current.srcObject = stream;
      myVideo.current.play();
    }

    const audioStream = new MediaStream(stream.getAudioTracks());
    const mediaRecorder = new MediaRecorder(audioStream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        const formData = new FormData();
        formData.append('file', e.data, 'chunk.wav');
        await axios.post('/transcribe-chunk', formData);
      }
    };
    mediaRecorder.start(5000);

    const p = new Peer({ initiator: false, trickle: false, stream });
    setPeer(p);

    p.on('signal', data => {
      socket.emit('signal', { to: fromId, data });
    });

    p.on('stream', partnerStream => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = partnerStream;
        partnerVideo.current.play();
      }
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