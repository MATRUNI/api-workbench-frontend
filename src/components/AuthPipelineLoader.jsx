import React, { useState, useEffect } from 'react';
import '../style/AuthPipelineLoader.css';

const PIPELINE_MESSAGES = {
  'sign up': [
    'INITIALIZING SECURE SOCKETS...',
    'PARSING REGISTRATION PAYLOAD...',
    'GENERATING CRYPTOGRAPHIC SALT...',
    'ESTABLISHING DATABASE RECORD...',
    'SYNCING USER PERMISSIONS...',
    'ACCOUNT CREATION SUCCESSFUL.'
  ],
  'sign in': [
    'ESTABLISHING HANDSHAKE...',
    'READING AUTHENTICATION HEADERS...',
    'DECRYPTING CREDENTIAL PACKETS...',
    'VALIDATING SESSION TOKEN...',
    'MATCHING ACCESS KEYS...',
    'AUTHORIZATION GRANTED.'
  ]
};

export default function AuthPipelineLoader({ mode = 'sign in' }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const normalizedMode = mode.toLowerCase() === 'sign in' ? 'sign in' : 'sign up';
  const currentMessages = PIPELINE_MESSAGES[normalizedMode];

  useEffect(() => {
    const textTimer = setInterval(() => {
      setMsgIdx((prev) => (prev < currentMessages.length - 1 ? prev + 1 : prev));
    }, 500);

    return () => clearInterval(textTimer);
  }, [currentMessages]);

  return (
    <div className="perimeter-loader-container">
      <div className="perimeter-frame">
        <div className="orbit-ball ball-top" />
        <div className="orbit-ball ball-right" />
        <div className="orbit-ball ball-bottom" />
        <div className="orbit-ball ball-left" />
      </div>
      
      <div className="perimeter-status-wrapper">
        <span className="perimeter-prompt">&gt;</span>
        <span className="perimeter-status-text">
          {currentMessages[msgIdx]}
        </span>
      </div>
    </div>
  );
}