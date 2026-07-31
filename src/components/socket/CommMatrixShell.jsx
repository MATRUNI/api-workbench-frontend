import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, PhoneCall } from 'lucide-react';
import ChatComponent from './ChatComponent';
import VoiceCallRoom from './VoiceCallRoom';
import '../../style/CommMatrixShell.css';

export default function CommMatrixShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVoiceActive,setIsVoiceActive] = useState(false);

  const audioUnlocked = useRef(false);
  const unlockAudio = async () => {
    if (audioUnlocked.current) return;

    try {
      const audio = new Audio('/silence.wav');

      audio.volume = 0;

      await audio.play();
      audio.pause();
      audio.currentTime = 0;

      audioUnlocked.current = true;

      console.log("Audio unlocked");
    } catch (err) {
      console.warn("Audio unlock failed:", err);
    }
  };
  return (
    <div className="comm-shell-wrapper" onPointerDown={unlockAudio}>
      <nav className="comm-tab-bar">
        <button 
          className={`comm-tab-btn ${!isVoiceActive ? 'active' : ''}`}
          onClick={() => setIsVoiceActive(false)}
        >
          <MessageSquare size={14} />
          <span>TEXT_STREAM</span>
        </button>
        <button 
          className={`comm-tab-btn ${isVoiceActive ? 'active' : ''}`}
          onClick={() => setIsVoiceActive(true)}
        >
          <PhoneCall size={14} />
          <span>VOICE_ROOM</span>
        </button>
      </nav>

      <div className="comm-shell-viewport">
        {isVoiceActive?<VoiceCallRoom/>:<ChatComponent/>}
      </div>
    </div>
  );
}