import { callAPI } from '../../services/api';
import { saveToHistory, getHistory, getHistoryTableSize, clearHistory, getAllDatabaseStats } from '../../services/history';

/**
 * Parses modifier clauses after 'with'.
 * Format: with [-a <val>] [& -h <val>] [& -q <val>] [& -b <val>]
 * Supports both & delimiter and flag prefixes.
 */
export function parseWithClauses(withStr) {
  const result = {
    auth: null,
    headers: [],
    query: [],
    body: null
  };

  if (!withStr) return result;

  // Split clauses by '&'
  const rawClauses = withStr.split('&').map(c => c.trim()).filter(Boolean);

  for (const clause of rawClauses) {
    // Check auth flag: -a or auth:
    const authMatch = clause.match(/^(-a|auth:?)\s+(.*)$/i);
    if (authMatch) {
      const val = authMatch[2].trim();
      if (/^bearer\s+/i.test(val)) {
        result.auth = { type: 'bearer', token: val.replace(/^bearer\s+/i, '').trim() };
      } else if (/^basic\s+/i.test(val)) {
        const creds = val.replace(/^basic\s+/i, '').trim().split(':');
        result.auth = { type: 'basic', username: creds[0] || '', password: creds[1] || '' };
      } else {
        result.auth = { type: 'bearer', token: val };
      }
      continue;
    }

    // Check headers flag: -h or headers: / h:
    const headerMatch = clause.match(/^(-h|headers:?|h:?)\s+(.*)$/i);
    if (headerMatch) {
      const rawPairs = headerMatch[2].trim();
      // Handle comma-separated or space-separated key=val
      const pairs = rawPairs.split(/,\s*(?=[A-Za-z0-9_-]+=)/);
      for (const pair of pairs) {
        const eqIdx = pair.indexOf('=');
        if (eqIdx !== -1) {
          result.headers.push({
            key: pair.slice(0, eqIdx).trim(),
            value: pair.slice(eqIdx + 1).replace(/^["']|["']$/g, '').trim()
          });
        }
      }
      continue;
    }

    // Check query flag: -q or query: / q:
    const queryMatch = clause.match(/^(-q|query:?|q:?)\s+(.*)$/i);
    if (queryMatch) {
      const rawPairs = queryMatch[2].trim();
      const pairs = rawPairs.split(/,\s*(?=[A-Za-z0-9_-]+=)/);
      for (const pair of pairs) {
        const eqIdx = pair.indexOf('=');
        if (eqIdx !== -1) {
          result.query.push({
            key: pair.slice(0, eqIdx).trim(),
            value: pair.slice(eqIdx + 1).replace(/^["']|["']$/g, '').trim()
          });
        }
      }
      continue;
    }

    // Check body flag: -b or body: / b:
    const bodyMatch = clause.match(/^(-b|body:?|b:?)\s+([\s\S]*)$/i);
    if (bodyMatch) {
      const rawBody = bodyMatch[2].trim();
      try {
        result.body = JSON.parse(rawBody);
      } catch (e) {
        result.body = rawBody.replace(/^["']|["']$/g, '');
      }
      continue;
    }
  }

  return result;
}

/**
 * Main command parser and router.
 */
export async function executeTerminalCommand(rawCmd, context) {
  const cmd = rawCmd.trim();
  if (!cmd) return null;

  const lower = cmd.toLowerCase();

  // 1. HELP MATRIX
  if (lower === 'help' || lower === '?') {
    return {
      type: 'suggestion',
      text: [
        'COMMAND MATRIX & SYNTAX GUIDE:',
        '  HTTP DISPATCH:',
        '    send [METHOD] [URL] with -a & -h & -q & -b   Execute HTTP request',
        '    get | post | put | delete | patch <url>       Direct verb shortcuts',
        '    curl <command>                               Parse and run cURL snippet',
        '    --new / --tab                                Execute in fresh Workbench Tab',
        '    --dry                                         Sync tab state without sending',
        '',
        '  WORKBENCH TAB MANAGEMENT:',
        '    tab [list | ls]                              List open tabs and active state',
        '    tab <n> | tab switch <n>                     Switch to tab #n or by name',
        '    tab next | tab prev                          Cycle to next or previous tab',
        '    tab new [method] [url] [with ...]            Create pre-configured new tab',
        '    tab close [n] | tab close other              Close active tab or other tabs',
        '    tab dup [n]                                  Duplicate active or specified tab',
        '    tab rename <name>                            Set custom alias for active tab',
        '    tab method <METHOD>                          Change active tab HTTP method',
        '',
        '  WORKSPACE ROUTE NAVIGATION:',
        '    goto | nav | open <view>                     Navigate to workspace view',
        '    workbench | console | library | docs         Direct view shortcuts',
        '    chat | profile | home | auth | home',
        '',
        '  INDEXED_DB & TELEMETRY:',
        '    history [size | clear | limit <n>]            Query real IndexedDB history',
        '    db [stats | audit | tables]                   Audit all IndexedDB tables',
        '    clear                                         Purge terminal output buffer'
      ].join('\n')
    };
  }

  // 2. CLEAR BUFFER
  if (lower === 'clear') {
    return { type: 'clear' };
  }

  // 3. LIBRARY OPERATIONS: library list, library search, library get, api list
  if (/^(library|lib)\s+/i.test(cmd) || /^(api)\s+(list|search|get|load)\b/i.test(cmd)) {
    return handleLibraryCommand(cmd, context);
  }

  // 4. WORKSPACE NAVIGATION: goto, nav, open, navigate or direct view names
  const isNavVerb = /^(goto|nav|open|navigate)\b/i.test(cmd);
  const isDirectNav = /^(workbench|home|endpoints|docs|documentation|profile|manifest|library|chat|matrix)\b$/i.test(cmd);

  if (isNavVerb || isDirectNav) {
    return handleNavigationCommand(cmd, context);
  }

  // 4. DATABASE TABLES AUDIT (Audits both api_os_history_db and lists)
  if (lower === 'db' || lower.startsWith('db ') || lower === 'tables') {
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

  // 5. HISTORY COMMANDS
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

  if (lower === 'history' || lower.startsWith('history ')) {
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
        return `[${i + 1}] ${r.method.padEnd(6)} ${r.url}\n    Status: ${status} | Time: ${time} | Size: ${size}`;
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

  // 6. TAB MANAGEMENT (tab, tabs, tnext, tprev, t <n>, tab <n>)
  const isTabCmd = /^(tab|tabs|tnext|tprev)\b/i.test(cmd) || /^t\s+/i.test(cmd);
  if (isTabCmd) {
    return handleTabCommand(cmd, context);
  }

  // 7. HTTP REQUEST EXECUTION (send, get, post, put, delete, patch, curl)
  const isHttpVerb = /^(send|get|post|put|delete|patch|head|options)\b/i.test(cmd);
  const isCurl = /^curl\b/i.test(cmd);

  if (isHttpVerb || isCurl) {
    return await handleHttpDispatch(cmd, context);
  }

  // Fallback for unrecognized command
  return {
    type: 'echo',
    text: `Command not recognized: "${cmd}". Type "help" to view syntax matrix.`
  };
}

/**
 * Route dictionary for app navigation.
 */
const ROUTE_MAP = {
  endpoints: { path: '/endpoints', label: 'API Workbench (Endpoints & Request Builder)' },
  workbench: { path: '/endpoints', label: 'API Workbench (Endpoints & Request Builder)' },
  workspace: { path: '/endpoints', label: 'API Workbench (Endpoints & Request Builder)' },
  api: { path: '/endpoints', label: 'API Workbench (Endpoints & Request Builder)' },
  builder: { path: '/endpoints', label: 'API Workbench (Endpoints & Request Builder)' },

  console: { path: '/console', label: 'Request Console & Telemetry' },
  logs: { path: '/console', label: 'Request Console & Telemetry' },
  telemetry: { path: '/console', label: 'Request Console & Telemetry' },

  library: { path: '/fetch', label: 'API Library Hub' },
  fetch: { path: '/fetch', label: 'API Library Hub' },
  apis: { path: '/fetch', label: 'API Library Hub' },

  docs: { path: '/docs', label: 'API Documentation' },
  documentation: { path: '/docs', label: 'API Documentation' },

  chat: { path: '/chat', label: 'Comm Matrix Shell' },
  matrix: { path: '/chat', label: 'Comm Matrix Shell' },
  comm: { path: '/chat', label: 'Comm Matrix Shell' },

  profile: { path: '/profile', label: 'User Profile Manifest' },
  manifest: { path: '/profile', label: 'User Profile Manifest' },
  user: { path: '/profile', label: 'User Profile Manifest' },

  home: { path: '/', label: 'System Hero Landing' },
  hero: { path: '/', label: 'System Hero Landing' },

  auth: { path: '/auth', label: 'Authentication & Session Gate' },
  login: { path: '/auth', label: 'Authentication & Session Gate' },

  onboarding: { path: '/onboarding', label: 'System Onboarding' }
};

/**
 * Handles workspace view navigation.
 */
function handleNavigationCommand(cmd, context) {
  if (!context.navigate) {
    return {
      type: 'error',
      text: 'Navigation service is currently unavailable.'
    };
  }

  const parts = cmd.trim().split(/\s+/);
  let target = '';

  if (['goto', 'nav', 'open', 'navigate'].includes(parts[0].toLowerCase())) {
    target = parts[1]?.toLowerCase();
  } else {
    target = parts[0].toLowerCase();
  }

  if (!target) {
    return {
      type: 'suggestion',
      text: [
        'AVAILABLE WORKSPACE ROUTES:',
        '  • goto endpoints (or workbench) -> Request Builder & Response Viewer',
        '  • goto console   (or console)   -> IndexedDB History & Request Logs',
        '  • goto library   (or library)   -> Pre-configured API Hub',
        '  • goto docs      (or docs)      -> Interactive Documentation',
        '  • goto chat      (or chat)      -> Comm Matrix Shell',
        '  • goto profile   (or profile)   -> User Manifest & Statistics',
        '  • goto home      (or home)      -> System Hero Landing',
        '  • goto auth      (or auth)      -> Session & Authentication'
      ].join('\n')
    };
  }

  const match = ROUTE_MAP[target];
  if (match) {
    context.navigate(match.path);
    return {
      type: 'success',
      text: `Navigated to ${match.label} [${match.path}].`
    };
  }

  return {
    type: 'error',
    text: `Unknown destination "${target}". Available: workbench, console, library, docs, chat, profile, home, auth.`
  };
}

/**
 * Handles Workbench Tab management.
 */
function handleTabCommand(cmd, context) {
  const tabCtx = context.tabCtx;
  if (!tabCtx) {
    return {
      type: 'error',
      text: 'Workbench Tab context is currently not initialized.'
    };
  }

  const {
    tabMap,
    activeTab,
    handleTabSwitch,
    handleAddTab,
    handleCloseTab,
    handleCloseOtherTabs,
    handleDuplicateTab,
    handleRenameTab,
    handleSetTabMethod
  } = tabCtx;

  const tabIds = tabMap ? Array.from(tabMap.keys()) : [];
  const parts = cmd.trim().split(/\s+/);
  let sub = parts[1]?.toLowerCase();

  // Handle shorthands
  if (cmd.toLowerCase() === 'tnext') sub = 'next';
  if (cmd.toLowerCase() === 'tprev') sub = 'prev';
  if (cmd.toLowerCase() === 'tabs') sub = 'list';

  const getActiveIndex = () => tabIds.indexOf(activeTab);

  // 1. LIST TABS: tab, tab list, tab ls, tabs
  if (!sub || sub === 'list' || sub === 'ls') {
    if (tabIds.length === 0) {
      return { type: 'info', text: 'No active tabs in Workbench.' };
    }

    const rows = tabIds.map((id, index) => {
      const data = id === activeTab
        ? { url: context.url || 'http://localhost:3000', method: context.method || 'GET', alias: tabMap.get(id)?.alias }
        : tabMap.get(id) || {};
      const num = `[#${index + 1}]`;
      const m = (data.method || 'GET').padEnd(7);
      const u = data.url || '(Empty URL)';
      const alias = data.alias ? ` (${data.alias})` : '';
      const isActive = id === activeTab ? ' [ACTIVE]' : '';
      return `  ${num} ${m} ${u}${alias}${isActive}`;
    }).join('\n');

    return {
      type: 'telemetry',
      text: `WORKBENCH TABS (${tabIds.length} open):\n${rows}\n\nTip: "tab <n>" to switch, "tab next" / "tab prev" to cycle, "tab new <url>" to create.`
    };
  }

  // 2. SWITCH TAB: tab switch <target>, tab <number>, tab <name/url>, t <number>
  const isDirectSwitchNumber = /^\d+$/.test(sub);
  const isSwitchVerb = sub === 'switch';
  const isKnownSub = ['new', 'add', 'close', 'rm', 'dup', 'duplicate', 'rename', 'name', 'method', 'set', 'next', 'prev', 'n', 'p', 'clear'].includes(sub);

  if (isDirectSwitchNumber || isSwitchVerb || !isKnownSub) {
    let targetArg = isSwitchVerb ? parts[2] : sub;
    if (!targetArg) {
      return { type: 'error', text: 'Specify a tab number or search term. Example: "tab 2" or "tab stripe".' };
    }

    let targetTabId = null;
    let targetIdx = -1;

    if (/^\d+$/.test(targetArg)) {
      const num = parseInt(targetArg, 10);
      if (num >= 1 && num <= tabIds.length) {
        targetIdx = num - 1;
        targetTabId = tabIds[targetIdx];
      } else {
        return { type: 'error', text: `Tab #${num} does not exist. Open tabs range from 1 to ${tabIds.length}.` };
      }
    } else {
      const search = targetArg.toLowerCase();
      targetIdx = tabIds.findIndex(id => {
        const d = tabMap.get(id);
        return (d?.alias && d.alias.toLowerCase().includes(search)) ||
               (d?.url && d.url.toLowerCase().includes(search));
      });
      if (targetIdx !== -1) {
        targetTabId = tabIds[targetIdx];
      } else {
        return { type: 'error', text: `No tab found matching "${targetArg}". Use "tab list" to view open tabs.` };
      }
    }

    if (targetTabId) {
      if (handleTabSwitch) {
        handleTabSwitch(targetTabId);
      }
      if (context.navigate) {
        context.navigate('/endpoints');
      }
      const tabData = tabMap.get(targetTabId) || {};
      return {
        type: 'success',
        text: `Switched to Tab #${targetIdx + 1}: [${tabData.method || 'GET'}] ${tabData.url || '(Empty URL)'}${tabData.alias ? ` (${tabData.alias})` : ''}`
      };
    }
  }

  // 3. CYCLE TABS: tab next / tab prev
  if (sub === 'next' || sub === 'n') {
    if (tabIds.length <= 1) return { type: 'info', text: 'Only 1 tab is open in Workbench.' };
    const curIdx = getActiveIndex();
    const nextIdx = (curIdx + 1) % tabIds.length;
    const targetId = tabIds[nextIdx];
    if (handleTabSwitch) handleTabSwitch(targetId);
    if (context.navigate) context.navigate('/endpoints');
    const tabData = tabMap.get(targetId) || {};
    return {
      type: 'success',
      text: `Switched to Tab #${nextIdx + 1}: [${tabData.method || 'GET'}] ${tabData.url || '(Empty URL)'}${tabData.alias ? ` (${tabData.alias})` : ''}`
    };
  }

  if (sub === 'prev' || sub === 'p') {
    if (tabIds.length <= 1) return { type: 'info', text: 'Only 1 tab is open in Workbench.' };
    const curIdx = getActiveIndex();
    const prevIdx = (curIdx - 1 + tabIds.length) % tabIds.length;
    const targetId = tabIds[prevIdx];
    if (handleTabSwitch) handleTabSwitch(targetId);
    if (context.navigate) context.navigate('/endpoints');
    const tabData = tabMap.get(targetId) || {};
    return {
      type: 'success',
      text: `Switched to Tab #${prevIdx + 1}: [${tabData.method || 'GET'}] ${tabData.url || '(Empty URL)'}${tabData.alias ? ` (${tabData.alias})` : ''}`
    };
  }

  // 4. NEW TAB: tab new [method] [url] [with ...]
  if (sub === 'new' || sub === 'add') {
    const rawRest = parts.slice(2).join(' ').trim();
    let method = 'GET';
    let url = 'http://localhost:3000';
    let withClause = '';

    if (rawRest) {
      let cleanRest = rawRest;
      const verbMatch = cleanRest.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+/i);
      if (verbMatch) {
        method = verbMatch[1].toUpperCase();
        cleanRest = cleanRest.slice(verbMatch[0].length).trim();
      }

      const withIdx = cleanRest.search(/\bwith\b/i);
      if (withIdx !== -1) {
        url = cleanRest.slice(0, withIdx).trim();
        withClause = cleanRest.slice(withIdx + 4).trim();
      } else {
        url = cleanRest.trim();
      }

      if (url && !/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
    }

    const modifiers = parseWithClauses(withClause);
    if (method === 'GET' && modifiers.body) method = 'POST';

    const newRequest = {
      body: modifiers.body,
      contentType: modifiers.body ? 'application/json' : 'application/json',
      headers: modifiers.headers,
      query: modifiers.query,
      auth: modifiers.auth || { type: 'none' }
    };

    const alias = url !== 'http://localhost:3000'
      ? `${method} ${url.replace(/^https?:\/\//, '').slice(0, 22)}`
      : 'New Tab';

    if (handleAddTab) {
      handleAddTab({
        url,
        method,
        alias,
        request: newRequest
      });
    }

    if (context.navigate) context.navigate('/endpoints');

    return {
      type: 'success',
      text: [
        `Created and switched to new Workbench Tab [#${tabIds.length + 1}]:`,
        `  Method: ${method}`,
        `  URL: ${url}`,
        `  Headers: ${newRequest.headers.length} configured`,
        `  Auth: ${newRequest.auth.type || 'none'}`,
        `  Body: ${newRequest.body ? JSON.stringify(newRequest.body) : 'none'}`
      ].join('\n')
    };
  }

  // 5. CLOSE TAB: tab close [n], tab rm [n], tab close other, tab close all
  if (sub === 'close' || sub === 'rm') {
    const targetArg = parts[2]?.toLowerCase();
    if (tabIds.length <= 1) {
      return { type: 'error', text: 'Cannot close the last remaining tab in Workbench.' };
    }

    if (targetArg === 'other' || targetArg === 'others') {
      if (handleCloseOtherTabs) handleCloseOtherTabs(activeTab);
      return { type: 'success', text: 'Closed all other tabs. Active tab preserved.' };
    }

    if (targetArg === 'all') {
      if (handleCloseOtherTabs) handleCloseOtherTabs(tabIds[0]);
      return { type: 'success', text: 'Closed secondary tabs. Preserved primary Tab #1.' };
    }

    let targetTabId = activeTab;
    let label = 'active tab';
    if (targetArg && /^\d+$/.test(targetArg)) {
      const num = parseInt(targetArg, 10);
      if (num >= 1 && num <= tabIds.length) {
        targetTabId = tabIds[num - 1];
        label = `Tab #${num}`;
      } else {
        return { type: 'error', text: `Tab #${num} not found. Open tabs: 1 to ${tabIds.length}.` };
      }
    }

    if (handleCloseTab) {
      const success = handleCloseTab(targetTabId);
      if (success) {
        return { type: 'success', text: `Closed ${label}.` };
      }
    }
    return { type: 'error', text: `Failed to close ${label}.` };
  }

  // 6. DUPLICATE TAB: tab dup [n], tab duplicate [n]
  if (sub === 'dup' || sub === 'duplicate') {
    let targetTabId = activeTab;
    const targetArg = parts[2];
    if (targetArg && /^\d+$/.test(targetArg)) {
      const num = parseInt(targetArg, 10);
      if (num >= 1 && num <= tabIds.length) {
        targetTabId = tabIds[num - 1];
      }
    }

    if (handleDuplicateTab) {
      const newId = handleDuplicateTab(targetTabId);
      if (newId) {
        if (context.navigate) context.navigate('/endpoints');
        return { type: 'success', text: `Duplicated Tab into new Tab [#${tabIds.length + 1}].` };
      }
    }
    return { type: 'error', text: 'Failed to duplicate tab.' };
  }

  // 7. RENAME TAB: tab rename <name>, tab name <name>
  if (sub === 'rename' || sub === 'name') {
    const newName = parts.slice(2).join(' ').replace(/^["']|["']$/g, '').trim();
    if (!newName) {
      return { type: 'error', text: 'Specify a new tab name. Example: tab rename "Stripe Customer"' };
    }
    if (handleRenameTab) {
      handleRenameTab(activeTab, newName);
      return { type: 'success', text: `Renamed active Tab to "${newName}".` };
    }
    return { type: 'error', text: 'Failed to rename active tab.' };
  }

  // 8. SET METHOD: tab method <METHOD>, tab set <METHOD>
  if (sub === 'method' || sub === 'set') {
    const newMethod = parts[2]?.toUpperCase();
    const valid = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    if (!valid.includes(newMethod)) {
      return { type: 'error', text: `Invalid HTTP method "${newMethod}". Valid: ${valid.join(', ')}` };
    }
    if (handleSetTabMethod) {
      handleSetTabMethod(activeTab, newMethod);
      return { type: 'success', text: `Active tab method updated to ${newMethod}.` };
    }
    return { type: 'error', text: 'Failed to update tab method.' };
  }

  return {
    type: 'suggestion',
    text: [
      `Tab command "${sub}" handled. Available tab commands:`,
      '  tab list                 List all open tabs',
      '  tab <n> | tab switch <n> Switch to tab number or name',
      '  tab next | tab prev      Cycle through tabs',
      '  tab new [method] [url]   Create a new tab',
      '  tab close [n]            Close active or specified tab',
      '  tab close other          Close all other tabs',
      '  tab dup [n]              Duplicate tab',
      '  tab rename <name>        Set custom tab name',
      '  tab method <METHOD>      Change tab HTTP method'
    ].join('\n')
  };
}

/**
 * Handles dynamic API Library operations: list, search, and load into Workbench tabs.
 */
function handleLibraryCommand(cmd, context) {
  const apiList = context.apiList || [];
  const parts = cmd.trim().split(/\s+/);
  const sub = parts[1]?.toLowerCase();

  // 1. LIST APIS: library list, library, api list
  if (!sub || sub === 'list' || sub === 'ls') {
    if (apiList.length === 0) {
      return {
        type: 'info',
        text: 'API Library is currently empty or loading from backend.'
      };
    }

    const lines = [
      `API LIBRARY DIRECTORY (${apiList.length} endpoints available):`,
      '#    METHOD   NAME                  CATEGORY     ENDPOINT'
    ];

    apiList.forEach((api, idx) => {
      const num = String(idx + 1).padEnd(4, ' ');
      const method = (api.method || 'GET').padEnd(8, ' ');
      const name = (api.name || 'Untitled').slice(0, 20).padEnd(22, ' ');
      const cat = (api.category || 'General').slice(0, 11).padEnd(13, ' ');
      const url = api.endpoint || '';
      lines.push(`${num} ${method} ${name} ${cat} ${url}`);
    });

    lines.push('');
    lines.push('Commands:');
    lines.push('  • library get <name|#> [--new]  Load endpoint into active/new tab');
    lines.push('  • library search <keyword>      Filter library catalog');

    return {
      type: 'suggestion',
      text: lines.join('\n')
    };
  }

  // 2. SEARCH LIBRARY: library search <query>
  if (sub === 'search' || sub === 'find') {
    const query = parts.slice(2).join(' ').trim().toLowerCase();
    if (!query) {
      return { type: 'error', text: 'Usage: library search <keyword>' };
    }

    const matches = apiList.filter(api => 
      (api.name && api.name.toLowerCase().includes(query)) ||
      (api.category && api.category.toLowerCase().includes(query)) ||
      (api.endpoint && api.endpoint.toLowerCase().includes(query)) ||
      (api.description && api.description.toLowerCase().includes(query))
    );

    if (matches.length === 0) {
      return { type: 'info', text: `No APIs found matching query "${query}".` };
    }

    const lines = [
      `SEARCH RESULTS FOR "${query}" (${matches.length} matches):`,
      '#    METHOD   NAME                  CATEGORY     ENDPOINT'
    ];

    matches.forEach((api, idx) => {
      const num = String(idx + 1).padEnd(4, ' ');
      const method = (api.method || 'GET').padEnd(8, ' ');
      const name = (api.name || 'Untitled').slice(0, 20).padEnd(22, ' ');
      const cat = (api.category || 'General').slice(0, 11).padEnd(13, ' ');
      const url = api.endpoint || '';
      lines.push(`${num} ${method} ${name} ${cat} ${url}`);
    });

    return {
      type: 'suggestion',
      text: lines.join('\n')
    };
  }

  // 3. GET / LOAD INTO WORKBENCH TAB: library get <name> [--new]
  if (sub === 'get' || sub === 'load' || sub === 'open') {
    let targetArg = parts.slice(2).join(' ').trim();
    const isNew = targetArg.includes('--new') || targetArg.includes('--tab');
    targetArg = targetArg.replace(/--(new|tab)/g, '').trim().replace(/^["']|["']$/g, '');

    if (!targetArg) {
      return { type: 'error', text: 'Usage: library get <name or index> [--new]' };
    }

    let targetApi = null;
    const numIdx = parseInt(targetArg, 10);
    if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= apiList.length) {
      targetApi = apiList[numIdx - 1];
    } else {
      targetApi = apiList.find(api => 
        api.name && api.name.toLowerCase() === targetArg.toLowerCase()
      ) || apiList.find(api => 
        api.name && api.name.toLowerCase().includes(targetArg.toLowerCase())
      );
    }

    if (!targetApi) {
      return {
        type: 'error',
        text: `API "${targetArg}" not found in library. Use "library list" to view available APIs.`
      };
    }

    if (isNew && context.handleAddTab) {
      context.handleAddTab({
        url: targetApi.endpoint,
        method: targetApi.method || 'GET',
        alias: targetApi.name
      });
    } else {
      if (context.setURL) context.setURL(targetApi.endpoint);
      if (context.setMethod) context.setMethod(targetApi.method || 'GET');
    }

    if (context.navigate) {
      context.navigate('/endpoints');
    }

    return {
      type: 'success',
      text: `Loaded "${targetApi.name}" into Workbench [${targetApi.method || 'GET'}] ${targetApi.endpoint}${isNew ? ' (Opened in new tab)' : ''}`
    };
  }

  return {
    type: 'error',
    text: `Unknown library action "${sub}". Available: library list, library search <query>, library get <name>`
  };
}

/**
 * Handles HTTP dispatch: parses method, url, with clauses, options, and fires live fetch.
 */
async function handleHttpDispatch(cmd, context) {
  let method = 'GET';
  let url = '';
  let withClause = '';
  let isDry = false;
  let isProxy = false;

  if (/^curl\b/i.test(cmd)) {
    // Basic cURL parsing
    const urlMatch = cmd.match(/['"](https?:\/\/[^'"]+)['"]|(https?:\/\/[^\s]+)/i);
    if (!urlMatch) {
      return { type: 'error', text: 'Invalid cURL: No valid HTTP/HTTPS URL found in command.' };
    }
    url = urlMatch[1] || urlMatch[2];

    const methodMatch = cmd.match(/-X\s+([A-Z]+)/i);
    if (methodMatch) method = methodMatch[1].toUpperCase();
    else if (/-d\s+|--data/i.test(cmd)) method = 'POST';
  } else {
    // Normal send / verb command
    // Check flags: --dry, --proxy
    isDry = /--dry\b/i.test(cmd);
    isProxy = /--proxy\b/i.test(cmd);

    let cleanCmd = cmd.replace(/--dry\b/i, '').replace(/--proxy\b/i, '').trim();

    // Check if starts with "send"
    if (/^send\b/i.test(cleanCmd)) {
      cleanCmd = cleanCmd.replace(/^send\s+/i, '').trim();
    }

    // Check if next token is HTTP method
    const verbMatch = cleanCmd.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+/i);
    if (verbMatch) {
      method = verbMatch[1].toUpperCase();
      cleanCmd = cleanCmd.slice(verbMatch[0].length).trim();
    }

    // Split at 'with'
    const withIdx = cleanCmd.search(/\bwith\b/i);
    if (withIdx !== -1) {
      url = cleanCmd.slice(0, withIdx).trim();
      withClause = cleanCmd.slice(withIdx + 4).trim();
    } else {
      url = cleanCmd.trim();
    }

    // Default method to POST if body is explicitly present
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

  // Ensure url has protocol
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Parse modifier clauses
  const modifiers = parseWithClauses(withClause);

  // Prepare full request payload for workbench synchronization
  const finalRequest = {
    body: modifiers.body !== null ? modifiers.body : context.request?.body,
    contentType: modifiers.body !== null ? 'application/json' : (context.request?.contentType || 'application/json'),
    headers: modifiers.headers.length > 0 ? modifiers.headers : (context.request?.headers || []),
    query: modifiers.query.length > 0 ? modifiers.query : (context.request?.query || []),
    auth: modifiers.auth || context.request?.auth || { type: 'none' }
  };

  // Check if target is a new tab (--tab or --new)
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
    // Synchronize state into active RequestContext tab
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

  // Live execution
  try {
    const startTime = Date.now();
    const res = await callAPI(url, method, finalRequest, isProxy || context.isProxyEnable);
    const duration = Date.now() - startTime;

    if (context.setResponse) {
      context.setResponse(res);
    }

    // Save to real IndexedDB history
    await saveToHistory(url, method, finalRequest, res);

    const statusBadge = `[${res.status} ${res.status >= 200 && res.status < 300 ? 'OK' : 'RESPONSE'}]`;
    const headersCount = res.headers ? Object.keys(res.headers).length : 0;

    let previewBody = '';
    if (res.data) {
      previewBody = typeof res.data === 'string' ? res.data.slice(0, 300) : JSON.stringify(res.data).slice(0, 300);
      if (previewBody.length >= 300) previewBody += '... (truncated in terminal, view full in Response tab)';
    }

    return {
      type: res.status >= 200 && res.status < 300 ? 'success' : 'error',
      text: [
        `${statusBadge} ${method} ${url}`,
        `Latency: ${res.time || duration}ms | Size: ${res.length || '0 B'} | Type: ${res.type || 'JSON'} | Headers: ${headersCount}`,
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
