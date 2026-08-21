import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Trash2, History, CheckCircle2, AlertTriangle, Zap, RefreshCw } from "lucide-react";
import { RequestContext } from '../context/RequestContext';
import { prismMotion, fadeFromLeft, fadeFromRight } from "../animations/Motion.js";
import '../style/console.css';

function Console() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  
  const { setURL, setMethod, setRequest, setResponse } = useContext(RequestContext);
  const navigate = useNavigate();

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('api_os_history')) || [];
    setLogs(history);
  }, []);

  const clearHistory = () => {
    if (window.confirm("Purge all terminal workspace memory caches?")) {
      localStorage.removeItem('api_os_history');
      setLogs([]);
    }
  };

  const handleRestoreCache = (log) => {
    setURL(log.url);
    if (setMethod) setMethod(log.method);
    
    setRequest({
      body: log.request.body,
      contentType: log.request.contentType,
      headers: log.request.headers,
      query: log.request.query
    });
    
    setResponse({
      status: log.response.status,
      data: Object.keys(log.response.data || {}).length === 0 ? "{}" : log.response.data,
      headers:log.response.headers,
      message: log.response.status >= 200 && log.response.status < 300 ? "Cached Success Snapshot" : "Cached Error Snapshot",
      length: log.response.length,
      time: log.response.time,
      type: log.response.type
    });

    navigate('/endpoints'); 
  };

  const getStatusClass = (status) => {
    const statusNum = parseInt(status, 10);
    if(statusNum >= 200 && statusNum < 300) return "success";
    if(statusNum >= 400 && statusNum < 500) return "warning";
    if(statusNum >= 500) return "error";
    return 'warning';
  };

  const filteredLogs = logs.filter(log => {
    const statusNum = parseInt(log.response.status, 10);
    if (filter === 'ALL') return true;
    if (filter === 'SUCCESS') return statusNum >= 200 && statusNum < 300;
    if (filter === 'FAILED') return statusNum >= 400;
    return true;
  });

  return (
    <motion.div className="fetch-container console-container" initial="hidden" animate="visible" {...prismMotion}>
      <div className="prism-backdrop">
        <div className="line-y"></div>
        <div className="line-x"></div>
      </div>

      <header className="fetch-header">
        <div className='top-section'>
          <motion.div className="status-pill" {...fadeFromLeft}>
            <History size={14} />
            SYSTEM_TELEMETRY
          </motion.div>
        </div>
        <motion.h1 {...fadeFromRight}>Cache Console</motion.h1>
        <motion.p {...fadeFromLeft}>Rehydrate historical request variables back into your current session workbench.</motion.p>
      </header>

      <motion.div className="console-toolbar" {...fadeFromLeft}>
        <div className="format-toggle">
          <button className={`format-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>
            <Terminal size={14} /> All
          </button>
          <button className={`format-btn ${filter === 'SUCCESS' ? 'active active-success' : ''}`} onClick={() => setFilter('SUCCESS')}>
            <CheckCircle2 size={14} /> Success
          </button>
          <button className={`format-btn ${filter === 'FAILED' ? 'active active-error' : ''}`} onClick={() => setFilter('FAILED')}>
            <AlertTriangle size={14} /> Failures
          </button>
        </div>

        <motion.button 
          className="copy-btn purge-btn" 
          disabled={logs.length === 0} 
          onClick={clearHistory}
          whileHover={logs.length > 0 ? { scale: 1.02 } : {}}
          whileTap={logs.length > 0 ? { scale: 0.98 } : {}}
        >
          <Trash2 size={16} />
        </motion.button>
      </motion.div>

      <div className="editor-window console-window">
        {filteredLogs.length === 0 ? (
          <div className="empty-state terminal-empty">
            <motion.span 
              className="terminal-prompt"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              &gt;
            </motion.span> 
            COLD STORAGE INACTIVE. PROCESS RUNS TO BEGIN INGESTION...
          </div>
        ) : (
          <div className="console-log-list">
            <AnimatePresence>
              {filteredLogs.map((log, index) => (
                <motion.div 
                  key={log.id || index} 
                  className="console-log-row" 
                  onClick={() => handleRestoreCache(log)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="log-meta">
                    <span className={`method-${log.method} log-time`}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={`method-dropdown method-${log.method} log-method-badge`}>
                      {log.method}
                    </span>
                  </div>
                  
                  <div className="log-url-zone">
                    <span className="log-url" title={log.url}>{log.url}</span>
                    <span className="payload-indicator-dot"><Zap size={12} /> {log.type}</span>
                  </div>
                  
                  <div className="log-metrics">
                    <span className="log-size">{log.size ? `${(log.size / 1024).toFixed(2)} KB` : '0 B'}</span>
                    <span className={`status-${getStatusClass(log.response.status)} log-status`}>
                      {log.response.status}
                    </span>
                    <RefreshCw size={14} className="restore-icon" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default Console;