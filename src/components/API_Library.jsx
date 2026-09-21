import React, { memo, useContext, useCallback } from 'react';
import { RequestContext } from '../context/RequestContext';
import { useNavigate } from 'react-router-dom';
import { LibraryContext } from '../context/LibraryContext';
import { TabContext } from '../context/TabContext';
import { ContextMenuContext } from '../context/ContextMenuContext';
import { 
  BookOpen, 
  Sparkles, 
  Terminal, 
  ArrowRight, 
  PlusSquare, 
  Copy, 
  Play, 
  Link, 
  Tag, 
  User, 
  Layers 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cardVariants, gridVariants } from '../animations/Motion';
import { generateCodeSnippet } from '../utils/codeGenerators';

function API_Library() {
  const { setURL, setMethod } = useContext(RequestContext);
  const { APIList } = useContext(LibraryContext);
  const { handleAddTab } = useContext(TabContext) || {};
  const { openContextMenu, copyToClipboard } = useContext(ContextMenuContext);
  const navigate = useNavigate();

  const handleConfigure = useCallback((api) => {
    setMethod(api.method);
    setURL(api.endpoint);
    navigate('/endpoints');
  }, [setMethod, setURL, navigate]);

  const handleOpenInNewTab = useCallback((api) => {
    if (handleAddTab) {
      handleAddTab({
        url: api.endpoint,
        method: api.method,
        alias: api.name
      });
    } else {
      setMethod(api.method);
      setURL(api.endpoint);
    }
    navigate('/endpoints');
  }, [handleAddTab, setMethod, setURL, navigate]);

  const handleCardContextMenu = useCallback((e, api) => {
    e.preventDefault();
    e.stopPropagation();

    const curlSnippet = generateCodeSnippet("curl", "curl", {
      url: api.endpoint,
      method: api.method || "GET",
      headers: [],
      query: [],
      body: ""
    });

    openContextMenu(e, [
      { type: "header", label: `${api.name} (${api.method})` },
      {
        label: "Configure in Workbench",
        icon: Play,
        shortcut: "Enter",
        onClick: () => handleConfigure(api)
      },
      {
        label: "Open in New Workbench Tab",
        icon: PlusSquare,
        shortcut: "Alt+N",
        onClick: () => handleOpenInNewTab(api)
      },
      { type: "separator" },
      {
        label: "Browse Available Endpoints",
        icon: BookOpen,
        disabled: !api.hasConfig,
        onClick: () => navigate(`/fetch/api/${api._id}`)
      },
      { type: "separator" },
      { type: "header", label: "Quick Copy" },
      {
        label: "Copy Endpoint URL",
        icon: Link,
        onClick: () => copyToClipboard(api.endpoint, "Copied endpoint URL!")
      },
      {
        label: "Copy as cURL",
        icon: Terminal,
        onClick: () => copyToClipboard(curlSnippet, "Copied as cURL!")
      },
      {
        label: "Copy Method & URL",
        icon: Copy,
        onClick: () => copyToClipboard(`${api.method} ${api.endpoint}`, "Copied method & URL!")
      },
      { type: "separator" },
      {
        label: "API Details",
        icon: Tag,
        submenu: [
          { label: `Category: ${api.category || 'General'}`, icon: Tag, disabled: true },
          { label: `Response: ${api.responseType || 'JSON'}`, icon: Layers, disabled: true },
          ...(api.developer ? [{ label: `Developer: ${api.developer}`, icon: User, disabled: true }] : [])
        ]
      }
    ]);
  }, [openContextMenu, handleConfigure, handleOpenInNewTab, navigate, copyToClipboard]);

  return (
    <motion.div 
      className="api-grid"
      variants={gridVariants}
      initial="hidden"
      animate="visible"
    >
      {APIList.map((api) => {
        const isFeatured = api.priority === 100;
        return (
          <motion.div 
            key={api._id}
            className={`api-card ${isFeatured ? 'featured-card' : ''}`}
            variants={cardVariants}
            tabIndex={0}
            role="article"
            aria-label={`${api.name} API`}
            onContextMenu={(e) => handleCardContextMenu(e, api)}
            onKeyDown={(e) => {
              if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
                handleCardContextMenu(e, api);
              }
            }}
          >
            {isFeatured && (
              <div className="featured-ribbon">
                <Sparkles size={12} />
                {`By ${api.developer}`}
              </div>
            )}
            <div className="card-meta">
              <div className="card-badge">
                <Terminal size={14}/>
                {api.category}
              </div>
              <div className="response-tag">
                <span className="pulse-dot"></span>
                {api.responseType}
              </div>
            </div>

            <h3>{api.name}</h3>
            <p>{api.description}</p>

            <div className="endpoint-preview">
              <code className={`method-${api.method}`}>{api.method}</code>
              <span>{api.endpoint}</span>
              
              <button 
                className={`btn ${api.hasConfig ? "docs-icon-btn" : ""}`}
                disabled={!api.hasConfig}
                title="Browse Available Endpoints"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/fetch/api/${api._id}`);
                }}
              >
                <BookOpen size={14} className="docs-icon" />
              </button>
            </div>

            <button 
              className="configure-btn" 
              onClick={() => handleConfigure(api)}
            >
              Configure in Endpoints
              <ArrowRight size={18}/>
            </button>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default memo(API_Library);