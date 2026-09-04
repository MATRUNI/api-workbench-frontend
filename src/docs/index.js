import gettingStarted from './getting-started.md?raw';
import authentication from './authentication.md?raw';
import endpoints from './endpoints.md?raw';
import commMatrix from './comm-matrix.md?raw';

export const docsRegistry = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of the API.OS workbench.',
    icon: 'Terminal',
    content: gettingStarted
  },
  {
    id: 'endpoints',
    title: 'Endpoints & Proxy',
    description: 'Master the Request Builder and CORS bypass agent.',
    icon: 'Zap',
    content: endpoints
  },
  {
    id: 'comm-matrix',
    title: 'Comm Matrix',
    description: 'Real-time chat, WebRTC voice, and config sharing.',
    icon: 'MessageSquareCode',
    content: commMatrix
  },
  {
    id: 'authentication',
    title: 'Authentication',
    description: 'Secure your operator profile and access restricted zones.',
    icon: 'ShieldCheck',
    content: authentication
  }
];
