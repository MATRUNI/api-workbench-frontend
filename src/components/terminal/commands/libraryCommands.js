import { FALLBACK_APIS } from './utils';

export function handleLibraryCommand(cmd, context) {
  const apiList = (context.apiList && context.apiList.length > 0) ? context.apiList : FALLBACK_APIS;
  const sub = cmd[0]?.toLowerCase();

  if (!sub || sub === 'list') {
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

  if (sub === 'search') {
    const query = cmd.slice(1).join(' ').trim().toLowerCase();
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

  if (sub === 'get') {
    let targetArg = cmd.slice(1).join(' ').trim();
    const isNew = targetArg.includes('--new') || targetArg.includes('--tab');
    targetArg = targetArg.replace(/--(new|tab)/g, '').trim().replace(/^["']|["']$/g, '');

    if (!targetArg) {
      return { type: 'error', text: 'Usage: library get <name or index> [--new]' };
    }

    let targetApi = null;
    const numIdx = parseInt(targetArg, 10);
    if (!Number.isNaN(numIdx) && numIdx >= 1 && numIdx <= apiList.length) {
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
