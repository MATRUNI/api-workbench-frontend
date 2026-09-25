import { FALLBACK_APIS } from './commands/utils';

const CORE_COMMANDS = [
  { label: 'send', type: 'keyword', detail: 'cmd', desc: 'Dispatch HTTP request: send [METHOD] [URL] with -a & -h & -b [--new]', syntax: 'send [METHOD] [URL] with -a & -h & -b [--new]' },
  { label: 'get', type: 'keyword', detail: 'cmd', desc: 'Shorthand for sending a GET request', syntax: 'get <url> [with ...]' },
  { label: 'post', type: 'keyword', detail: 'cmd', desc: 'Shorthand for sending a POST request with payload', syntax: 'post <url> with -b <json>' },
  { label: 'put', type: 'keyword', detail: 'cmd', desc: 'Shorthand for sending a PUT request', syntax: 'put <url> with -b <json>' },
  { label: 'delete', type: 'keyword', detail: 'cmd', desc: 'Shorthand for sending a DELETE request', syntax: 'delete <url>' },
  { label: 'patch', type: 'keyword', detail: 'cmd', desc: 'Shorthand for sending a PATCH request', syntax: 'patch <url> with -b <json>' },
  { label: 'curl', type: 'function', detail: 'fn', desc: 'Parse and execute raw cURL snippet into Workbench', syntax: 'curl -X POST <url> -H ... -d ...' },
  { label: 'tab', type: 'class', detail: 'tab', desc: 'Workbench tab manager: list, switch, next, prev, new, close, dup', syntax: 'tab <list | switch | next | prev | new | close>' },
  { label: 'library', type: 'interface', detail: 'lib', desc: 'Browse and load curated public APIs from Library into Workbench', syntax: 'library <list | search | get>' },
  { label: 'nav', type: 'interface', detail: 'nav', desc: 'Navigate to any workspace view instantly', syntax: 'nav <workbench | console | library | docs | chat | profile | home | auth>' },
  { label: 'history', type: 'variable', detail: 'db', desc: 'Query IndexedDB request history or storage size', syntax: 'history [size | clear | limit <n>]' },
  { label: 'db', type: 'variable', detail: 'db', desc: 'Audit all IndexedDB database tables & storage footprint', syntax: 'db [tables | stats]' },
  { label: 'timing', type: 'variable', detail: 'perf', desc: 'Inspect latency waterfall telemetry for last request', syntax: 'timing' },
  { label: 'clear', type: 'keyword', detail: 'cmd', desc: 'Purge terminal screen buffer', syntax: 'clear' },
  { label: 'help', type: 'info', detail: 'info', desc: 'Display CLI syntax reference matrix', syntax: 'help' }
];

const HTTP_METHOD_OPTIONS = [
  { label: 'GET', type: 'keyword', detail: 'method', desc: 'Retrieve data from the specified resource' },
  { label: 'POST', type: 'keyword', detail: 'method', desc: 'Submit payload to create or process a resource' },
  { label: 'PUT', type: 'keyword', detail: 'method', desc: 'Replace or update entire resource at target URL' },
  { label: 'PATCH', type: 'keyword', detail: 'method', desc: 'Apply partial modifications to a resource' },
  { label: 'DELETE', type: 'keyword', detail: 'method', desc: 'Remove specified resource' },
  { label: 'HEAD', type: 'keyword', detail: 'method', desc: 'Same as GET but returns HTTP headers only' },
  { label: 'OPTIONS', type: 'keyword', detail: 'method', desc: 'Describe the communication options for target resource' }
];

const MODIFIER_OPTIONS = [
  { label: '-a', type: 'property', detail: 'mod', desc: 'Authentication modifier (Bearer token or Basic auth)', syntax: '-a bearer <token>' },
  { label: '-h', type: 'property', detail: 'mod', desc: 'Custom HTTP headers', syntax: '-h Header-Name=Value' },
  { label: '-q', type: 'property', detail: 'mod', desc: 'URL query parameter', syntax: '-q key=value' },
  { label: '-b', type: 'property', detail: 'mod', desc: 'Request JSON payload body', syntax: '-b {"key": "value"}' },
  { label: '--tab', type: 'constant', detail: 'flag', desc: 'Run execution in a fresh tab without altering current tab', syntax: '--tab' },
  { label: '--new', type: 'constant', detail: 'flag', desc: 'Alias for --tab', syntax: '--new' },
  { label: '--dry', type: 'constant', detail: 'flag', desc: 'Populate tab without dispatching network request', syntax: '--dry' }
];

const ROUTES = [
  { name: 'workbench', desc: 'Tabbed request builder & inspector (/endpoints)' },
  { name: 'console', desc: 'IndexedDB live logs & telemetry (/console)' },
  { name: 'library', desc: 'Curated public API hub (/fetch)' },
  { name: 'docs', desc: 'Interactive developer documentation (/docs)' },
  { name: 'chat', desc: 'Collaborative WebSocket shell (/chat)' },
  { name: 'profile', desc: 'User profile and storage metrics (/profile)' },
  { name: 'home', desc: 'System Hero Landing (/)' },
  { name: 'auth', desc: 'Authentication and session gate (/auth)' }
];

const TAB_SUBCOMMANDS = [
  { label: 'list', desc: 'Print formatted table of all open tabs' },
  { label: 'switch', desc: 'Switch active tab by index or name (e.g. tab switch 2)' },
  { label: 'next', desc: 'Cycle forward to next tab' },
  { label: 'prev', desc: 'Cycle backward to previous tab' },
  { label: 'new', desc: 'Create a new tab: tab new [method] [url]' },
  { label: 'close', desc: 'Close tab: tab close [index | other | all]' },
  { label: 'dup', desc: 'Duplicate current active tab' },
  { label: 'rename', desc: 'Assign custom label to active tab' },
  { label: 'method', desc: 'Set HTTP method of active tab' }
];

const LIBRARY_SUBCOMMANDS = [
  { label: 'list', desc: 'List all curated APIs available in the library' },
  { label: 'search', desc: 'Filter library APIs by keyword: library search <query>' },
  { label: 'get', desc: 'Load a library API into Workbench: library get <name> [--new]' }
];

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDocCard({ label, badge, desc, syntax, example }) {
  const dom = document.createElement('div');
  dom.className = 'cm-vscode-doc-card';
  dom.innerHTML = `
    <div class="cm-vscode-doc-header">
      <span class="cm-vscode-doc-title">${escapeHtml(label)}</span>
      <span class="cm-vscode-doc-badge">${escapeHtml(badge || 'CLI')}</span>
    </div>
    <div class="cm-vscode-doc-body">
      ${desc ? `<div class="cm-vscode-doc-desc">${escapeHtml(desc)}</div>` : ''}
      ${syntax ? `<div class="cm-vscode-doc-syntax"><span class="cm-vscode-doc-label">Syntax</span><code class="cm-vscode-doc-code">${escapeHtml(syntax)}</code></div>` : ''}
      ${example ? `<div class="cm-vscode-doc-example"><span class="cm-vscode-doc-label">Example</span><code class="cm-vscode-doc-code">${escapeHtml(example)}</code></div>` : ''}
    </div>
    <div class="cm-vscode-doc-footer">
      <span>API-OS CLI</span>
      <span><kbd>Tab</kbd> or <kbd>Enter</kbd> to insert</span>
    </div>
  `;
  return dom;
}

function createOption({ label, type = 'keyword', detail = 'cmd', badge, desc, syntax, example, apply }) {
  return {
    label,
    type,
    detail,
    apply: apply !== undefined ? apply : label,
    info: () => renderDocCard({
      label,
      badge: badge || detail,
      desc,
      syntax,
      example
    })
  };
}

export function createTerminalCompletionSource(config = {}) {
  const { tabs = [], apiList = [], recentUrls = [] } = Array.isArray(config) 
    ? { recentUrls: config } 
    : config;

  const effectiveApiList = (apiList && apiList.length > 0) ? apiList : FALLBACK_APIS;

  return function terminalCompletionSource(context) {
    const textBefore = context.state.doc.sliceString(0, context.pos);
    const word = context.matchBefore(/[^\s]*/);
    if (!word) return null;

    const prefix = textBefore.slice(0, word.from);

    if (prefix === '') {
      return {
        from: word.from,
        options: CORE_COMMANDS.map(c => createOption({
          ...c,
          badge: 'COMMAND'
        }))
      };
    }

    if (/^nav\s+$/i.test(prefix)) {
      return {
        from: word.from,
        options: ROUTES.map(r => createOption({
          label: r.name,
          type: 'interface',
          detail: 'route',
          badge: 'ROUTE',
          desc: r.desc,
          syntax: `nav ${r.name}`
        }))
      };
    }

    if (/^tab\s+$/i.test(prefix)) {
      const actions = TAB_SUBCOMMANDS.map(a => createOption({
        label: a.label,
        type: 'keyword',
        detail: 'tab',
        badge: 'ACTION',
        desc: a.desc,
        syntax: `tab ${a.label}`
      }));

      const dynamicTabs = tabs.map((tab, idx) => createOption({
        label: String(idx + 1),
        type: 'text',
        detail: 'tab',
        badge: `TAB #${idx + 1}`,
        desc: `[${tab.method || 'GET'}] ${tab.url || '(Untitled)'}${tab.alias ? ` (${tab.alias})` : ''}`,
        syntax: `tab switch ${idx + 1}`
      }));

      return {
        from: word.from,
        options: [...actions, ...dynamicTabs]
      };
    }

    if (/^tab\s+switch\s+$/i.test(prefix)) {
      return {
        from: word.from,
        options: tabs.map((tab, idx) => createOption({
          label: String(idx + 1),
          type: 'text',
          detail: 'tab',
          badge: `TAB #${idx + 1}`,
          desc: `Switch to [${tab.method || 'GET'}] ${tab.url || '(Untitled)'}${tab.alias ? ` (${tab.alias})` : ''}`,
          syntax: `tab switch ${idx + 1}`
        }))
      };
    }

    if (/^library\s+$/i.test(prefix)) {
      const actions = LIBRARY_SUBCOMMANDS.map(a => createOption({
        label: a.label,
        type: 'keyword',
        detail: 'lib',
        badge: 'ACTION',
        desc: a.desc,
        syntax: `library ${a.label}`
      }));

      const apiOptions = effectiveApiList.map((api) => createOption({
        label: `get "${api.name}"`,
        apply: `get "${api.name}"`,
        type: 'interface',
        detail: api.method || 'GET',
        badge: api.category || 'API',
        desc: api.endpoint || api.description,
        syntax: `library get "${api.name}"`,
        example: `${api.method || 'GET'} ${api.endpoint}`
      }));

      return {
        from: word.from,
        options: [...actions, ...apiOptions]
      };
    }

    if (/^library\s+get\s+["']?$/i.test(prefix)) {
      const isQuoted = word.text.startsWith('"') || word.text.startsWith("'");
      const nameOptions = effectiveApiList.map((api, idx) => {
        const cleanName = api.name;
        const quotedName = `"${cleanName}"`;
        return createOption({
          label: isQuoted ? quotedName : cleanName,
          apply: isQuoted ? quotedName : (cleanName.includes(' ') ? quotedName : cleanName),
          type: 'interface',
          detail: api.method || 'GET',
          badge: api.category || 'API',
          desc: api.endpoint || api.description,
          syntax: `library get "${cleanName}"`,
          example: `[#${idx + 1}] ${api.method || 'GET'} ${api.endpoint}`
        });
      });

      const indexOptions = effectiveApiList.map((api, idx) => createOption({
        label: String(idx + 1),
        apply: String(idx + 1),
        type: 'text',
        detail: api.name,
        badge: `#${idx + 1}`,
        desc: `${api.method || 'GET'} ${api.endpoint}`,
        syntax: `library get ${idx + 1}`
      }));

      return {
        from: word.from,
        options: [...nameOptions, ...indexOptions]
      };
    }

    if (/^library\s+search\s+$/i.test(prefix)) {
      const categories = Array.from(new Set(effectiveApiList.map(a => a.category).filter(Boolean)));
      const catOptions = categories.map(cat => createOption({
        label: cat,
        type: 'keyword',
        detail: 'category',
        badge: 'CATEGORY',
        desc: `Filter by ${cat} category`,
        syntax: `library search ${cat}`
      }));

      const apiOptions = effectiveApiList.map(api => createOption({
        label: api.name,
        type: 'interface',
        detail: api.category || 'API',
        badge: 'API',
        desc: api.description || api.endpoint,
        syntax: `library search ${api.name}`
      }));

      return {
        from: word.from,
        options: [...catOptions, ...apiOptions]
      };
    }

    const isHttpUrlPosition = /^(?:send(?:\s+(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS))?|(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)|curl(?:\s+-X\s+[A-Z]+)?)\s+$/i.test(prefix);

    if (isHttpUrlPosition) {
      const isSendBare = /^send\s+$/i.test(prefix);
      const targetMethodMatch = prefix.match(/\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b/i);
      const targetMethod = targetMethodMatch ? targetMethodMatch[1].toUpperCase() : null;

      const urlOptions = [];

      effectiveApiList.forEach(api => {
        if (api.endpoint && !urlOptions.some(o => o.label === api.endpoint)) {
          const isMatchingMethod = !targetMethod || (api.method && api.method.toUpperCase() === targetMethod);
          urlOptions.push({
            option: createOption({
              label: api.endpoint,
              type: 'interface',
              detail: api.method || 'GET',
              badge: api.name || 'API',
              desc: `${api.name} (${api.category || 'API'})`,
              syntax: `send ${api.method || 'GET'} ${api.endpoint}`,
              example: api.description
            }),
            priority: isMatchingMethod ? 2 : 1
          });
        }
      });

      recentUrls.forEach(u => {
        if (u && !urlOptions.some(o => o.option.label === u)) {
          urlOptions.push({
            option: createOption({
              label: u,
              type: 'text',
              detail: 'url',
              badge: 'RECENT',
              desc: 'Target URL from session history',
              syntax: `send ${u}`
            }),
            priority: 0
          });
        }
      });

      urlOptions.sort((a, b) => b.priority - a.priority);

      const methodOptions = isSendBare ? HTTP_METHOD_OPTIONS.map(m => createOption({
        ...m,
        badge: 'METHOD'
      })) : [];

      return {
        from: word.from,
        options: [...methodOptions, ...urlOptions.map(o => o.option)]
      };
    }

    if (/(?:with|&)\s*[\w-]*$/i.test(textBefore) || word.text.startsWith('-')) {
      return {
        from: word.from,
        options: MODIFIER_OPTIONS.map(m => createOption({
          ...m,
          badge: 'MODIFIER'
        }))
      };
    }

    return null;
  };
}
