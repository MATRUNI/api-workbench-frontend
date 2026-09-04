import { useContext } from 'react';
import { Share2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import "../style/FloatingSharedIndicator.css";
import { ShareContext } from '../context/ShareContext';

function FloatingSharedIndicator({ onOpenInbox }) {
  const { unreadShares, sentShares } = useContext(ShareContext);

  return (
    <AnimatePresence>
      {(unreadShares.length > 0 || sentShares) && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="floating-shared-badge"
          onClick={onOpenInbox}
          title="Click to view shared configurations"
        >
          <div className="floating-badge-icon">
            <Share2 size={18} />
          </div>
          <div className="floating-badge-text">
            <span>Shared</span>
            <span className="floating-badge-count">{unreadShares.length||1}</span>
          </div>
          <Sparkles size={14} className="floating-badge-sparkle" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FloatingSharedIndicator;