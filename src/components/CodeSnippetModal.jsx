import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code2, Copy, Check } from 'lucide-react';
import { CustomDropdown } from './utility_Components/CustomDropdown';
import { LANGUAGES, generateCodeSnippet } from '../utils/codeGenerators';
import '../style/CodeSnippetModal.css';

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
                options={LANGUAGES.map(lang => ({ value: lang.id, label: lang.name }))}
              />

              {currentClients.length > 0 && (
                <CustomDropdown 
                  value={activeClient}
                  onChange={handleClientChange}
                  options={currentClients.map(client => ({ value: client.id, label: client.name }))}
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
              {currentLanguage?.logo && (
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