import { parseWithClauses } from './utils';

export function handleTabCommand(cmd, context) {
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
  const sub = parts[1]?.toLowerCase();

  const getActiveIndex = () => tabIds.indexOf(activeTab);

  if (!sub || sub === 'list') {
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
      text: `WORKBENCH TABS (${tabIds.length} open):\n${rows}\n\nTip: "tab switch <n>", "tab next" / "tab prev", "tab new [method] [url]".`
    };
  }

  const isDirectSwitchNumber = /^\d+$/.test(sub);
  const isSwitchVerb = sub === 'switch';
  const isKnownSub = ['new', 'close', 'dup', 'rename', 'method', 'next', 'prev'].includes(sub);

  if (isDirectSwitchNumber || isSwitchVerb || !isKnownSub) {
    const targetArg = isSwitchVerb ? parts[2] : sub;
    if (!targetArg) {
      return { type: 'error', text: 'Specify a tab number or search term. Example: "tab switch 2" or "tab 2".' };
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

  if (sub === 'next') {
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

  if (sub === 'prev') {
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

  if (sub === 'new') {
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

  if (sub === 'close') {
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

  if (sub === 'dup') {
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

  if (sub === 'rename') {
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

  if (sub === 'method') {
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
      `Unknown tab command "${sub}". Canonical tab commands:`,
      '  tab list                 List all open tabs',
      '  tab switch <n>           Switch to tab number or name',
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
