import { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExternalLink, Terminal, Globe, Languages, Monitor, House } from 'lucide-react';
import '../style/Footer.css';
import { SocketContext } from '../context/SocketContext';
import { fadeFooter, fadeFromLeft, fadeFromRight } from '../animations/Motion';
import { motion } from 'framer-motion';

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

  const { isConnected, latency } = useContext(SocketContext);

  // State to hold dynamic environment details
  const [envInfo, setEnvInfo] = useState({
    browser: 'CHROME',
    os: 'LINUX',
    timezone: 'ASIA/KOLKATA',
    language: 'EN-IN'
  });

  useEffect(() => {
    try {
      const ua = navigator.userAgent;
      let browser = 'UNKNOWN';
      if (/SamsungBrowser/i.test(ua)) {
        browser = 'SAMSUNG';
      }
      else if (/Edg/i.test(ua)) {
        browser = 'EDGE';
      }
      else if (/OPR|Opera/i.test(ua)) {
        browser = 'OPERA';
      }
      else if (/Firefox/i.test(ua)) {
        browser = 'FIREFOX';
      }
      else if (/Chrome|CriOS/i.test(ua)) {
        browser = 'CHROME';
      }
      else if (/Safari/i.test(ua)) {
        browser = 'SAFARI';
      }

      let os = 'UNKNOWN OS';

      const platform = navigator.platform || navigator.userAgentData?.platform || '';

      if (/android/i.test(ua)) {
        os = 'ANDROID';
      }
      else if (/iphone|ipad|ipod/i.test(ua)) {
        os = 'IOS';
      }
      else if (/win/i.test(platform) || /win/i.test(ua)) {
        os = 'WINDOWS';
      }
      else if (/mac/i.test(platform) || /mac/i.test(ua)) {
        os = 'MACOS';
      }
      else if (/linux/i.test(platform) || /linux/i.test(ua)) {
        os = 'LINUX';
      }

      let timezone = 'UTC';
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone?.toUpperCase() || 'UTC';
      } catch {

      }

      const language = (navigator.language || 'en-US').toUpperCase();

      setEnvInfo({ browser, os, timezone, language });
    } catch {
    }
  }, []);

  if (location.pathname === '/chat') {
    return null;
  }

  return (
    <motion.footer
     className="prism-footer-shell" 
     aria-label="Application Geometric Prism Footer"
     initial="hidden"
     whileInView="visible"
     viewport={{once:true,amount:0.2}}
     {...fadeFooter}
     >
      <div className="prism-top-scanline-container" aria-hidden="true">
        <div className="prism-top-scanline-beam"></div>
      </div>

      <motion.div className="prism-left-section" {...fadeFromLeft}>
        <button 
          type="button" 
          className="prism-logo-btn" 
          onClick={() => navigate('/')} 
          title="Return to Hub"
        >
          <House size={15}/>
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
              <span> OFFLINE</span>
            )}
        </div>
      </motion.div>

      <motion.div className="prism-middle-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="prism-env-pill">
          <Terminal size={14}/>
          <span>{envInfo.browser}</span>
          <span className="prism-env-separator">·</span>
          <Monitor size={14}/>
          <span>{envInfo.os}</span>
          <span className="prism-env-separator">·</span>
          <Globe size={14}/>
          <span>{envInfo.timezone}</span>
          <span className="prism-env-language-separator">·</span>
          <Languages size={14} className='prism-env-language'/>
          <span className='prism-env-language-separator'>{envInfo.language}</span>
        </div>
      </motion.div>

      <motion.div className="prism-right-section" {...fadeFromRight}>
        <div className="prism-telemetry">
          <span>VERSION: <b className="prism-cipher-text">{import.meta.env.VITE_VERSION}</b></span>
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
      </motion.div>
    </motion.footer>
  );
}