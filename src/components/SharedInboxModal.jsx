import { useContext, useState, useEffect } from 'react';
import { ShareContext } from '../context/ShareContext';
import { RequestContext } from '../context/RequestContext'; 
import { X, Share2, ArrowRight, Terminal, Inbox, Send, Users, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import "../style/SharedInboxModal.css";
import { customFetch } from '../services/customFetch';
import { useNavigate } from 'react-router-dom';

function SharedInboxModal({ isOpen, onClose }) {
  const { unreadShares, clearUnreadShare, sentShares } = useContext(ShareContext);
  const { setURL, setMethod, setRequest } = useContext(RequestContext); 
  const [activeTab, setActiveTab] = useState("received");
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  
  const [sentShareDetails, setSentShareDetails] = useState({});
  const [isLoadingSent, setIsLoadingSent] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const navigate = useNavigate();

  const normalizedSentIds = Array.isArray(sentShares) 
    ? sentShares 
    : sentShares 
      ? [sentShares] 
      : [];

  useEffect(() => {
    if (activeTab === "shared" && normalizedSentIds.length > 0) {
      const fetchSentDetails = async () => {
        setIsLoadingSent(true);
        try {
          const detailsMap = {};
          await Promise.all(
            normalizedSentIds.map(async (id, index) => {
              const res = await customFetch(`${import.meta.env.VITE_BACKEND_URL}/api/share/recipients/${id}`);
              const usernames = await res.json(); 
              detailsMap[index] = Array.isArray(usernames) ? usernames : [];
            })
          );
          setSentShareDetails(detailsMap);
        } catch (error) {
          console.error("Failed to fetch sent share details", error);
        } finally {
          setIsLoadingSent(false);
        }
      };

      fetchSentDetails();
    } else {
      setSentShareDetails({});
      setExpandedIndex(null);
    }
  }, [activeTab, sentShares]);

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

  const handleCardClick = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
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
              {normalizedSentIds.length > 0 && <span className="shared-tab-badge">{normalizedSentIds.length}</span>}
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
                        <span>{isLoadingConfig ? "Loading" : "Load Config"}</span>
                        {isLoadingConfig ? <Loader size={14}/> : <ArrowRight size={14} />}
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              normalizedSentIds.length === 0 ? (
                <div className="config-empty-state">
                  <Terminal size={24} className="config-empty-icon" />
                  <p>You haven't shared any configurations yet.</p>
                </div>
              ) : isLoadingSent ? (
                <div className="config-empty-state">
                  <Loader size={24} className="config-empty-icon animate-spin" />
                  <p>Loading shared configurations...</p>
                </div>
              ) : (
                normalizedSentIds.map((id, index) => {
                  const isExpanded = expandedIndex === index;
                  const usernames = sentShareDetails[index] || [];

                  return (
                    <div 
                      key={id || index} 
                      className="shared-item-card clickable-card" 
                      onClick={() => handleCardClick(index)}
                    >
                      <div className="shared-item-main-row">
                        <div className="shared-sender">
                          <span>sharedID:<strong className="shared-id-text">{id}</strong></span>
                        </div>
                        <div className="shared-remaining-tag">
                          <Users size={12} />
                          <span>remaining people: <strong>{usernames.length}</strong></span>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            className="shared-expanded-content"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="recipients-title">Recipients List</p>
                            {usernames.length === 0 ? (
                              <p className="no-recipients-text">No recipients found.</p>
                            ) : (
                              <ul className="recipients-list">
                                {usernames.map((username, uIdx) => (
                                  <li key={uIdx} className="recipient-item">{username}</li>
                                ))}
                              </ul>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}

export default SharedInboxModal;