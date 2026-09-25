export const ROUTE_MAP = {
  workbench: { path: '/endpoints', label: 'API Workbench (Endpoints & Request Builder)' },
  endpoints: { path: '/endpoints', label: 'API Workbench (Endpoints & Request Builder)' },

  console: { path: '/console', label: 'Request Console & Telemetry' },
  logs: { path: '/console', label: 'Request Console & Telemetry' },

  library: { path: '/fetch', label: 'API Library Hub' },
  apis: { path: '/fetch', label: 'API Library Hub' },

  docs: { path: '/docs', label: 'API Documentation' },

  chat: { path: '/chat', label: 'Comm Matrix Shell' },

  profile: { path: '/profile', label: 'User Profile Manifest' },
  manifest: { path: '/profile', label: 'User Profile Manifest' },

  home: { path: '/', label: 'System Hero Landing' },

  auth: { path: '/auth', label: 'Authentication & Session Gate' },
  login: { path: '/auth', label: 'Authentication & Session Gate' }
};

export function handleNavigationCommand(cmd, context) {
  if (!context.navigate) {
    return {
      type: 'error',
      text: 'Navigation service is currently unavailable.'
    };
  }

  const target = cmd[0]?.toLowerCase();

  if (!target) {
    return {
      type: 'suggestion',
      text: [
        'AVAILABLE WORKSPACE ROUTES (syntax: nav <route>):',
        '  • nav workbench  -> Request Builder & Response Viewer',
        '  • nav console    -> IndexedDB History & Request Logs',
        '  • nav library    -> Pre-configured API Hub',
        '  • nav docs       -> Interactive Documentation',
        '  • nav chat       -> Comm Matrix Shell',
        '  • nav profile    -> User Manifest & Statistics',
        '  • nav home       -> System Hero Landing',
        '  • nav auth       -> Session & Authentication'
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
    text: `Unknown route "${target}". Available routes: workbench, console, library, docs, chat, profile, home, auth.`
  };
}
