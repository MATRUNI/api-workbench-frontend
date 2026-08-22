import { useState, useEffect } from 'react'
import { X, Search, Sparkles, Terminal, UserPlus, Check, Send } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import { customFetch } from '../services/customFetch'

import "../style/ConfigSharing.css"

let configData = [];

function ConfigSharing({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState()
  const [selectedUsers, setSelectedUsers] = useState([])
  const [message, setMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false)

  if (!isOpen) return null

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll")
    } else {
      document.body.classList.remove("no-scroll")
    }
  
    return () => {
      document.body.classList.remove("no-scroll")
    }
  }, [isOpen])

  const handleAddUser = (username) => {
    if (!selectedUsers.includes(username)) {
      setSelectedUsers(prev => [...prev, username])
    }
  }

  const handleRemoveUser = (usernameToRemove) => {
    setSelectedUsers(prev => prev.filter(u => u !== usernameToRemove))
  }

  const handleShareConfig = async () => {
    if (selectedUsers.length === 0) {
      alert("Please select at least one user to share with.")
      return
    }

    setIsSharing(true)
    try {
      // Implement your share API call payload here
      const payload = {
        users: selectedUsers,
        message: message
      }
      
      // Example call:
      // await customFetch(`${import.meta.env.VITE_BACKEND_URL}/api/share/config`, {
      //   method: 'POST',
      //   body: JSON.stringify(payload)
      // })

      alert("WORK IN PROGRESS!!")
      onClose()
    } catch (error) {
      console.error("Failed to share configuration:", error)
      alert("Failed to share configuration.")
    } finally {
      setIsSharing(false)
    }
  }

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      return
    }

    let isMounted = true

    async function searchUsers() {
      try {
        const response = await customFetch(`${import.meta.env.VITE_BACKEND_URL}/api/share/users/search/${searchQuery}`);
        const data = await response.json();
        
        if (isMounted) {
          configData = (data || []).map((item, idx) => ({
            id: item.id || String(idx),
            username: item.username || item
          }))
        }
      } catch (error) {
        console.error("Failed to search users:", error);
        if (isMounted) setSearchResults([]);
      }
    }

    let debounceTimer;
    function finding() {
      if(searchQuery.length !== 0 && configData.length > 0 && 
        ( configData[0].username.toLowerCase().startsWith(searchQuery) || configData[configData.length - 1].username.toLowerCase().startsWith(searchQuery))) {
        setSearchResults(configData.filter(item=>item.username.toLowerCase().startsWith(searchQuery.toLowerCase())))
      } else {
        debounceTimer = setTimeout(() => {
          searchUsers()
        }, 300)
      }
    }
    finding()

    return () => {
      isMounted = false
      clearTimeout(debounceTimer)
    }
  }, [searchQuery])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div 
        className="modal-surface config-modal-surface" 
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="modal-interior-content config-modal-content">

          <div className="config-header-row">
            <div className="config-title-group">
              <Sparkles size={18} className="config-brand-icon" />
              <h3>Search User</h3>
            </div>
            <button 
              className="modal-close-corner-btn" 
              onClick={onClose} 
              title="Close Panel (ESC)"
            >
              <X size={16} />
              <span>ESC</span>
            </button>
          </div>

          <div className="config-search-row">
            <div className="config-search-input-wrapper">
              <Search size={15} className="config-search-icon" />
              <input 
                type="text" 
                placeholder="Search username (min 3 chars)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="config-search-field"
              />
            </div>
            <button 
              type="button"
              className="config-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              Clear
            </button>
          </div>

          {selectedUsers.length > 0 && (
            <div className="config-selected-list">
              <span className="config-selected-label">Selected Users:</span>
              <div className="config-chips-container">
                {selectedUsers.map((user) => (
                  <div key={user} className="config-user-chip">
                    <span>{user}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveUser(user)}
                      className="config-chip-remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="config-message-section">
            <label className="config-selected-label">Optional Message / Note:</label>
            <textarea
              className="config-message-textarea"
              placeholder="Add a note or message for the configuration..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
          </div>

          <div className="config-results-feed">
            <AnimatePresence>
              {searchQuery.trim().length < 3 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="config-empty-state"
                >
                  <Terminal size={24} className="config-empty-icon" />
                  <p>Type at least 3 characters to search users...</p>
                </motion.div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => {
                  const isAlreadySelected = selectedUsers.includes(user.username);
                  return (
                    <motion.div
                      key={user.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="config-item-card"
                    >
                      <div className="config-item-info">
                        <div className="config-user-profile">
                          <div className="config-user-avatar">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="config-item-title">
                            {user.username}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddUser(user.username)}
                        disabled={isAlreadySelected}
                        className={`config-action-btn ${isAlreadySelected ? 'copied' : ''}`}
                        title={isAlreadySelected ? "Already added" : "Add user"}
                      >
                        {isAlreadySelected ? <Check size={14} /> : <UserPlus size={14} />}
                        <span>{isAlreadySelected ? 'Added' : 'Add'}</span>
                      </button>
                    </motion.div>
                  )
                })
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="config-empty-state"
                >
                  <Terminal size={24} className="config-empty-icon" />
                  <p>No users found.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="config-footer-action">
            <button
              type="button"
              className="config-share-submit-btn"
              onClick={handleShareConfig}
              disabled={isSharing || selectedUsers.length === 0}
            >
              <Send size={15} />
              <span>{isSharing ? "Sharing..." : `Share Config (${selectedUsers.length})`}</span>
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  )
}

export default ConfigSharing