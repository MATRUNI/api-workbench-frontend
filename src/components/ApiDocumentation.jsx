import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../style/ApiDocumentation.css';
import { RequestContext } from '../context/RequestContext';

export default function ApiDocumentation({ apiConfig, onClose }) {
  const { id } = useParams();
  const navigate = useNavigate();
const {
    title = "API Reference Console",
    baseUrl = "https://api.example.com",
    endpoints = []
  } = apiConfig || {};

  const [activeTab, setActiveTab] = useState(null);
  const [simulatedResponse, setSimulatedResponse] = useState(null);
  
  const [pathParams, setPathParams] = useState({});
  const [queryParams, setQueryParams] = useState({});
  
  const [bodyPayload, setBodyPayload] = useState("");
  const [isLoading] = useState(false);
  const { setURL, setMethod } = useContext(RequestContext);

  const currentEp = endpoints.find(e => e.id === activeTab);

  const handleTabChange = (ep) => {
    setActiveTab(ep.id);

    // 1. Extract and map Path Variables (e.g., /:id)
    const segments = ep.path.split('/');
    const extractedPaths = {};
    segments.forEach(seg => {
      if (seg.startsWith(':')) {
        const paramName = seg.replace(':', '');
        extractedPaths[paramName] = ep.defaultParams?.[paramName] || '';
      }
    });
    setPathParams(extractedPaths);

    // 2. Extract and map Query Parameters (e.g., ?page=1)
    const extractedQueries = {};
    if (ep.queryParams) {
      ep.queryParams.forEach(q => {
        extractedQueries[q.name] = q.defaultValue || '';
      });
    }
    setQueryParams(extractedQueries);

    // 3. Hydrate interactive body blocks
    if (ep.body) {
      setBodyPayload(JSON.stringify(ep.body, null, 2));
    } else {
      setBodyPayload("");
    }

    // 4. Handle Mock Server Responses
    if (ep.method === 'GET') {
      setSimulatedResponse(ep.response);
    } else {
      setSimulatedResponse(null);
    }
  };

  useEffect(() => {
    if (endpoints.length > 0) {
      const target = endpoints.find(e => e.id === id) || endpoints[0];
      if (target) {
        handleTabChange(target);
      }
    }
  }, [id, endpoints]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (onClose) {
          onClose();
        } else {
          navigate('/fetch');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, navigate]);

  const handlePathParamChange = (param, value) => {
    setPathParams(prev => ({ ...prev, [param]: value }));
  };

  const handleQueryParamChange = (param, value) => {
    setQueryParams(prev => ({ ...prev, [param]: value }));
  };

  // Dynamically compiles: baseUrl + replaced/path/:variables + ?computed=query&strings
  const computeComputedUrl = () => {
    if (!currentEp) return "";
    
    let generatedPath = currentEp.path;
    Object.keys(pathParams).forEach(key => {
      generatedPath = generatedPath.replace(`:${key}`, pathParams[key] || `:${key}`);
    });

    // Build the query string dynamically if values exist
    const activeQueries = Object.entries(queryParams)
      .filter(([_, value]) => value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const queryString = activeQueries ? `?${activeQueries}` : '';
    
    return `${baseUrl}${generatedPath}${queryString}`;
  };

  const executeApiCall = () => {
    setURL(computeComputedUrl());
    setMethod(currentEp.method);
    navigate('/endpoints');
  };

  return (
    <div className="api-container">
      <div className="api-sidebar">
        <h2 className="api-brand-title">{title}</h2>
        <p className="api-base-url">Base URL: <code>{baseUrl}</code></p>
        <nav className="api-nav">
          {endpoints.map((ep) => (
            <button 
              key={ep.id} 
              className={`api-nav-item ${activeTab === ep.id ? 'active' : ''}`}
              onClick={() => handleTabChange(ep)}
            >
              <span className={`api-badge ${ep.method}`}>{ep.method}</span>
              <span className="api-nav-path">{ep.path}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="api-main-content">
        {activeTab && currentEp ? (
          <div>
            <div className="api-doc-header">
              <span className={`api-badge-large ${currentEp.method}`}>{currentEp.method}</span>
              <h2 className="api-endpoint-heading">{currentEp.path}</h2>
            </div>
            
            <p className="api-description">{currentEp.description}</p>

            {/* 1. Render Path Variables Inputs */}
            {Object.keys(pathParams).length > 0 && (
              <div className="api-section">
                <h4 className="api-section-heading">Path Variables</h4>
                <div className="api-param-grid">
                  {Object.keys(pathParams).map((param) => (
                    <div key={param} className="api-input-group">
                      <label className="api-input-label">{param}</label>
                      <input 
                        type="text" 
                        value={pathParams[param]} 
                        onChange={(e) => handlePathParamChange(param, e.target.value)}
                        className="api-text-input"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Render Dynamic Query Parameters Inputs (Matches your original CSS layout rules) */}
            {Object.keys(queryParams).length > 0 && (
              <div className="api-section">
                <h4 className="api-section-heading">Query Parameters</h4>
                <div className="api-param-grid">
                  {Object.keys(queryParams).map((param) => (
                    <div key={param} className="api-input-group">
                      <label className="api-input-label">
                        {param} <span style={{ color: 'var(--brand-green)', fontSize: '9px' }}>?</span>
                      </label>
                      <input 
                        type="text" 
                        value={queryParams[param]} 
                        placeholder={currentEp.queryParams.find(q => q.name === param)?.placeholder || ''}
                        onChange={(e) => handleQueryParamChange(param, e.target.value)}
                        className="api-text-input"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Render JSON Payload Request Modification */}
            {currentEp.body && (
              <div className="api-section">
                <h4 className="api-section-heading">Interactive JSON Payload Body</h4>
                <textarea
                  value={bodyPayload}
                  onChange={(e) => setBodyPayload(e.target.value)}
                  className="api-textarea"
                  rows={8}
                />
              </div>
            )}

            {/* Dynamic Live Compilation Preview Target */}
            <div className="api-execution-bar">
              <div className="api-url-preview-container">
                <span className="api-url-label">Target Request Endpoint:</span>
                <code className="api-code-text">{computeComputedUrl()}</code>
              </div>
              <button onClick={executeApiCall} disabled={isLoading} className="api-send-button">
                {isLoading ? "Executing..." : "Configure To Endpoints"}
              </button>
            </div>

            {/* Response Console Display Panel */}
            <div className="api-section">
              <h4 className="api-section-heading">
                Server Response Output {simulatedResponse && !simulatedResponse.error && <span className="api-status-ok">200 OK</span>}
              </h4>
              <pre className="api-json-response">
                {simulatedResponse 
                  ? JSON.stringify(simulatedResponse, null, 2) 
                  : "// Click \"Configure To Endpoints\" above to seed active sandbox arguments."
                }
              </pre>
            </div>
          </div>
        ) : (
          <div className="api-welcome-state">
            <h3>API Documentation Portal</h3>
            <p>Select an endpoint from the menu to explore its properties, parameters, and interactive structural outputs.</p>
          </div>
        )}
      </div>
    </div>
  );
}