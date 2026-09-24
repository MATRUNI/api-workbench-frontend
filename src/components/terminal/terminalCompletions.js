/**
 * Dynamic, Production-Grade Autocomplete Source for Kernel Terminal.
 * Zero hardcoded tab indices or bloated static catalogs.
 * Dynamically resolves against live Workbench tabs, Library APIs, and Route definitions.
 */

const CORE_COMMANDS = [
  { label: 'send', type: 'keyword', detail: 'cmd', desc: 'Dispatch HTTP request (defaults to GET, or infers POST if body is set)', syntax: 'send [METHOD] [URL] with -a & -h & -b [--new]' },
  { label: 'get', type: 'keyword', detail: 'cmd', desc: 'Shorthand for sending a GET request', syntax: 'get <url> [with ...]' },
  { label: 'post', type: 'keyword', detail: 'cmd', desc: 'Shorthand for sending a POST request with payload', syntax: 'post <url> with -b <json>' },
  { label: 'put', type: 'keyword', detail: 'cmd', desc: 'Shorthand for sending a PUT request', syntax: 'put <url> with -b <json>' },
  { label: 'delete', type: 'keyword', detail: 'cmd', desc: 'Shorthand for sending a DELETE request', syntax: 'delete <url>' },
  { label: 'patch', type: 'keyword', detail: 'cmd', desc: 'Shorthand for sending a PATCH request', syntax: 'patch <url> with -b <json>' },
  { label: 'curl', type: 'function', detail: 'fn', desc: 'Parse and execute raw cURL snippet into Workbench', syntax: 'curl -X POST <url> -H ... -d ...' },
  { label: 'tab', type: 'class', detail: 'tab', desc: 'Workbench tab manager: list, switch, next, prev, new, close, dup', syntax: 'tab <list | switch | next | prev | new | close>' },
  { label: 'library', type: 'interface', detail: 'lib', desc: 'Browse and load curated public APIs from Library into Workbench', syntax: 'library <list | search | get>' },
  { label: 'goto', type: 'interface', detail: 'nav', desc: 'Navigate to any workspace view instantly', syntax: 'goto <workbench | console | library | docs | chat | profile>' },
  { label: 'history', type: 'variable', detail: 'db', desc: 'Query IndexedDB request history or storage size', syntax: 'history [size | --filter | clear]' },
  { label: 'db', type: 'variable', detail: 'db', desc: 'Audit all IndexedDB database tables & storage footprint', syntax: 'db [tables | stats]' },
  { label: 'clear', type: 'keyword', detail: 'cmd', desc: 'Purge terminal screen buffer', syntax: 'clear' },
  { label: 'help', type: 'info', detail: 'info', desc: 'Display CLI syntax reference matrix', syntax: 'help' }
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

function createOption({ label, type = 'keyword', detail = 'cmd', badge, desc, syntax, example }) {
  return {
    label,
    type,
    detail,
    info: () => renderDocCard({
      label,
      badge: badge || detail,
      desc,
      syntax,
      example
    })
  };
}

/**
 * Creates dynamic completion source wired to live context state.
 */
export function createTerminalCompletionSource(config = {}) {
  const { tabs = [], apiList = [], recentUrls = [] } = Array.isArray(config) 
    ? { recentUrls: config } 
    : config;

  return function terminalCompletionSource(context) {
    const textBefore = context.state.doc.sliceString(0, context.pos);
    const word = context.matchBefore(/[\w\-&:"'/.]*/);
    if (!word) return null;

    const trimmed = textBefore.trim();

    // 1. Root command completion at start of line
    if (!textBefore.includes(' ')) {
      return {
        from: word.from,
        options: CORE_COMMANDS.map(c => createOption({
          ...c,
          badge: 'COMMAND'
        }))
      };
    }

    // 2. Navigation routes: goto <route>, nav <route>, open <route>
    if (/^(goto|nav|open|navigate)\s+[\w]*$/i.test(trimmed)) {
      return {
        from: word.from,
        options: ROUTES.map(r => createOption({
          label: r.name,
          type: 'interface',
          detail: 'route',
          badge: 'ROUTE',
          desc: r.desc,
          syntax: `goto ${r.name}`
        }))
      };
    }

    // 3. Tab operations & dynamic tabs resolution from live state
    if (/^(tab|t)\s+[\w]*$/i.test(trimmed)) {
      const actions = TAB_SUBCOMMANDS.map(a => createOption({
        label: a.label,
        type: 'keyword',
        detail: 'tab',
        badge: 'ACTION',
        desc: a.desc,
        syntax: `tab ${a.label}`
      }));

      // Dynamically map real open tabs
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

    // Tab switch dynamic targets (indexes or aliases)
    if (/^(tab|t)\s+(?:switch|s)\s+[\w]*$/i.test(trimmed)) {
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

    // 4. Library operations & dynamic API catalog resolution from LibraryContext
    if (/^(library|lib|api)\s+[\w]*$/i.test(trimmed)) {
      const actions = LIBRARY_SUBCOMMANDS.map(a => createOption({
        label: a.label,
        type: 'keyword',
        detail: 'lib',
        badge: 'ACTION',
        desc: a.desc,
        syntax: `library ${a.label}`
      }));

      return {
        from: word.from,
        options: actions
      };
    }

    // Library get: dynamically populate APIs from live catalog
    if (/^(library|lib|api)\s+(?:get|load|run)\s+["\w]*$/i.test(trimmed)) {
      return {
        from: word.from,
        options: apiList.map(api => createOption({
          label: `"${api.name}"`,
          type: 'interface',
          detail: 'lib',
          badge: api.category || 'API',
          desc: api.description || `Pre-configured ${api.method} endpoint`,
          syntax: `library get "${api.name}"`,
          example: `library get "${api.name}" --new`
        }))
      };
    }

    // 5. Dynamic Recent URLs after HTTP methods
    if (/^(send|get|post|put|delete|patch)\s+[\w-:/.]*$/i.test(trimmed)) {
      if (recentUrls.length > 0) {
        return {
          from: word.from,
          options: recentUrls.slice(0, 8).map(u => createOption({
            label: u,
            type: 'text',
            detail: 'url',
            badge: 'RECENT',
            desc: 'Target URL from session history',
            syntax: `send ${u}`
          }))
        };
      }
    }

    // 6. Modifiers after "with" or "&"
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
