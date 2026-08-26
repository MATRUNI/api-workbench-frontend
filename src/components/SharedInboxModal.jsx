import { useContext, useState } from 'react';
import { ShareContext } from '../context/ShareContext';
import { RequestContext } from '../context/RequestContext'; 
import { X, Share2, ArrowRight, Terminal, Inbox, Send, Users, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

import "../style/SharedInboxModal.css";
import { customFetch } from '../services/customFetch';
import { useNavigate } from 'react-router-dom';

function SharedInboxModal({ isOpen, onClose }) {
  const { unreadShares, clearUnreadShare, sentShares } = useContext(ShareContext);
  const { setURL, setMethod, setRequest } = useContext(RequestContext); 
  const [activeTab, setActiveTab] = useState("received");
  const [isLoadingConfig,setIsLoadingConfig] = useState(false)
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleApplyConfig = async (item) => {
    setIsLoadingConfig(true);
    const res = await customFetch(`${import.meta.env.VITE_BACKEND_URL}/api/share/consume/${item.sharedDataId}`);
    const data = (await res.json()).decrypted;
    setURL(data.url);
    setMethod(data.method);

    setRequest(prev => ({
      ...prev,
      headers: data.headers,
      query: data.query,
      body: data.body,
    }));
    clearUnreadShare(item.sharedDataId);
    setIsLoadingConfig(false);
    onClose();
    navigate("/endpoints");
  };


  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div 
        className="modal-surface shared-inbox-modal-surface" 
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="modal-interior-content shared-inbox-content">
          
          <div className="config-header-row">
            <div className="config-title-group">
              <Share2 size={18} className="config-brand-icon" />
              <h3>Configuration Activity</h3>
            </div>
            <button className="modal-close-corner-btn" onClick={onClose} title="Close Panel (ESC)">
              <X size={16} />
              <span>ESC</span>
            </button>
          </div>

          <div className="shared-tabs-row">
            <button
              type="button"
              className={`shared-tab-btn ${activeTab === "received" ? "active" : ""}`}
              onClick={() => setActiveTab("received")}
            >
              <Inbox size={15} />
              <span>Received</span>
              {unreadShares.length > 0 && <span className="shared-tab-badge">{unreadShares.length}</span>}
            </button>

            <button
              type="button"
              className={`shared-tab-btn ${activeTab === "shared" ? "active" : ""}`}
              onClick={() => setActiveTab("shared")}
            >
              <Send size={15} />
              <span>Shared by You</span>
              {sentShares.length > 0 && <span className="shared-tab-badge">{sentShares.length}</span>}
            </button>
          </div>

          <div className="shared-inbox-feed">
            {activeTab === "received" ? (
              unreadShares.length === 0 ? (
                <div className="config-empty-state">
                  <Terminal size={24} className="config-empty-icon" />
                  <p>No new received configurations.</p>
                </div>
              ) : (
                unreadShares.map((item) => (
                  <div key={item.sharedDataId || Math.random()} className="shared-item-card">
                    <div className="shared-item-header">
                      <span className="shared-sender">From: <strong>{item.from}</strong></span>
                      <button className="shared-item-delete" onClick={() => clearUnreadShare(item.sharedDataId)}>
                        <X size={14} />
                      </button>
                    </div>
                    {item.message && <p className="shared-item-message">"{item.message}"</p>}
                    <div className="shared-item-actions">
                      <button type="button" className="config-action-btn" onClick={() => handleApplyConfig(item)}>
                        <span>{isLoadingConfig?"Loading":"Load Config"}</span>
                        {isLoadingConfig?
                        <Loader size={14}/>
                        :<ArrowRight size={14} />
                        }
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              sentShares.length === 0 ? (
                <div className="config-empty-state">
                  <Terminal size={24} className="config-empty-icon" />
                  <p>You haven't shared any configurations yet.</p>
                </div>
              ) : (
                sentShares.map((item, index) => (
                  <div key={item.sharedDataId || index} className="shared-item-card">
                    <div className="shared-item-header">
                      <span className="shared-sender">Status: <strong className="sent-badge">Active Share</strong></span>
                      <span className="shared-remaining-tag">
                        <Users size={12} />
                        <span>{item.recipientsRemainingCount ?? 0} remaining</span>
                      </span>
                    </div>
                    {item.message && <p className="shared-item-message">"{item.message}"</p>}
                  </div>
                ))
              )
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}

export default SharedInboxModal;