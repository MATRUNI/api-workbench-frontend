import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../style/ApiDocumentation.css';
import { RequestContext } from '../context/RequestContext';
import { TabContext } from '../context/TabContext';
import { ContextMenuContext } from '../context/ContextMenuContext';
import { 
  Play, 
  PlusSquare, 
  Copy, 
  Terminal, 
  Link, 
  RotateCcw, 
  Sparkles, 
  X, 
  Code, 
  FileText 
} from 'lucide-react';
import { generateCodeSnippet } from '../utils/codeGenerators';

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
  const { handleAddTab } = useContext(TabContext) || {};
  const { openContextMenu, copyToClipboard } = useContext(ContextMenuContext);

  const currentEp = endpoints.find(e => e.id === activeTab);

  const handleTabChange = useCallback((ep) => {
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
  }, []);

  useEffect(() => {
    if (endpoints.length > 0) {
      const target = endpoints.find(e => e.id === id) || endpoints[0];
      if (target) {
        handleTabChange(target);
      }
    }
  }, [id, endpoints, handleTabChange]);

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
  const computeComputedUrl = useCallback((ep = currentEp) => {
    if (!ep) return "";
    
    let generatedPath = ep.path;
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
  }, [currentEp, pathParams, queryParams, baseUrl]);

  const executeApiCall = useCallback(() => {
    if (!currentEp) return;
    setURL(computeComputedUrl());
    setMethod(currentEp.method);
    navigate('/endpoints');
  }, [currentEp, computeComputedUrl, setURL, setMethod, navigate]);

  const handleOpenInNewTab = useCallback((ep = currentEp) => {
    if (!ep) return;
    const computedUrl = computeComputedUrl(ep);
    if (handleAddTab) {
      handleAddTab({
        url: computedUrl,
        method: ep.method,
        alias: ep.path,
        request: {
          body: bodyPayload || (ep.body ? JSON.stringify(ep.body, null, 2) : ""),
          contentType: "application/json",
          headers: [],
          query: []
        }
      });
    } else {
      setURL(computedUrl);
      setMethod(ep.method);
    }
    navigate('/endpoints');
  }, [currentEp, computeComputedUrl, handleAddTab, bodyPayload, setURL, setMethod, navigate]);

  const handleResetParameters = useCallback(() => {
    if (!currentEp) return;
    handleTabChange(currentEp);
    copyToClipboard("", "Reset parameters to defaults!");
  }, [currentEp, handleTabChange, copyToClipboard]);

  const handlePrettifyBody = useCallback(() => {
    if (!bodyPayload) return;
    try {
      const parsed = JSON.parse(bodyPayload);
      setBodyPayload(JSON.stringify(parsed, null, 2));
      copyToClipboard("", "Prettified JSON payload!");
    } catch {
      copyToClipboard("", "Invalid JSON payload");
    }
  }, [bodyPayload, copyToClipboard]);

  const handleEndpointItemContextMenu = useCallback((e, ep) => {
    e.preventDefault();
    e.stopPropagation();

    const fullUrl = `${baseUrl}${ep.path}`;
    const curlSnippet = generateCodeSnippet("curl", "curl", {
      url: fullUrl,
      method: ep.method || "GET",
      headers: ep.body ? [{ key: "Content-Type", value: "application/json" }] : [],
      query: [],
      body: ep.body ? JSON.stringify(ep.body) : ""
    });

    openContextMenu(e, [
      { type: "header", label: `${ep.method} ${ep.path}` },
      {
        label: "Select Endpoint",
        icon: FileText,
        onClick: () => handleTabChange(ep)
      },
      {
        label: "Configure in Workbench",
        icon: Play,
        shortcut: "Enter",
        onClick: () => {
          setURL(fullUrl);
          setMethod(ep.method);
          navigate('/endpoints');
        }
      },
      {
        label: "Open in New Workbench Tab",
        icon: PlusSquare,
        shortcut: "Alt+N",
        onClick: () => {
          if (handleAddTab) {
            handleAddTab({
              url: fullUrl,
              method: ep.method,
              alias: ep.path,
              request: {
                body: ep.body ? JSON.stringify(ep.body, null, 2) : "",
                contentType: "application/json"
              }
            });
          } else {
            setURL(fullUrl);
            setMethod(ep.method);
          }
          navigate('/endpoints');
        }
      },
      { type: "separator" },
      { type: "header", label: "Quick Copy" },
      {
        label: "Copy Endpoint Path",
        icon: Link,
        onClick: () => copyToClipboard(ep.path, "Copied endpoint path!")
      },
      {
        label: "Copy Full URL",
        icon: Copy,
        onClick: () => copyToClipboard(fullUrl, "Copied full URL!")
      },
      {
        label: "Copy as cURL",
        icon: Terminal,
        onClick: () => copyToClipboard(curlSnippet, "Copied as cURL!")
      }
    ]);
  }, [baseUrl, openContextMenu, handleAddTab, handleTabChange, setURL, setMethod, navigate, copyToClipboard]);

  const handleContentContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const selectedText = window.getSelection()?.toString()?.trim() || "";
    const computedUrl = computeComputedUrl();
    const curlSnippet = currentEp ? generateCodeSnippet("curl", "curl", {
      url: computedUrl,
      method: currentEp.method || "GET",
      headers: currentEp.body ? [{ key: "Content-Type", value: "application/json" }] : [],
      query: [],
      body: bodyPayload || ""
    }) : "";

    const items = [];

    if (selectedText) {
      items.push({
        label: `Copy "${selectedText.length > 20 ? selectedText.slice(0, 20) + '...' : selectedText}"`,
        icon: Copy,
        shortcut: "Ctrl+C",
        onClick: () => copyToClipboard(selectedText, "Copied selection!")
      });
      items.push({ type: "separator" });
    }

    if (currentEp) {
      items.push({ type: "header", label: `${currentEp.method} ${currentEp.path}` });
      items.push({
        label: "Configure in Workbench",
        icon: Play,
        shortcut: "Enter",
        onClick: executeApiCall
      });
      items.push({
        label: "Open in New Workbench Tab",
        icon: PlusSquare,
        shortcut: "Alt+N",
        onClick: () => handleOpenInNewTab(currentEp)
      });
      items.push({ type: "separator" });
      items.push({ type: "header", label: "Export & Copy" });
      items.push({
        label: "Copy Request URL",
        icon: Link,
        onClick: () => copyToClipboard(computedUrl, "Copied request URL!")
      });
      items.push({
        label: "Copy as cURL",
        icon: Terminal,
        onClick: () => copyToClipboard(curlSnippet, "Copied as cURL!")
      });
      if (bodyPayload) {
        items.push({
          label: "Copy JSON Payload",
          icon: Code,
          onClick: () => copyToClipboard(bodyPayload, "Copied JSON payload!")
        });
      }
      if (simulatedResponse) {
        items.push({
          label: "Copy Server Response",
          icon: Copy,
          onClick: () => copyToClipboard(JSON.stringify(simulatedResponse, null, 2), "Copied response JSON!")
        });
      }
      items.push({ type: "separator" });
      items.push({ type: "header", label: "Sandbox Actions" });
      items.push({
        label: "Reset Parameters & Payload",
        icon: RotateCcw,
        onClick: handleResetParameters
      });
      if (bodyPayload) {
        items.push({
          label: "Prettify JSON Payload",
          icon: Sparkles,
          shortcut: "Alt+Shift+F",
          onClick: handlePrettifyBody
        });
      }
      items.push({ type: "separator" });
    }

    items.push({
      label: "Close Documentation",
      icon: X,
      shortcut: "Esc",
      onClick: () => (onClose ? onClose() : navigate('/fetch'))
    });

    openContextMenu(e, items);
  }, [
    currentEp,
    computeComputedUrl,
    bodyPayload,
    simulatedResponse,
    executeApiCall,
    handleOpenInNewTab,
    handleResetParameters,
    handlePrettifyBody,
    onClose,
    navigate,
    openContextMenu,
    copyToClipboard
  ]);

  return (
    <div className="api-container" onContextMenu={handleContentContextMenu}>
      <div className="api-sidebar">
        <h2 className="api-brand-title">{title}</h2>
        <p className="api-base-url">Base URL: <code>{baseUrl}</code></p>
        <nav className="api-nav">
          {endpoints.map((ep) => (
            <button 
              key={ep.id} 
              className={`api-nav-item ${activeTab === ep.id ? 'active' : ''}`}
              onClick={() => handleTabChange(ep)}
              onContextMenu={(e) => handleEndpointItemContextMenu(e, ep)}
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