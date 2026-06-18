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
  const [bodyPayload, setBodyPayload] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setURL, setMethod } = useContext(RequestContext)

  const currentEp = endpoints.find(e => e.id === activeTab);

  const handleTabChange = (ep) => {
    setActiveTab(ep.id);

    const segments = ep.path.split('/');
    const extracted = {};
    segments.forEach(seg => {
      if (seg.startsWith(':')) {
        const paramName = seg.replace(':', '');
        extracted[paramName] = ep.defaultParams?.[paramName] || '';
      }
    });
    setPathParams(extracted);

    if (ep.body) {
      setBodyPayload(JSON.stringify(ep.body, null, 2));
    } else {
      setBodyPayload("");
    }

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

  // 1. Core global escape key tracking logic
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (onClose) {
          onClose();
        } else {
          navigate('/fetch'); // Safe fallback redirect path
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, navigate]);

  const handleParamChange = (param, value) => {
    setPathParams(prev => ({ ...prev, [param]: value }));
  };

  const computeComputedUrl = () => {
    if (!currentEp) return "";
    let generatedPath = currentEp.path;
    Object.keys(pathParams).forEach(key => {
      generatedPath = generatedPath.replace(`:${key}`, pathParams[key] || `:${key}`);
    });
    return `${baseUrl}${generatedPath}`;
  };

  const executeApiCall = () => {
    setURL(computeComputedUrl());
    setMethod(currentEp.method);
    navigate('/endpoints')
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
                        onChange={(e) => handleParamChange(param, e.target.value)}
                        className="api-text-input"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentEp.body && (
              <div className="api-section">
                <h4 className="api-section-heading">Interactive JSON Payload Body</h4>
                <textarea
                  value={bodyPayload}
                  onChange={(e) => setBodyPayload(e.target.value)}
                  className="api-textarea"
                  rows={5}
                />
              </div>
            )}

            <div className="api-execution-bar">
              <div className="api-url-preview-container">
                <span className="api-url-label">Target Request Endpoint:</span>
                <code className="api-code-text">{computeComputedUrl()}</code>
              </div>
              <button onClick={executeApiCall} disabled={isLoading} className="api-send-button">
                {isLoading ? "Executing..." : "Configure To Endpoints"}
              </button>
            </div>

            <div className="api-section">
              <h4 className="api-section-heading">
                Server Response Output {simulatedResponse && !simulatedResponse.error && <span className="api-status-ok">200 OK</span>}
              </h4>
              <pre className="api-json-response">
                {simulatedResponse 
                  ? JSON.stringify(simulatedResponse, null, 2) 
                  : "// Click \"Send Request\" above to trigger dynamic compilation output."
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