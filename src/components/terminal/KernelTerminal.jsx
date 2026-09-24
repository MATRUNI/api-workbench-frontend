import { useState, useRef, useEffect, useMemo, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal as TerminalIcon, 
  X, 
  Maximize2, 
  Minimize2, 
  Play, 
  Trash2, 
  Layers, 
  CornerDownLeft,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldCheck,
  ChevronRight,
  Info,
  Database,
  Sparkles,
  Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CodeMirrorEditor from '../utility_Components/CodeMirrorEditor';
import { useTerminal } from '../../context/TerminalContext.js';
import { RequestContext } from '../../context/RequestContext';
import { TabContext } from '../../context/TabContext';
import { LibraryContext } from '../../context/LibraryContext';
import { executeTerminalCommand } from './commandEngine';
import { createTerminalCompletionSource } from './terminalCompletions';
import '../../style/KernelTerminal.css';
import { UserContext } from '../../context/UserContext.jsx';

export default function KernelTerminal() {
  const navigate = useNavigate();
  const { 
    isTerminalOpen, 
    closeTerminal, 
    terminalViewMode, 
    setTerminalViewMode, 
    terminalLogs, 
    addTerminalLog, 
    clearTerminalLogs,
    commandHistory,
    pushCommandHistory 
  } = useTerminal();

  const requestCtx = useContext(RequestContext);
  const tabCtx = useContext(TabContext);
  const { APIList = [] } = useContext(LibraryContext) || {};
  const { user } = useContext(UserContext)
  const { tabs = [] } = tabCtx || {};
  const { url, method } = requestCtx || {};
  
  const [commandText, setCommandText] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(() => {
    try {
      const saved = localStorage.getItem('api_os_terminal_show_suggestions');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleSuggestions = () => {
    setShowSuggestions(prev => {
      const next = !prev;
      try {
        localStorage.setItem('api_os_terminal_show_suggestions', String(next));
      } catch {}
      return next;
    });
  };

  const logContainerRef = useRef(null);

  // Resizable drawer height (persisted in localStorage)
  const [terminalHeight, setTerminalHeight] = useState(() => {
    try {
      const saved = localStorage.getItem('api_os_terminal_height');
      return saved ? Math.max(180, parseInt(saved, 10)) : 360;
    } catch {
      return 360;
    }
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(360);

  // Floating Window (HUD Mode) Position & Size (persisted in localStorage)
  const [hudPos, setHudPos] = useState(() => {
    try {
      const saved = localStorage.getItem('api_os_terminal_hud_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          const maxX = (typeof window !== 'undefined' ? window.innerWidth : 1200) - 100;
          const maxY = (typeof window !== 'undefined' ? window.innerHeight : 800) - 80;
          return {
            x: Math.max(16, Math.min(parsed.x, maxX)),
            y: Math.max(16, Math.min(parsed.y, maxY))
          };
        }
      }
    } catch {}
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const initialWidth = Math.min(880, Math.floor(w * 0.85));
    const initialX = Math.max(20, Math.floor((w - initialWidth) / 2));
    return { x: initialX, y: 70 };
  });

  const [hudSize, setHudSize] = useState(() => {
    try {
      const saved = localStorage.getItem('api_os_terminal_hud_size');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.width === 'number' && typeof parsed?.height === 'number') {
          const maxW = (typeof window !== 'undefined' ? window.innerWidth : 1200) - 30;
          const maxH = (typeof window !== 'undefined' ? window.innerHeight : 800) - 30;
          return {
            width: Math.max(440, Math.min(parsed.width, maxW)),
            height: Math.max(260, Math.min(parsed.height, maxH))
          };
        }
      }
    } catch {}
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      width: Math.min(880, Math.floor(w * 0.85)),
      height: Math.min(540, Math.floor(h * 0.65))
    };
  });

  // HUD Dragging state & refs
  const [isDraggingHud, setIsDraggingHud] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });

  // HUD 2D Resizing state & refs
  const [hudResizeMode, setHudResizeMode] = useState(null); // 'corner' | 'right' | 'bottom' | null
  const hudResizeOrigin = useRef({ clientX: 0, clientY: 0, width: 0, height: 0 });

  // Drawer resize drag handlers
  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    resizeStartY.current = clientY;
    resizeStartHeight.current = terminalHeight;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      const deltaY = resizeStartY.current - clientY;
      const minH = 180;
      const maxH = window.innerHeight - 70;
      const newHeight = Math.min(Math.max(resizeStartHeight.current + deltaY, minH), maxH);
      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem('api_os_terminal_height', String(terminalHeight));
      } catch (err) {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isResizing, terminalHeight]);

  // Floating Window (HUD) Header Drag Handlers
  const handleHudDragStart = (e) => {
    if (terminalViewMode !== 'hud') return;
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.traffic-dot') || e.target.closest('.shortcut-pill')) {
      return;
    }
    e.preventDefault();
    setIsDraggingHud(true);
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    dragStartOffset.current = {
      x: clientX - hudPos.x,
      y: clientY - hudPos.y
    };
  };

  useEffect(() => {
    if (!isDraggingHud) return;

    const handleMouseMove = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      const maxX = Math.max(16, window.innerWidth - 120);
      const maxY = Math.max(16, window.innerHeight - 60);
      const newX = Math.max(10, Math.min(clientX - dragStartOffset.current.x, maxX));
      const newY = Math.max(10, Math.min(clientY - dragStartOffset.current.y, maxY));
      setHudPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingHud(false);
      try {
        localStorage.setItem('api_os_terminal_hud_pos', JSON.stringify(hudPos));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingHud, hudPos]);

  // Floating Window (HUD) Resize Handlers (corner, right edge, bottom edge)
  const startHudResize = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    setHudResizeMode(mode);
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    hudResizeOrigin.current = {
      clientX,
      clientY,
      width: hudSize.width,
      height: hudSize.height
    };
  };

  useEffect(() => {
    if (!hudResizeMode) return;

    const handleMouseMove = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      const deltaX = clientX - hudResizeOrigin.current.clientX;
      const deltaY = clientY - hudResizeOrigin.current.clientY;

      const minW = 440;
      const minH = 240;
      const maxW = Math.max(minW, window.innerWidth - hudPos.x - 16);
      const maxH = Math.max(minH, window.innerHeight - hudPos.y - 16);

      setHudSize(prev => {
        let newW = prev.width;
        let newH = prev.height;

        if (hudResizeMode === 'corner' || hudResizeMode === 'right') {
          newW = Math.min(Math.max(hudResizeOrigin.current.width + deltaX, minW), maxW);
        }
        if (hudResizeMode === 'corner' || hudResizeMode === 'bottom') {
          newH = Math.min(Math.max(hudResizeOrigin.current.height + deltaY, minH), maxH);
        }

        return { width: newW, height: newH };
      });
    };

    const handleMouseUp = () => {
      setHudResizeMode(null);
      try {
        localStorage.setItem('api_os_terminal_hud_size', JSON.stringify(hudSize));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [hudResizeMode, hudSize, hudPos]);

  // Adjust position on browser window resize so window isn't pushed offscreen
  useEffect(() => {
    const handleWinResize = () => {
      setHudPos(prev => ({
        x: Math.max(10, Math.min(prev.x, window.innerWidth - 120)),
        y: Math.max(10, Math.min(prev.y, window.innerHeight - 60))
      }));
    };
    window.addEventListener('resize', handleWinResize);
    return () => window.removeEventListener('resize', handleWinResize);
  }, []);

  const handleDoubleClickResize = () => {
    setTerminalHeight(prev => {
      if (prev < 320) return 460;
      if (prev < 520) return Math.min(window.innerHeight - 80, 680);
      return 340;
    });
  };

  const handleHeaderDoubleClick = () => {
    if (terminalViewMode !== 'hud') return;
    const isNearMax = hudSize.width >= window.innerWidth - 60 && hudSize.height >= window.innerHeight - 80;
    if (isNearMax) {
      const normalWidth = Math.min(880, Math.floor(window.innerWidth * 0.85));
      const normalHeight = Math.min(540, Math.floor(window.innerHeight * 0.65));
      setHudSize({ width: normalWidth, height: normalHeight });
      setHudPos({
        x: Math.max(20, Math.floor((window.innerWidth - normalWidth) / 2)),
        y: 70
      });
    } else {
      setHudPos({ x: 20, y: 20 });
      setHudSize({
        width: window.innerWidth - 40,
        height: window.innerHeight - 40
      });
    }
  };

  // Auto-scroll logs to bottom when updated
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [terminalLogs, isTerminalOpen, isExecuting]);

  // Refocus editor when execution completes and prompt returns
  useEffect(() => {
    if (!isExecuting && isTerminalOpen) {
      const timer = setTimeout(() => {
        const cmContent = logContainerRef.current?.querySelector('.cm-content');
        if (cmContent && document.activeElement !== cmContent) {
          cmContent.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isExecuting, isTerminalOpen]);

  // Autocomplete completion source with dynamic live state
  const recentUrls = useMemo(() => {
    const urls = [];
    if (url) urls.push(url);
    tabs.forEach(t => {
      if (t.url && !urls.includes(t.url)) urls.push(t.url);
    });
    return urls;
  }, [url, tabs]);

  const completionSource = useMemo(() => {
    return createTerminalCompletionSource({
      tabs,
      apiList: APIList,
      recentUrls
    });
  }, [tabs, APIList, recentUrls]);

  // Handle command submission from CodeMirror Enter or Run button
  const handleExecute = async (rawCmd) => {
    const cmd = (rawCmd !== undefined ? rawCmd : commandText).trim();
    if (!cmd || isExecuting) return;

    if(cmd==="exit") 
    {
      clearTerminalLogs()
      closeTerminal();
      return;
    }

    pushCommandHistory(cmd);
    setHistoryIndex(-1);

    // Echo the executed command into terminal log
    addTerminalLog({
      type: 'command',
      text: cmd
    });

    setCommandText('');
    setIsExecuting(true);

    // Execute via command engine against real system state
    try {
      const result = await executeTerminalCommand(cmd, {
        ...requestCtx,
        tabCtx,
        apiList: APIList,
        navigate,
        handleAddTab: tabCtx?.handleAddTab
      });

      if (result) {
        if (result.type === 'clear') {
          clearTerminalLogs();
        } else {
          addTerminalLog(result);
        }
      }
    } catch (err) {
      addTerminalLog({
        type: 'error',
        text: `Execution failed: ${err.message}`
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // History cycling with ArrowUp and ArrowDown
  const handleHistoryUp = (view) => {
    if (commandHistory.length === 0) return false;
    const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1);
    setHistoryIndex(nextIdx);
    const cmd = commandHistory[nextIdx];
    if (cmd) {
      setCommandText(cmd);
      if (view) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: cmd },
          selection: { anchor: cmd.length }
        });
      }
      return true;
    }
    return false;
  };

  const handleHistoryDown = (view) => {
    if (historyIndex <= 0) {
      setHistoryIndex(-1);
      setCommandText('');
      if (view) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: '' }
        });
      }
      return true;
    }
    const nextIdx = historyIndex - 1;
    setHistoryIndex(nextIdx);
    const cmd = commandHistory[nextIdx] || '';
    setCommandText(cmd);
    if (view) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: cmd },
        selection: { anchor: cmd.length }
      });
    }
    return true;
  };

  const handleViewportClick = (e) => {
    // If not clicking interactive controls, focus the prompt editor
    if (!e.target.closest('button') && !e.target.closest('a') && !e.target.closest('.chip')) {
      const cmContent = logContainerRef.current?.querySelector('.cm-content');
      if (cmContent) {
        cmContent.focus();
      }
    }
  };

  const setPromptChip = (snippet) => {
    setCommandText(snippet);
    setTimeout(() => {
      const cmContent = logContainerRef.current?.querySelector('.cm-content');
      if (cmContent) cmContent.focus();
    }, 40);
  };

  return (
    <AnimatePresence>
      {isTerminalOpen && (
        <motion.div 
          className={`kernel-terminal-wrapper ${
            terminalViewMode === 'hud' ? 'mode-hud' : 'mode-drawer'
          } ${isResizing || isDraggingHud || hudResizeMode ? 'is-resizing' : ''} ${isDraggingHud ? 'is-dragging' : ''}`}
          initial={terminalViewMode === 'hud' ? { opacity: 0, scale: 0.98 } : { y: '100%' }}
          animate={terminalViewMode === 'hud' ? { opacity: 1, scale: 1 } : { y: 0 }}
          exit={terminalViewMode === 'hud' ? { opacity: 0, scale: 0.98 } : { y: '100%' }}
          transition={
            isDraggingHud || hudResizeMode 
              ? { duration: 0 } 
              : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
          }
          style={
            terminalViewMode === 'drawer'
              ? { height: `${terminalHeight}px` }
              : {
                  left: `${hudPos.x}px`,
                  top: `${hudPos.y}px`,
                  width: `${hudSize.width}px`,
                  height: `${hudSize.height}px`
                }
          }
        >
          {/* Top Resize Handle Bar (Bottom-docked Drawer Mode) */}
          {terminalViewMode === 'drawer' && (
            <div 
              className={`terminal-resize-handle ${isResizing ? 'is-resizing' : ''}`}
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
              onDoubleClick={handleDoubleClickResize}
              title="Drag up/down to resize terminal (Double-click to toggle height)"
            >
              <div className="resize-grip" />
            </div>
          )}

          {/* Floating HUD Mode 2D Resize Handles */}
          {terminalViewMode === 'hud' && (
            <>
              <div 
                className="terminal-hud-edge-r"
                onMouseDown={(e) => startHudResize(e, 'right')}
                onTouchStart={(e) => startHudResize(e, 'right')}
                title="Drag to resize width"
              />
              <div 
                className="terminal-hud-edge-b"
                onMouseDown={(e) => startHudResize(e, 'bottom')}
                onTouchStart={(e) => startHudResize(e, 'bottom')}
                title="Drag to resize height"
              />
              <div 
                className={`terminal-hud-corner ${hudResizeMode === 'corner' ? 'is-active' : ''}`}
                onMouseDown={(e) => startHudResize(e, 'corner')}
                onTouchStart={(e) => startHudResize(e, 'corner')}
                title="Drag corner to resize width and height"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" className="corner-grip-svg">
                  <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="8" y1="6" x2="6" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </>
          )}

          {/* 1. Terminal Topbar with Authentic Traffic Lights & Window Dragging */}
          <div 
            className={`terminal-header-bar ${terminalViewMode === 'hud' ? 'is-hud-header' : ''}`}
            onMouseDown={handleHudDragStart}
            onTouchStart={handleHudDragStart}
            onDoubleClick={handleHeaderDoubleClick}
            title={terminalViewMode === 'hud' ? 'Click and drag to move window (Double-click to toggle maximize)' : undefined}
          >
            <div className="header-left">
              <div className="terminal-traffic-lights">
                <button 
                  className="traffic-dot dot-close" 
                  onClick={closeTerminal} 
                  title="Close Terminal (Ctrl + `)" 
                />
                <button 
                  className="traffic-dot dot-min" 
                  onClick={() => {
                    if (terminalViewMode === 'drawer') {
                      setTerminalHeight(prev => prev > 420 ? 240 : 520);
                    } else {
                      setHudSize(prev => ({
                        ...prev,
                        height: prev.height > 420 ? 320 : 540
                      }));
                    }
                  }} 
                  title={terminalViewMode === 'drawer' ? "Toggle Drawer Height" : "Toggle Window Height"} 
                />
                <button 
                  className="traffic-dot dot-max" 
                  onClick={() => setTerminalViewMode(prev => prev === 'drawer' ? 'hud' : 'drawer')} 
                  title="Switch Drawer / Floating Window" 
                />
              </div>

              <div className="terminal-session-title">
                <TerminalIcon size={13} className="terminal-brand-icon" />
                <span className="session-user">{user?`${user.username}@api-os`:'operator@api-os'}</span>
                <span className="session-sep">:</span>
                <span className="session-path">~</span>
                <span className="version-tag">(kernel-v1.5)</span>
              </div>
            </div>

            <div className="header-right">
              <div className="target-tab-badge" title="Active Request Builder Target">
                <Layers size={11} />
                <span>TARGET: {method || 'GET'} {url ? url.replace(/^https?:\/\//, '').slice(0, 26) : 'Active Tab'}</span>
              </div>

              <span className="shortcut-pill" title="Toggle via shortcut">Ctrl + `</span>
              
              {terminalViewMode === 'drawer' && (
                <button 
                  className="terminal-ctrl-btn" 
                  onClick={() => setTerminalHeight(prev => prev > 480 ? 300 : Math.min(window.innerHeight - 80, 640))}
                  title={terminalHeight > 480 ? "Collapse Height" : "Expand Height"}
                >
                  {terminalHeight > 480 ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
              )}

              <button 
                className={`terminal-ctrl-btn ${showSuggestions ? 'active-glow' : ''}`}
                onClick={toggleSuggestions}
                title={showSuggestions ? "Hide Suggestions Bar" : "Show Suggestions Bar"}
              >
                <Sparkles size={13} />
              </button>

              <button 
                className="terminal-ctrl-btn" 
                onClick={() => setTerminalViewMode(prev => prev === 'drawer' ? 'hud' : 'drawer')}
                title={terminalViewMode === 'drawer' ? 'Switch to Floating Window' : 'Dock to Bottom'}
              >
                <Layers size={13} />
              </button>

              <button className="terminal-ctrl-btn" onClick={clearTerminalLogs} title="Clear Screen (clear)" disabled={isExecuting}>
                <Trash2 size={13} />
              </button>

              <button className="terminal-ctrl-btn close-btn" onClick={closeTerminal} title="Dismiss Terminal (Esc)">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* 2. Authentic Continuous Terminal Canvas (Messages Stream) */}
          <div className="terminal-log-viewport" ref={logContainerRef} onClick={handleViewportClick}>
            {terminalLogs.map((log) => (
              <div key={log.id} className={`terminal-log-row type-${log.type}`}>
                {log.type === 'command' ? (
                  <div className="command-stream-line">
                    <span className="terminal-prompt-glyph">
                      <span className="prompt-user">{user?`${user.username}@api-os`:'operator@api-os'}</span>
                      <span className="prompt-sep">:</span>
                      <span className="prompt-dir">~</span>
                      <span className="prompt-symbol">$</span>
                    </span>
                    <span className="command-stream-text">{log.text}</span>
                  </div>
                ) : log.type === 'suggestion' ? (
                  <div className="log-suggestion-card">
                    <div className="log-prefix">
                      <Sparkles size={12} className="log-icon suggestion-icon" />
                      <span className="suggestion-badge">COMMAND MATRIX & ROUTING</span>
                      <span className="log-time">{log.timestamp}</span>
                    </div>
                    <pre className="log-content suggestion-content">{log.text}</pre>
                  </div>
                ) : (
                  <div className="log-output-block">
                    {log.type !== 'system' && (
                      <div className="log-prefix">
                        {log.type === 'success' && <CheckCircle2 size={12} className="log-icon success-icon" />}
                        {log.type === 'error' && <AlertTriangle size={12} className="log-icon error-icon" />}
                        {log.type === 'telemetry' && <Zap size={12} className="log-icon telemetry-icon" />}
                        {log.type === 'info' && <Info size={12} className="log-icon info-icon" />}
                        <span className="log-time">{log.timestamp}</span>
                      </div>
                    )}
                    <pre className="log-content">{log.text}</pre>
                  </div>
                )}
              </div>
            ))}

            {/* Authentic Inline Prompt (Typing Directly in Canvas) - Hidden while API request is in flight */}
            {!isExecuting && (
              <div className="terminal-active-prompt-line">
                <span className="terminal-prompt-glyph">
                  <span className="prompt-user">{user?`${user.username}@api-os`:'operator@api-os'}</span>
                  <span className="prompt-sep">:</span>
                  <span className="prompt-dir">~</span>
                  <span className="prompt-symbol">$</span>
                </span>
                <div className="terminal-inline-editor">
                  <CodeMirrorEditor
                    value={commandText}
                    onChange={setCommandText}
                    lang="xml"
                    placeholderText="send [METHOD] [URL] with -a & -h & -b... (or 'help')"
                    customCompletionSource={completionSource}
                    onEnter={handleExecute}
                    onArrowUp={handleHistoryUp}
                    onArrowDown={handleHistoryDown}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Dedicated Bottom Suggestions Dock (Clearly Separated from Message Stream) */}
          {showSuggestions && (
            <div className="terminal-suggestions-section">
              <div className="suggestions-header">
                <Sparkles size={11} className="suggestions-sparkle-icon" />
                <span className="chips-label">SUGGESTIONS:</span>
              </div>
              <div className="suggestions-scroll">
                <button className="chip" onClick={() => setPromptChip('tab list')} disabled={isExecuting}>
                  <Layers size={10} style={{ marginRight: 4 }} />
                  tab list
                </button>
                <button className="chip" onClick={() => setPromptChip('tab new')} disabled={isExecuting}>
                  tab new
                </button>
                <button className="chip" onClick={() => setPromptChip('goto workbench')} disabled={isExecuting}>
                  <Compass size={10} style={{ marginRight: 4 }} />
                  goto workbench
                </button>
                <button className="chip" onClick={() => setPromptChip('goto console')} disabled={isExecuting}>
                  goto console
                </button>
                <button className="chip" onClick={() => setPromptChip('send https://jsonplaceholder.typicode.com/posts/1')} disabled={isExecuting}>
                  GET /posts/1
                </button>
                <button className="chip" onClick={() => setPromptChip('send POST https://api.stripe.com/v1/customers with -a bearer sk_test_secret & -b {"name": "Test"}')} disabled={isExecuting}>
                  POST with -a & -b
                </button>
                <button className="chip" onClick={() => setPromptChip('history size')} disabled={isExecuting}>
                  <Database size={10} style={{ marginRight: 4 }} />
                  history size
                </button>
                <button className="chip" onClick={() => setPromptChip('db tables')} disabled={isExecuting}>
                  db tables
                </button>
                <button className="chip" onClick={() => setPromptChip('help')} disabled={isExecuting}>
                  help
                </button>
              </div>
            </div>
          )}

          {/* 4. Terminal Minimal Monospace Footer */}
          <div className={`terminal-footer-status ${isExecuting ? 'is-executing' : ''}`}>
            {isExecuting ? (
              <>
                <span className="footer-busy-indicator">
                  <Zap size={11} className="footer-busy-icon" />
                  Request in-flight (waiting for response stream)...
                </span>
                <span className="sec-tag">
                  <ShieldCheck size={12} style={{ marginRight: 4 }} />
                  Foreground Job
                </span>
              </>
            ) : (
              <>
                <span>[Enter] Dispatch</span>
                <span>[Shift+Enter] Multiline</span>
                <span>[Tab / Arrows] Autocomplete</span>
                <span>[Ctrl + `] Toggle CLI</span>
                <span className="sec-tag">
                  <ShieldCheck size={12} style={{ marginRight: 4 }} />
                  Modeless Shell
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}