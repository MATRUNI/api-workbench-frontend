import { useMemo, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../../style/MatrixStats.css';
import { ShieldAlert, Cpu, HardDrive, Zap, Terminal, Copy, ExternalLink } from 'lucide-react';
import { ContextMenuContext } from '../../context/ContextMenuContext';
import { prismMotion, gridVariants, cardVariants } from '../../animations/Motion';
import { getHistoryStats } from '../../services/history';

export default function MatrixStats({ stats }) {
  const navigate = useNavigate();
  const { openContextMenu, copyToClipboard } = useContext(ContextMenuContext);
  const [localStats, setLocalStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getHistoryStats().then(res => {
      if (isMounted) setLocalStats(res);
    }).catch(err => {
      console.warn('Failed to load local history stats:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Compute real telemetry from stats prop or fallback to live local history
  const { data, historyWaveform } = useMemo(() => {
    const hasBackendStats = stats && typeof stats.total === 'number' && stats.total > 0;
    const localHistory = localStats?.records || [];

    let computedData;
    if (hasBackendStats) {
      computedData = { ...stats };
    } else if (localStats && localStats.total > 0) {
      computedData = {
        total: localStats.total,
        success: localStats.success,
        rate_limited: localStats.rate_limited,
        client_errors: localStats.client_errors,
        server_errors: localStats.server_errors,
        bytes_transferred: localStats.bytes_transferred,
        total_compute_time_ms: localStats.total_compute_time_ms
      };
    } else {
      computedData = {
        total: 0,
        success: 0,
        rate_limited: 0,
        client_errors: 0,
        server_errors: 0,
        bytes_transferred: 0,
        total_compute_time_ms: 0
      };
    }

    // Extract recent latencies (last 5 requests) for organic real-world oscilloscope waveform
    const recentLatencies = localHistory.slice(0, 5).map(l => {
      const t = l.time || l.response?.time;
      return typeof t === 'string' ? parseFloat(t) || 35 : (t || 35);
    });
    while (recentLatencies.length < 5) {
      recentLatencies.push(30);
    }

    return { data: computedData, historyWaveform: recentLatencies.reverse() };
  }, [stats, localStats]);

  const total = data.total || 1;
  const integrityRatio = data.total > 0 ? (data.success / data.total) : 1.0;
  const failedCalls = Math.max(0, (data.total || 0) - (data.success || 0));

  // Generate 5 coordinate nodes for the oscilloscope waveform
  const maxLatency = Math.max(...historyWaveform, 80);
  const sparkPoints = historyWaveform.map((lat, idx) => {
    const x = idx * 45; // 0, 45, 90, 135, 180
    const normalized = Math.min(1, Math.max(0, lat / maxLatency));
    const y = Math.round(30 - (normalized * 22));
    return { x, y, latency: lat };
  });

  const polylinePoints = sparkPoints.map(p => `${p.x},${p.y}`).join(' ');

  const formatBytes = (b) => {
    if (!Number.isFinite(b) || b === 0) return '0.0 KB';
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return (b / Math.pow(1024, i)).toFixed(1) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    openContextMenu(e, [
      { type: "header", label: "Telemetry Actions" },
      {
        label: "Copy Metrics JSON",
        icon: Copy,
        onClick: () => copyToClipboard(JSON.stringify(data, null, 2), "Copied telemetry metrics as JSON!")
      },
      {
        label: "Copy Integrity Score",
        icon: Copy,
        onClick: () => copyToClipboard(integrityRatio.toFixed(2), "Copied integrity index!")
      },
      {
        label: "Copy Volume Transferred",
        icon: Copy,
        onClick: () => copyToClipboard(formatBytes(data.bytes_transferred), "Copied transfer volume!")
      },
      { type: "separator" },
      {
        label: "Open Workbench",
        icon: ExternalLink,
        onClick: () => navigate('/endpoints')
      },
      {
        label: "Open Console History",
        icon: Terminal,
        onClick: () => navigate('/console')
      }
    ]);
  };

  return (
    <motion.div 
      className="typo-matrix-canvas"
      initial="hidden"
      animate="visible"
      {...prismMotion}
      onContextMenu={handleContextMenu}
    >
      {/* Hero Block with Real-Time Telemetry Sparkline & Grid Monitor */}
      <motion.div 
        className="typo-hero-block api-card"
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.2 }}
      >
        <div className="matrix-hero-monitor-header">
          <div className="hero-index-number">
            <span className="hero-index-value">
              {integrityRatio.toFixed(2)}
            </span>
            <span className="hero-subtext">
              INTEGRITY_INDEX
            </span>
          </div>

          {/* Oscilloscope Sparkline Monitor */}
          <div className="matrix-oscilloscope">
            <div className="oscilloscope-screen-header">
              <span className="osc-label"><Terminal size={10} /> LIVE_TELEMETRY_WAVE</span>
              <span className="osc-status-dot"></span>
            </div>
            <div className="oscilloscope-display">
              <svg className="matrix-sparkline-svg" viewBox="0 0 180 35" preserveAspectRatio="none">
                <line x1="0" y1="17.5" x2="180" y2="17.5" className="osc-grid-line" />
                <polyline 
                  fill="none" 
                  className="osc-waveform" 
                  points={polylinePoints} 
                />
                {sparkPoints.map((pt, idx) => (
                  <circle 
                    key={idx} 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="2.5" 
                    className="osc-node-dot"
                  >
                    <title>{`${pt.latency}ms latency`}</title>
                  </circle>
                ))}
              </svg>
            </div>
          </div>
        </div>

        <div className="hero-supporting-text">
          Operational pipeline processed <span className="text-highlight-total" title="Total Calls">{data.total || 0}</span> structural cycles. 
          Out of these requests, <span className="text-highlight-success" title="Success Calls">{data.success || 0}</span> resolved without exception flags, 
          while <span className="text-highlight-failed" title="Failed Calls">{failedCalls}</span> registered as system runtime casualties.
        </div>
      </motion.div>

      {/* Data Ledger Cards */}
      <motion.div className="typo-data-ledger api-grid" variants={gridVariants}>
        <motion.div 
          className="ledger-item-node api-card"
          variants={cardVariants}
          whileHover={{ y: -3 }}
        >
          <div className="card-meta">
            <span className="card-badge"><HardDrive size={12} className="card-icon" /> QUANTITATIVE_VOLUME</span>
            <div className="pulse-dot"></div>
          </div>
          <div className="ledger-huge-stat">
            {formatBytes(data.bytes_transferred)}
          </div>
        </motion.div>

        <motion.div 
          className="ledger-item-node api-card"
          variants={cardVariants}
          whileHover={{ y: -3 }}
        >
          <div className="card-meta">
            <span className="card-badge"><Cpu size={12} className="card-icon" /> COMPUTE_LATENCY</span>
            <div className="pulse-dot"></div>
          </div>
          <div className="ledger-huge-stat text-brand-accent">
            {data.total_compute_time_ms || 0}<span className="ms-marker">ms</span>
          </div>
        </motion.div>

        <motion.div 
          className="ledger-item-node api-card"
          variants={cardVariants}
          whileHover={{ y: -3 }}
        >
          <div className="card-meta">
            <span className="card-badge"><Zap size={12} className="card-icon" /> AVERAGE_CYCLE</span>
            <div className="pulse-dot"></div>
          </div>
          <div className="ledger-huge-stat">
            {data.total > 0 ? (data.total_compute_time_ms / data.total).toFixed(1) : 0}ms
          </div>
        </motion.div>
      </motion.div>

      {/* Routing Exceptions Manifest with Animated Segment Bars */}
      <motion.div 
        className="typo-exception-footer api-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="exception-footer-heading">
          <ShieldAlert size={16} /> ROUTING_EXCEPTIONS_MANIFEST
        </div>
        
        {/* Compact Terminal Matrix Grid Graph with Motion-animated Bars */}
        <div className="matrix-telemetry-matrix">
          <div className="telemetry-node-row">
            <div className="telemetry-label-col">
              <span className="matrix-node-tag">SUCCESSFUL_NODES</span>
              <span className="matrix-node-num text-success-val">{data.success}</span>
            </div>
            <div className="telemetry-bar-col">
              <div className="matrix-segment-track">
                <motion.div 
                  className="matrix-segment-fill fill-success" 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (data.success / total) * 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          <div className="telemetry-node-row">
            <div className="telemetry-label-col">
              <span className="matrix-node-tag">RUNTIME_FAILURES</span>
              <span className="matrix-node-num text-failed-val">{failedCalls}</span>
            </div>
            <div className="telemetry-bar-col">
              <div className="matrix-segment-track">
                <motion.div 
                  className="matrix-segment-fill fill-failed" 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (failedCalls / total) * 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                />
              </div>
            </div>
          </div>

          <div className="telemetry-node-row">
            <div className="telemetry-label-col">
              <span className="matrix-node-tag">THROTTLED_LIMITS</span>
              <span className="matrix-node-num text-warn-val">{data.rate_limited}</span>
            </div>
            <div className="telemetry-bar-col">
              <div className="matrix-segment-track">
                <motion.div 
                  className="matrix-segment-fill fill-warn" 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (data.rate_limited / total) * 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="exception-row-strip">
          <div className="exception-strip-cell endpoint-preview">
            <span className="lbl">RATE_LIMITED</span>
            <span className={`val ${data.rate_limited > 0 ? 'active-warn' : ''}`}>{data.rate_limited}</span>
          </div>
          <div className="exception-strip-cell endpoint-preview">
            <span className="lbl">CLIENT_ERRORS</span>
            <span className={`val ${data.client_errors > 0 ? 'active-error' : ''}`}>{data.client_errors}</span>
          </div>
          <div className="exception-strip-cell endpoint-preview">
            <span className="lbl">SERVER_ERRORS</span>
            <span className={`val ${data.server_errors > 0 ? 'active-error' : ''}`}>{data.server_errors}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}