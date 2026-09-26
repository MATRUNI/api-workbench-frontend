import React, { useContext, useState } from 'react';
import { RequestContext } from '../context/RequestContext';
import { ProxyContext } from '../context/ProxyContext';
import { createStressRunner } from '../services/stressEngine';
import { 
  TbFlame, 
  TbPlayerStop, 
  TbHash,
  TbUsers,
  TbPlus,
  TbMinus,
  TbClock,
  TbHourglass,
  TbAdjustmentsHorizontal,
  TbChevronDown,
  TbChevronUp,
  TbRotate
} from 'react-icons/tb';
import '../style/StressMode.css';

const REQUEST_PRESETS = [25, 100, 500, 1000, 10000, 50000];
const CONCURRENCY_PRESETS = [
  { label: 'Serial (1)', value: 1 },
  { label: '5x', value: 5 },
  { label: '15x', value: 15 },
  { label: '50x', value: 50 },
  { label: '100x', value: 100 }
];

const TIMEOUT_PRESETS = [
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '15s', value: 15000 },
  { label: '30s', value: 30000 },
  { label: '60s', value: 60000 }
];

const DELAY_PRESETS = [
  { label: '0ms (Blast)', value: 0 },
  { label: '10ms', value: 10 },
  { label: '50ms', value: 50 },
  { label: '100ms', value: 100 },
  { label: '250ms', value: 250 }
];

export default function StressControls({ scrollToResponse }) {
  const { 
    url, 
    method, 
    request, 
    setResponse,
    isProxyEnable, 
    setIsProxyEnable,
    stressConfig, 
    setStressConfig, 
    stressTelemetry, 
    setStressTelemetry,
    activeRunnerRef,
    abortStressTest
  } = useContext(RequestContext);

  const { isProxyRunning } = useContext(ProxyContext);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isRunning = stressTelemetry.isRunning;

  const isCustomized = (stressConfig.timeoutMs !== 15000) || (stressConfig.delayBetweenRequestsMs > 0);

  const handleResetAdvanced = () => {
    setStressConfig(prev => ({
      ...prev,
      timeoutMs: 15000,
      delayBetweenRequestsMs: 0
    }));
  };

  const handleStart = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isRunning) return;

    if (!url || !url.trim()) {
      alert('Please enter a target URL first.');
      return;
    }

    try {
      new URL(url);
    } catch {
      alert('Please enter a valid HTTP/HTTPS URL.');
      return;
    }

    if (scrollToResponse) scrollToResponse();

    // Reset telemetry
    setStressTelemetry({
      isRunning: true,
      completed: 0,
      total: stressConfig.totalRequests,
      inFlight: 0,
      percent: 0,
      elapsedMs: 0,
      currentRps: 0,
      successCount: 0,
      failureCount: 0,
      statusCounts: {},
      recentLatencies: [],
      lastLatency: 0,
      aborted: false,
      sampleResponse: null,
      storedResponses: [],
      sampleErrors: [],
      finalReport: null
    });

    const runner = createStressRunner({
      url,
      method,
      headers: request.headers || [],
      query: request.query || [],
      body: request.body,
      contentType: request.contentType || 'application/json',
      auth: request.auth,
      totalRequests: stressConfig.totalRequests,
      concurrency: stressConfig.concurrency,
      timeoutMs: stressConfig.timeoutMs,
      delayBetweenRequestsMs: stressConfig.delayBetweenRequestsMs,
      storeResponses: true,
      isProxyEnable: Boolean(isProxyRunning && isProxyEnable)
    });

    activeRunnerRef.current = runner;

    try {
      await runner.run({
        onProgress: (p) => {
          if (p.sampleResponse && setResponse) {
            setResponse(p.sampleResponse);
          }
          setStressTelemetry(prev => ({
            ...prev,
            completed: p.completed,
            total: p.total,
            inFlight: p.inFlight,
            percent: p.percent,
            elapsedMs: p.elapsedMs,
            currentRps: p.currentRps,
            successCount: p.successCount,
            failureCount: p.failureCount,
            statusCounts: p.statusCounts,
            recentLatencies: p.recentLatencies,
            lastLatency: p.lastLatency,
            aborted: p.aborted,
            sampleResponse: p.sampleResponse || prev.sampleResponse,
            storedResponses: p.storedResponses || prev.storedResponses,
            sampleErrors: p.sampleErrors || prev.sampleErrors
          }));
        },
        onComplete: (report) => {
          if (report.sampleResponse && setResponse) {
            setResponse(report.sampleResponse);
          }
          setStressTelemetry(prev => ({
            ...prev,
            isRunning: false,
            finalReport: report,
            sampleResponse: report.sampleResponse || prev.sampleResponse,
            storedResponses: report.storedResponses || prev.storedResponses,
            sampleErrors: report.sampleErrors || prev.sampleErrors,
            aborted: report.aborted
          }));
        }
      });
    } catch (err) {
      console.error('Stress runner error:', err);
      setStressTelemetry(prev => ({
        ...prev,
        isRunning: false,
        aborted: true
      }));
    } finally {
      activeRunnerRef.current = null;
    }
  };

  return (
    <div className="stress-controls-panel">
      <div className="stress-controls-header">
        <div className="stress-header-badge">
          <TbFlame size={16} className="stress-badge-icon" />
          <span>STRESS CONFIGURATION</span>
        </div>
        <div className="stress-header-target">
          <span className={`stress-method-pill method-${method}`}>{method}</span>
          <span className="stress-target-url" title={url}>{url}</span>
        </div>
      </div>

      {/* Total Requests Setting */}
      <div className="stress-field-group">
        <div className="stress-field-label">
          <span>Total Requests</span>
          <span className="stress-field-val">{stressConfig.totalRequests.toLocaleString()}</span>
        </div>
        <div className="stress-presets-row">
          {REQUEST_PRESETS.map(preset => (
            <button
              key={preset}
              type="button"
              disabled={isRunning}
              className={`stress-preset-btn ${stressConfig.totalRequests === preset ? 'active' : ''}`}
              onClick={() => setStressConfig(prev => ({ ...prev, totalRequests: preset }))}
            >
              {preset >= 1000 ? `${preset / 1000}k` : preset}
            </button>
          ))}
        </div>
        <div className="stress-num-control">
          <div className="stress-num-prefix-badge" title="Total Requests">
            <TbHash size={15} />
          </div>
          <input
            type="number"
            min="1"
            max="250000"
            disabled={isRunning}
            value={stressConfig.totalRequests}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              const val = isNaN(parsed) ? '' : Math.max(1, Math.min(250000, parsed));
              setStressConfig(prev => ({ ...prev, totalRequests: val === '' ? 1 : val }));
            }}
            className="stress-num-field"
            placeholder="Custom requests count"
          />
          <div className="stress-num-stepper">
            <button
              type="button"
              disabled={isRunning || stressConfig.totalRequests <= 1}
              onClick={() => {
                const step = stressConfig.totalRequests > 1000 ? 500 : (stressConfig.totalRequests > 100 ? 50 : 10);
                setStressConfig(prev => ({
                  ...prev,
                  totalRequests: Math.max(1, prev.totalRequests - step)
                }));
              }}
              className="stress-step-btn"
              title="Decrease requests"
            >
              <TbMinus size={13} />
            </button>
            <button
              type="button"
              disabled={isRunning || stressConfig.totalRequests >= 250000}
              onClick={() => {
                const step = stressConfig.totalRequests >= 1000 ? 500 : (stressConfig.totalRequests >= 100 ? 50 : 10);
                setStressConfig(prev => ({
                  ...prev,
                  totalRequests: Math.min(250000, prev.totalRequests + step)
                }));
              }}
              className="stress-step-btn"
              title="Increase requests"
            >
              <TbPlus size={13} />
            </button>
          </div>
          <span className="stress-range-badge">Max 250k</span>
        </div>
      </div>

      {/* Concurrency Setting */}
      <div className="stress-field-group">
        <div className="stress-field-label">
          <span>Worker Concurrency</span>
          <span className="stress-field-val">
            {stressConfig.concurrency === 1 ? 'Serial (1 worker)' : `${stressConfig.concurrency} parallel workers`}
          </span>
        </div>
        <div className="stress-presets-row">
          {CONCURRENCY_PRESETS.map(preset => (
            <button
              key={preset.value}
              type="button"
              disabled={isRunning}
              className={`stress-preset-btn ${stressConfig.concurrency === preset.value ? 'active' : ''}`}
              onClick={() => setStressConfig(prev => ({ ...prev, concurrency: preset.value }))}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="stress-num-control">
          <div className="stress-num-prefix-badge" title="Worker Concurrency">
            <TbUsers size={15} />
          </div>
          <input
            type="number"
            min="1"
            max="250"
            disabled={isRunning}
            value={stressConfig.concurrency}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              const val = isNaN(parsed) ? '' : Math.max(1, Math.min(250, parsed));
              setStressConfig(prev => ({ ...prev, concurrency: val === '' ? 1 : val }));
            }}
            className="stress-num-field"
            placeholder="Workers count"
          />
          <div className="stress-num-stepper">
            <button
              type="button"
              disabled={isRunning || stressConfig.concurrency <= 1}
              onClick={() => {
                setStressConfig(prev => ({
                  ...prev,
                  concurrency: Math.max(1, prev.concurrency - (prev.concurrency > 10 ? 5 : 1))
                }));
              }}
              className="stress-step-btn"
              title="Decrease workers"
            >
              <TbMinus size={13} />
            </button>
            <button
              type="button"
              disabled={isRunning || stressConfig.concurrency >= 250}
              onClick={() => {
                setStressConfig(prev => ({
                  ...prev,
                  concurrency: Math.min(250, prev.concurrency + (prev.concurrency >= 10 ? 5 : 1))
                }));
              }}
              className="stress-step-btn"
              title="Increase workers"
            >
              <TbPlus size={13} />
            </button>
          </div>
          <span className="stress-range-badge">1 – 250 workers</span>
        </div>
      </div>

      {/* Advanced Execution Settings (Collapsible) */}
      <div className="stress-advanced-section">
        <button
          type="button"
          className={`stress-advanced-toggle ${showAdvanced ? 'open' : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <div className="stress-advanced-title-left">
            <TbAdjustmentsHorizontal size={16} className="stress-advanced-icon" />
            <span>Advanced Execution Settings</span>
            {isCustomized && (
              <span className="stress-customized-pill" title="Custom timeout or pacing active">Customized</span>
            )}
          </div>
          <div className="stress-advanced-title-right">
            <span className="stress-advanced-quick-summary">
              {`${(stressConfig.timeoutMs || 15000) / 1000}s timeout`}
              {stressConfig.delayBetweenRequestsMs > 0 ? ` • ${stressConfig.delayBetweenRequestsMs}ms delay` : ''}
            </span>
            {showAdvanced ? <TbChevronUp size={15} /> : <TbChevronDown size={15} />}
          </div>
        </button>

        {showAdvanced && (
          <div className="stress-advanced-content">
            {/* Request Timeout Setting */}
            <div className="stress-field-group">
              <div className="stress-field-label">
                <span>Request Timeout</span>
                <span className="stress-field-val">
                  {stressConfig.timeoutMs >= 1000 ? `${(stressConfig.timeoutMs / 1000).toFixed(1)}s` : `${stressConfig.timeoutMs}ms`}
                </span>
              </div>
              <div className="stress-presets-row">
                {TIMEOUT_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    disabled={isRunning}
                    className={`stress-preset-btn ${stressConfig.timeoutMs === preset.value ? 'active' : ''}`}
                    onClick={() => setStressConfig(prev => ({ ...prev, timeoutMs: preset.value }))}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="stress-num-control">
                <div className="stress-num-prefix-badge" title="Request Timeout">
                  <TbClock size={15} />
                </div>
                <input
                  type="number"
                  min="100"
                  max="120000"
                  step="500"
                  disabled={isRunning}
                  value={stressConfig.timeoutMs}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    const val = isNaN(parsed) ? '' : Math.max(100, Math.min(120000, parsed));
                    setStressConfig(prev => ({ ...prev, timeoutMs: val === '' ? 1000 : val }));
                  }}
                  className="stress-num-field"
                  placeholder="Timeout in ms"
                />
                <div className="stress-num-stepper">
                  <button
                    type="button"
                    disabled={isRunning || stressConfig.timeoutMs <= 500}
                    onClick={() => {
                      setStressConfig(prev => ({
                        ...prev,
                        timeoutMs: Math.max(500, (prev.timeoutMs || 15000) - 1000)
                      }));
                    }}
                    className="stress-step-btn"
                    title="Decrease timeout by 1s"
                  >
                    <TbMinus size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={isRunning || stressConfig.timeoutMs >= 120000}
                    onClick={() => {
                      setStressConfig(prev => ({
                        ...prev,
                        timeoutMs: Math.min(120000, (prev.timeoutMs || 15000) + 1000)
                      }));
                    }}
                    className="stress-step-btn"
                    title="Increase timeout by 1s"
                  >
                    <TbPlus size={13} />
                  </button>
                </div>
                <span className="stress-range-badge">100ms – 120s</span>
              </div>
              <small className="stress-field-hint">
                Aborts any hanging request as TIMEOUT if the server fails to respond within this time.
              </small>
            </div>

            {/* Delay / Pacing Setting */}
            <div className="stress-field-group">
              <div className="stress-field-label">
                <span>Delay Between Requests (Pacing)</span>
                <span className="stress-field-val">
                  {stressConfig.delayBetweenRequestsMs === 0 ? '0ms (Blast Mode)' : `${stressConfig.delayBetweenRequestsMs}ms delay`}
                </span>
              </div>
              <div className="stress-presets-row">
                {DELAY_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    disabled={isRunning}
                    className={`stress-preset-btn ${stressConfig.delayBetweenRequestsMs === preset.value ? 'active' : ''}`}
                    onClick={() => setStressConfig(prev => ({ ...prev, delayBetweenRequestsMs: preset.value }))}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="stress-num-control">
                <div className="stress-num-prefix-badge" title="Worker Delay">
                  <TbHourglass size={15} />
                </div>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="10"
                  disabled={isRunning}
                  value={stressConfig.delayBetweenRequestsMs}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    const val = isNaN(parsed) ? '' : Math.max(0, Math.min(10000, parsed));
                    setStressConfig(prev => ({ ...prev, delayBetweenRequestsMs: val === '' ? 0 : val }));
                  }}
                  className="stress-num-field"
                  placeholder="Delay in ms"
                />
                <div className="stress-num-stepper">
                  <button
                    type="button"
                    disabled={isRunning || stressConfig.delayBetweenRequestsMs <= 0}
                    onClick={() => {
                      setStressConfig(prev => ({
                        ...prev,
                        delayBetweenRequestsMs: Math.max(0, (prev.delayBetweenRequestsMs || 0) - 10)
                      }));
                    }}
                    className="stress-step-btn"
                    title="Decrease delay by 10ms"
                  >
                    <TbMinus size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={isRunning || stressConfig.delayBetweenRequestsMs >= 10000}
                    onClick={() => {
                      setStressConfig(prev => ({
                        ...prev,
                        delayBetweenRequestsMs: Math.min(10000, (prev.delayBetweenRequestsMs || 0) + 10)
                      }));
                    }}
                    className="stress-step-btn"
                    title="Increase delay by 10ms"
                  >
                    <TbPlus size={13} />
                  </button>
                </div>
                <span className="stress-range-badge">0 – 10,000ms</span>
              </div>
              <small className="stress-field-hint">
                Pause each worker pauses between successive requests. Useful to avoid instant rate limiting.
              </small>
            </div>

            {/* Reset Defaults Action */}
            {isCustomized && (
              <div className="stress-advanced-footer">
                <button
                  type="button"
                  disabled={isRunning}
                  className="stress-reset-advanced-btn"
                  onClick={handleResetAdvanced}
                >
                  <TbRotate size={13} />
                  <span>Reset to Defaults (15s timeout, 0ms delay)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proxy Toggle */}
      <div className="stress-options-single">
        <label 
          className={`stress-toggle-label ${!isProxyRunning ? 'disabled' : ''}`}
          title={isProxyRunning ? (isProxyEnable ? "Proxy enabled: routing through local Vlang proxy on 17777" : "Proxy disabled: routing directly from browser") : "Local proxy is offline. Start your Vlang proxy on 127.0.0.1:17777 to enable."}
        >
          <input
            type="checkbox"
            disabled={isRunning || !isProxyRunning}
            checked={Boolean(isProxyRunning && isProxyEnable)}
            onChange={(e) => {
              if (isProxyRunning) {
                setIsProxyEnable(e.target.checked);
              }
            }}
          />
          <span className="stress-checkbox-custom" />
          <div className="stress-toggle-text">
            <div className="stress-toggle-title-row">
              <span>Vlang Local Proxy</span>
              {isProxyRunning ? (
                <span className="proxy-status-pill online">ONLINE</span>
              ) : (
                <span className="proxy-status-pill offline">OFFLINE</span>
              )}
            </div>
            <small>
              {isProxyRunning 
                ? '● Active on 17777 (Bypasses CORS & Browser Limits)' 
                : 'Offline (Proxy must be running to enable)'}
            </small>
          </div>
        </label>
      </div>

      {/* Action Button: Start or Abort */}
      <div className="stress-action-wrapper">
        {isRunning ? (
          <button
            type="button"
            className="stress-btn-abort"
            onClick={abortStressTest}
          >
            <TbPlayerStop size={18} />
            <span>STOP STRESS TEST</span>
          </button>
        ) : (
          <button
            type="button"
            className="stress-btn-start"
            onClick={handleStart}
          >
            <TbFlame size={19} />
            <span>START STRESS TEST ({stressConfig.totalRequests.toLocaleString()} REQS)</span>
          </button>
        )}
      </div>
    </div>
  );
}
