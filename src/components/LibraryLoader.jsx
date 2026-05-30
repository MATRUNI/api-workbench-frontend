import React, { useState, useEffect } from 'react';
import '../style/LibraryLoader.css';

function LibraryLoader() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const intervals = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 650),
      setTimeout(() => setStep(3), 950),
    ];
    return () => intervals.forEach(clearTimeout);
  }, []);

  return (
    <div className="matrix-loader-container">
      <div className="matrix-grid-visual">
        <div className="grid-line horizontal"></div>
        <div className="grid-line vertical"></div>
        
        <div className="data-pipeline">
          <div className={`pipeline-node ${step >= 0 ? 'active' : ''}`}>
            <span className="node-status"></span>
            <code className="node-code">GET /schema_cluster</code>
          </div>
          <div className={`pipeline-node ${step >= 1 ? 'active' : ''}`}>
            <span className="node-status"></span>
            <code className="node-code">INFRASTRUCTURE // OK</code>
          </div>
          <div className={`pipeline-node ${step >= 2 ? 'active' : ''}`}>
            <span className="node-status"></span>
            <code className="node-code">PARSING_ENDPOINTS</code>
          </div>
        </div>

        <div className="binary-falling-pool">
          <span>01010</span>
          <span>11001</span>
          <span>00110</span>
          <span>11101</span>
        </div>
      </div>

      <div className="matrix-status-bar">
        <div className="system-ready-light"></div>
        <p className="status-terminal-text">
          SYSTEM.INGEST: <span className="highlight-text">POPULATING API_LIBRARY...</span>
        </p>
      </div>
    </div>
  );
}

export default LibraryLoader;