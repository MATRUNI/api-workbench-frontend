import { callAPI } from '../../../services/api';
import { saveToHistory } from '../../../services/history';
import { parseWithClauses, setLastTimingTelemetry } from './utils';

export async function handleHttpDispatch(cmd, context) {
  let method = 'GET';
  let url = '';
  let withClause = '';
  let isDry = false;
  let isProxy = false;

  if (/^curl\b/i.test(cmd)) {
    const urlMatch = cmd.match(/['"](https?:\/\/[^'"]+)['"]|(https?:\/\/[^\s]+)/i);
    if (!urlMatch) {
      return { type: 'error', text: 'Invalid cURL: No valid HTTP/HTTPS URL found in command.' };
    }
    url = urlMatch[1] || urlMatch[2];

    const methodMatch = cmd.match(/-X\s+([A-Z]+)/i);
    if (methodMatch) method = methodMatch[1].toUpperCase();
    else if (/-d\s+|--data/i.test(cmd)) method = 'POST';
  } else {
    isDry = /--dry\b/i.test(cmd);
    isProxy = /--proxy\b/i.test(cmd);

    let cleanCmd = cmd.replace(/--dry\b/i, '').replace(/--proxy\b/i, '').trim();

    if (/^send\b/i.test(cleanCmd)) {
      cleanCmd = cleanCmd.replace(/^send\s+/i, '').trim();
    }

    const verbMatch = cleanCmd.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+/i);
    if (verbMatch) {
      method = verbMatch[1].toUpperCase();
      cleanCmd = cleanCmd.slice(verbMatch[0].length).trim();
    }

    const withIdx = cleanCmd.search(/\bwith\b/i);
    if (withIdx !== -1) {
      url = cleanCmd.slice(0, withIdx).trim();
      withClause = cleanCmd.slice(withIdx + 4).trim();
    } else {
      url = cleanCmd.trim();
    }

    if (method === 'GET' && /\b(-b|body:?|b:?)\b/i.test(withClause)) {
      method = 'POST';
    }
  }

  if (!url) {
    return {
      type: 'error',
      text: 'Missing Target URL. Syntax: send [METHOD] <https://api.example.com> [with ...]'
    };
  }

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const modifiers = parseWithClauses(withClause);

  const finalRequest = {
    body: modifiers.body !== null ? modifiers.body : context.request?.body,
    contentType: modifiers.body !== null ? 'application/json' : (context.request?.contentType || 'application/json'),
    headers: modifiers.headers.length > 0 ? modifiers.headers : (context.request?.headers || []),
    query: modifiers.query.length > 0 ? modifiers.query : (context.request?.query || []),
    auth: modifiers.auth || context.request?.auth || { type: 'none' }
  };

  const isNewTab = /--tab\b|--new\b/i.test(cmd);
  if (isNewTab && context.tabCtx?.handleAddTab) {
    context.tabCtx.handleAddTab({
      url,
      method,
      request: finalRequest,
      alias: `${method} ${url.replace(/^https?:\/\//, '').slice(0, 20)}`
    });
    if (context.navigate) {
      context.navigate('/endpoints');
    }
  } else {
    if (context.setURL) context.setURL(url);
    if (context.setMethod) context.setMethod(method);
    if (context.setRequest) context.setRequest(finalRequest);
  }

  if (isDry) {
    return {
      type: 'success',
      text: [
        `[DRY-RUN] Synchronized with active Workbench tab:`,
        `  Method: ${method}`,
        `  URL: ${url}`,
        `  Headers: ${finalRequest.headers.length} configured`,
        `  Auth: ${finalRequest.auth?.type || 'none'}`,
        `  Body: ${finalRequest.body ? (typeof finalRequest.body === 'object' ? JSON.stringify(finalRequest.body) : finalRequest.body) : 'none'}`
      ].join('\n')
    };
  }

  try {
    const startTime = Date.now();
    const res = await callAPI(url, method, finalRequest, isProxy || context.isProxyEnable);
    const duration = Date.now() - startTime;

    if (context.setResponse) {
      context.setResponse(res);
    }
    if (res.timing) {
      setLastTimingTelemetry(res.timing);
    }

    await saveToHistory(url, method, finalRequest, res);

    const statusBadge = `[${res.status} ${res.status >= 200 && res.status < 300 ? 'OK' : 'RESPONSE'}]`;
    const timing = res.timing;

    let previewBody = '';
    if (res.data) {
      previewBody = typeof res.data === 'string' ? res.data.slice(0, 300) : JSON.stringify(res.data).slice(0, 300);
      if (previewBody.length >= 300) previewBody += '... (truncated in terminal, view full in Response tab)';
    }

    const timingSummary = timing ? [
      `Waterfall: ${timing.asciiBar || ''}`,
      `Insight:   ${timing.insight || ''}`
    ].filter(Boolean).join('\n') : '';

    const routeTag = res.proxyUsed ? 'Proxy (Vlang)' : 'Browser Direct';

    return {
      type: res.status >= 200 && res.status < 300 ? 'success' : 'error',
      text: [
        `${statusBadge} ${method} ${url}`,
        `Route: ${routeTag} | Latency: ${res.time || duration}ms | Size: ${res.length || '0 B'} | Type: ${res.type || 'JSON'} | Protocol: ${timing?.protocol || 'HTTP/1.1'}`,
        timingSummary,
        previewBody ? `\nPayload Preview:\n${previewBody}` : ''
      ].filter(Boolean).join('\n')
    };
  } catch (err) {
    const errObj = {
      status: err.status || '500',
      data: err.message,
      time: '0 ms'
    };
    if (context.setResponse) {
      context.setResponse(errObj);
    }
    await saveToHistory(url, method, finalRequest, errObj);

    return {
      type: 'error',
      text: `[REQUEST FAILED] ${method} ${url}\nError: ${err.message || 'Network connection refused'}`
    };
  }
}
