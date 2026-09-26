import React, { useContext, useState, useMemo } from 'react';
import { RequestContext } from '../context/RequestContext';
import { ContextMenuContext } from '../context/ContextMenuContext';
import { 
  TbGauge, 
  TbActivity, 
  TbClock, 
  TbCircleCheck, 
  TbAlertTriangle, 
  TbTrendingUp, 
  TbCopy, 
  TbCheck, 
  TbPlayerStop,
  TbFlame,
  TbServer,
  TbFileCode,
  TbKey,
  TbListDetails
} from 'react-icons/tb';
import '../style/StressMode.css';

export default function StressTelemetryViewer({ onSelectTab }) {
  const { 
    stressTelemetry, 
    stressConfig, 
    abortStressTest, 
    url, 
    method 
  } = useContext(RequestContext);

  const { copyToClipboard } = useContext(ContextMenuContext) || {};
  const [copied, setCopied] = useState(false);

  const {
    isRunning,
    completed,
    total,
    inFlight,
    percent,
    elapsedMs,
    currentRps,
    successCount,
    failureCount,
    statusCounts,
    recentLatencies,
    lastLatency,
    aborted,
    sampleResponse,
    storedResponses,
    sampleErrors,
    finalReport
  } = stressTelemetry;

  const sampleRes = finalReport?.sampleResponse || sampleResponse;

  const hasStarted = completed > 0 || isRunning || finalReport;
  const isFinished = !isRunning && (completed === total || Boolean(finalReport));

  const formatMs = (ms) => {
    if (!ms) return '0.0s';
    return (ms / 1000).toFixed(2) + 's';
  };

  const { count2xx, count4xx, count5xx } = useMemo(() => {
    let c2 = 0;
    let c4 = 0;
    let c5 = 0;
    Object.entries(statusCounts || {}).forEach(([code, count]) => {
      const num = Number(code);
      if (!isNaN(num) && num >= 200 && num < 400) {
        c2 += count;
      } else if (!isNaN(num) && num >= 400 && num < 500) {
        c4 += count;
      } else {
        c5 += count;
      }
    });
    return { count2xx: c2, count4xx: c4, count5xx: c5 };
  }, [statusCounts]);

  const handleCopyReport = () => {
    const data = finalReport || {
      target: { method, url },
      total,
      completed,
      successCount,
      failureCount,
      throughputRps: currentRps,
      statusCounts
    };
    const jsonStr = JSON.stringify(data, null, 2);
    if (copyToClipboard) {
      copyToClipboard(jsonStr, 'Copied benchmark report!');
    } else {
      navigator.clipboard?.writeText(jsonStr);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusEntries = Object.entries(statusCounts || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="stress-telemetry-container">
      {/* Top Telemetry Header */}
      <div className="stress-telemetry-header">
        <div className="stress-status-indicator">
          {isRunning ? (
            <div className="stress-status-pill running">
              <span className="stress-pulse-dot" />
              <span>RUNNING BENCHMARK</span>
            </div>
          ) : isFinished ? (
            <div className={`stress-status-pill ${aborted ? 'aborted' : 'completed'}`}>
              {aborted ? <TbAlertTriangle size={15} /> : <TbCircleCheck size={15} />}
              <span>{aborted ? 'BENCHMARK ABORTED' : 'BENCHMARK COMPLETED'}</span>
            </div>
          ) : (
            <div className="stress-status-pill idle">
              <TbActivity size={15} />
              <span>STRESS ENGINE READY</span>
            </div>
          )}
          <span className="stress-elapsed-timer">
            <TbClock size={14} /> {formatMs(finalReport?.elapsedMs || elapsedMs)}
          </span>
        </div>

        <div className="stress-header-actions">
          {isRunning ? (
            <button
              type="button"
              className="stress-abort-sm-btn"
              onClick={abortStressTest}
              title="Abort ongoing stress test"
            >
              <TbPlayerStop size={14} />
              <span>Stop</span>
            </button>
          ) : hasStarted ? (
            <button
              type="button"
              className="stress-copy-report-btn"
              onClick={handleCopyReport}
              title="Copy benchmark telemetry JSON"
            >
              {copied ? <TbCheck size={14} /> : <TbCopy size={14} />}
              <span>{copied ? 'Copied JSON' : 'Export Report'}</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Hero Metrics Row */}
      <div className="stress-hero-grid">
        <div className="stress-hero-card rps-card">
          <div className="stress-hero-icon">
            <TbGauge size={22} />
          </div>
          <div className="stress-hero-content">
            <div className="stress-hero-label">THROUGHPUT</div>
            <div className="stress-hero-value">
              {finalReport ? finalReport.throughputRps : currentRps}
              <span className="stress-hero-unit">req/sec</span>
            </div>
          </div>
        </div>

        <div className="stress-hero-card duration-card">
          <div className="stress-hero-icon">
            <TbClock size={22} />
          </div>
          <div className="stress-hero-content">
            <div className="stress-hero-label">{finalReport ? 'TOTAL DURATION' : 'ELAPSED TIME'}</div>
            <div className="stress-hero-value">
              {formatMs(finalReport?.elapsedMs || elapsedMs)}
            </div>
          </div>
        </div>

        <div className="stress-hero-card workers-card">
          <div className="stress-hero-icon">
            <TbServer size={22} />
          </div>
          <div className="stress-hero-content">
            <div className="stress-hero-label">CONCURRENCY</div>
            <div className="stress-hero-value">
              {isRunning ? inFlight : (finalReport?.concurrency || stressConfig.concurrency)}
              <span className="stress-hero-unit">
                {isRunning ? `/ ${stressConfig.concurrency} active` : (stressConfig.concurrency === 1 ? 'serial' : 'workers')}
              </span>
            </div>
          </div>
        </div>

        <div className="stress-hero-card latency-card">
          <div className="stress-hero-icon">
            <TbTrendingUp size={22} />
          </div>
          <div className="stress-hero-content">
            <div className="stress-hero-label">{finalReport ? 'AVERAGE LATENCY' : 'LAST LATENCY'}</div>
            <div className="stress-hero-value">
              {finalReport ? finalReport.latencies?.avg : lastLatency}
              <span className="stress-hero-unit">ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Captured Sample Response Quick Card */}
      {sampleRes && (
        <div className="stress-sample-quickcard">
          <div className="stress-sample-quickcard-header">
            <div className="stress-sample-quickcard-title">
              <TbFileCode size={18} className="stress-quickcard-icon" />
              <span className="stress-quickcard-heading">CAPTURED SAMPLE RESPONSE</span>
              <span className={`stress-quickcard-status ${sampleRes.status >= 200 && sampleRes.status < 300 ? 'success' : sampleRes.status >= 400 ? 'warning' : 'info'}`}>
                {sampleRes.status}
              </span>
              <span className="stress-quickcard-meta">
                <TbClock size={13} /> {sampleRes.time || 0}ms
              </span>
              <span className="stress-quickcard-meta">
                {sampleRes.length ? `${sampleRes.length} bytes` : ''}
              </span>
            </div>
            <div className="stress-sample-quickcard-actions">
              <button
                type="button"
                className="stress-quickcard-btn primary"
                onClick={() => onSelectTab && onSelectTab('body')}
                title="Inspect full formatted response in CodeMirror"
              >
                <TbFileCode size={14} />
                <span>Inspect Full Body</span>
              </button>
              <button
                type="button"
                className="stress-quickcard-btn"
                onClick={() => onSelectTab && onSelectTab('headers')}
                title="View response headers"
              >
                <TbKey size={14} />
                <span>Headers</span>
              </button>
              {storedResponses && storedResponses.length > 0 && (
                <button
                  type="button"
                  className="stress-quickcard-btn"
                  onClick={() => onSelectTab && onSelectTab('samples')}
                  title="View individual request samples"
                >
                  <TbListDetails size={14} />
                  <span>Samples ({storedResponses.length})</span>
                </button>
              )}
            </div>
          </div>
          <div className="stress-sample-preview-box">
            <pre className="stress-sample-code-preview">
              {typeof sampleRes.data === 'object'
                ? JSON.stringify(sampleRes.data, null, 2).slice(0, 360) + (JSON.stringify(sampleRes.data).length > 360 ? '\n... (Click "Inspect Full Body" for complete response)' : '')
                : String(sampleRes.data || '').slice(0, 360) + (String(sampleRes.data || '').length > 360 ? '\n... (Click "Inspect Full Body" for complete response)' : '')}
            </pre>
          </div>
        </div>
      )}

      {/* Progress Section */}
      <div className="stress-progress-box">
        <div className="stress-progress-labels">
          <span className="stress-progress-count">
            {completed.toLocaleString()} / {total.toLocaleString()} Requests
          </span>
          <span className="stress-progress-percent">{percent}%</span>
        </div>
        <div className="stress-progress-track">
          <div 
            className="stress-progress-fill-success" 
            style={{ width: `${Math.min(100, (count2xx / Math.max(1, total)) * 100)}%` }} 
            title={`2xx Success: ${count2xx.toLocaleString()}`}
          />
          <div 
            className="stress-progress-fill-warning" 
            style={{ width: `${Math.min(100, (count4xx / Math.max(1, total)) * 100)}%` }} 
            title={`4xx Client Errors: ${count4xx.toLocaleString()}`}
          />
          <div 
            className="stress-progress-fill-failure" 
            style={{ width: `${Math.min(100, (count5xx / Math.max(1, total)) * 100)}%` }} 
            title={`5xx / Failures: ${count5xx.toLocaleString()}`}
          />
        </div>
        <div className="stress-sub-counters">
          <span className="stress-sub-pill success" title="2xx and 3xx Successful responses">
            ● {count2xx.toLocaleString()} Success
          </span>
          {count4xx > 0 && (
            <span className="stress-sub-pill warning" title="4xx Client error responses (400, 401, 403, 404, 429, etc.)">
              ● {count4xx.toLocaleString()} Client Errors (4xx)
            </span>
          )}
          {count5xx > 0 && (
            <span className="stress-sub-pill failure" title="5xx Server errors, drops, or timeouts">
              ● {count5xx.toLocaleString()} Server Errors (5xx)
            </span>
          )}
          <span className="stress-sub-pill total">
            Remaining: {Math.max(0, total - completed).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Live Percentiles Distribution */}
      <div className="stress-section-card">
        <div className="stress-section-title">
          <TbGauge size={16} />
          <span>LATENCY DISTRIBUTION (PERCENTILES)</span>
        </div>
        <div className="stress-percentiles-grid">
          <div className="stress-p-box">
            <span className="stress-p-label">Min</span>
            <span className="stress-p-val">{finalReport?.latencies?.min ?? (recentLatencies.length ? Math.min(...recentLatencies) : 0)}ms</span>
          </div>
          <div className="stress-p-box highlight">
            <span className="stress-p-label">p50 (Median)</span>
            <span className="stress-p-val">{finalReport?.latencies?.median ?? lastLatency}ms</span>
          </div>
          <div className="stress-p-box">
            <span className="stress-p-label">p90</span>
            <span className="stress-p-val">{finalReport?.latencies?.p90 ?? '--'}ms</span>
          </div>
          <div className="stress-p-box">
            <span className="stress-p-label">p95</span>
            <span className="stress-p-val">{finalReport?.latencies?.p95 ?? '--'}ms</span>
          </div>
          <div className="stress-p-box">
            <span className="stress-p-label">p99</span>
            <span className="stress-p-val">{finalReport?.latencies?.p99 ?? '--'}ms</span>
          </div>
          <div className="stress-p-box">
            <span className="stress-p-label">Max</span>
            <span className="stress-p-val">{finalReport?.latencies?.max ?? (recentLatencies.length ? Math.max(...recentLatencies) : 0)}ms</span>
          </div>
        </div>
      </div>

      {/* Recent Latency Sparkline Pulse */}
      {recentLatencies && recentLatencies.length > 0 && (
        <div className="stress-section-card">
          <div className="stress-section-title">
            <TbActivity size={16} />
            <span>RECENT LATENCY PULSE (LAST 25 REQUESTS)</span>
          </div>
          <div className="stress-sparkline-track">
            {recentLatencies.map((lat, idx) => {
              const maxL = Math.max(10, ...recentLatencies);
              const heightPercent = Math.min(100, Math.max(15, (lat / maxL) * 100));
              return (
                <div 
                  key={idx} 
                  className="stress-spark-bar" 
                  style={{ height: `${heightPercent}%` }}
                  title={`Request: ${lat}ms`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Status Code Breakdown */}
      {statusEntries.length > 0 && (
        <div className="stress-section-card">
          <div className="stress-section-title">
            <TbCircleCheck size={16} />
            <span>HTTP STATUS CODES</span>
          </div>
          <div className="stress-status-pills-list">
            {statusEntries.map(([code, count]) => {
              const num = Number(code);
              const is2xx = num >= 200 && num < 300;
              const is4xx = num >= 400 && num < 500;
              const is5xx = num >= 500;
              const pillType = is2xx ? 'success' : is4xx ? 'warning' : is5xx ? 'error' : 'info';
              return (
                <div key={code} className={`stress-code-badge ${pillType}`}>
                  <span className="stress-code-num">{code}</span>
                  <span className="stress-code-count">{count.toLocaleString()} reqs</span>
                  <span className="stress-code-pct">
                    ({total > 0 ? Math.round((count / total) * 100) : 0}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Throttle / Rate Limit Notice */}
      {finalReport?.rateLimitDetected && (
        <div className="stress-rate-limit-alert">
          <TbAlertTriangle size={18} />
          <div>
            <strong>Rate Limit Enforced by Target Server:</strong>
            <p>{finalReport.rateLimitDetails || 'HTTP 429 Too Many Requests detected during run.'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
