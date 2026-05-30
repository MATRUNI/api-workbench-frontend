import React, { useState, useEffect } from 'react';
import '../style/VoidLoader.css';

function VoidLoader({currentPhase}) {
  
  const phaseMap = {
    initializing: "INITIALIZING_DISPATCH",
    connecting:   "ESTABLISHING_VOID_LINK",
    processing:   "WAITING_FOR_RESPONSE",
    parsing:      "PARSING_STRUCTURE_DATA"
  };

  const activePhase=phaseMap[currentPhase]|| "CONNECTING_TO_HOST"

  return (
    <div className="void-loader-container">
      <div className="void-scanner-box">
        {/* The laser scanning line */}
        <div className="scanner-line"></div>
        
        {/* Corner brackets for the digital targeting reticle look */}
        <div className="corner-bracket top-left"></div>
        <div className="corner-bracket top-right"></div>
        <div className="corner-bracket bottom-left"></div>
        <div className="corner-bracket bottom-right"></div>
        
        {/* Center UI Metrics */}
        <div className="loader-core">
          <span className="loader-brand">API.OS</span>
          <div className="pulse-ring"></div>
        </div>
      </div>
      
      <div className="loader-status-text">
        <span className="terminal-prompt">&gt;</span> {activePhase}
        <span className="loading-dots">...</span>
      </div>
    </div>
  );
}

export default VoidLoader;