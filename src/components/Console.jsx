import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { RequestContext } from '../context/RequestContext';
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
      header: log.request.header,
      query: log.request.query
    });
    
    setResponse({
      status: log.response.status,
      data: log.response.data,
      message: log.response.status >= 200 && log.response.status < 300 ? "Cached Success Snapshot" : "Cached Error Snapshot",
      time: log.response.time
    });

    navigate('/endpoints'); 
  };

  const getStatusClass = (status) => {
    const statusNum = parseInt(status, 10);
    if (statusNum >= 200 && statusNum < 300) return 'success';
    if (statusNum >= 400) return 'error';
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
    <div className="fetch-container console-container">
      <header className="fetch-header">
        <h1>Cache Console</h1>
        <p>Rehydrate historical request variables back into your current session workbench.</p>
      </header>

      <div className="console-toolbar">
        <div className="format-toggle">
          <button className={`format-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>All Core</button>
          <button className={`format-btn ${filter === 'SUCCESS' ? 'active active-success' : ''}`} onClick={() => setFilter('SUCCESS')}>Success</button>
          <button className={`format-btn ${filter === 'FAILED' ? 'active active-error' : ''}`} onClick={() => setFilter('FAILED')}>Failures</button>
        </div>

        <button className="copy-btn purge-btn" disabled={logs.length === 0} onClick={clearHistory}>
          Purge_Memory
        </button>
      </div>

      <div className="editor-window console-window">
        {filteredLogs.length === 0 ? (
          <div className="empty-state terminal-empty">
            <span className="terminal-prompt">&gt;</span> COLD STORAGE INACTIVE. PROCESS RUNS TO BEGIN INGESTION...
          </div>
        ) : (
          <div className="console-log-list">
            {filteredLogs.map((log) => (
              <div key={log.id} className="console-log-row" onClick={() => handleRestoreCache(log)}>
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
                  {log.request.body && Object.keys(log.request.body).length > 0 && (
                    <span className="payload-indicator-dot">⚡ JSON</span>
                  )}
                </div>
                
                <div className="log-metrics">
                  <span className="log-size">{log.size ? `${(log.size / 1024).toFixed(2)} KB` : '0 B'}</span>
                  <span className={`status-${getStatusClass(log.response.status)} log-status`}>
                    {log.response.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Console;