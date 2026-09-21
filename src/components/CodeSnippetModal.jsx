import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code2, Copy, Check } from 'lucide-react';
import { 
  SiJavascript, 
  SiTypescript, 
  SiPython, 
  SiGo, 
  SiDotnet, 
  SiPhp, 
  SiRust, 
  SiRuby, 
  SiKotlin, 
  SiSwift, 
  SiDart, 
  SiCplusplus, 
  SiCurl,
  SiAxios
} from 'react-icons/si';
import { FaJava } from 'react-icons/fa6';
import { VscGlobe, VscCode, VscTerminal } from 'react-icons/vsc';
import { CustomDropdown } from './utility_Components/CustomDropdown';
import { LANGUAGES, generateCodeSnippet } from '../utils/codeGenerators';
import '../style/CodeSnippetModal.css';

const getClientIcon = (id) => {
  if (id === 'axios') return <SiAxios size={14} style={{ color: '#5a29e4' }} />;
  if (id === 'curl' || id === 'libcurl') return <SiCurl size={14} style={{ color: '#38bdf8' }} />;
  if (id === 'httpx') return <VscTerminal size={14} style={{ color: '#10b981' }} />;
  if (['fetch', 'requests', 'http', 'httpclient', 'net-http', 'reqwest', 'resty', 'guzzle', 'faraday', 'dio', 'urlsession', 'alamofire', 'okhttp', 'ktor'].includes(id)) {
    return <VscGlobe size={14} style={{ color: '#61affe' }} />;
  }
  return <VscCode size={14} style={{ color: '#94a3b8' }} />;
};

const LANGUAGE_ICONS = {
  curl: <SiCurl style={{ color: '#38bdf8' }} size={14} />,
  javascript: <SiJavascript style={{ color: '#f7df1e' }} size={14} />,
  typescript: <SiTypescript style={{ color: '#3178c6' }} size={14} />,
  python: <SiPython style={{ color: '#3776ab' }} size={14} />,
  go: <SiGo style={{ color: '#00add8' }} size={14} />,
  java: <FaJava style={{ color: '#e76f00' }} size={14} />,
  csharp: <SiDotnet style={{ color: '#512bd4' }} size={14} />,
  php: <SiPhp style={{ color: '#777bb4' }} size={14} />,
  rust: <SiRust style={{ color: '#dea584' }} size={14} />,
  ruby: <SiRuby style={{ color: '#cc342d' }} size={14} />,
  kotlin: <SiKotlin style={{ color: '#7f52ff' }} size={14} />,
  swift: <SiSwift style={{ color: '#f05138' }} size={14} />,
  dart: <SiDart style={{ color: '#0175c2' }} size={14} />,
  cpp: <SiCplusplus style={{ color: '#00599c' }} size={14} />
};

export default function CodeSnippetModal({ isOpen, onClose, requestData }) {
  const [activeLanguage, setActiveLanguage] = useState('curl');
  const [activeClient, setActiveClient] = useState('curl');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll")
    } else {
      document.body.classList.remove("no-scroll")
    }
    
    const handleKeyDown = (e)=>{
      if(e.key === "Escape") onClose()
    }

    if(isOpen)
    {
      window.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.body.classList.remove("no-scroll");
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen,onClose])

  const currentLanguage = useMemo(
    () => LANGUAGES.find(lang => lang.id === activeLanguage) || LANGUAGES[0],
    [activeLanguage]
  );

  const currentClients = useMemo(
    () => currentLanguage?.clients || [],
    [currentLanguage]
  );

  const handleLanguageChange = (valOrEvent) => {
    const langId = valOrEvent?.target ? valOrEvent.target.value : valOrEvent;
    const foundLang = LANGUAGES.find(lang => lang.id === langId);
    setActiveLanguage(langId);
    setActiveClient(foundLang?.clients?.[0]?.id || '');
    setCopied(false);
  };

  const handleClientChange = (valOrEvent) => {
    const clientId = valOrEvent?.target ? valOrEvent.target.value : valOrEvent;
    setActiveClient(clientId);
    setCopied(false);
  };

  const codeSnippet = useMemo(
    () => generateCodeSnippet(activeLanguage, activeClient, requestData),
    [activeLanguage, activeClient, requestData]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-backdrop" onClick={onClose}>
        <motion.div 
          className="snippet-modal-surface" 
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="snippet-header">
            <div className="snippet-title">
              <Code2 size={20} className="text-blue-400" />
              <span>Generate Code Snippet</span>
            </div>
            <button 
              className="snippet-close-btn" 
              onClick={onClose} 
              title="Close (ESC)"
            >
              <X size={16} />
              <span>ESC</span>
            </button>
          </div>
          
          <div className="snippet-body">
            <div className="snippet-toolbar">
              <CustomDropdown 
                value={activeLanguage}
                onChange={handleLanguageChange}
                options={LANGUAGES.map(lang => ({ 
                  value: lang.id, 
                  label: lang.name,
                  icon: LANGUAGE_ICONS[lang.id]
                }))}
              />

              {currentClients.length > 0 && (
                <CustomDropdown 
                  value={activeClient}
                  onChange={handleClientChange}
                  options={currentClients.map(client => ({ 
                    value: client.id, 
                    label: client.name,
                    icon: getClientIcon(client.id)
                  }))}
                />
              )}

              <button 
                className={`copy-btn ${copied ? 'copied' : ''}`} 
                onClick={handleCopy}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            <div className="code-container">
              {LANGUAGE_ICONS[activeLanguage] ? (
                <div className="code-watermark-vector">
                  {LANGUAGE_ICONS[activeLanguage]}
                </div>
              ) : currentLanguage?.logo && (
                currentLanguage.monochrome ? (
                  <div 
                    className="code-watermark monochrome-watermark" 
                    style={{ 
                      WebkitMaskImage: `url(${currentLanguage.logo})`,
                      maskImage: `url(${currentLanguage.logo})`
                    }} 
                  />
                ) : (
                  <img 
                    src={currentLanguage.logo} 
                    alt="Language Logo" 
                    className="code-watermark color-watermark" 
                  />
                )
              )}
              <pre className="code-block">
                <code>{codeSnippet}</code>
              </pre>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}