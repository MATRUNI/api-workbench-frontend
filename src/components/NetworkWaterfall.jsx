import React, { useState } from 'react';
import { 
  Zap, 
  Activity, 
  Clock, 
  Globe, 
  ShieldCheck, 
  Server, 
  Download, 
  Cpu, 
  Copy, 
  Check, 
  Terminal,
  Layers,
  BarChart3
} from 'lucide-react';
import '../style/networkWaterfall.css';

/**
 * Mobile-Responsive, Developer-Grade Network Waterfall & Latency Profiler
 */
export default function NetworkWaterfall({ timing, totalTime }) {
  const [viewMode, setViewMode] = useState('cascade'); // 'cascade' | 'spectrum'
  const [copiedAscii, setCopiedAscii] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activePhaseKey, setActivePhaseKey] = useState(null);

  if (!timing) {
    return (
      <div className="waterfall-empty-container">
        <Activity size={32} className="waterfall-empty-icon" />
        <div className="waterfall-empty-title">No Network Telemetry</div>
        <div className="waterfall-empty-desc">
          Dispatch an API request to profile high-precision connection phases and latency waterfall.
        </div>
      </div>
    );
  }

  const {
    dns = 0,
    tcp = 0,
    tls = 0,
    ttfb = 0,
    download = 0,
    total = totalTime || 0,
    percentages = { dns: 0, tcp: 0, tls: 0, ttfb: 0, download: 0 },
    bottleneck = 'ttfb',
    source = 'stream',
    protocol = 'HTTP/1.1',
    asciiBar = ''
  } = timing;

  // Chronological time offsets
  const tDnsStart = 0;
  const tDnsEnd = dns;
  const tTcpStart = tDnsEnd;
  const tTcpEnd = tTcpStart + tcp;
  const tTlsStart = tTcpEnd;
  const tTlsEnd = tTlsStart + tls;
  const tTtfbStart = tTlsEnd;
  const tTtfbEnd = tTtfbStart + ttfb;
  const tDlStart = Math.max(tTtfbEnd, total - download);
  const tDlEnd = total;

  const phases = [
    {
      key: 'dns',
      name: 'DNS Lookup',
      shortName: 'DNS',
      dur: dns,
      pct: percentages.dns,
      start: tDnsStart,
      end: tDnsEnd,
      color: '#d2a8ff', // --code-json
      icon: Globe,
      desc: 'Domain resolution to IP address'
    },
    {
      key: 'tcp',
      name: 'TCP Handshake',
      shortName: 'TCP',
      dur: tcp,
      pct: percentages.tcp,
      start: tTcpStart,
      end: tTcpEnd,
      color: '#8b5cf6', // violet
      icon: Cpu,
      desc: 'TCP SYN/ACK socket establishment'
    },
    {
      key: 'tls',
      name: 'TLS Negotiation',
      shortName: 'TLS',
      dur: tls,
      pct: percentages.tls,
      start: tTlsStart,
      end: tTlsEnd,
      color: '#c084fc', // brand purple accent
      icon: ShieldCheck,
      desc: 'Cryptographic cipher & SSL handshake'
    },
    {
      key: 'ttfb',
      name: 'Server Processing (TTFB)',
      shortName: 'TTFB',
      dur: ttfb,
      pct: percentages.ttfb,
      start: tTtfbStart,
      end: tTtfbEnd,
      color: '#f59e0b', // --config-color
      icon: Server,
      desc: 'Origin compute until first response byte'
    },
    {
      key: 'download',
      name: 'Content Transfer',
      shortName: 'TRANSFER',
      dur: download,
      pct: percentages.download,
      start: tDlStart,
      end: tDlEnd,
      color: '#49cc90', // --brand-green
      icon: Download,
      desc: 'Transfer time to buffer response body'
    }
  ];

  // Aggregated Handshake vs Compute vs Transfer
  const handshakeTime = dns + tcp + tls;
  const handshakePct = Math.round((handshakeTime / total) * 100) || 0;
  const computeTime = ttfb;
  const computePct = Math.round((computeTime / total) * 100) || 0;
  const transferTime = download;
  const transferPct = Math.max(1, 100 - (handshakePct + computePct));

  const handleCopyAscii = async () => {
    try {
      await navigator.clipboard.writeText(asciiBar);
      setCopiedAscii(true);
      setTimeout(() => setCopiedAscii(false), 2000);
    } catch (err) {
      console.error("Failed to copy ASCII bar", err);
    }
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(timing, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err) {
      console.error("Failed to copy timing JSON", err);
    }
  };

  const isProxyActive = timing.isProxy || source.includes('Proxy') || source.includes('vlang');

  return (
    <div className="waterfall-container">
      {/* 1. COMPACT INTEGRATED HEADER */}
      <div className="waterfall-header-row">
        <div className="waterfall-meta-left">
          <div className="waterfall-total-badge">
            <span className="total-ms">{total}</span>
            <span className="total-unit">ms</span>
          </div>

          <div className="waterfall-meta-tags">
            <span className="storage-pill">
              <span className={`live-pulse-dot ${isProxyActive ? 'active' : 'direct'}`} />
              {isProxyActive ? 'Proxy' : 'Browser Direct'}
            </span>
            <span className="storage-pill">
              {protocol.split(' ')[0]}
            </span>
            <span className="storage-pill dominant-tag-pill">
              <Zap size={10} className="dominant-icon" />
              {bottleneck.toUpperCase()} ({percentages[bottleneck] || 0}%)
            </span>
          </div>
        </div>

        <div className="waterfall-actions-right">
          <div className="format-toggle" style={{ margin: 0 }}>
            <button
              type="button"
              className={`format-btn ${viewMode === 'cascade' ? 'active' : ''}`}
              onClick={() => setViewMode('cascade')}
              title="Chronological Cascading Timeline"
            >
              <Layers size={11} /> Cascade
            </button>
            <button
              type="button"
              className={`format-btn ${viewMode === 'spectrum' ? 'active' : ''}`}
              onClick={() => setViewMode('spectrum')}
              title="Unified Stacked Spectrum Bar"
            >
              <BarChart3 size={11} /> Spectrum
            </button>
          </div>

          <button
            type="button"
            className="copy-btn"
            onClick={handleCopyAscii}
            title="Copy ASCII breakdown"
          >
            {copiedAscii ? <Check size={11} /> : <Terminal size={11} />}
            {copiedAscii ? 'COPIED' : 'ASCII'}
          </button>
          <button
            type="button"
            className="copy-btn"
            onClick={handleCopyJson}
            title="Copy timing JSON"
          >
            {copiedJson ? <Check size={11} /> : <Copy size={11} />}
            {copiedJson ? 'COPIED' : 'JSON'}
          </button>
        </div>
      </div>

      {/* 2. SLIM BUDGET RATIO STRIP */}
      <div className="waterfall-budget-strip">
        <div className="budget-multi-track">
          <div 
            className="budget-seg handshake" 
            style={{ width: `${handshakePct}%` }}
            title={`Handshake: ${handshakeTime}ms (${handshakePct}%)`}
          />
          <div 
            className="budget-seg compute" 
            style={{ width: `${computePct}%` }}
            title={`Compute: ${computeTime}ms (${computePct}%)`}
          />
          <div 
            className="budget-seg transfer" 
            style={{ width: `${transferPct}%` }}
            title={`Transfer: ${transferTime}ms (${transferPct}%)`}
          />
        </div>
        <div className="budget-strip-labels">
          <span className="budget-label handshake">
            <span className="dot" /> Handshake: {handshakeTime}ms ({handshakePct}%)
          </span>
          <span className="budget-label compute">
            <span className="dot" /> Compute: {computeTime}ms ({computePct}%)
          </span>
          <span className="budget-label transfer">
            <span className="dot" /> Transfer: {transferTime}ms ({transferPct}%)
          </span>
        </div>
      </div>

      {/* 3. TIMELINE CANVAS */}
      <div className="waterfall-canvas-card">
        {/* Timeline Axis Rulers (Desktop) */}
        <div className="timeline-axis-row">
          <div className="axis-label-spacer">PHASE</div>
          <div className="axis-timeline-scale">
            <span>0 ms</span>
            <span>{Math.round(total * 0.25)} ms</span>
            <span>{Math.round(total * 0.5)} ms</span>
            <span>{Math.round(total * 0.75)} ms</span>
            <span className="axis-end">{total} ms</span>
          </div>
          <div className="axis-stat-spacer">DURATION</div>
        </div>

        {/* VIEW 1: CASCADING GANTT TIMELINE */}
        {viewMode === 'cascade' && (
          <div className="cascade-timeline-body">
            {/* Background Grid Lines */}
            <div className="timeline-grid-lines">
              <div className="grid-line" style={{ left: '0%' }} />
              <div className="grid-line" style={{ left: '25%' }} />
              <div className="grid-line" style={{ left: '50%' }} />
              <div className="grid-line" style={{ left: '75%' }} />
              <div className="grid-line" style={{ left: '100%' }} />
            </div>

            {phases.map((phase) => {
              const Icon = phase.icon;
              const isDominant = bottleneck === phase.key;
              const isHovered = activePhaseKey === phase.key;

              const startPct = Math.min(99, Math.max(0, (phase.start / total) * 100));
              const widthPct = Math.max(2, Math.min(100 - startPct, (phase.dur / total) * 100));

              return (
                <div 
                  key={phase.key} 
                  className={`cascade-row ${isDominant ? 'dominant' : ''} ${isHovered ? 'hovered' : ''}`}
                  onMouseEnter={() => setActivePhaseKey(phase.key)}
                  onMouseLeave={() => setActivePhaseKey(null)}
                >
                  {/* Left Column: Fixed Width on Desktop, Responsive on Mobile */}
                  <div className="row-meta">
                    <div className="phase-title-group">
                      <Icon size={13} style={{ color: phase.color, flexShrink: 0 }} />
                      <div className="phase-text-col">
                        <span className="phase-label" style={{ color: isDominant ? 'var(--config-color)' : 'var(--text-main)' }}>
                          {phase.name}
                        </span>
                        <span className="phase-time-span">
                          {phase.start}ms → {phase.end}ms
                        </span>
                      </div>
                    </div>

                    {/* Mobile-only inline duration */}
                    <div className="row-mobile-stat">
                      <span className="stat-dur">{phase.dur}ms</span>
                      <span className="stat-pct">({phase.pct}%)</span>
                    </div>
                  </div>

                  {/* Center Column: Cascading Timeline Track */}
                  <div className="row-track">
                    <div 
                      className="cascade-bar-segment"
                      style={{
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: phase.color,
                        boxShadow: isHovered ? `0 0 10px ${phase.color}` : 'none'
                      }}
                    />
                  </div>

                  {/* Right Column: Desktop Duration & % */}
                  <div className="row-stat-col">
                    <span className="stat-dur">{phase.dur}ms</span>
                    <span className="stat-pct">({phase.pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: UNIFIED SPECTRUM BAR */}
        {viewMode === 'spectrum' && (
          <div className="spectrum-timeline-body">
            <div className="spectrum-stacked-bar">
              {phases.map((phase) => {
                const widthPct = Math.max(2, phase.pct);
                return (
                  <div
                    key={phase.key}
                    className="spectrum-segment"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: phase.color
                    }}
                    title={`${phase.name}: ${phase.dur}ms (${phase.pct}%)`}
                  >
                    {widthPct >= 10 && (
                      <span className="spectrum-segment-label">
                        {phase.shortName} {phase.dur}ms
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="spectrum-cards-grid">
              {phases.map((phase) => (
                <div key={phase.key} className="spectrum-phase-pill">
                  <div className="pill-dot" style={{ backgroundColor: phase.color }} />
                  <div className="pill-content">
                    <span className="pill-name">{phase.name}</span>
                    <span className="pill-val">{phase.dur}ms <small>({phase.pct}%)</small></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
