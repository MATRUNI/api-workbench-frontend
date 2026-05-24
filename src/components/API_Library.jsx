import React, { useContext } from 'react'
import { RequestContext } from '../context/RequestContext';
import { useNavigate } from 'react-router-dom';

function API_Library() {
  const {APIList, setURL, setMethod } = useContext(RequestContext);
  const navigate = useNavigate();

  const handleConfigure = (api) => {
    setMethod(api.method)
    setURL(api.endpoint);
    navigate('/endpoints'); 
  };
  return (
    <div className="api-grid">
        {APIList.map((api) => (
          <div key={api._id} className="api-card">
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
        ))}
    </div>
  )
}

export default API_Library