import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Clock, 
  Terminal, 
  Trash2, 
  ExternalLink, 
  Copy, 
  ArrowRight,
  Database
} from 'lucide-react';
import { ContextMenuContext } from '../../context/ContextMenuContext';
import { TabContext } from '../../context/TabContext';
import { prismMotion, fadeFromLeft, fadeFromRight, gridVariants, cardVariants } from '../../animations/Motion';
import '../../style/Endpoints.css';

export default function Overview({ username, email, isVerified, createdAt }) {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();
  const { openContextMenu, copyToClipboard, showFloatingPill } = useContext(ContextMenuContext);
  const { handleAddTab } = useContext(TabContext) || {};

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('api_os_history')) || [];
      setLogs(history.slice(0, 5));
    } catch {
      setLogs([]);
    }
  }, []);

  const handlePurgeLogs = () => {
    if (window.confirm("Purge all live system request history?")) {
      localStorage.removeItem('api_os_history');
      setLogs([]);
      if (showFloatingPill) showFloatingPill("Live request logs purged!");
    }
  };

  const handleOpenInWorkbench = (log) => {
    if (handleAddTab) {
      handleAddTab(log.method || 'GET', log.url || '', {
        body: log.request?.body,
        headers: log.request?.headers || [],
        contentType: log.request?.contentType || 'application/json'
      });
    }
    navigate('/endpoints');
  };

  const handleDeleteSingleLog = (logToDelete) => {
    try {
      const history = JSON.parse(localStorage.getItem('api_os_history')) || [];
      const updated = history.filter(
        l => !(l.url === logToDelete.url && l.timestamp === logToDelete.timestamp && l.method === logToDelete.method)
      );
      localStorage.setItem('api_os_history', JSON.stringify(updated));
      setLogs(updated.slice(0, 5));
      if (showFloatingPill) showFloatingPill("Log deleted!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogContextMenu = (e, log) => {
    e.preventDefault();
    e.stopPropagation();

    openContextMenu(e, [
      { type: "header", label: `${log.method} ${log.url}` },
      {
        label: "Open in Workbench Tab",
        icon: ExternalLink,
        onClick: () => handleOpenInWorkbench(log)
      },
      {
        label: "Copy Endpoint URL",
        icon: Copy,
        onClick: () => copyToClipboard(log.url, "Copied endpoint URL!")
      },
      {
        label: "Copy Response Payload",
        icon: Copy,
        disabled: !log.response?.rawData && !log.response?.data,
        onClick: () => {
          const raw = typeof log.response?.rawData === 'string' 
            ? log.response.rawData 
            : JSON.stringify(log.response?.data || {}, null, 2);
          copyToClipboard(raw, "Copied response payload!");
        }
      },
      { type: "separator" },
      {
        label: "View All in Console",
        icon: Terminal,
        onClick: () => navigate('/console')
      },
      {
        label: "Delete From History",
        icon: Trash2,
        danger: true,
        onClick: () => handleDeleteSingleLog(log)
      }
    ]);
  };

  const handleIdentityContextMenu = (e) => {
    e.preventDefault();
    openContextMenu(e, [
      { type: "header", label: "Identity Actions" },
      {
        label: "Copy Email",
        icon: Copy,
        onClick: () => copyToClipboard(email || 'unassigned@core.net', "Copied operator email!")
      },
      {
        label: "Copy Username",
        icon: Copy,
        onClick: () => copyToClipboard(username || 'OPERATOR', "Copied operator handle!")
      }
    ]);
  };

  const handleDateContextMenu = (e) => {
    e.preventDefault();
    const formatted = createdAt 
      ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(createdAt))
      : '00/00/2026';
    openContextMenu(e, [
      { type: "header", label: "Timestamp Actions" },
      {
        label: "Copy Initialized Date",
        icon: Clock,
        onClick: () => copyToClipboard(formatted, "Copied initialization timestamp!")
      }
    ]);
  };

  const getStatusColorClass = (status) => {
    const s = parseInt(status, 10);
    if (s >= 200 && s < 300) return "status-2xx";
    if (s >= 300 && s < 400) return "status-3xx";
    if (s >= 400 && s < 500) return "status-4xx";
    return "status-5xx";
  };

  const formatLogSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0.0 kb';
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} kb`;
    return `${bytes} B`;
  };

  return (
    <motion.main 
      className="dashboard-content"
      initial="hidden"
      animate="visible"
      {...prismMotion}
    >
      {/* --- HERO BANNER --- */}
      <section className="dashboard-hero overview-hero api-card">
        <div className="prism-backdrop overview-hero-backdrop">
          <div className="line-x"></div>
          <div className="line-y"></div>
        </div>
        <div className="overview-hero-content">
          <motion.h1 className="overview-hero-title" {...fadeFromLeft}>
            WELCOME<span className="dot-accent">.</span> {username || 'OPERATOR'}
          </motion.h1>
          <motion.p className="overview-hero-tagline" {...fadeFromRight}>
            OPERATOR SESSION TERMINAL // SECURE_CONVENT
          </motion.p>
        </div>
      </section>

      {/* --- KPI STATS CARDS GRID --- */}
      <motion.section className="api-grid" variants={gridVariants}>
        {/* Identity Card */}
        <motion.div 
          className="api-card kpi-card" 
          variants={cardVariants}
          onContextMenu={handleIdentityContextMenu}
          whileHover={{ y: -3 }}
        >
          <div className="card-meta">
            <span className="card-badge">
              <KeyRound size={12} className="kpi-card-icon" /> IDENTITY_PARAM
            </span>
            <div className="pulse-dot"></div>
          </div>
          <h3>SECURE ENDPOINT</h3>
          <div className="endpoint-preview kpi-preview">
            <code>ADDRESS</code>
            <span>{email || 'unassigned@core.net'}</span>
          </div>
          <p className="kpi-preview-desc">
            Main master clearance communication address registered to this system anchor.
          </p>
        </motion.div>

        {/* Verification Card */}
        <motion.div 
          className="api-card kpi-card" 
          variants={cardVariants}
          whileHover={{ y: -3 }}
        >
          <div className="card-meta">
            <span className="card-badge">ACCESS_STATE</span>
            <span className="status-success-text">200 OK</span>
          </div>
          <h3>VERIFICATION</h3>
          <p className="kpi-preview-desc">Clearance validation check telemetry signatures.</p>
          <div className="kpi-tag-row">
            {isVerified ? (
              <span className="kpi-tag kpi-tag-verified">
                <ShieldCheck size={14} /> CORE_VERIFIED
              </span>
            ) : (
              <span className="kpi-tag kpi-tag-unverified">
                <ShieldAlert size={14} /> UNVERIFIED_THREAT
              </span>
            )}
          </div>
        </motion.div>

        {/* Timestamp Card */}
        <motion.div 
          className="api-card kpi-card" 
          variants={cardVariants}
          onContextMenu={handleDateContextMenu}
          whileHover={{ y: -3 }}
        >
          <div className="card-meta">
            <span className="card-badge">
              <Clock size={12} className="kpi-card-icon" /> TIME_STAMP
            </span>
            <span className="kpi-date-stamp">
              {createdAt 
                ? new Intl.DateTimeFormat('en-GB', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(new Date(createdAt)).replace(/\//g, '.') 
                : '00.00.2026'}
            </span>
          </div>
          <h3>INITIALIZED</h3>
          <div className="endpoint-preview kpi-preview">
            <code>INIT</code>
            <span>
              {createdAt 
                ? new Intl.DateTimeFormat('en-GB', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(new Date(createdAt)) 
                : '00/00/2026'}
            </span>
          </div>
          <p className="kpi-preview-desc">
            Timestamp records tracking when this user layout matrix profile block was committed to the database.
          </p>
        </motion.div>
      </motion.section>

      {/* --- LIVE REQUEST STREAM (REAL LOCAL LOGS) --- */}
      <motion.section 
        className="console-stream-card api-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="console-stream-toolbar">
          <span className="console-stream-title">
            <span className="terminal-prompt">&gt;</span> LIVE_SYSTEM_REQUEST_STREAM
          </span>
          <div className="console-stream-actions">
            <button 
              className="console-stream-btn console-view-btn" 
              onClick={() => navigate('/console')}
              title="Open full Console history"
            >
              <Terminal size={13} />
              <span>FULL_CONSOLE</span>
            </button>
            <button 
              className="console-stream-btn console-purge-btn" 
              onClick={handlePurgeLogs}
              disabled={logs.length === 0}
              title="Purge local request cache"
            >
              <Trash2 size={13} />
              <span>PURGE_LOGS</span>
            </button>
          </div>
        </div>

        <div className="console-stream-window">
          {logs.length > 0 ? (
            <div className="console-stream-list">
              {logs.map((log, index) => {
                const logSize = log.response?.length || log.size || 0;
                const statusNum = log.response?.status || 200;
                const timeString = log.timestamp 
                  ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : (log.time ? `${log.time}ms` : '12:00:00');

                return (
                  <div 
                    key={index} 
                    className="console-stream-row"
                    onClick={() => handleOpenInWorkbench(log)}
                    onContextMenu={(e) => handleLogContextMenu(e, log)}
                    title="Click to load into Workbench, right-click for options"
                  >
                    <div className="console-stream-meta">
                      <span className="console-stream-time">{timeString}</span>
                      <span className={`method-dropdown method-${log.method} log-method-badge`}>
                        {log.method}
                      </span>
                    </div>
                    <span className="console-stream-url">{log.url}</span>
                    <div className="console-stream-metrics">
                      <span className="console-stream-size">{formatLogSize(logSize)}</span>
                      <span className={`kpi-status-code ${getStatusColorClass(statusNum)}`}>
                        {statusNum}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="console-stream-empty">
              <Database size={24} style={{ opacity: 0.6 }} />
              <div>NO_REQUEST_TELEMETRY_LOGGED_YET</div>
              <button 
                className="console-empty-cta" 
                onClick={() => navigate('/endpoints')}
              >
                <span>DISPATCH_CALL_IN_WORKBENCH</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </motion.section>
    </motion.main>
  );
}