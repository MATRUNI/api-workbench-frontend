import React, { useState, useMemo } from 'react';
import { 
  TbListDetails, 
  TbSearch, 
  TbCheck, 
  TbCopy, 
  TbFileCode, 
  TbClock,
  TbAlertTriangle,
  TbCircleCheck,
  TbKey,
  TbGauge
} from 'react-icons/tb';
import '../style/StressMode.css';

const HTTP_STATUS_TEXTS = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  301: 'Moved',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Not Allowed',
  408: 'Timeout',
  409: 'Conflict',
  422: 'Unprocessable',
  429: 'Rate Limited',
  500: 'Server Error',
  502: 'Bad Gateway',
  503: 'Unavailable',
  504: 'Timeout'
};

export default function StressSamplesViewer({ samples = [], onSelectSample }) {
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [expandedHeadersKey, setExpandedHeadersKey] = useState(null);

  const totalRequests = useMemo(() => {
    return samples.reduce((acc, curr) => acc + (curr.count || 1), 0);
  }, [samples]);

  const filteredSamples = useMemo(() => {
    return samples.filter(item => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const matchStatus = `${item.status}`.toLowerCase().includes(q);
      const matchLabel = (HTTP_STATUS_TEXTS[item.status] || '').toLowerCase().includes(q);
      const matchError = item.error ? item.error.toLowerCase().includes(q) : false;
      const matchData = item.data ? (typeof item.data === 'string' ? item.data : JSON.stringify(item.data)).toLowerCase().includes(q) : false;
      return matchStatus || matchLabel || matchError || matchData;
    });
  }, [samples, search]);

  const handleCopy = (data, key) => {
    const text = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data || '');
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const getStatusClass = (status) => {
    const num = Number(status);
    if (isNaN(num)) return 'error';
    if (num >= 200 && num < 300) return 'success';
    if (num >= 400 && num < 500) return 'warning';
    return 'error';
  };

  if (!samples || samples.length === 0) {
    return (
      <div className="stress-empty-samples-view">
        <TbListDetails size={32} className="stress-empty-icon" />
        <h3>No Response Samples Recorded</h3>
        <p>Start a stress benchmark run to capture representative response samples grouped by HTTP status code (200, 429, 500, etc.).</p>
      </div>
    );
  }

  return (
    <div className="stress-samples-viewer-container">
      {/* Top Search & Summary Bar */}
      <div className="stress-samples-toolbar">
        <div className="stress-samples-summary-pill">
          <TbGauge size={14} className="stress-toolbar-icon" />
          <span>{samples.length} Unique Status Group{samples.length === 1 ? '' : 's'}</span>
          <span className="stress-toolbar-dot">•</span>
          <span>{totalRequests.toLocaleString()} Total Requests</span>
        </div>

        <div className="stress-samples-search-wrapper">
          <TbSearch size={14} className="stress-search-icon" />
          <input
            type="text"
            className="stress-samples-search-input"
            placeholder="Search status code (e.g. 200, 429), error, payload..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Samples List Table */}
      <div className="stress-samples-table-wrapper">
        <table className="stress-samples-table">
          <thead>
            <tr>
              <th style={{ width: '160px', minWidth: '150px', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ width: '95px', minWidth: '85px', whiteSpace: 'nowrap' }}>Count</th>
              <th style={{ width: '175px', minWidth: '165px', whiteSpace: 'nowrap' }}>Latency Profile</th>
              <th style={{ minWidth: '160px' }}>Representative Sample Payload</th>
              <th style={{ width: '150px', minWidth: '145px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSamples.map((sample) => {
              const statusClass = getStatusClass(sample.status);
              const statusText = HTTP_STATUS_TEXTS[sample.status] || (isNaN(Number(sample.status)) ? sample.status : 'Status');
              const previewText = sample.error 
                ? sample.error 
                : sample.data 
                  ? (typeof sample.data === 'object' ? JSON.stringify(sample.data) : String(sample.data)) 
                  : '[No Body Returned]';

              const pct = totalRequests > 0 ? Math.round((sample.count / totalRequests) * 100) : 0;
              const isExpandedHeaders = expandedHeadersKey === sample.status;

              return (
                <React.Fragment key={sample.status}>
                  <tr className="stress-sample-row">
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="stress-status-group-badge">
                        <span className={`stress-code-badge-sm ${statusClass}`}>
                          {statusClass === 'success' ? <TbCircleCheck size={12} /> : <TbAlertTriangle size={12} />}
                          <span>{sample.status}</span>
                        </span>
                        <span className="stress-status-sub-label">{statusText}</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="stress-sample-freq">
                        <strong className="stress-sample-multiplier">{sample.count.toLocaleString()}</strong>
                        <span className="stress-sample-pct">({pct}%)</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="stress-sample-latency-col">
                        <span className="stress-sample-avg">
                          <TbClock size={12} /> avg: <strong>{sample.avgLatency}ms</strong>
                        </span>
                        <span className="stress-sample-range">
                          min: {sample.minLatency}ms • max: {sample.maxLatency}ms
                        </span>
                      </div>
                    </td>
                    <td className="stress-sample-preview-cell">
                      <div className="stress-sample-snippet" title={previewText}>
                        {previewText.slice(0, 160)}
                        {previewText.length > 160 ? '…' : ''}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div className="stress-sample-actions-cell">
                        {sample.headers && Object.keys(sample.headers).length > 0 && (
                          <button
                            type="button"
                            className={`stress-sm-action-btn ${isExpandedHeaders ? 'active' : ''}`}
                            onClick={() => setExpandedHeadersKey(isExpandedHeaders ? null : sample.status)}
                            title="Toggle response headers for this status"
                          >
                            <TbKey size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="stress-sm-action-btn"
                          onClick={() => handleCopy(sample.data || sample.error, sample.status)}
                          title="Copy response payload"
                        >
                          {copiedKey === sample.status ? <TbCheck size={13} style={{ color: '#49cc90' }} /> : <TbCopy size={13} />}
                        </button>
                        {onSelectSample && (
                          <button
                            type="button"
                            className="stress-sm-action-btn primary"
                            onClick={() => onSelectSample(sample)}
                            title="Inspect this response in full CodeMirror viewer"
                          >
                            <TbFileCode size={13} />
                            <span>Inspect</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpandedHeaders && sample.headers && (
                    <tr className="stress-sample-expanded-headers-row">
                      <td colSpan="5">
                        <div className="stress-sample-headers-drawer">
                          <div className="stress-headers-drawer-title">
                            <TbKey size={13} /> Representative Response Headers ({sample.status} {statusText}):
                          </div>
                          <div className="stress-headers-drawer-grid">
                            {Object.entries(sample.headers).map(([k, v]) => (
                              <div key={k} className="stress-header-kv">
                                <span className="stress-h-k">{k}:</span>
                                <span className="stress-h-v">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
