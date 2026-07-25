import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, PhoneCall } from 'lucide-react';
import ChatComponent from './ChatComponent';
import VoiceCallRoom from './VoiceCallRoom';
import '../../style/CommMatrixShell.css';

export default function CommMatrixShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isVoiceActive,setIsVoiceActive] = useState(false);

  return (
    <div className="comm-shell-wrapper">
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