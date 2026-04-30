import React, {useContext} from 'react';
import { RequestContext } from '../context/RequestContext';

function Query_panel() {
  const {request,setRequest} =useContext(RequestContext)
  const addQuery = () => {
    const newQueries = [...request.query, { key: '', value: '' }];
    setRequest({ ...request, query: newQueries });
  };

  const updateQuery = (index, field, val) => {
    const newQueries = [...request.query];
    newQueries[index][field] = val;
    setRequest({ ...request, query: newQueries });
  };

  const removeQuery = (index) => {
    const newQueries = request.query.filter((_, i) => i !== index);
    setRequest({ ...request, query: newQueries });
  };

  return (
    <div className="kv-container">
      <div className="pane-header">
        <span className="label">Query Parameters</span>
        <button className="add-row-btn" onClick={addQuery}>+ Add Param</button>
      </div>

      <div className="kv-table">
        {request.query.map((q, index) => (
          <div className="kv-row" key={index}>
            <input 
              type="text" 
              placeholder="Parameter" 
              value={q.key} 
              onChange={(e) => updateQuery(index, 'key', e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Value" 
              value={q.value} 
              onChange={(e) => updateQuery(index, 'value', e.target.value)}
            />
            <button className="remove-row" onClick={() => removeQuery(index)}>✕</button>
          </div>
        ))}
        {request.query.length === 0 && (
          <div className="empty-state">No query parameters defined.</div>
        )}
      </div>
    </div>
  );
}

export default Query_panel;