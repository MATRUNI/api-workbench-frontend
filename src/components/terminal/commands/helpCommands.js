export function getHelpMatrix() {
  return {
    type: 'suggestion',
    text: [
      'COMMAND MATRIX & SYNTAX GUIDE:',
      '  HTTP DISPATCH:',
      '    <method> <url> [with -h & -q & -b & -a]      Execute HTTP request (e.g. get https://...)',
      '    https://<url>                                Direct URL shortcut (defaults to GET)',
      '    curl <command>                               Parse and run cURL snippet',
      '    --new / --tab                                Execute in fresh Workbench Tab',
      '    --dry                                         Sync tab state without sending',
      '',
      '  WORKBENCH TAB MANAGEMENT:',
      '    tab list                                     List open tabs and active state',
      '    tab <n>                                      Switch to tab #n or by name',
      '    tab next | tab prev                          Cycle to next or previous tab',
      '    tab new [method] [url] [with ...]            Create pre-configured new tab',
      '    tab close [n | other | all]                  Close active or target tab',
      '    tab dup [n]                                  Duplicate active or specified tab',
      '    tab rename <name>                            Set custom alias for active tab',
      '    tab method <METHOD>                          Change active tab HTTP method',
      '',
      '  WORKSPACE ROUTE NAVIGATION:',
      '    nav <route>                                  Navigate to workspace view',
      '    Routes: workbench, console, library, docs, chat, profile, home, auth',
      '',
      '  API LIBRARY HUB:',
      '    library list                                 List curated library endpoints',
      '    library search <keyword>                     Filter library APIs by keyword',
      '    library get <name|#> [--new]                 Load API into active or new tab',
      '',
      '  INDEXED_DB & TELEMETRY:',
      '    history [size | clear | limit <n>]            Query real IndexedDB history',
      '    db [tables | stats]                           Audit all IndexedDB tables',
      '    timing | waterfall                            Inspect network latency breakdown',
      '    clear                                         Purge terminal output buffer'
    ].join('\n')
  };
}
