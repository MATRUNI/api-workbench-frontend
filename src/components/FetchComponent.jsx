import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { RequestContext } from '../context/RequestContext';
import '../style/fetchComponent.css';

function FetchComponent() {
  const {APIList, setURL, setMethod } = useContext(RequestContext);
  const navigate = useNavigate();

  const handleConfigure = (api) => {
    setMethod(api.method)
    setURL(api.endpoint);
    navigate('/endpoints'); 
  };

  return (
    <div className="fetch-container">
      <header className="fetch-header">
        <h1>API Library</h1>
        <p>Select a pre-configured API to start testing your requests.</p>
      </header>

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
    </div>
  );
}

export default FetchComponent;