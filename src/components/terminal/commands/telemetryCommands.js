import { getAllDatabaseStats, clearHistory, getHistory } from '../../../services/history';
import { getLastTimingTelemetry } from './utils';

export function handleTimingCommand(context) {
  const timing = context.response?.timing || getLastTimingTelemetry();
  if (!timing) {
    return {
      type: 'suggestion',
      text: [
        'NO LATENCY TELEMETRY RECORDED:',
        '  Execute an HTTP request first (e.g. `get https://api.github.com` or via Workbench).',
        '  The waterfall profiler will analyze DNS, TCP, TLS, and TTFB phases.'
      ].join('\n')
    };
  }

  return {
    type: 'telemetry',
    text: [
      'NETWORK LATENCY WATERFALL PROFILE:',
      `  Total Duration: ${timing.total} ms | Protocol: ${timing.protocol} | Source: ${timing.source}`,
      `  Waterfall:      ${timing.asciiBar}`,
      '',
      '  PHASE BREAKDOWN:',
      `    • DNS Lookup:        ${timing.dns} ms (${timing.percentages.dns}%)`,
      `    • TCP Connect:       ${timing.tcp} ms (${timing.percentages.tcp}%)`,
      `    • TLS Cryptography:  ${timing.tls} ms (${timing.percentages.tls}%)`,
      `    • Server TTFB:       ${timing.ttfb} ms (${timing.percentages.ttfb}%) [Origin Processing]`,
      `    • Content Download:  ${timing.download} ms (${timing.percentages.download}%)`,
      '',
      `  DIAGNOSTIC INSIGHT:`,
      `    ${timing.insight}`
    ].join('\n')
  };
}

export async function handleDatabaseStatsCommand() {
  try {
    const stats = await getAllDatabaseStats();
    return {
      type: 'telemetry',
      text: [
        'INDEXED_DB TABLE TELEMETRY AUDIT:',
        `  • [Database: api_os_history_db] -> Table: history`,
        `    Role: HTTP Request Execution History (Console Tab)`,
        `    Records: ${stats.history.count} records | Footprint: ${stats.history.formatted}`,
        '',
        `  • [Database: lists] -> Table: jsonList`,
        `    Role: Schema Intelligence & Key Frequency Model`,
        `    Records: ${stats.lists.count} records | Footprint: ${stats.lists.formatted}`,
        '',
        `  Total Storage Allocated: ${stats.totalFormatted} across 2 active tables.`
      ].join('\n')
    };
  } catch (err) {
    return {
      type: 'error',
      text: `Failed to inspect IndexedDB tables: ${err.message}`
    };
  }
}

export async function handleHistoryCommand(cmd) {
  const lower = cmd.toLowerCase().trim();

  if (lower === 'history size') {
    try {
      const stats = await getAllDatabaseStats();
      return {
        type: 'telemetry',
        text: [
          'INDEXED_DB STORAGE TELEMETRY:',
          `  Database: api_os_history_db`,
          `  Primary Table: history`,
          `  Footprint: ${stats.history.formatted} (${stats.history.count} records)`,
          `  Status: Synchronized with Console tab & Profile Matrix`
        ].join('\n')
      };
    } catch (err) {
      return {
        type: 'error',
        text: `Failed to read history table size: ${err.message}`
      };
    }
  }

  if (lower === 'history clear') {
    try {
      await clearHistory();
      return {
        type: 'success',
        text: 'IndexedDB history table (api_os_history_db -> history) purged successfully.'
      };
    } catch (err) {
      return {
        type: 'error',
        text: `Failed to clear history: ${err.message}`
      };
    }
  }

  try {
    const limitMatch = cmd.match(/limit\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1], 10) : 10;
    const records = await getHistory({ limit });

    if (!records || records.length === 0) {
      return {
        type: 'info',
        text: 'IndexedDB history table is currently empty (0 records).\nExecute a request from Endpoints or type "send https://jsonplaceholder.typicode.com/posts/1" to record history.'
      };
    }

    const rows = records.map((r, i) => {
      const time = r.response?.time || '0ms';
      const status = r.response?.status || 'N/A';
      const size = r.response?.length || r.size || '0 B';
      const timing = r.response?.timing || r.timing;
      const timingDetail = timing 
        ? ` | DNS: ${timing.dns || 0}ms, TCP: ${timing.tcp || 0}ms, TTFB: ${timing.ttfb || 0}ms` 
        : '';
      return `[${i + 1}] ${r.method.padEnd(6)} ${r.url}\n    Status: ${status} | Time: ${time}${timingDetail} | Size: ${size}`;
    }).join('\n');

    return {
      type: 'telemetry',
      text: `INDEXED_DB RECENT LOGS (${records.length} records shown):\n${rows}`
    };
  } catch (err) {
    return {
      type: 'error',
      text: `Failed to query IndexedDB history: ${err.message}`
    };
  }
}
