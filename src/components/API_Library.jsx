import React, { memo, useContext, useCallback } from 'react'
import { RequestContext } from '../context/RequestContext';
import { useNavigate } from 'react-router-dom';
import { LibraryContext } from '../context/LibraryContext';

function API_Library() {
  const { setURL, setMethod } = useContext(RequestContext);
  const { APIList } = useContext(LibraryContext);
  const navigate = useNavigate();

  const handleConfigure = useCallback((api) => {
    setMethod(api.method);
    setURL(api.endpoint);
    navigate('/endpoints');
  }, [setMethod, setURL, navigate]);
  return (
    <div className="api-grid">
        {APIList.map((api) =>{
          const isFeatured = api.priority === 100;
          return (
            <div 
            key={api._id}
            className={`api-card ${isFeatured ? 'featured-card' : ''}`}
            >
              {isFeatured && <div className="featured-ribbon">By API.OS</div>}
              <div className="card-meta">
                <div className="card-badge">{api.category}</div>
                <div className="response-tag">
                  <span className="pulse-dot"></span>
                  {api.responseType}
                </div>
              </div>

              <h3>{api.name}</h3>
              <p>{api.description}</p>

              <div className="endpoint-preview">
                <code>{api.method}</code>
                <span>{api.endpoint}</span>
              </div>

              <button 
                className="configure-btn" 
                onClick={() => handleConfigure(api)}
              >
                Configure in Endpoints
              </button>
            </div>
        )})}
    </div>
  )
}

export default memo(API_Library)