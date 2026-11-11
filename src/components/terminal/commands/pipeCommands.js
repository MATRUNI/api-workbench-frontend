import { callAPI } from '../../../services/api';
import { saveToHistory } from '../../../services/history';
import { setLastTimingTelemetry } from './utils';

function parsePipeTokens(rawCmd) {
  const withoutPipe = rawCmd.replace(/^pipe\s*/i, '').trim();
  if (!withoutPipe) return [];

  const tokens = [];
  let current = '';
  let inQuote = null;

  for (let i = 0; i < withoutPipe.length; i++) {
    const char = withoutPipe[i];
    if ((char === '"' || char === "'") && (i === 0 || withoutPipe[i - 1] !== '\\')) {
      if (inQuote === char) {
        inQuote = null;
      } else if (!inQuote) {
        inQuote = char;
      }
      current += char;
    } else if (char === '|' && !inQuote) {
      if (current.trim()) tokens.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens;
}

function getMergedTabData(id, tabMap, context) {
  const saved = tabMap.get(id) || {};
  if (id === context.tabCtx?.activeTab) {
    return {
      ...saved,
      url: context.url || saved.url,
      method: context.method || saved.method,
      request: context.request || saved.request,
      alias: saved.alias || ''
    };
  }
  return saved;
}

function resolveTab(token, tabMap, tabIds, context) {
  const clean = token.replace(/^["']|["']$/g, '').trim();
  if (!clean) return null;

  const num = parseInt(clean, 10);
  if (!Number.isNaN(num) && String(num) === clean) {
    if (num >= 1 && num <= tabIds.length) {
      const id = tabIds[num - 1];
      return {
        id,
        index: num,
        data: getMergedTabData(id, tabMap, context)
      };
    }
    return null;
  }

  const search = clean.toLowerCase();
  const exactIdx = tabIds.findIndex(id => {
    const d = tabMap.get(id);
    return (d?.alias || '').trim().toLowerCase() === search;
  });

  if (exactIdx !== -1) {
    const id = tabIds[exactIdx];
    return {
      id,
      index: exactIdx + 1,
      data: getMergedTabData(id, tabMap, context)
    };
  }

  const partialIdx = tabIds.findIndex(id => {
    const d = tabMap.get(id);
    const alias = (d?.alias || '').toLowerCase();
    const url = (d?.url || '').toLowerCase();
    return alias.includes(search) || url.includes(search);
  });

  if (partialIdx !== -1) {
    const id = tabIds[partialIdx];
    return {
      id,
      index: partialIdx + 1,
      data: getMergedTabData(id, tabMap, context)
    };
  }

  return null;
}

export async function handlePipeCommand(rawCmd, context) {
  const tabCtx = context.tabCtx;
  if (!tabCtx || !tabCtx.tabMap) {
    return {
      type: 'error',
      text: 'Workbench Tab context is currently not initialized.'
    };
  }

  const tokens = parsePipeTokens(rawCmd);
  if (tokens.length < 2) {
    return {
      type: 'info',
      text: 'Pipeline syntax: pipe <tab> | <tab> [| <tab> ...]\nExample: pipe 1 | 2 | 3\nEach tab can be a tab number or alias.'
    };
  }

  const { tabMap } = tabCtx;
  const tabIds = Array.from(tabMap.keys());
  const resolvedTabs = [];

  for (const token of tokens) {
    const resolved = resolveTab(token, tabMap, tabIds, context);
    if (!resolved) {
      return {
        type: 'error',
        text: `Pipeline error: Tab "${token}" could not be resolved. Open tabs range from 1 to ${tabIds.length}.`
      };
    }
    resolvedTabs.push(resolved);
  }

  let pipedData = null;
  const stageLogs = [];
  let totalLatency = 0;
  let finalResponse = null;

  for (let i = 0; i < resolvedTabs.length; i++) {
    const { id, index, data } = resolvedTabs[i];
    let method = (data.method || 'GET').toUpperCase();
    let url = data.url;

    if (!url || url === 'http://localhost:3000') {
      return {
        type: 'error',
        text: `Pipeline halted at Stage ${i + 1} (Tab #${index}): Target URL is empty or unconfigured.`
      };
    }

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    const stageRequest = {
      body: data.request?.body || '',
      contentType: data.request?.contentType || 'application/json',
      headers: [...(data.request?.headers || [])],
      query: [...(data.request?.query || [])],
      auth: data.request?.auth ? { ...data.request.auth } : { type: 'none' }
    };

    let pipedNote = '';

    if (pipedData !== null) {
      const token = pipedData?.token || pipedData?.access_token || pipedData?.accessToken || pipedData?.data?.token;
      if (token && (!stageRequest.auth || stageRequest.auth.type === 'none')) {
        stageRequest.auth = { type: 'bearer', token };
        pipedNote = ' [Bearer Injected]';
      }

      if (typeof pipedData === 'object' && pipedData !== null) {
        Object.entries(pipedData).forEach(([k, v]) => {
          if (typeof v === 'string' || typeof v === 'number') {
            url = url.replace(new RegExp(`:${k}\\b|\\{${k}\\}`, 'g'), String(v));
          }
        });
      }

      if (method !== 'GET' && method !== 'HEAD') {
        stageRequest.body = typeof pipedData === 'string' 
          ? pipedData 
          : JSON.stringify(pipedData, null, 2);
        stageRequest.contentType = 'application/json';
        pipedNote += ' [Body Piped]';
      }
    }

    const startTime = Date.now();
    let res;

    try {
      res = await callAPI(url, method, stageRequest, context.isProxyEnable);
    } catch (err) {
      const errRes = {
        status: err.status || 500,
        data: err.message || 'Network error',
        time: Date.now() - startTime
      };
      await saveToHistory(url, method, stageRequest, errRes);

      stageLogs.push(`  [${i + 1}/${resolvedTabs.length}] Tab #${index}${data.alias ? ` (${data.alias})` : ''} ${method} ${url} -> 500 ERROR (${Date.now() - startTime}ms)`);
      return {
        type: 'error',
        text: [
          `PIPELINE HALTED at Stage ${i + 1} of ${resolvedTabs.length}:`,
          ...stageLogs,
          `\nError: ${err.message || 'Network connection refused'}`
        ].join('\n')
      };
    }

    const duration = res.time || (Date.now() - startTime);
    totalLatency += Number(duration) || 0;
    finalResponse = res;

    if (res.timing) {
      setLastTimingTelemetry(res.timing);
    }

    await saveToHistory(url, method, stageRequest, res);

    if (tabCtx.setTabMap) {
      tabCtx.setTabMap(prev => {
        const next = new Map(prev);
        const cur = next.get(id) || {};
        next.set(id, {
          ...cur,
          url,
          method,
          request: stageRequest,
          response: res
        });
        return next;
      });
    }

    const isSuccess = res.status >= 200 && res.status < 400;
    const badge = `[${res.status} ${isSuccess ? 'OK' : 'ERR'}]`;
    stageLogs.push(`  [${i + 1}/${resolvedTabs.length}] Tab #${index}${data.alias ? ` (${data.alias})` : ''} ${method} ${url} -> ${badge} (${duration}ms)${pipedNote}`);

    if (!isSuccess) {
      return {
        type: 'error',
        text: [
          `PIPELINE HALTED at Stage ${i + 1} of ${resolvedTabs.length}:`,
          ...stageLogs,
          `\nResponse status: ${res.status}. Pipeline execution stopped.`
        ].join('\n')
      };
    }

    pipedData = res.data;
  }

  const lastTab = resolvedTabs[resolvedTabs.length - 1];
  if (tabCtx.handleTabSwitch) {
    tabCtx.handleTabSwitch(lastTab.id);
  }
  if (context.setURL) context.setURL(lastTab.data.url);
  if (context.setMethod) context.setMethod(lastTab.data.method);
  if (context.setResponse && finalResponse) context.setResponse(finalResponse);

  return {
    type: 'success',
    text: [
      `PIPELINE COMPLETE (${resolvedTabs.length} stages):`,
      ...stageLogs,
      `\nTotal Pipeline Latency: ${totalLatency}ms`,
      `Final output loaded into active Tab #${lastTab.index}${lastTab.data.alias ? ` (${lastTab.data.alias})` : ''}.`
    ].join('\n')
  };
}
