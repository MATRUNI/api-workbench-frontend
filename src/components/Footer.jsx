import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import '../style/Footer.css';
import { SocketContext } from '../context/SocketContext';

const GithubIcon = ({ size = 16, style = {}, ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    style={{ flexShrink: 0, ...style }}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

export default function SystemFooter() {
  const location = useLocation();
  const navigate = useNavigate();

  const { isConnected, latency } = useContext(SocketContext)

  if (location.pathname === '/chat') {
    return null;
  }

  return (
    <footer className="prism-footer-shell" aria-label="Application Geometric Prism Footer">
      {/* Animated Light Beam / Glow Line scanning across the top */}
      <div className="prism-top-scanline-container" aria-hidden="true">
        <div className="prism-top-scanline-beam"></div>
      </div>

      <div className="prism-left-section">
        <button 
          type="button" 
          className="prism-logo-btn" 
          onClick={() => navigate('/')} 
          title="Return to Hub"
        >
          API.OS
        </button>

        <div className="prism-divider" aria-hidden="true" />

        <div className={isConnected?`prism-status-pill`:'status-error'} role="status" aria-label="System latency">
          <span className={`prism-status-dot-${isConnected?"online":"offline"}`} aria-hidden="true" />
            {isConnected ? (
              <span>
                ONLINE{" "}
                <span className="prism-latency">
                  [{latency === null ? "SYNCING" : `${latency}ms`}]
                </span>
              </span>
            ) : (
              <span>OFFLINE</span>
            )}
        </div>
      </div>

      <div className="prism-right-section">
        <div className="prism-telemetry">
          <span>VERSION: <b className="prism-cipher-text">1.3</b></span>
          <div className="prism-divider" aria-hidden="true" />
          <span>© {new Date().getFullYear()}</span>
        </div>

        <a 
          href="https://github.com/MATRUNI" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="prism-matruni-btn"
          title="Inspect @MATRUNI GitHub Profile"
        >
          <span className="prism-btn-bg" aria-hidden="true" />
          <span className="prism-content-span">
            <GithubIcon size={16} />
            <span>Engineered by <strong>@MATRUNI</strong></span>
            <ExternalLink size={13} className="prism-external-icon" />
          </span>
        </a>
      </div>
    </footer>
  );
}