import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Trash2, History, CheckCircle2, AlertTriangle, Zap, RefreshCw, ExternalLink, Copy, Code, Database, Clock } from "lucide-react";
import { RequestContext } from '../context/RequestContext';
import { prismMotion, fadeFromLeft, fadeFromRight } from "../animations/Motion.js";
import '../style/console.css';
import { formatContent } from '../services/contentTypeHandler.js';
import { ContextMenuContext } from '../context/ContextMenuProvider.jsx';
import { TabContext } from '../context/TabContext.jsx';
import { getHistory, clearHistory as clearHistoryDB, deleteHistoryItem, getHistoryTableSize } from '../services/history.js';

function Console() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [storageSize, setStorageSize] = useState({ bytes: 0, formatted: '0.00 B', count: 0 });
  
  const { setURL, setMethod, setRequest, setResponse } = useContext(RequestContext);
  const { openContextMenu } = useContext(ContextMenuContext);
  const { handleAddTab } = useContext(TabContext)
  const navigate = useNavigate();

  const [floatingPill, setFloatingPill] = useState(null);

  const showFloatingPill = (message) => {
    setFloatingPill(message);
    setTimeout(() => {
      setFloatingPill(null);
    }, 2000);
  };
  useEffect(() => {
    let isMounted = true;
    
    const refreshHistory = () => {
      getHistory().then(history => {
        if (isMounted) setLogs(history || []);
      }).catch(err => {
        console.error('Console getHistory error:', err);
      });
      getHistoryTableSize().then(size => {
        if (isMounted) setStorageSize(size);
      }).catch(err => {
        console.error('Console getHistoryTableSize error:', err);
      });
    };

    refreshHistory();

    const handleUpdate = () => refreshHistory();
    window.addEventListener('api_os_history_updated', handleUpdate);
    window.addEventListener('api_os_history_cleared', handleUpdate);

    return () => { 
      isMounted = false; 
      window.removeEventListener('api_os_history_updated', handleUpdate);
      window.removeEventListener('api_os_history_cleared', handleUpdate);
    };
  }, []);

  const clearHistory = async () => {
    if (window.confirm("Purge all terminal workspace memory caches?")) {
      await clearHistoryDB();
      setLogs([]);
      setStorageSize({ bytes: 0, formatted: '0.00 B', count: 0 });
    }
  };

  const handleRestoreCache = async (log) => {
    setURL(log.url);
    if (setMethod) setMethod(log.method);
    
    setRequest({
      body: log.request?.body,
      contentType: log.request?.contentType || 'application/json',
      headers: log.request?.headers || [],
      query: log.request?.query || []
    });
    
    const data = await formatContent(log.response?.rawData, log.type);
    const status = log.response?.status || '200';
    const statusNum = parseInt(status, 10);
    const timing = log.response?.timing || log.timing || null;
    
    setResponse({
      status,
      data,
      rawData: log.response?.rawData,
      headers: log.response?.headers || [],
      message: statusNum >= 200 && statusNum < 300 ? "Cached Success Snapshot" : "Cached Error Snapshot",
      length: log.response?.length || '0 B',
      time: log.response?.time || '0 ms',
      timing,
      type: log.type || 'JSON',
      category: log.category || 'TEXT'
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
    const status = log?.response?.status;
    const statusNum = parseInt(status, 10);
    if (filter === 'ALL') return true;
    if (filter === 'SUCCESS') return statusNum >= 200 && statusNum < 300;
    if (filter === 'FAILED') return isNaN(statusNum) || statusNum >= 400;
    return true;
  });

  const handleOpenInNewTab = async (log) => {
    const data = await formatContent(log.response?.rawData, log.type);
    const status = log.response?.status || '200';
    const statusNum = parseInt(status, 10);
    const timing = log.response?.timing || log.timing || null;

    handleAddTab({
      url: log.url,
      method: log.method,
      alias: log.category ? `${log.category} Request` : "",
      request: {
        body: log.request?.body,
        contentType: log.request?.contentType || 'application/json',
        headers: log.request?.headers || [],
        query: log.request?.query || []
      },
      response: {
        status,
        data: data,
        rawData: log.response?.rawData,
        headers: log.response?.headers || [],
        message: statusNum >= 200 && statusNum < 300 ? "Cached Success Snapshot" : "Cached Error Snapshot",
        time: log.response?.time || 100,
        timing,
        category: log.category || ""
      }
    });

    navigate('/endpoints');
  };

  const handleDeleteLog = async (targetLog) => {
    const updatedLogs = logs.filter(log => log !== targetLog);
    setLogs(updatedLogs);
    if (targetLog?.id) {
      await deleteHistoryItem(targetLog.id);
    }
    const newSize = await getHistoryTableSize();
    setStorageSize(newSize);
  };

  const handleCopyCurl = (log) => {
    let curl = `curl -X ${log.method} "${log.url}"`;

    // Add headers if they exist
    if (log.request?.headers && Array.isArray(log.request.headers)) {
      log.request.headers.forEach(h => {
        if (h.key) curl += ` -H "${h.key}: ${h.value}"`;
      });
    }

    // Add body if it's a method that uses one and body exists
    if (["POST", "PUT", "PATCH"].includes(log.method) && log.request?.body) {
      const bodyStr = typeof log.request.body === 'object' 
        ? JSON.stringify(log.request.body) 
        : log.request.body;
      curl += ` -d '${bodyStr}'`;
    }

    navigator.clipboard.writeText(curl);
    showFloatingPill("Copied cURL!")
  };
  function handleTabContext(e, log) {
    e.preventDefault();
    e.stopPropagation();

    openContextMenu(e, [
      {
        label: "Open in a new tab.",
        icon: ExternalLink,
        onClick: () => handleOpenInNewTab(log)
      },
      {
        label: "Export Request",
        icon: Code,
        submenu: [
          {
            label: "Copy as cURL",
            icon: Terminal,
            onClick: () => handleCopyCurl(log)
          },
          {
            label: "Copy URL only",
            icon: Copy,
            onClick: () => {
              navigator.clipboard.writeText(log.url)
              showFloatingPill("Copied URL!")
            }
          },
          {
            label: "Copy response body",
            icon: Copy,
            onClick: async ()=>{
              const data = await formatContent(log.response.rawData, log.type);
              navigator.clipboard.writeText(data)
              showFloatingPill("Copied Res body!")
            }
          }
        ]
      },
      {type: "separator"},
      {
        label: "Delete",
        icon: Trash2,
        onClick: ()=>handleDeleteLog(log)
      }
    ]);
  }

  return (
    <>  
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
            <motion.div 
              className="status-pill storage-pill" 
              {...fadeFromRight} 
              title="Exact IndexedDB footprint (api_os_history_db -> history table)"
            >
              <Database size={13} className="storage-icon" />
              <span>INDEXED_DB: <strong className="storage-size">{storageSize.formatted}</strong></span>
              <span className="storage-count">({storageSize.count} records)</span>
            </motion.div>
          </div>
          <h1 {...fadeFromRight}>Cache Console</h1>
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
                    onContextMenu={(e)=>handleTabContext(e, log)}
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
                      <div className="log-badges">
                        <span className="payload-indicator-dot category-badge">
                          {log.category || 'BLOB'}
                        </span>
                        <span className="payload-indicator-dot">
                          <Zap size={12} /> {log.type}
                        </span>
                      </div>
                    </div>
    
                    <div className="log-metrics">
                      <span 
                        className="log-time-badge"
                        title={
                          (log.response?.timing || log.timing)
                            ? `Response Latency: ${log.response?.time || '0ms'}\n• DNS: ${(log.response?.timing || log.timing).dns || 0}ms\n• TCP: ${(log.response?.timing || log.timing).tcp || 0}ms\n• TLS: ${(log.response?.timing || log.timing).tls || 0}ms\n• TTFB: ${(log.response?.timing || log.timing).ttfb || 0}ms\n• Download: ${(log.response?.timing || log.timing).download || 0}ms`
                            : `Response Latency: ${log.response?.time || '0ms'}`
                        }
                      >
                        <Clock size={11} className="clock-icon" />
                        {typeof log.response?.time === 'number' ? `${log.response.time}ms` : (log.response?.time || '0ms')}
                      </span>
                      <span className="log-size">{log.size}</span>
                      <span className={`status-${getStatusClass(log?.response?.status)} log-status`}>
                        {log?.response?.status || 'ERR'}
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
        <AnimatePresence>
          {floatingPill && (
            <motion.div
              className="console-floating-pill"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <CheckCircle2 size={14} className="pill-check-icon" />
              <span>{floatingPill}</span>
            </motion.div>
          )}
        </AnimatePresence>
  </>
  );
}

export default Console;