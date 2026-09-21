import { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExternalLink, Globe, Languages, House } from 'lucide-react';
import { 
  TbBrandChrome, 
  TbBrandFirefox, 
  TbBrandSafari, 
  TbBrandEdge, 
  TbBrandOpera, 
  TbBrandVivaldi,
  TbBrowser,
  TbBrandWindows, 
  TbBrandApple, 
  TbBrandAndroid, 
  TbBrandUbuntu, 
  TbPrompt,
  TbDeviceDesktop,
  TbBrandGithub
} from 'react-icons/tb';
import '../style/Footer.css';
import { SocketContext } from '../context/SocketContext';
import { fadeFooter, fadeFromLeft, fadeFromRight } from '../animations/Motion';
import { motion } from 'framer-motion';

const getBrowserIcon = (browser) => {
  switch (browser) {
    case 'CHROME':
      return <TbBrandChrome size={14} title="Google Chrome" />;
    case 'FIREFOX':
      return <TbBrandFirefox size={14} title="Mozilla Firefox" />;
    case 'SAFARI':
      return <TbBrandSafari size={14} title="Apple Safari" />;
    case 'EDGE':
      return <TbBrandEdge size={14} title="Microsoft Edge" />;
    case 'OPERA':
      return <TbBrandOpera size={14} title="Opera" />;
    case 'VIVALDI':
      return <TbBrandVivaldi size={14} title="Vivaldi" />;
    default:
      return <TbBrowser size={14} title="Web Browser" />;
  }
};

const getOsIcon = (os) => {
  switch (os) {
    case 'WINDOWS':
      return <TbBrandWindows size={14} title="Microsoft Windows" />;
    case 'MACOS':
    case 'IOS':
      return <TbBrandApple size={14} title="Apple macOS / iOS" />;
    case 'ANDROID':
      return <TbBrandAndroid size={14} title="Android" />;
    case 'UBUNTU':
      return <TbBrandUbuntu size={14} title="Ubuntu Linux" />;
    case 'LINUX':
      return <TbPrompt size={14} title="Linux Terminal" />;
    default:
      return <TbDeviceDesktop size={14} title="Workstation OS" />;
  }
};

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

      // Check for Brave
      if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
        navigator.brave.isBrave().then(isBrave => {
          if (isBrave) {
            setEnvInfo(prev => ({ ...prev, browser: 'BRAVE' }));
          }
        }).catch(() => {});
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
      else if (/ubuntu/i.test(ua)) {
        os = 'UBUNTU';
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
          <span className="prism-env-item">
            {getBrowserIcon(envInfo.browser)}
            <span>{envInfo.browser}</span>
          </span>
          <span className="prism-env-separator">·</span>
          <span className="prism-env-item">
            {getOsIcon(envInfo.os)}
            <span>{envInfo.os}</span>
          </span>
          <span className="prism-env-separator">·</span>
          <span className="prism-env-item">
            <Globe size={13} />
            <span>{envInfo.timezone}</span>
          </span>
          <span className="prism-env-language-separator">·</span>
          <span className="prism-env-item">
            <Languages size={13} className='prism-env-language' />
            <span className='prism-env-language-separator'>{envInfo.language}</span>
          </span>
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
            <TbBrandGithub size={16} />
            <span>Engineered by <strong>@MATRUNI</strong></span>
            <ExternalLink size={13} className="prism-external-icon" />
          </span>
        </a>
      </motion.div>
    </motion.footer>
  );
}