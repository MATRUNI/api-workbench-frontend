import React, { useState } from 'react';
import { 
  TbAlertTriangle, 
  TbClock, 
  TbCopy, 
  TbCheck, 
  TbServerOff, 
  TbFlame,
  TbShieldExclamation,
  TbCircleCheck
} from 'react-icons/tb';
import '../style/StressMode.css';

export default function StressErrorsViewer({ report, sampleErrors = [], failureCount = 0 }) {
  const [copied, setCopied] = useState(false);

  const errorBreakdown = report?.errorBreakdown || [];
  const rateLimitDetected = report?.rateLimitDetected;
  const rateLimitDetails = report?.rateLimitDetails;
  const totalRequests = report?.totalRequests || (sampleErrors.length + (report?.successCount || 0));

  const handleCopyErrors = () => {
    const errorData = {
      failureCount,
      rateLimitDetected,
      rateLimitDetails,
      errorBreakdown,
      sampleErrors
    };
    navigator.clipboard?.writeText(JSON.stringify(errorData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (failureCount === 0 && sampleErrors.length === 0 && !rateLimitDetected) {
    return (
      <div className="stress-empty-samples-view">
        <TbCircleCheck size={36} style={{ color: '#49cc90' }} className="stress-empty-icon" />
        <h3 style={{ color: '#49cc90' }}>Zero Errors Encountered!</h3>
        <p>100% of benchmarked requests returned valid responses without timeouts, network drops, or rate limit penalties.</p>
      </div>
    );
  }

  return (
    <div className="stress-errors-viewer-container">
      {/* Top Banner / Actions */}
      <div className="stress-errors-header">
        <div className="stress-errors-title-group">
          <TbAlertTriangle size={20} className="stress-errors-main-icon" />
          <div>
            <h3 className="stress-errors-title">
              {failureCount.toLocaleString()} Failed / Dropped Requests Detected
            </h3>
            <span className="stress-errors-subtitle">
              Detailed diagnostic log and failure root cause analysis
            </span>
          </div>
        </div>

        <button
          type="button"
          className="stress-copy-report-btn"
          onClick={handleCopyErrors}
          title="Copy error diagnostics JSON"
        >
          {copied ? <TbCheck size={14} /> : <TbCopy size={14} />}
          <span>{copied ? 'Copied Error JSON' : 'Export Errors'}</span>
        </button>
      </div>

      {/* Rate Limit Alert */}
      {rateLimitDetected && (
        <div className="stress-rate-limit-alert">
          <TbFlame size={20} />
          <div>
            <strong>HTTP 429 Rate Limiting Enforced:</strong>
            <p>{rateLimitDetails || 'The target server rejected incoming requests due to rate limiting or DDoS protection.'}</p>
          </div>
        </div>
      )}

      {/* Grouped Error Signatures */}
      {errorBreakdown.length > 0 && (
        <div className="stress-section-card">
          <div className="stress-section-title">
            <TbShieldExclamation size={16} />
            <span>ERROR ROOT CAUSES BREAKDOWN</span>
          </div>
          <div className="stress-error-signatures-list">
            {errorBreakdown.map((item, idx) => {
              const pct = totalRequests > 0 ? Math.round((item.count / totalRequests) * 100) : 0;
              return (
                <div key={idx} className="stress-error-sig-item">
                  <div className="stress-error-sig-left">
                    <span className="stress-error-sig-dot" />
                    <span className="stress-error-sig-msg">{item.message}</span>
                  </div>
                  <div className="stress-error-sig-right">
                    <span className="stress-error-sig-count">{item.count.toLocaleString()} occurrences</span>
                    <span className="stress-error-sig-pct">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sample Error Log Traces */}
      {sampleErrors.length > 0 && (
        <div className="stress-section-card">
          <div className="stress-section-title">
            <TbServerOff size={16} />
            <span>SAMPLE FAILED REQUEST TRACES</span>
          </div>
          <div className="stress-error-traces-list">
            {sampleErrors.map((err, idx) => (
              <div key={idx} className="stress-error-trace-row">
                <span className="stress-error-trace-idx">Req #{err.index}</span>
                <span className="stress-error-trace-msg">{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
