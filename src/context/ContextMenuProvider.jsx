import React, { useState, useCallback, useRef } from 'react';
import { ContextMenu } from '../components/utility_Components/ContextMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { ContextMenuContext } from './ContextMenuContext';

export { ContextMenuContext };

export const ContextMenuProvider = ({ children }) => {
  const [menuState, setMenuState] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    items: [],
  });

  const [floatingPill, setFloatingPill] = useState(null);
  const pillTimerRef = useRef(null);

  const showFloatingPill = useCallback((message = 'Copied to clipboard!') => {
    if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    setFloatingPill(message);
    pillTimerRef.current = setTimeout(() => {
      setFloatingPill(null);
    }, 2000);
  }, []);

  const openContextMenu = useCallback((eventOrItems, itemsOrUndefined) => {
    let event = null;
    let items = [];

    if (Array.isArray(eventOrItems)) {
      items = eventOrItems;
    } else {
      event = eventOrItems;
      items = itemsOrUndefined || [];
    }

    if (event?.preventDefault) event.preventDefault();
    if (event?.stopPropagation) event.stopPropagation();

    let x = event?.clientX ?? 0;
    let y = event?.clientY ?? 0;

    // If triggered by keyboard or button without pointer coordinates, anchor beneath active element
    if ((!x && !y) || (x === 0 && y === 0)) {
      const target = event?.currentTarget || event?.target || document.activeElement;
      if (target && typeof target.getBoundingClientRect === 'function' && target !== document.body && target !== document.documentElement) {
        const rect = target.getBoundingClientRect();
        x = Math.round(rect.left);
        y = Math.round(rect.bottom + 6);
      } else {
        x = Math.max(20, Math.round(window.innerWidth / 2 - 105));
        y = Math.max(40, Math.round(window.innerHeight / 3));
      }
    }

    setMenuState({
      isOpen: true,
      x,
      y,
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

  const copyToClipboard = useCallback(async (text, pillMessage = 'Copied to clipboard!') => {
    if (!text && text !== '') return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showFloatingPill(pillMessage);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [showFloatingPill]);

  return (
    <ContextMenuContext.Provider
      value={{
        openContextMenu,
        closeContextMenu,
        showFloatingPill,
        copyToClipboard,
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
        onShowPill={showFloatingPill}
      />

      <AnimatePresence>
        {floatingPill && (
          <motion.div
            className="console-floating-pill"
            initial={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 10, scale: 0.9, x: '-50%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ left: '50%' }}
          >
            <CheckCircle2 size={14} className="pill-check-icon" />
            <span>{floatingPill}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </ContextMenuContext.Provider>
  );
};