import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import './CustomDropdown.css';

export function CustomDropdown({ value, onChange, options, icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentIndex = options.findIndex(opt => opt.value === value);
  const selectedOption = options[currentIndex !== -1 ? currentIndex : 0];

  
  useEffect(() => {
    const triggerElement = triggerRef.current;
    if (!triggerElement) return;

    const handleWheel = (e) => {
      e.preventDefault(); 

      if (options.length === 0) return;

      let nextIndex;
      if (e.deltaY > 0) {
        nextIndex = (currentIndex + 1) % options.length;
      } else {
        nextIndex = (currentIndex - 1 + options.length) % options.length;
      }

      const nextOption = options[nextIndex];
      onChange({ target: { value: nextOption.value } });
    };

    triggerElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      triggerElement.removeEventListener('wheel', handleWheel);
    };
  }, [currentIndex, options, onChange]);

  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>
      <motion.button
        ref={triggerRef}
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.98 }}
        title="Scroll to change format"
      >
        <span className="dropdown-label">
          {icon}
          {selectedOption.label}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            className="custom-dropdown-menu"
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {options.map((option) => (
              <motion.li
                key={option.value}
                className={`custom-dropdown-item ${value === option.value ? 'active' : ''}`}
                onClick={() => {
                  onChange({ target: { value: option.value } });
                  setIsOpen(false);
                }}
              >
                {option.label}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}