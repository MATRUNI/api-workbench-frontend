import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ContextMenu.css';

export const ContextMenu = ({ isOpen, position, onClose, items = [] }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (e.target.closest('.context-menu-container')) return;
      onClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const timer = setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
      window.addEventListener('contextmenu', handleOutsideClick);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', onClose, true);
    }, 0);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('contextmenu', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuWidth = 200;
  const menuHeight = items.length * 36 + 20;
  const constrainedX = Math.min(position.x, window.innerWidth - menuWidth - 10);
  const constrainedY = Math.min(position.y, window.innerHeight - menuHeight - 10);

  return (
    <AnimatePresence>
      <div
        className="context-menu-container"
        style={{
          position: 'fixed',
          top: `${constrainedY}px`,
          left: `${constrainedX}px`,
          zIndex: 99999,
        }}
      >
        <motion.div
          className="context-menu-surface"
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
        >
          {items.map((item, index) => {
            if (item.type === 'separator') {
              return <div key={`sep-${index}`} className="context-menu-separator" />;
            }

            const IconComponent = item.icon;

            return (
              <button
                key={item.label || index}
                className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.onClick) item.onClick();
                  onClose();
                }}
              >
                {IconComponent && <IconComponent className="context-menu-icon" size={14} />}
                <span className="context-menu-label">{item.label}</span>
                {item.shortcut && <span className="context-menu-shortcut">{item.shortcut}</span>}
              </button>
            );
          })}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};