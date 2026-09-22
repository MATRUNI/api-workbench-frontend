import { createContext } from 'react';

export const ContextMenuContext = createContext({
  isOpen: false,
  anchor: null,
  openContextMenu: () => {},
  closeContextMenu: () => {},
  showFloatingPill: () => {},
  copyToClipboard: async () => {},
});
