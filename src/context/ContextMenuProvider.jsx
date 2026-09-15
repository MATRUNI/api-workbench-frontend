import React, { createContext, useState, useCallback } from 'react';
import { ContextMenu } from '../components/utility_Components/ContextMenu';

export const ContextMenuContext = createContext();

export const ContextMenuProvider = ({ children }) => {
  const [menuState, setMenuState] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    items: [],
  });

  const openContextMenu = useCallback((event, items) => {
    event.preventDefault();

    setMenuState({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
      items,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setMenuState({
      isOpen: false,
      x: 0,
      y: 0,
      items: [],
    });
  }, []);

  return (
    <ContextMenuContext.Provider
      value={{
        openContextMenu,
        closeContextMenu,
      }}
    >
      {children}

      <ContextMenu
        isOpen={menuState.isOpen}
        position={{
          x: menuState.x,
          y: menuState.y,
        }}
        onClose={closeContextMenu}
        items={menuState.items}
      />
    </ContextMenuContext.Provider>
  );
};