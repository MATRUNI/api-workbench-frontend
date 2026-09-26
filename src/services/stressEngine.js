import { ArrayToObject } from './ArrayToObject.js';
import { prepareRequest } from '../utils/requestUtils.js';
import APIMask from '../utils/APIMask.js';
import { customFetch } from './customFetch.js';
import { contentTypeHandlers } from './contentTypeHandler.js';
import { calculateLatencyWaterfall } from '../utils/networkTiming.js';

const HTTP_STATUS_TEXTS = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout'
};

function getStatusLabel(status) {
  if (status === 0 || status === 'NETWORK_ERROR') return 'Network Failure / CORS';
  if (status === 'TIMEOUT') return 'Timeout';
  if (status === 'ABORTED') return 'Aborted';
  return `${status} ${HTTP_STATUS_TEXTS[status] || 'Unknown Status'}`;
}

function calculatePercentile(sortedArray, p) {
  if (!sortedArray || sortedArray.length === 0) return 0;
  const index = (p / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (lower === upper) return sortedArray[lower];
  return Math.round((sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight) * 10) / 10;
}

const MAX_LATENCY_SAMPLES = 50000;
const MAX_STORED_RESPONSES = 250;

export function createStressRunner(config = {}) {
  const total = Math.max(1, Math.min(parseInt(config.totalRequests, 10) || 10, 250000));
  const concurrency = Math.max(1, Math.min(parseInt(config.concurrency, 10) || (config.serial ? 1 : 4), 250));
  const storeResponses = Boolean(config.storeResponses);
  const timeoutMs = parseInt(config.timeoutMs, 10) || 15000;
  const delayMs = Math.max(0, parseInt(config.delayBetweenRequestsMs, 10) || 0);

  const rawHeaders = Array.isArray(config.headers) 
    ? ArrayToObject(config.headers) 
    : (config.headers || {});
  const authHeaders = config.auth ? prepareRequest(config.auth) : {};

  let queryString = '';
  const rawQuery = Array.isArray(config.query)
    ? ArrayToObject(config.query)
    : (config.query || {});

  try {
    const urlObj = new URL(config.url);
    queryString = new URLSearchParams({
      ...Object.fromEntries(urlObj.searchParams),
      ...rawQuery
    }).toString();
  } catch {
    queryString = new URLSearchParams(rawQuery).toString();
  }

  const { isMasked, finalUrl } = APIMask(config.url || 'http://localhost:3000');
  const targetUrl = `${finalUrl.split('?')[0]}${queryString ? '?' + queryString : ''}`;

  const method = (config.method || 'GET').toUpperCase();
  const headers = {
    ...(method !== 'GET' && config.body ? { 'Content-Type': config.contentType || 'application/json' } : {}),
    ...authHeaders,
    ...rawHeaders
  };

  const bodyData = method !== 'GET' && config.body 
    ? (typeof config.body === 'string' ? config.body : JSON.stringify(config.body))
    : undefined;

  const shouldUseProxy = Boolean(config.isProxyEnable) && !isMasked;
  const proxyPort = (typeof window !== 'undefined' && window.__proxy_port) || 17777;
  const proxyUrl = shouldUseProxy 
    ? `http://127.0.0.1:${proxyPort}/?url=${encodeURIComponent(targetUrl)}` 
    : targetUrl;

  const internalAbortController = new AbortController();
  if (config.signal) {
    config.signal.addEventListener('abort', () => internalAbortController.abort(), { once: true });
  }

  let isRunning = false;
  let isAborted = false;
  let inFlight = 0;
  let completed = 0;
  let successCount = 0;
  let failureCount = 0;

  const statusCounts = {};
  const latencies = [];
  const errorCounts = {};
  const sampleErrors = [];
  const sampleErrorsSet = new Set();
  const statusSamples = new Map(); // status -> { status, count, totalLatency, minLatency, maxLatency, data, headers, error }
  const recentLatencies = [];

  let sampleResponse = null;
  let minLatency = Infinity;
  let maxLatency = 0;
  let totalLatencySum = 0;

  let rateLimitDetected = false;
  let rateLimitDetails = null;

  let startTime = 0;
  let endTime = 0;

  const executeSingle = async (index) => {
    if (isAborted || internalAbortController.signal.aborted) return;

    inFlight++;
    const reqStart = performance.now();
    let status = 0;
    let errorMessage = null;
    let responseData = null;

    const reqAbortController = new AbortController();
    const abortListener = () => reqAbortController.abort();
    internalAbortController.signal.addEventListener('abort', abortListener, { once: true });

    const timer = setTimeout(() => {
      reqAbortController.abort('TIMEOUT');
    }, timeoutMs);

    let sampleHeaders = null;

    try {
      const fetchOpts = {
        method,
        headers: { ...headers },
        body: bodyData,
        signal: reqAbortController.signal,
        ...(shouldUseProxy ? { credentials: 'include' } : {})
      };

      let res;
      if (shouldUseProxy) {
        try {
          res = await fetch(proxyUrl, fetchOpts);
        } catch (proxyError) {
          // If proxy drops or is unreachable, fall back to direct/custom fetch
          res = isMasked
            ? await customFetch(targetUrl, fetchOpts)
            : await fetch(targetUrl, fetchOpts);
        }
      } else {
        res = isMasked
          ? await customFetch(targetUrl, fetchOpts)
          : await fetch(targetUrl, fetchOpts);
      }

      clearTimeout(timer);
      const reqDuration = Math.round(performance.now() - reqStart);
      status = res.status;

      if (res && res.headers) {
        sampleHeaders = Object.fromEntries(res.headers.entries());
      }

      if (res.headers.has('retry-after') || status === 429) {
        rateLimitDetected = true;
        rateLimitDetails = res.headers.get('retry-after') 
          ? `Retry-After: ${res.headers.get('retry-after')}s` 
          : 'HTTP 429 Throttled';
      }

      // Capture one primary sample response for the run (from the first completed response)
      if (!sampleResponse && res) {
        try {
          const resClone = res.clone();
          const contentType = (res.headers.get("content-type") || "").split(';')[0];
          const handlerFunction = contentTypeHandlers[contentType] || contentTypeHandlers["default"];
          const parsed = await handlerFunction(resClone);

          let timing = null;
          try {
            timing = calculateLatencyWaterfall({
              url: targetUrl,
              headers: sampleHeaders || {},
              startTime: reqStart,
              headerTime: reqStart + Math.round(reqDuration * 0.7),
              endTime: reqStart + reqDuration,
              isProxy: shouldUseProxy
            });
          } catch {}

          sampleResponse = {
            status: res.status,
            headers: sampleHeaders || {},
            data: parsed.data,
            rawData: parsed.rawData !== undefined ? parsed.rawData : parsed.data,
            length: parsed.length,
            type: parsed.type,
            category: parsed.category,
            time: reqDuration,
            timing,
            url: targetUrl,
            proxyUsed: shouldUseProxy,
            executionRoute: shouldUseProxy ? 'proxy' : (isMasked ? 'customFetch' : 'browser')
          };
          responseData = parsed.data;
        } catch (parseErr) {
          console.warn('Could not parse sample response:', parseErr);
        }
      }

      // Group samples by status: only clone body for the FIRST response of each unique status code
      let statusEntry = statusSamples.get(status);
      if (!statusEntry) {
        if (!responseData && res) {
          try {
            const resClone = res.clone();
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              responseData = await resClone.json();
            } else {
              const text = await resClone.text();
              responseData = text.length > 2500 ? text.slice(0, 2500) + '... (truncated)' : text;
            }
          } catch {
            responseData = null;
          }
        }
        statusSamples.set(status, {
          status,
          count: 1,
          totalLatency: reqDuration,
          minLatency: reqDuration,
          maxLatency: reqDuration,
          data: responseData,
          headers: sampleHeaders,
          error: errorMessage
        });
      } else {
        statusEntry.count++;
        statusEntry.totalLatency += reqDuration;
        if (reqDuration < statusEntry.minLatency) statusEntry.minLatency = reqDuration;
        if (reqDuration > statusEntry.maxLatency) statusEntry.maxLatency = reqDuration;
        if (!statusEntry.data && responseData) statusEntry.data = responseData;
        if (!statusEntry.error && errorMessage) statusEntry.error = errorMessage;
      }

      // Cancel body stream immediately for maximum throughput
      if (res && res.body && typeof res.body.cancel === 'function') {
        res.body.cancel().catch(() => {});
      }

      totalLatencySum += reqDuration;
      if (reqDuration < minLatency) minLatency = reqDuration;
      if (reqDuration > maxLatency) maxLatency = reqDuration;

      if (latencies.length < MAX_LATENCY_SAMPLES) {
        latencies.push(reqDuration);
      } else {
        const r = Math.floor(Math.random() * (completed + 1));
        if (r < MAX_LATENCY_SAMPLES) latencies[r] = reqDuration;
      }

      recentLatencies.push(reqDuration);
      if (recentLatencies.length > 25) recentLatencies.shift();

      if (status >= 200 && status < 400) {
        successCount++;
      } else {
        failureCount++;
      }

    } catch (err) {
      clearTimeout(timer);
      const reqDuration = Math.round(performance.now() - reqStart);
      
      totalLatencySum += reqDuration;
      if (reqDuration < minLatency) minLatency = reqDuration;
      if (reqDuration > maxLatency) maxLatency = reqDuration;

      if (latencies.length < MAX_LATENCY_SAMPLES) {
        latencies.push(reqDuration);
      } else {
        const r = Math.floor(Math.random() * (completed + 1));
        if (r < MAX_LATENCY_SAMPLES) latencies[r] = reqDuration;
      }

      if (err.name === 'AbortError' || err === 'TIMEOUT' || internalAbortController.signal.aborted) {
        status = internalAbortController.signal.aborted ? 'ABORTED' : 'TIMEOUT';
        errorMessage = status === 'TIMEOUT' ? `Timed out after ${timeoutMs}ms` : 'Request aborted by user';
      } else {
        status = 'NETWORK_ERROR';
        errorMessage = err.message || 'Network connection failed / CORS blocked';
      }

      failureCount++;
      errorCounts[errorMessage] = (errorCounts[errorMessage] || 0) + 1;
      if (sampleErrors.length < 50) {
        if (!sampleErrorsSet.has(errorMessage)) {
          sampleErrorsSet.add(errorMessage);
          sampleErrors.push({ index: index + 1, message: errorMessage });
        } else if (sampleErrors.length < 20) {
          sampleErrors.push({ index: index + 1, message: errorMessage });
        }
      }

      let statusEntry = statusSamples.get(status);
      if (!statusEntry) {
        statusSamples.set(status, {
          status,
          count: 1,
          totalLatency: reqDuration,
          minLatency: reqDuration,
          maxLatency: reqDuration,
          data: null,
          headers: null,
          error: errorMessage
        });
      } else {
        statusEntry.count++;
        statusEntry.totalLatency += reqDuration;
        if (reqDuration < statusEntry.minLatency) statusEntry.minLatency = reqDuration;
        if (reqDuration > statusEntry.maxLatency) statusEntry.maxLatency = reqDuration;
      }
    } finally {
      internalAbortController.signal.removeEventListener('abort', abortListener);
      inFlight--;
      completed++;

      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (delayMs > 0 && !isAborted) {
        await new Promise(r => setTimeout(r, delayMs));
      }

      emitProgress();
    }
  };

  const getAggregatedStatusSamples = () => {
    return Array.from(statusSamples.values()).map(e => ({
      status: e.status,
      count: e.count,
      avgLatency: Math.round(e.totalLatency / Math.max(1, e.count)),
      minLatency: e.minLatency,
      maxLatency: e.maxLatency,
      data: e.data,
      headers: e.headers,
      error: e.error
    })).sort((a, b) => b.count - a.count);
  };

  let progressCb = null;
  let lastEmitTime = 0;
  const emitProgress = (force = false) => {
    if (!progressCb) return;
    const now = performance.now();
    if (!force && now - lastEmitTime < 35 && completed < total) return;
    lastEmitTime = now;

    const elapsedMs = Math.round(now - (startTime || now));
    const currentRps = elapsedMs > 0 ? Math.round((completed / (elapsedMs / 1000)) * 10) / 10 : 0;
    const percent = Math.min(100, Math.round((completed / total) * 100));

    progressCb({
      completed,
      total,
      inFlight,
      percent,
      elapsedMs,
      currentRps,
      successCount,
      failureCount,
      statusCounts: { ...statusCounts },
      recentLatencies: [...recentLatencies],
      lastLatency: latencies[latencies.length - 1] || 0,
      aborted: isAborted,
      sampleResponse,
      storedResponses: getAggregatedStatusSamples(),
      sampleErrors
    });
  };

  const run = async (callbacks = {}) => {
    if (isRunning) throw new Error('Stress runner is already executing.');
    isRunning = true;
    isAborted = false;
    startTime = performance.now();

    if (callbacks.onProgress) progressCb = callbacks.onProgress;
    if (callbacks.onStart) {
      callbacks.onStart({
        total,
        concurrency,
        method,
        url: targetUrl,
        mode: concurrency === 1 ? 'SERIAL' : 'PARALLEL'
      });
    }

    emitProgress(true);

    let nextRequestIndex = 0;
    const workerCount = Math.min(concurrency, total);

    const workerPromises = Array.from({ length: workerCount }, async () => {
      while (!isAborted && !internalAbortController.signal.aborted) {
        const itemIdx = nextRequestIndex++;
        if (itemIdx >= total) break;
        await executeSingle(itemIdx);
      }
    });

    await Promise.all(workerPromises);

    endTime = performance.now();
    isRunning = false;

    const totalElapsedMs = Math.max(1, Math.round(endTime - startTime));
    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const throughputRps = Math.round((completed / (totalElapsedMs / 1000)) * 10) / 10;
    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;

    const statusBreakdown = Object.entries(statusCounts).map(([code, count]) => ({
      status: isNaN(Number(code)) ? code : Number(code),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      label: getStatusLabel(isNaN(Number(code)) ? code : Number(code))
    })).sort((a, b) => b.count - a.count);

    const errorBreakdown = Object.entries(errorCounts).map(([message, count]) => ({
      message,
      count
    })).sort((a, b) => b.count - a.count);

    const aggregatedSamples = getAggregatedStatusSamples();

    const finalReport = {
      target: { method, url: targetUrl },
      mode: concurrency === 1 ? 'SERIAL' : 'PARALLEL',
      concurrency,
      totalRequests: total,
      completedRequests: completed,
      successCount,
      failureCount,
      successRate,
      elapsedMs: totalElapsedMs,
      throughputRps,
      latencies: {
        min: completed > 0 && minLatency !== Infinity ? minLatency : 0,
        max: completed > 0 ? maxLatency : 0,
        avg: completed > 0 ? Math.round(totalLatencySum / completed) : 0,
        median: calculatePercentile(sortedLatencies, 50),
        p90: calculatePercentile(sortedLatencies, 90),
        p95: calculatePercentile(sortedLatencies, 95),
        p99: calculatePercentile(sortedLatencies, 99)
      },
      statusBreakdown,
      errorBreakdown,
      sampleErrors,
      rateLimitDetected,
      rateLimitDetails,
      aborted: isAborted || internalAbortController.signal.aborted,
      sampleResponse,
      storedResponses: aggregatedSamples
    };

    if (callbacks.onComplete) {
      callbacks.onComplete(finalReport);
    }

    return finalReport;
  };

  const abort = () => {
    if (isAborted || (!isRunning && completed === total)) return;
    isAborted = true;
    internalAbortController.abort();
    emitProgress();
  };

  return {
    run,
    abort,
    isRunning: () => isRunning,
    getTarget: () => ({ method, url: targetUrl, total, concurrency })
  };
}
