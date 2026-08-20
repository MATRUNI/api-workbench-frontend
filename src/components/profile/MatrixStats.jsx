import React from 'react';
import '../../style/MatrixStats.css';
import { ShieldAlert, Cpu, HardDrive, Zap, Terminal } from 'lucide-react';

export default function MatrixStats({ stats }) {
  const data = stats || {
    total: 0, success: 0,
    rate_limited: 0, client_errors: 0, server_errors: 0,
    bytes_transferred: 0, total_compute_time_ms: 0
  };
  
  const total = data.total || 1;
  const integrityRatio = (data.success / total) || 0;
  const failedCalls = Math.max(0, data.total - data.success);

  // Sparkline points generator for SVG
  const successRate = data.success / total;
  const failRate = failedCalls / total;
  const warnRate = (data.rate_limited || 0) / total;
  const clientErrRate = (data.client_errors || 0) / total;
  const serverErrRate = (data.server_errors || 0) / total;

  // Generate 5 coordinate nodes for an organic cyberpunk monitor waveform
  const sparkPoints = [
    { x: 0, y: 30 - (successRate * 25) },
    { x: 45, y: 30 - (failRate * 15) },
    { x: 90, y: 30 - (warnRate * 20) },
    { x: 135, y: 30 - (clientErrRate * 25) },
    { x: 180, y: 30 - (serverErrRate * 20) },
  ];

  const polylinePoints = sparkPoints.map(p => `${p.x},${p.y}`).join(' ');

  const formatBytes = (b) => {
    if (!Number.isFinite(b) || b === 0) return '0.0 KB';
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return (b / Math.pow(1024, i)).toFixed(1) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
  };

  return (
    <div className="typo-matrix-canvas challenge-reveal">
      
      {/* Hero Block with Real-Time Telemetry Sparkline & Grid Monitor */}
      <div className="typo-hero-block api-card">
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
                  <circle key={idx} cx={pt.x} cy={pt.y} r="2" className="osc-node-dot" />
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
      </div>

      {/* Data Ledger Cards */}
      <div className="typo-data-ledger api-grid">
        <div className="ledger-item-node api-card">
          <div className="card-meta">
            <span className="card-badge"><HardDrive size={12} className="card-icon" /> QUANTITATIVE_VOLUME</span>
            <div className="pulse-dot"></div>
          </div>
          <div className="ledger-huge-stat">
            {formatBytes(data.bytes_transferred)}
          </div>
        </div>

        <div className="ledger-item-node api-card">
          <div className="card-meta">
            <span className="card-badge"><Cpu size={12} className="card-icon" /> COMPUTE_LATENCY</span>
            <div className="pulse-dot"></div>
          </div>
          <div className="ledger-huge-stat text-brand-accent">
            {data.total_compute_time_ms || 0}<span className="ms-marker">ms</span>
          </div>
        </div>

        <div className="ledger-item-node api-card">
          <div className="card-meta">
            <span className="card-badge"><Zap size={12} className="card-icon" /> AVERAGE_CYCLE</span>
            <div className="pulse-dot"></div>
          </div>
          <div className="ledger-huge-stat">
            {data.total > 0 ? (data.total_compute_time_ms / data.total).toFixed(1) : 0}ms
          </div>
        </div>
      </div>

      {/* Routing Exceptions Manifest with Compact Terminal Metric Ledger Graph */}
      <div className="typo-exception-footer api-card">
        <div className="exception-footer-heading">
          <ShieldAlert size={16} /> ROUTING_EXCEPTIONS_MANIFEST
        </div>
        
        {/* Compact Terminal Matrix Grid Graph */}
        <div className="matrix-telemetry-matrix">
          <div className="telemetry-node-row">
            <div className="telemetry-label-col">
              <span className="matrix-node-tag">SUCCESSFUL_NODES</span>
              <span className="matrix-node-num text-success-val">{data.success}</span>
            </div>
            <div className="telemetry-bar-col">
              <div className="matrix-segment-track">
                <div className="matrix-segment-fill fill-success" style={{ width: `${Math.min(100, (data.success / total) * 100)}%` }}></div>
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
                <div className="matrix-segment-fill fill-failed" style={{ width: `${Math.min(100, (failedCalls / total) * 100)}%` }}></div>
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
                <div className="matrix-segment-fill fill-warn" style={{ width: `${Math.min(100, (data.rate_limited / total) * 100)}%` }}></div>
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
      </div>

    </div>
  );
}