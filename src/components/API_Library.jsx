import React, { memo, useContext, useCallback } from 'react';
import { RequestContext } from '../context/RequestContext';
import { useNavigate } from 'react-router-dom';
import { LibraryContext } from '../context/LibraryContext';
import { BookOpen, Sparkles, Terminal, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cardVariants, gridVariants } from '../animations/Motion';

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
          >
            {isFeatured && <div className="featured-ribbon">
              <Sparkles size={12} />
              {`By ${api.developer}`}
              </div>}
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
              <code>{api.method}</code>
              <span>{api.endpoint}</span>
              
              <button 
                className={`btn ${api.hasConfig?"docs-icon-btn":""}`}
                disabled={!api.hasConfig}
                title="View Documentation"
                onClick={() => navigate(`/fetch/api/${api._id}`)}
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