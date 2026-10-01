import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { docsRegistry } from '../docs/index.js';
import { 
  X, Menu, Info, Lightbulb, AlertCircle, Play, Pause, 
  SkipForward, RotateCcw, Eye, Terminal, ArrowDown
} from 'lucide-react';
import { DynamicIcon } from './utility_Components/DynamicIcon';
import '../style/Docs.css';

const SPEED_OPTIONS = [
  { label: '1x', ms: 25 },
  { label: '2x', ms: 12 },
  { label: '5x', ms: 4 },
  { label: '10x', ms: 1 },
];

function Docs() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const docId = searchParams.get('doc') || 'getting-started';
  
  const [activeDoc, setActiveDoc] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [streamMode, setStreamMode] = useState(() => {
    return localStorage.getItem('docs_stream_mode') || 'typewriter';
  });

  const [speedMs, setSpeedMs] = useState(() => {
    const saved = localStorage.getItem('docs_speed_ms');
    return saved !== null ? Number(saved) : 12;
  });

  const [autoScroll, setAutoScroll] = useState(() => {
    const saved = localStorage.getItem('docs_auto_scroll');
    return saved !== null ? saved === 'true' : true;
  });

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeStreamMode = isMobile ? 'instant' : streamMode;

  const [displayedLineCount, setDisplayedLineCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const mainContentRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const doc = docsRegistry.find(d => d.id === docId);
    if (doc) {
      setActiveDoc(doc);
    } else {
      setActiveDoc(docsRegistry[0]);
    }
  }, [docId]);

  useEffect(() => {
    if (!activeDoc) return;

    const lines = activeDoc.content.split('\n');
    const totalLines = lines.length;

    if (activeStreamMode === 'instant') {
      setDisplayedLineCount(totalLines);
      setIsPaused(false);
      return;
    }

    setDisplayedLineCount(1);
    setIsPaused(false);
  }, [activeDoc, activeStreamMode]);

  useEffect(() => {
    if (!activeDoc || activeStreamMode === 'instant' || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const lines = activeDoc.content.split('\n');
    const totalLines = lines.length;

    if (displayedLineCount >= totalLines) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setDisplayedLineCount((prev) => {
        if (prev >= totalLines) {
          clearInterval(timerRef.current);
          return totalLines;
        }
        return prev + 1;
      });
    }, speedMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeDoc, activeStreamMode, isPaused, speedMs, displayedLineCount]);

  useEffect(() => {
    if (autoScroll && activeStreamMode === 'typewriter' && mainContentRef.current && !isPaused) {
      const container = mainContentRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [displayedLineCount, autoScroll, activeStreamMode, isPaused]);

  const handleNavClick = (id) => {
    navigate(`/docs?doc=${id}`);
    setIsMobileMenuOpen(false);
  };

  const handleSetStreamMode = (mode) => {
    setStreamMode(mode);
    localStorage.setItem('docs_stream_mode', mode);
  };

  const handleSetSpeed = (ms) => {
    setSpeedMs(ms);
    localStorage.setItem('docs_speed_ms', String(ms));
  };

  const toggleAutoScroll = () => {
    setAutoScroll((prev) => {
      const next = !prev;
      localStorage.setItem('docs_auto_scroll', String(next));
      if (next && mainContentRef.current) {
        mainContentRef.current.scrollTop = mainContentRef.current.scrollHeight;
      }
      return next;
    });
  };

  const handleSkip = () => {
    const lines = activeDoc?.content ? activeDoc.content.split('\n') : [];
    setDisplayedLineCount(lines.length);
    setIsPaused(false);
  };

  const handleReplay = () => {
    setDisplayedLineCount(1);
    setIsPaused(false);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const lines = activeDoc?.content ? activeDoc.content.split('\n') : [];
  const totalLines = lines.length;
  const isStreaming = activeStreamMode === 'typewriter' && displayedLineCount < totalLines;
  const visibleContent = activeStreamMode === 'instant' 
    ? activeDoc?.content || '' 
    : lines.slice(0, displayedLineCount).join('\n');
  const progressPercent = totalLines > 0 ? Math.min(100, Math.round((displayedLineCount / totalLines) * 100)) : 100;

  return (
    <div className="docs-layout">
      <div className="docs-mobile-header">
        <div className="docs-mobile-current">
          {activeDoc && <DynamicIcon name={activeDoc.icon} />}
          <span>{activeDoc ? activeDoc.title : 'Select Documentation'}</span>
        </div>
        <button 
          className="docs-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside className={`docs-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="docs-sidebar-header">
          <h2>SYSTEM DOCS</h2>
          <p>OPERATOR MANUAL</p>
        </div>
        <nav className="docs-nav-list">
          {docsRegistry.map((doc) => (
            <button
              key={doc.id}
              className={`docs-nav-btn ${activeDoc?.id === doc.id ? 'active' : ''}`}
              onClick={() => handleNavClick(doc.id)}
            >
              <DynamicIcon name={doc.icon} />
              <span>{doc.title}</span>
            </button>
          ))}
        </nav>

        <div className="docs-sidebar-footer">
          <div className="docs-sidebar-footer-header">
            <span className="footer-title">STREAM CONTROLS</span>
            <span className={`status-dot ${isStreaming ? (isPaused ? 'paused' : 'active') : 'done'}`}></span>
          </div>

          <div className="docs-sidebar-mode-toggle">
            <button 
              className={`mode-btn ${streamMode === 'typewriter' ? 'active' : ''}`}
              onClick={() => handleSetStreamMode('typewriter')}
              title="Line-by-line typewriter streaming animation"
            >
              <Terminal size={12} /> Typewriter
            </button>
            <button 
              className={`mode-btn ${streamMode === 'instant' ? 'active' : ''}`}
              onClick={() => handleSetStreamMode('instant')}
              title="Instant full rendering"
            >
              <Eye size={12} /> Instant
            </button>
          </div>

          {streamMode === 'typewriter' && (
            <div className="docs-sidebar-stream-controls">
              <div className="docs-sidebar-progress-info">
                <span className="progress-status">
                  {isStreaming 
                    ? (isPaused ? 'PAUSED' : `LINE ${displayedLineCount}/${totalLines}`) 
                    : 'COMPLETED'}
                </span>
                <span className="progress-pct">{progressPercent}%</span>
              </div>
              <div className="docs-progress-container">
                <div className="docs-progress-bar" style={{ width: `${progressPercent}%` }}></div>
              </div>

              <div className="docs-sidebar-speed-row">
                <span className="row-label">SPEED</span>
                <div className="speed-pills">
                  {SPEED_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      className={`speed-pill ${speedMs === opt.ms ? 'active' : ''}`}
                      onClick={() => handleSetSpeed(opt.ms)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="docs-sidebar-action-grid">
                <button 
                  className={`sidebar-action-btn ${autoScroll ? 'active-follow' : ''}`} 
                  onClick={toggleAutoScroll}
                  title={autoScroll ? "Follow Mode Active: Auto-scrolls down to active typing line" : "Unfollow Mode Active: Free manual scroll without auto-scrolling"}
                >
                  <ArrowDown size={12} className={autoScroll ? "follow-icon-active" : "follow-icon-off"} />
                  <span>{autoScroll ? "Follow" : "Unfollow"}</span>
                </button>

                {isStreaming && (
                  <button 
                    className="sidebar-action-btn" 
                    onClick={togglePause}
                    title={isPaused ? "Resume Animation" : "Pause Animation"}
                  >
                    {isPaused ? <Play size={12} /> : <Pause size={12} />}
                    <span>{isPaused ? "Resume" : "Pause"}</span>
                  </button>
                )}

                {isStreaming && (
                  <button 
                    className="sidebar-action-btn" 
                    onClick={handleSkip}
                    title="Skip to full document"
                  >
                    <SkipForward size={12} />
                    <span>Skip</span>
                  </button>
                )}

                <button 
                  className="sidebar-action-btn" 
                  onClick={handleReplay}
                  title="Replay animation"
                >
                  <RotateCcw size={12} />
                  <span>Replay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="docs-main-content" ref={mainContentRef}>
        {activeDoc ? (
          <div className="docs-content-wrapper">
            <div className="markdown-body">
              <Markdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeRaw, [rehypeKatex, { output: 'html', strict: false }]]}
                components={{
                  blockquote({ node, children, ...props }) {
                    let alertType = null;
                    
                    const processChildren = (nodes) => {
                      return React.Children.map(nodes, child => {
                        if (typeof child === 'string') {
                          if (!alertType) {
                            const match = child.match(/^\s*\[!(TIP|WARNING|IMPORTANT|NOTE|CAUTION)\]/i);
                            if (match) {
                              alertType = match[1].toLowerCase();
                              return child.replace(match[0], '').replace(/^\s*<br\s*\/?>\s*/i, '').trimStart();
                            }
                          }
                          return child;
                        }
                        if (React.isValidElement(child)) {
                          return React.cloneElement(child, {}, processChildren(child.props.children));
                        }
                        return child;
                      });
                    };

                    const processedChildren = processChildren(children);

                    if (alertType) {
                       let icon = <Info size={18} />;
                       let alertClass = "docs-alert-important";
                       
                       if (alertType === 'tip') {
                          icon = <Lightbulb size={18} />;
                          alertClass = "docs-alert-tip";
                       } else if (alertType === 'warning') {
                          icon = <AlertCircle size={18} />;
                          alertClass = "docs-alert-warning";
                       } else if (alertType === 'caution') {
                          icon = <AlertCircle size={18} />;
                          alertClass = "docs-alert-caution";
                       }

                       const filterEmptyChildren = (nodes) => {
                         return React.Children.toArray(nodes).filter(child => {
                           if (typeof child === 'string') return child.trim().length > 0;
                           if (React.isValidElement(child) && child.type === 'p') {
                             const pChildren = React.Children.toArray(child.props.children);
                             if (pChildren.length === 0) return false;
                             if (pChildren.every(c => typeof c === 'string' && c.trim().length === 0)) return false;
                           }
                           return true;
                         });
                       };
                       
                       return (
                          <div className={`docs-alert ${alertClass}`}>
                             <div className="docs-alert-icon">{icon}</div>
                             <div className="docs-alert-content">{filterEmptyChildren(processedChildren)}</div>
                          </div>
                       );
                    }
                    
                    return <blockquote {...props}>{children}</blockquote>;
                  },
                  code({node, inline, className, children, ...props}) {
                    return (
                      <code className={`${className} docs-code-block`} {...props}>
                        {children}
                      </code>
                    )
                  },
                  table({node, children, ...props}) {
                    return (
                      <div className="docs-table-container">
                        <table {...props}>{children}</table>
                      </div>
                    );
                  },
                  a({node, href, children, ...props}) {
                    const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
                    return (
                      <a 
                        href={href} 
                        target={isExternal ? '_blank' : undefined} 
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                        className="docs-external-link"
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  }
                }}
              >
                {visibleContent}
              </Markdown>

              {isStreaming && (
                <div className="docs-stream-cursor-line">
                  <span className="docs-stream-cursor">▋</span>
                  <span className="docs-stream-indicator-text">Writing telemetry stream...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="docs-loading">Loading documentation...</div>
        )}
      </main>
    </div>
  );
}

export default Docs;