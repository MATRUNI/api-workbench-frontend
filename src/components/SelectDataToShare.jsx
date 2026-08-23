import { useState, useEffect } from 'react';
import { Send, X } from "lucide-react";

function SelectDataToShare({ 
  message, 
  setMessage, 
  selectedUsers, 
  handleRemoveUser, 
  handleShareConfig,
  setIsUserSelect
}) {
  const [shareOptions, setShareOptions] = useState({
    url: true,
    body: true,
    query: true,
    header: true,
    headerKey: true, 
    headerValue: false 
  });

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setShareOptions(prev => {
      const updated = { ...prev, [name]: checked };
      if (name === 'header' && !checked) {
        updated.headerKey = false;
        updated.headerValue = false;
      }
      return updated;
    });
  };

  useEffect(()=>{
    if(selectedUsers.length === 0)
        setIsUserSelect(true)
  },[selectedUsers])

  const handleSubmit = () => {
    handleShareConfig(shareOptions);
  };

  return (
    <div className="config-select-data-container">
      {selectedUsers.length > 0 && (
        <div className="config-selected-list">
          <span className="config-selected-label">Sharing with:</span>
          <div className="config-chips-container">
            {selectedUsers.map((user) => (
              <div key={user.id} className="config-user-chip">
                <span>{user.username}</span>
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

      <div className="config-options-section">
        <label className="config-selected-label">Include Data Elements:</label>
        <div className="config-checkboxes-grid">
          {['url', 'body', 'query', 'header'].map((key) => (
            <label key={key} className="config-checkbox-label">
              <input 
                type="checkbox"
                name={key}
                checked={shareOptions[key]}
                onChange={handleCheckboxChange}
              />
              <span className="config-checkbox-text">{key.toUpperCase()}</span>
            </label>
          ))}
        </div>
      </div>

      {shareOptions.header && (
        <div className="config-sub-options-section">
          <span className="config-selected-label">Header Details:</span>
          <div className="config-checkboxes-grid">
            <label className="config-checkbox-label">
              <input 
                type="checkbox"
                name="headerKey"
                checked={shareOptions.headerKey}
                onChange={handleCheckboxChange}
              />
              <span className="config-checkbox-text">Include Header Key</span>
            </label>
            <label className="config-checkbox-label">
              <input 
                type="checkbox"
                name="headerValue"
                checked={shareOptions.headerValue}
                onChange={handleCheckboxChange}
              />
              <span className="config-checkbox-text">Include Header Value</span>
            </label>
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

      <div className="config-footer-action">
        <button
          type="button"
          className="config-share-submit-btn"
          onClick={handleSubmit}
        >
          <Send size={15} />
          <span>Send Configuration</span>
        </button>
      </div>
    </div>
  );
}

export default SelectDataToShare;