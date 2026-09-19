import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import './ContextMenu.css';

export const ContextMenu = ({ isOpen, position, onClose, items = [] }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveSubmenu(null);
      return;
    }

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
          top: `${constrainedY}px`,
          left: `${constrainedX}px`,
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
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuOpen = activeSubmenu === index;

            return (
              <div
                key={item.label || index}
                className="context-menu-item-wrapper"
                onMouseEnter={() => hasSubmenu && setActiveSubmenu(index)}
                onMouseLeave={() => hasSubmenu && setActiveSubmenu(null)}
              >
                <button
                  className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasSubmenu) return;
                    if (item.onClick) item.onClick();
                    onClose();
                  }}
                >
                  {IconComponent && <IconComponent className="context-menu-icon" size={14} />}
                  <span className="context-menu-label">{item.label}</span>
                  {item.shortcut && <span className="context-menu-shortcut">{item.shortcut}</span>}
                  {hasSubmenu && <ChevronRight size={14} className="context-menu-submenu-arrow" />}
                </button>

                {/* Submenu rendering */}
                {hasSubmenu && isSubmenuOpen && (
                  <motion.div
                    className="context-menu-surface submenu-surface"
                    initial={{ opacity: 0, scale: 0.95, x: -4 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: -4 }}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                  >
                    {item.submenu.map((subItem, subIndex) => {
                      if (subItem.type === 'separator') {
                        return <div key={`sub-sep-${subIndex}`} className="context-menu-separator" />;
                      }
                      const SubIcon = subItem.icon;
                      return (
                        <button
                          key={subItem.label || subIndex}
                          className={`context-menu-item ${subItem.danger ? 'danger' : ''} ${subItem.disabled ? 'disabled' : ''}`}
                          disabled={subItem.disabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (subItem.onClick) subItem.onClick();
                            onClose();
                          }}
                        >
                          {SubIcon && <SubIcon className="context-menu-icon" size={14} />}
                          <span className="context-menu-label">{subItem.label}</span>
                          {subItem.shortcut && <span className="context-menu-shortcut">{subItem.shortcut}</span>}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};