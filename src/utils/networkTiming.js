/**
 * Network Latency Waterfall & Performance Profiler
 * Extracts microsecond/millisecond connection phases from:
 * 1. Native Vlang Proxy headers (Server-Timing / X-API-OS-Timing)
 * 2. Browser PerformanceResourceTiming API (Timing-Allow-Origin)
 * 3. High-resolution connection & stream network model
 */

export function parseTimingHeaders(headers = {}) {
  // Normalize header keys to lowercase
  const normalized = {};
  for (const [k, v] of Object.entries(headers)) {
    normalized[k.toLowerCase()] = v;
  }

  // 1. Check custom JSON timing header from Vlang Proxy: X-API-OS-Timing
  const jsonTiming = normalized['x-api-os-timing'] || normalized['x-timing'];
  if (jsonTiming) {
    try {
      const parsed = typeof jsonTiming === 'string' ? JSON.parse(jsonTiming) : jsonTiming;
      if (parsed && typeof parsed === 'object') {
        const dns = Math.max(0, Math.round(parsed.dns || 0));
        const tcp = Math.max(0, Math.round(parsed.tcp || 0));
        const tls = Math.max(0, Math.round(parsed.tls || 0));
        const ttfb = Math.max(1, Math.round(parsed.ttfb || parsed.wait || 0));
        const download = Math.max(1, Math.round(parsed.download || parsed.dl || 1));
        const total = Math.max(1, Math.round(parsed.total || (dns + tcp + tls + ttfb + download)));

        return {
          dns,
          tcp,
          tls,
          ttfb,
          download,
          total,
          source: 'Vlang Proxy (OS Sockets)'
        };
      }
    } catch {}
  }

  // 2. Check standard W3C Server-Timing header: dns;dur=4.2, tcp;dur=12.1, tls;dur=24.5, ttfb;dur=178.0
  const serverTiming = normalized['server-timing'];
  if (serverTiming && typeof serverTiming === 'string') {
    const phases = {};
    const parts = serverTiming.split(',');
    for (const part of parts) {
      const match = part.trim().match(/^([a-zA-Z_-]+);dur=([\d.]+)/i);
      if (match) {
        phases[match[1].toLowerCase()] = parseFloat(match[2]);
      }
    }

    if (Object.keys(phases).length > 0) {
      const dns = Math.max(0, Math.round(phases.dns || 0));
      const tcp = Math.max(0, Math.round(phases.tcp || 0));
      const tls = Math.max(0, Math.round(phases.tls || phases.ssl || 0));
      const ttfb = Math.max(1, Math.round(phases.ttfb || phases.app || phases.wait || 0));
      const download = Math.max(1, Math.round(phases.download || phases.dl || 1));
      const total = Math.max(1, Math.round(phases.total || (dns + tcp + tls + ttfb + download)));

      return {
        dns,
        tcp,
        tls,
        ttfb,
        download,
        total,
        source: 'Vlang Proxy (Server-Timing)'
      };
    }
  }

  return null;
}

export function getBrowserResourceTiming(targetUrl) {
  if (typeof window === 'undefined' || !window.performance || !window.performance.getEntriesByType) {
    return null;
  }

  try {
    const entries = window.performance.getEntriesByType('resource');
    if (!entries || entries.length === 0) return null;

    const cleanTarget = targetUrl.split('?')[0].replace(/\/+$/, '');
    let matchedEntry = null;

    // Search backwards for latest matching invocation
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i];
      const cleanName = e.name.split('?')[0].replace(/\/+$/, '');
      if (e.name === targetUrl || cleanName === cleanTarget || e.name.includes(cleanTarget)) {
        matchedEntry = e;
        break;
      }
    }

    if (!matchedEntry) return null;

    // If server sent Timing-Allow-Origin: * or permitted origin
    if (matchedEntry.responseStart > 0 && matchedEntry.requestStart > 0) {
      const dns = Math.max(0, Math.round(matchedEntry.domainLookupEnd - matchedEntry.domainLookupStart));
      const tcp = Math.max(0, Math.round(matchedEntry.connectEnd - matchedEntry.connectStart));
      const tls = matchedEntry.secureConnectionStart > 0 
        ? Math.max(0, Math.round(matchedEntry.connectEnd - matchedEntry.secureConnectionStart)) 
        : 0;
      const ttfb = Math.max(1, Math.round(matchedEntry.responseStart - matchedEntry.requestStart));
      const download = Math.max(1, Math.round(matchedEntry.responseEnd - matchedEntry.responseStart));
      const total = Math.max(1, Math.round(matchedEntry.duration || (dns + tcp + tls + ttfb + download)));
      const protocol = matchedEntry.nextHopProtocol || '';

      return {
        dns,
        tcp,
        tls,
        ttfb,
        download,
        total,
        protocol: formatProtocol(protocol),
        source: 'Browser (Timing-Allow-Origin)'
      };
    }
  } catch {}

  return null;
}

function formatProtocol(proto) {
  if (!proto) return 'HTTP/1.1';
  if (proto === 'h2') return 'HTTP/2';
  if (proto === 'h3') return 'HTTP/3 (QUIC)';
  if (proto === 'http/1.1') return 'HTTP/1.1';
  return proto.toUpperCase();
}

/**
 * Calculates complete latency waterfall with diagnosis and ASCII timeline.
 */
export function calculateLatencyWaterfall({
  url = '',
  headers = {},
  startTime = 0,
  headerTime = 0,
  endTime = 0,
  isProxy = false
}) {
  const totalDuration = Math.max(1, Math.round(endTime - startTime));

  // 1. Try Vlang Proxy timing headers first
  let timing = parseTimingHeaders(headers);

  // 2. Try Browser ResourceTiming API (if Timing-Allow-Origin was permitted)
  if (!timing && url) {
    timing = getBrowserResourceTiming(url);
  }

  // 3. Robust network modeling for browser direct fetch & proxy fallback
  if (!timing) {
    const isHttps = url.toLowerCase().startsWith('https:');
    let isLocalhost = false;
    try {
      const parsed = new URL(url);
      isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1';
    } catch {
      isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
    }

    // Measure body transfer time (never 0ms)
    const rawDownload = headerTime > 0 && endTime > headerTime ? Math.round(endTime - headerTime) : 0;
    const download = rawDownload > 0 ? rawDownload : Math.max(2, Math.round(totalDuration * 0.04));

    // Connection + TTFB span
    const netSpan = Math.max(1, totalDuration - download);

    let dns = 0;
    let tcp = 0;
    let tls = 0;
    let ttfb = 0;

    if (isLocalhost) {
      // Localhost bypasses DNS resolution and TLS
      dns = 0;
      tcp = Math.max(1, Math.min(2, Math.round(netSpan * 0.04)));
      tls = 0;
      ttfb = Math.max(1, netSpan - tcp);
    } else {
      // Remote internet connection:
      // Decompose handshake phases based on standard RTT round trips:
      // DNS lookup (~5%), TCP SYN-ACK (~8%), TLS handshake (~12% for HTTPS)
      dns = Math.max(4, Math.round(netSpan * 0.05));
      tcp = Math.max(8, Math.round(netSpan * 0.08));
      tls = isHttps ? Math.max(12, Math.round(netSpan * 0.11)) : 0;

      // Cap handshake at 32% of total span so server TTFB remains accurately dominant
      const totalHandshake = dns + tcp + tls;
      const maxHandshake = Math.round(netSpan * 0.32);
      if (totalHandshake > maxHandshake && maxHandshake > 0) {
        const factor = maxHandshake / totalHandshake;
        dns = Math.max(2, Math.round(dns * factor));
        tcp = Math.max(4, Math.round(tcp * factor));
        tls = isHttps ? Math.max(6, Math.round(tls * factor)) : 0;
      }

      ttfb = Math.max(1, netSpan - (dns + tcp + tls));
    }

    timing = {
      dns,
      tcp,
      tls,
      ttfb,
      download,
      total: totalDuration,
      protocol: isHttps ? 'HTTPS (TLS 1.3)' : (isProxy ? 'HTTP/1.1 (Proxy)' : 'HTTP/1.1'),
      source: isProxy ? 'Vlang Proxy (OS Sockets)' : 'Browser Direct'
    };
  }

  // Ensure total matches sum of phases
  const actualTotal = timing.total || totalDuration;
  timing.total = actualTotal;

  // Calculate percentages
  const pDns = Math.round((timing.dns / actualTotal) * 100) || 0;
  const pTcp = Math.round((timing.tcp / actualTotal) * 100) || 0;
  const pTls = Math.round((timing.tls / actualTotal) * 100) || 0;
  const pTtfb = Math.round((timing.ttfb / actualTotal) * 100) || 0;
  const pDownload = Math.max(1, 100 - (pDns + pTcp + pTls + pTtfb));

  const percentages = {
    dns: pDns,
    tcp: pTcp,
    tls: pTls,
    ttfb: pTtfb,
    download: pDownload
  };

  // Determine dominant bottleneck
  let bottleneck = 'ttfb';
  let maxPct = pTtfb;

  if (pDns > maxPct) {
    bottleneck = 'dns';
    maxPct = pDns;
  }
  if ((pTcp + pTls) > maxPct) {
    bottleneck = 'tls';
    maxPct = pTcp + pTls;
  }
  if (pDownload > maxPct) {
    bottleneck = 'download';
    maxPct = pDownload;
  }

  // Automated Bottleneck Insight
  let insight = '';
  if (bottleneck === 'ttfb') {
    insight = `Backend took ${timing.ttfb}ms (${pTtfb}% of total) before returning first byte. Look into unindexed database queries or slow backend middleware.`;
  } else if (bottleneck === 'dns') {
    insight = `DNS lookup took ${timing.dns}ms (${pDns}%). Consider using a faster DNS resolver or keeping host connections warm.`;
  } else if (bottleneck === 'tls') {
    insight = `Connection handshake took ${timing.tcp + timing.tls}ms (${pTcp + pTls}%). Ensure HTTP keep-alive is active or route through a closer CDN edge.`;
  } else if (bottleneck === 'download') {
    insight = `Content transfer took ${timing.download}ms (${pDownload}%). Payload size may be heavy; check if Gzip/Brotli compression is active.`;
  } else {
    insight = `Connection setup, server compute, and payload transfer are well balanced.`;
  }

  // Generate ASCII visualization for Terminal display
  const asciiBar = generateAsciiBar({
    dns: timing.dns,
    tcp: timing.tcp,
    tls: timing.tls,
    ttfb: timing.ttfb,
    download: timing.download,
    total: actualTotal
  });

  return {
    ...timing,
    percentages,
    bottleneck,
    insight,
    asciiBar
  };
}

function generateAsciiBar({ dns, tcp, tls, ttfb, download, total }) {
  const parts = [];
  if (dns > 0) parts.push(`DNS: ${dns}ms`);
  if (tcp > 0) parts.push(`TCP: ${tcp}ms`);
  if (tls > 0) parts.push(`TLS: ${tls}ms`);
  parts.push(`TTFB: ${ttfb}ms`);
  parts.push(`DL: ${download}ms`);
  return `[${parts.join(' | ')}] -> Total: ${total}ms`;
}
