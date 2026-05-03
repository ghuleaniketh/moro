'use client';
import React, { useRef, useState } from 'react';
import { Canvas } from "@react-three/fiber";
import { Experience } from "@/componets/Experience";


export default function VoicePage() {
  const mediaRecorder = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioChunksRef = useRef([]);
  const [responseAudioUrl, setResponseAudioUrl] = useState(null);
  const [mouthLevel, setMouthLevel] = useState(0);

  // Start recording
  const startRecording = async () => {
    console.log("i am rec ing bro!!!!!!!!!!!!!!!!!")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }

      mediaRecorder.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Send to server
        await sendAudioToServer(blob);
      };

      mediaRecorder.current.start(1000);
      setIsRecording(true);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    console.log("rec stop bro!!!!!!!!!!!!!!!!!")
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
  };

  // send audio file to /chat endpoint
 const sendAudioToServer = async (audioBlob) => {
  setIsProcessing(true);
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    
    console.log("i am sending the req to the AWS server try2");
    const response = await fetch("https://morobackend.duckdns.org/chat", {
      method: 'POST',
      body: formData
    });
    console.log(" audio send to server... Wiating for response");
    const data = await response.json();
    console.log('Hey I got the respoonse:', data);

    if (data.audioBase64 && data.audioBase64.audios) {
      const audios = data.audioBase64.audios;
      playAudioChunks(Array.isArray(audios) ? audios : [audios]);
    }

  } catch (err) {
    console.error("Error sending audio:", err);
  } finally {
    setIsProcessing(false);
  }
};

  function playAudioChunks(base64Array) {
    let current = 0;

    function playNext() {
      if (current >= base64Array.length) return;

      const base64 = base64Array[current];
      const binary = atob(base64);
      const len = binary.length;
      const buffer = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        buffer[i] = binary.charCodeAt(i);
      }

      const audioBlob = new Blob([buffer], { type: 'audio/wav' });
      const audioURL = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioURL);

      // expose URL for optional UI/audio element
      setResponseAudioUrl(audioURL);

      // setup analyser to drive mouthLevel
      let audioCtx = null;
      let analyser = null;
      let rafId = null;
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(audio);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        const dataArray = new Uint8Array(analyser.fftSize);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        const update = () => {
          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const normalized = Math.min(1, rms * 3);
          setMouthLevel(normalized);
          rafId = requestAnimationFrame(update);
        };
        audio.onended = () => {
          if (rafId) cancelAnimationFrame(rafId);
          setMouthLevel(0);
          try { audioCtx.close(); } catch (e) {}
        };
        // kick off update when audio plays
        audio.addEventListener('play', () => {
          update();
        });
      } catch (err) {
        // failed to create analyser — still play audio
        console.warn('Audio analyser unavailable', err);
      }

      audio.onended = () => {
        current += 1;
        playNext();
      };
      audio.play();
    }

    playNext();
  }
  return (
    <>
    <Canvas shadows camera={{ position: [0,0,8], fov: 30 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
      
  <color attach="background" args={["#ececec"]} />
  <Experience mouthLevel={mouthLevel} />
    </Canvas>
    <div style={{ position: 'fixed', bottom: '20px', left: '20px', padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '10px', maxWidth: '400px', zIndex: 10 }}>
      <h2>Voice Assistant</h2>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={startRecording}
          disabled={isRecording || isProcessing}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isRecording ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRecording || isProcessing ? 'not-allowed' : 'pointer'
          }}
        >
          {isRecording ? 'Recording...' : 'Start Recording'}
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: !isRecording ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !isRecording ? 'not-allowed' : 'pointer',
            marginLeft: '10px'
          }}
        >
          Stop Recording
        </button>
      </div>

      {/* Status indicator */}
      <div style={{ marginTop: '20px' }}>
        {isRecording && (
          <p style={{ color: '#4CAF50', fontWeight: 'bold' }}>
            🎤 Recording... Speak now!
          </p>
        )}
        {isProcessing && (
          <p style={{ color: '#2196F3', fontWeight: 'bold' }}>
            🤖 Processing your voice... Please wait
          </p>
        )}
       
      </div>
    </div>
    </>
    
  );
}
