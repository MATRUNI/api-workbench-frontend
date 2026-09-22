import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import './ContextMenu.css';

export const ContextMenu = ({ isOpen, position, onClose, items = [], onShowPill, anchor }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeSubmenuIndex, setActiveSubmenuIndex] = useState(-1);

  const isNavigable = (item) => item && item.type !== 'separator' && item.type !== 'header' && !item.disabled;

  const getNextIndex = (current, dir, list) => {
    if (!list || list.length === 0) return -1;
    let idx = current;
    for (let i = 0; i < list.length; i++) {
      idx = (idx + dir + list.length) % list.length;
      if (isNavigable(list[idx])) return idx;
    }
    return -1;
  };

  useEffect(() => {
    if (!isOpen) {
      setActiveSubmenu(null);
      setActiveIndex(-1);
      setActiveSubmenuIndex(-1);
      return;
    }

    const handleOutsideClick = (e) => {
      if (e.target.closest('.context-menu-container') || e.target.closest('#workspace-context-btn')) return;
      onClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (activeSubmenu !== null) {
          setActiveSubmenu(null);
          setActiveSubmenuIndex(-1);
        } else {
          onClose();
        }
        return;
      }

      // Arrow Down
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeSubmenu !== null) {
          const subItems = items[activeSubmenu]?.submenu || [];
          setActiveSubmenuIndex((prev) => getNextIndex(prev, 1, subItems));
        } else {
          setActiveIndex((prev) => getNextIndex(prev, 1, items));
        }
        return;
      }

      // Arrow Up
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeSubmenu !== null) {
          const subItems = items[activeSubmenu]?.submenu || [];
          setActiveSubmenuIndex((prev) => getNextIndex(prev, -1, subItems));
        } else {
          setActiveIndex((prev) => getNextIndex(prev, -1, items));
        }
        return;
      }

      // Arrow Right: Open submenu
      if (e.key === 'ArrowRight') {
        if (activeSubmenu === null && activeIndex >= 0) {
          const currentItem = items[activeIndex];
          if (currentItem?.submenu && currentItem.submenu.length > 0) {
            e.preventDefault();
            setActiveSubmenu(activeIndex);
            const firstSubIndex = getNextIndex(-1, 1, currentItem.submenu);
            setActiveSubmenuIndex(firstSubIndex);
          }
        }
        return;
      }

      // Arrow Left: Close submenu
      if (e.key === 'ArrowLeft') {
        if (activeSubmenu !== null) {
          e.preventDefault();
          setActiveSubmenu(null);
          setActiveSubmenuIndex(-1);
        }
        return;
      }

      // Enter or Space: Trigger action
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (activeSubmenu !== null && activeSubmenuIndex >= 0) {
          const subItem = items[activeSubmenu]?.submenu?.[activeSubmenuIndex];
          if (subItem && isNavigable(subItem)) {
            if (subItem.copiedMessage && onShowPill) onShowPill(subItem.copiedMessage);
            if (subItem.onClick) subItem.onClick();
            onClose();
          }
        } else if (activeIndex >= 0) {
          const currentItem = items[activeIndex];
          if (currentItem && isNavigable(currentItem)) {
            if (currentItem.submenu && currentItem.submenu.length > 0) {
              setActiveSubmenu(activeIndex);
              const firstSubIndex = getNextIndex(-1, 1, currentItem.submenu);
              setActiveSubmenuIndex(firstSubIndex);
            } else {
              if (currentItem.copiedMessage && onShowPill) onShowPill(currentItem.copiedMessage);
              if (currentItem.onClick) currentItem.onClick();
              onClose();
            }
          }
        }
        return;
      }
    };

    const isBottomRight = anchor === 'bottom-right';

    const timer = setTimeout(() => {
      window.addEventListener('click', handleOutsideClick, true);
      window.addEventListener('contextmenu', handleOutsideClick, true);
      window.addEventListener('keydown', handleKeyDown, true);
      if (!isBottomRight) {
        window.addEventListener('scroll', onClose, true);
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleOutsideClick, true);
      window.removeEventListener('contextmenu', handleOutsideClick, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (!isBottomRight) {
        window.removeEventListener('scroll', onClose, true);
      }
    };
  }, [isOpen, onClose, activeIndex, activeSubmenu, activeSubmenuIndex, items, onShowPill, anchor]);

  if (!isOpen) return null;

  const isBottomRight = anchor === 'bottom-right';
  const menuWidth = 210;
  const submenuWidth = 190;
  const menuHeight = items.reduce(
    (acc, item) => acc + (item.type === 'separator' ? 9 : item.type === 'header' ? 24 : 36),
    16
  );

  // Awareness: Main menu horizontal position (opens right of cursor by default, flips to left if constrained)
  const openLeft = position.x + menuWidth > window.innerWidth - 10;
  const constrainedX = openLeft
    ? Math.max(10, position.x - menuWidth)
    : Math.min(position.x, window.innerWidth - menuWidth - 10);

  // Awareness: Main menu vertical position (opens downward by default, flips upward if constrained)
  const openUp = position.y + menuHeight > window.innerHeight - 10;
  const constrainedY = openUp
    ? Math.max(10, position.y - menuHeight)
    : Math.min(position.y, window.innerHeight - menuHeight - 10);

  // Awareness: Submenu horizontal direction (flips to left if main menu opened left, or no room on the right)
  const submenuOpenLeft = isBottomRight ? true : (openLeft || constrainedX + menuWidth + submenuWidth > window.innerWidth - 10);
  const mainTransformOrigin = isBottomRight
    ? 'bottom right'
    : `${openUp ? 'bottom' : 'top'} ${openLeft ? 'right' : 'left'}`;

  return (
    <AnimatePresence>
      <div
        className={`context-menu-container ${isBottomRight ? 'bottom-right-anchor' : ''}`}
        style={
          isBottomRight
            ? undefined
            : {
                top: `${constrainedY}px`,
                left: `${constrainedX}px`,
              }
        }
      >
        <motion.div
          className="context-menu-surface"
          style={{ transformOrigin: mainTransformOrigin }}
          initial={{
            opacity: 0,
            scale: 0.95,
            y: isBottomRight ? 6 : (openUp ? 4 : -4),
            x: isBottomRight ? 0 : (openLeft ? 4 : -4),
          }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{
            opacity: 0,
            scale: 0.95,
            y: isBottomRight ? 6 : (openUp ? 4 : -4),
            x: isBottomRight ? 0 : (openLeft ? 4 : -4),
          }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
        >
          {items.map((item, index) => {
            if (item.type === 'separator') {
              return <div key={`sep-${index}`} className="context-menu-separator" />;
            }

            if (item.type === 'header') {
              return (
                <div key={`header-${index}`} className="context-menu-header">
                  {item.label}
                </div>
              );
            }

            const isCheckedType = item.type === 'checkbox' || typeof item.checked === 'boolean';
            const IconComponent = item.icon;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuOpen = activeSubmenu === index;
            const isItemFocused = (activeIndex === index && activeSubmenu === null) || isSubmenuOpen;

            // Submenu vertical awareness for this specific item
            const itemTop = items
              .slice(0, index)
              .reduce((acc, it) => acc + (it.type === 'separator' ? 9 : it.type === 'header' ? 24 : 36), 8);
            const subHeight = (item.submenu?.length || 0) * 36 + 16;
            const submenuOpenUp = isBottomRight ? true : (constrainedY + itemTop + subHeight > window.innerHeight - 10);
            const submenuTransformOrigin = `${submenuOpenUp ? 'bottom' : 'top'} ${submenuOpenLeft ? 'right' : 'left'}`;

            return (
              <div
                key={item.label || index}
                className="context-menu-item-wrapper"
                onMouseEnter={() => {
                  setActiveIndex(index);
                  if (hasSubmenu) {
                    setActiveSubmenu(index);
                    setActiveSubmenuIndex(-1);
                  } else {
                    setActiveSubmenu(null);
                    setActiveSubmenuIndex(-1);
                  }
                }}
                onMouseLeave={() => hasSubmenu && setActiveSubmenu(null)}
              >
                <button
                  className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''} ${isItemFocused ? 'active' : ''}`}
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasSubmenu) {
                      setActiveSubmenu((prev) => (prev === index ? null : index));
                      return;
                    }
                    if (item.copiedMessage && onShowPill) {
                      onShowPill(item.copiedMessage);
                    }
                    if (item.onClick) item.onClick();
                    onClose();
                  }}
                >
                  {isCheckedType ? (
                    item.checked ? (
                      <Check size={14} className="context-menu-check-icon" />
                    ) : (
                      <span className="context-menu-check-spacer" />
                    )
                  ) : (
                    IconComponent && <IconComponent className="context-menu-icon" size={14} />
                  )}
                  <span className="context-menu-label">{item.label}</span>
                  {item.shortcut && <span className="context-menu-shortcut">{item.shortcut}</span>}
                  {hasSubmenu && (
                    submenuOpenLeft ? (
                      <ChevronLeft size={14} className="context-menu-submenu-arrow" />
                    ) : (
                      <ChevronRight size={14} className="context-menu-submenu-arrow" />
                    )
                  )}
                </button>

                {/* Submenu rendering */}
                {hasSubmenu && isSubmenuOpen && (
                  <motion.div
                    className={`context-menu-surface submenu-surface ${submenuOpenLeft ? 'open-left' : 'open-right'} ${submenuOpenUp ? 'open-up' : 'open-down'}`}
                    style={{ transformOrigin: submenuTransformOrigin }}
                    initial={{
                      opacity: 0,
                      scale: 0.95,
                      x: submenuOpenLeft ? 6 : -6,
                      y: submenuOpenUp ? 4 : -4,
                    }}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    exit={{
                      opacity: 0,
                      scale: 0.95,
                      x: submenuOpenLeft ? 6 : -6,
                      y: submenuOpenUp ? 4 : -4,
                    }}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                  >
                    {item.submenu.map((subItem, subIndex) => {
                      if (subItem.type === 'separator') {
                        return <div key={`sub-sep-${subIndex}`} className="context-menu-separator" />;
                      }

                      if (subItem.type === 'header') {
                        return (
                          <div key={`sub-hdr-${subIndex}`} className="context-menu-header">
                            {subItem.label}
                          </div>
                        );
                      }

                      const isSubCheckedType = subItem.type === 'checkbox' || typeof subItem.checked === 'boolean';
                      const SubIcon = subItem.icon;
                      const isSubItemFocused = activeSubmenuIndex === subIndex;

                      return (
                        <button
                          key={subItem.label || subIndex}
                          className={`context-menu-item ${subItem.danger ? 'danger' : ''} ${subItem.disabled ? 'disabled' : ''} ${isSubItemFocused ? 'active' : ''}`}
                          disabled={subItem.disabled}
                          onMouseEnter={() => setActiveSubmenuIndex(subIndex)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (subItem.copiedMessage && onShowPill) {
                              onShowPill(subItem.copiedMessage);
                            }
                            if (subItem.onClick) subItem.onClick();
                            onClose();
                          }}
                        >
                          {isSubCheckedType ? (
                            subItem.checked ? (
                              <Check size={14} className="context-menu-check-icon" />
                            ) : (
                              <span className="context-menu-check-spacer" />
                            )
                          ) : (
                            SubIcon && <SubIcon className="context-menu-icon" size={14} />
                          )}
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