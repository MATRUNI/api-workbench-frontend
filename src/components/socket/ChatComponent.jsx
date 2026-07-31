import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { UserContext } from '../../context/UserContext.jsx';
import { SocketContext } from '../../context/SocketContext.jsx';
import { 
  Terminal, 
  Send, 
  Users, 
  Cpu,
  Activity, 
  Hash, 
  Trash2,
  HelpCircle
} from 'lucide-react';
import '../../style/ChatComponent.css';
import { useNavigate } from 'react-router-dom';

function ChatComponent() {
  const { user } = useContext(UserContext);
  const { socket, isConnected, member } = useContext(SocketContext);
  const navigate = useNavigate();

  // Redirect if unauthenticated
  useEffect(() => {
    if (user === null) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null; 
  }

  // Application & Metrics States
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [auditLog, setAuditLog] = useState([]);
  const [latency, setLatency] = useState(12);

  const feedEndRef = useRef(null);
  const auditEndRef = useRef(null);

  // Helper to add timestamped logs to the Audit Buffer panel
  const pushAudit = useCallback((text, type = 'default') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAuditLog((prev) => [...prev, { timestamp, text, type }].slice(-11));
  }, []);

  // Auto-scroll chat feed
  const scrollToBottom = () => {
    feedEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(()=>{
    pushAudit(`NODE_SWEEP done. Relays: ${member}`, 'default');
  },[member])
  useEffect(() => {
    auditEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [auditLog]);

  // Latency simulator
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      setLatency(() => Math.floor(Math.random() * (16 - 9) + 9));
    }, 5000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Socket Event Listeners Pipeline (Connection management handled by SocketContext)
  useEffect(() => {
    pushAudit('INIT Channel network routing context...', 'sys');

    function onMessageReceived(value) {
      const verifiedPayload = typeof value === 'string' 
        ? { sender: 'RemoteOperator', text: value, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        : value;

      setMessages((previous) => [...previous, verifiedPayload].slice(-100));
      pushAudit(`RECV package from @${verifiedPayload.sender || 'system'}`);
    }

    socket.on('chat:receive', onMessageReceived);

    return () => {
      socket.off('chat:receive', onMessageReceived);
    };
  }, [socket, pushAudit]);

  // Shell Command Processor
  const executeSystemCommand = (input) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const parts = input.trim().split(/\s+/);
    const command = parts[0].toLowerCase();

    if (command === '/clear') {
      setMessages([]);
      pushAudit('MEM_PURGE triggered successfully', 'ok');
      return;
    }

    if (command === '/help') {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'system',
          text: 'AVAILABLE CONSOLE SHELL COMMANDS:\n' +
                '  /help                 - Prints diagnostic operations guide.\n' +
                '  /clear                - Purges message memory snapshot buffers.\n' +
                '  /status               - Executes trace route checks for network health.',
          timestamp,
          type: 'system'
        }
      ].slice(-100));
      return;
    }

    if (command === '/status') {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'system',
          text: `NETWORK METRICS STATUS:\n` +
                `  [STATE] online\n` +
                `  [LATENCY] ${latency}ms\n` +
                `  [OPERATOR] ${user?.username || 'GuestOperator'}`,
          timestamp,
          type: 'system'
        }
      ].slice(-100));
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: 'system',
        text: `COMMAND_ERROR: Unrecognized directory path "${command}". Send /help to query system index guides.`,
        timestamp,
        type: 'system'
      }
    ].slice(-100));
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const trimmedInput = inputValue.trim();

    if (trimmedInput.startsWith('/')) {
      executeSystemCommand(trimmedInput);
      setInputValue('');
      return;
    }

    const payload = {
      sender: user?.username || 'GuestOperator',
      text: trimmedInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socket.emit('chat:send', payload);
    setMessages((previous) => [...previous, payload].slice(-100));
    pushAudit(`SEND package frame successfully broadcasted.`);
    setInputValue('');
  };

  return (
    <div className="chat-workbench">
      {/* Sidebar Controls Console */}
      <aside className="chat-sidebar">
        <div>
          <h3 className="chat-brand-title">
            <Terminal size={16} className="dot" />
            <span>SHELL_STREAM_v2</span>
          </h3>
          <p className="chat-sidebar-sub">
            OPERATOR: {user?.username || 'NOT_LOGGED'}
          </p>

          <div className="chat-hud-group">
            <div className="chat-status-indicator">
              <span className="hud-label">STATE</span>
              <span className="hud-value">
                <span className={`chat-status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <div className="chat-status-indicator">
              <span className="hud-label">LATENCY</span>
              <span className="hud-value hud-value-latency">
                {latency}ms
              </span>
            </div>

            <div className="chat-status-indicator">
              <span className="hud-label">RELAYS</span>
              <span className="hud-value hud-value-relays">
                <Users size={11} /> {member}
              </span>
            </div>
          </div>
        </div>

        {/* Live System Logs Pipeline */}
        <div className="chat-audit-wrapper">
          <span className="chat-audit-header">
            <Cpu size={12} /> AUDIT_LOG_BUFFER
          </span>
          <div className="chat-audit-box">
            {auditLog.map((log, index) => (
              <div key={index} className={`audit-entry ${log.type}`}>
                [{log.timestamp}] {log.text}
              </div>
            ))}
            <div ref={auditEndRef} />
          </div>
        </div>

        {/* Core Controls Row */}
        <div className="chat-action-container">
          <button 
            className="add-row-btn chat-btn-guide" 
            onClick={() => executeSystemCommand('/help')}
          >
            <HelpCircle size={14} /> Guide
          </button>
          <button 
            className="add-row-btn chat-btn-clear" 
            disabled={messages.length === 0}
            onClick={() => executeSystemCommand('/clear')}
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </aside>

      {/* Main Streaming Feed Area */}
      <main className="chat-main">
        {/* Header Bar */}
        <header className="chat-header">
          <div className="chat-header-channel">
            <Hash size={16} className="text-muted" />
            <span>stdout_stream</span>
          </div>

          {/* Mobile Metrics Bar */}
          <div className="chat-mobile-metrics-bar">
            <div className="chat-mobile-status-wrapper">
              <span className={`chat-status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
              <span className={isConnected ? 'chat-mobile-latency-ok' : 'chat-mobile-latency-bad'}>
                {isConnected ? `${latency}ms` : 'OFFLINE'}
              </span>
            </div>
            <div className="chat-mobile-relays-wrapper">
              <Users size={12} />
              <span>{member}</span>
            </div>
          </div>

          <div className="chat-header-system-info">
            <Activity size={12} className="system-ready-light" />
          </div>
        </header>

        {/* Dynamic Feed Window */}
        <section className="chat-feed">
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              <span className="chat-empty-prompt">&gt;</span> 
              STREAM IDLE. Enter text messages or <code className="chat-empty-highlight">/help</code>...
            </div>
          ) : (
            messages.map((msg, index) => {
              const isSelf = msg.sender === (user?.username || 'GuestOperator');
              const isSys = msg.type === 'system' || msg.sender === 'system';
              
              if (isSys) {
                return (
                  <div key={index} className="message-wrapper system-broadcast">
                    <div className="msg-meta">
                      <span>[SYS_RELAY]</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div className="msg-bubble">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className={`message-wrapper ${isSelf ? 'outgoing' : 'incoming'}`}>
                  <div className="msg-meta">
                    <span className="msg-meta-author">
                      {isSelf ? 'you' : `@${msg.sender}`}
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp || '00:00'}</span>
                  </div>
                  <div className="msg-bubble">
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={feedEndRef} className="chat-anchor-node" />
        </section>

        {/* Shell Input Row */}
        <footer className="chat-input-row">
          <form onSubmit={sendMessage} className="chat-input-form">
            <div className="chat-prompt">$&gt;</div>
            <input 
              type="text"
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              placeholder={isConnected ? "Send message package..." : "Pipeline offline..."}
              className="chat-input"
              disabled={!isConnected}
            />
            <button 
              type="submit" 
              className="chat-send-btn" 
              disabled={!isConnected || !inputValue.trim()}
            >
              <Send size={14} />
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}

export default ChatComponent;