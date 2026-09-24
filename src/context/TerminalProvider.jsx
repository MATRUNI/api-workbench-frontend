import { useState, useEffect, useCallback } from 'react';
import { TerminalContext } from './TerminalContext';

const INITIAL_WELCOME_LOGS = [
  {
    id: 'welcome-header',
    type: 'system',
    text: 'API.OS KERNEL SHELL v1.5 // OPERATOR CLI\nType "help" for syntax matrix. Syntax: send [METHOD] [URL] with -a & -h & -b',
    timestamp: new Date().toLocaleTimeString()
  },
  {
    id: 'hint-shortcuts',
    type: 'info',
    text: 'Shortcuts: [Enter] Execute  |  [Shift+Enter] Multiline  |  [Ctrl+`] Toggle  |  [Esc] Dismiss',
    timestamp: new Date().toLocaleTimeString()
  }
];

export function TerminalProvider({ children }) {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalViewMode, setTerminalViewMode] = useState('drawer'); // 'drawer' | 'hud'
  const [terminalLogs, setTerminalLogs] = useState(INITIAL_WELCOME_LOGS);
  const [commandHistory, setCommandHistory] = useState([
    'send https://jsonplaceholder.typicode.com/posts/1',
    'history size',
    'tab list'
  ]);

  const toggleTerminal = useCallback(() => {
    setIsTerminalOpen(prev => !prev);
  }, []);

  const openTerminal = useCallback(() => {
    setIsTerminalOpen(true);
  }, []);

  const closeTerminal = useCallback(() => {
    setIsTerminalOpen(false);
  }, []);

  const addTerminalLog = useCallback((log) => {
    setTerminalLogs(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        ...log
      }
    ]);
  }, []);

  const clearTerminalLogs = useCallback(() => {
    setTerminalLogs([]);
  }, []);

  const pushCommandHistory = useCallback((cmd) => {
    if (!cmd || !cmd.trim()) return;
    setCommandHistory(prev => {
      const filtered = prev.filter(c => c !== cmd);
      return [cmd, ...filtered].slice(0, 50);
    });
  }, []);

  // Global keyboard shortcut: Ctrl + ` (backtick)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        toggleTerminal();
      } else if (e.key === 'Escape' && isTerminalOpen) {
        closeTerminal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTerminalOpen, toggleTerminal, closeTerminal]);

  return (
    <TerminalContext.Provider value={{
      isTerminalOpen,
      setIsTerminalOpen,
      toggleTerminal,
      openTerminal,
      closeTerminal,
      terminalViewMode,
      setTerminalViewMode,
      terminalLogs,
      addTerminalLog,
      clearTerminalLogs,
      commandHistory,
      pushCommandHistory
    }}>
      {children}
    </TerminalContext.Provider>
  );
}
