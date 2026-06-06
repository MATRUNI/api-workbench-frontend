import React from 'react';
import '../style/StartBootLoader.css';

export default function StartBootLoader() {
  return (
    <div className="boot-container-fullscreen">
      <div className="aperture-frame">
        {/* Decorative corner framing ticks */}
        <div className="frame-tick top-left"></div>
        <div className="frame-tick top-right"></div>
        <div className="frame-tick bottom-left"></div>
        <div className="frame-tick bottom-right"></div>
        
        {/* Central Geometric Target Reticle */}
        <div className="aperture-reticle">
          <div className="reticle-ring outer-spin"></div>
          <div className="reticle-ring inner-reverse"></div>
          <div className="reticle-center-dot"></div>
        </div>

        {/* Minimal system status readouts */}
        <div className="aperture-meta-text">
          <span className="meta-bracket">[</span>
          <span className="meta-value">SYS_LOAD</span>
          <span className="meta-bracket">]</span>
        </div>
      </div>
    </div>
  );
}