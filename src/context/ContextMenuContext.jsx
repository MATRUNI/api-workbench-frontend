import { createContext } from 'react';

export const ContextMenuContext = createContext({
  openContextMenu: () => {},
  closeContextMenu: () => {},
  showFloatingPill: () => {},
  copyToClipboard: async () => {},
});
