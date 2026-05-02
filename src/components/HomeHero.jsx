import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeHero.css';

function HomeHero() {
  const navigate = useNavigate();

  return (
    <div className="home-hero-prism">
      <div className="prism-backdrop">
        <div className="line-y"></div>
        <div className="line-x"></div>
      </div>

      <div className="prism-content">
        <div className="top-section">
          <div className="status-pill">SYSTEM_READY</div>
          <div className="version-info">BUILD_2026.05</div>
        </div>

        <div className="main-interaction">
          <div className="hero-text-area">
            <h1 className="huge-title">API<span className="dot">.</span>OS</h1>
            <p className="tagline">DISPATCH DATA THROUGH THE VOID.</p>
          </div>

          <div className="split-nav">
            <div className="nav-item start" onClick={() => navigate('/endpoints')}>
              <div className="item-bg"></div>
              <div className="item-label">01 / WORKBENCH</div>
              <h2 className="item-title">INITIALIZE_HUB</h2>
              <div className="item-desc">Open the primary testing environment.</div>
            </div>

            <div className="nav-item fetch" onClick={() => navigate('/fetch')}>
              <div className="item-bg"></div>
              <div className="item-label">02 / LIBRARY</div>
              <h2 className="item-title">FETCH_SCHEMAS</h2>
              <div className="item-desc">Browse pre-configured API blueprints.</div>
            </div>
          </div>
        </div>

        <div className="bottom-bar">
          <div className="metric-group">
            <div className="metric"><span>LATENCY</span> 12ms</div>
            <div className="metric"><span>STATE</span> ISOLATED</div>
            <div className="metric"><span>PROTOCOL</span> HTTP/S</div>
          </div>
          <div className="copyright">© 2026 API_OS_TECH</div>
        </div>
      </div>
    </div>
  );
}

export default HomeHero;