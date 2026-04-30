import React, { useContext } from 'react';
import { RequestContext } from '../context/RequestContext';

function Header_panel() {
  const {request,setRequest} =useContext(RequestContext)
  // Add a new empty row
  const addHeader = () => {
    const newHeaders = [...request.header, { key: '', value: '', active: true }];
    setRequest({ ...request, header: newHeaders });
  };

  // Update a specific row
  const updateHeader = (index, field, val) => {
    const newHeaders = [...request.header];
    newHeaders[index][field] = val;
    setRequest({ ...request, header: newHeaders });
  };
  const removeHeader = (index) => {
    const newHeaders = request.header.filter((_, i) => i !== index);
    setRequest({ ...request, header: newHeaders });
  };

  return (
    <div className="kv-container">
      <div className="pane-header">
        <span className="label">Request Headers</span>
        <button className="add-row-btn" onClick={addHeader}>+ Add Header</button>
      </div>

      <div className="kv-table">
        {request.header.map((header, index) => (
          <div className="kv-row" key={index}>
            <input 
              type="text" 
              placeholder="Key" 
              value={header.key} 
              onChange={(e) => updateHeader(index, 'key', e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Value" 
              value={header.value} 
              onChange={(e) => updateHeader(index, 'value', e.target.value)}
            />
            <button className="remove-row" onClick={() => removeHeader(index)}>✕</button>
          </div>
        ))}
        {request.header.length === 0 && (
          <div className="empty-state">No headers defined. Click add to begin.</div>
        )}
      </div>
    </div>
  );
}

export default Header_panel;