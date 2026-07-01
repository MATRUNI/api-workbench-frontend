import React from 'react';
import '../../style/MatrixStats.css';

export default function MatrixStats({ stats }) {
  const data = stats || {
    total: 0, failed: 0, success: 0,
    rate_limited: 0, client_errors: 0, server_errors: 0,
    bytes_transferred: 0, total_compute_time_ms: 0
  };

  const total = data.total || 1;
  const integrityRatio = (data.success / total)||0;

  const formatBytes = (b) => {
    console.log(b)
    if (!Number.isFinite(b) || b === 0) return '0.0 KB';
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return (b / Math.pow(1024, i)).toFixed(1) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
  };

  return (
    <div className="typo-matrix-canvas challenge-reveal">
      
      <div className="typo-hero-block">
        <div className="hero-index-number">
          {integrityRatio.toFixed(2)}
          <span className="hero-subtext">INTEGRITY_INDEX</span>
        </div>
        <div className="hero-supporting-text">
          Operational pipeline processed <span className="text-highlight-total" title='Total Calls'>{data.total||0}</span> structural cycles. 
          Out of these requests, <span className="text-highlight-success" title='Success Calls' >{data.success||0}</span> resolved without exception flags, 
          while <span className="text-highlight-failed" title='Failed Calls' >{data.failed||0}</span> registered as system runtime casualties.
        </div>
      </div>

      <div className="typo-data-ledger">
        
        <div className="ledger-item-node">
          <div className="ledger-meta-label">01 // QUANTITATIVE_VOLUME</div>
          <div className="ledger-huge-stat">{formatBytes(data.bytes_transferred)}</div>
        </div>

        <div className="ledger-item-node">
          <div className="ledger-meta-label">02 // COMPUTE_LATENCY</div>
          <div className="ledger-huge-stat text-brand-accent">
            {data.total_compute_time_ms}<span className="ms-marker">ms</span>
          </div>
        </div>

        <div className="ledger-item-node">
          <div className="ledger-meta-label">03 // AVERAGE_CYCLE</div>
          <div className="ledger-huge-stat">
            {data.total > 0 ? (data.total_compute_time_ms / data.total).toFixed(1) : 0}s
          </div>
        </div>

      </div>

      <div className="typo-exception-footer">
        <div className="exception-footer-heading">ROUTING_EXCEPTIONS_MANIFEST</div>
        
        <div className="exception-row-strip">
          <div className="exception-strip-cell">
            <span className="lbl">RATE_LIMITED</span>
            <span className={`val ${data.rate_limited > 0 ? 'active-warn' : ''}`}>{data.rate_limited}</span>
          </div>
          <div className="exception-strip-cell">
            <span className="lbl">CLIENT_ERRORS</span>
            <span className={`val ${data.client_errors > 0 ? 'active-error' : ''}`}>{data.client_errors}</span>
          </div>
          <div className="exception-strip-cell">
            <span className="lbl">SERVER_ERRORS</span>
            <span className={`val ${data.server_errors > 0 ? 'active-error' : ''}`}>{data.server_errors}</span>
          </div>
        </div>
      </div>

    </div>
  );
}