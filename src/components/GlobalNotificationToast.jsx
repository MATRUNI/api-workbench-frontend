import { useContext, useEffect } from 'react';
import { Share2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import "../style/GlobalNotificationToast.css"
import { ShareContext } from '../context/ShareContext';

function GlobalNotificationToast() {
  const { toastQueue, removeTopToast } = useContext(ShareContext);

  const currentToast = toastQueue[0];

  useEffect(() => {
    if (!currentToast) return;

    // Auto-dismiss current toast after 5 seconds, then pop the next one
    const timer = setTimeout(() => {
      removeTopToast();
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentToast, removeTopToast]);

  return (
    <div className="global-toast-container">
      <AnimatePresence>
        {currentToast && (
          <motion.div 
            key={currentToast.sharedDataId || Math.random()} 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="global-toast-card"
          >
            <div className="global-toast-icon-wrapper">
              <Share2 size={20} />
            </div>
            <div className="global-toast-content">
              {/* Using 'from' instead of 'username' */}
              <h4>{currentToast.from || "Someone"} shared a config!</h4>
              {/* Using 'message' */}
              <p>{currentToast.message || "New API configuration received."}</p>
            </div>
            <button 
              className="global-toast-close"
              onClick={removeTopToast}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GlobalNotificationToast;