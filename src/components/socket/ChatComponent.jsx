import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { socket } from '../../socket/index.js';
import { UserContext } from '../../context/UserContext.jsx';
import { 
  Terminal, 
  Send, 
  Users, 
  Cpu,
  Activity, 
  Hash, 
  Trash2,
  HelpCircle,
  Phone,
  PhoneOff,
  PhoneCall
} from 'lucide-react';
import '../../style/ChatComponent.css';
import { useNavigate } from 'react-router-dom';
import refreshSession from '../../utils/refreshSession.js';
import useWebRTC from '../../hooks/useWebRtc.jsx';

function ChatComponent() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null; 
  }

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [member, setMember] = useState(0);
  const [auditLog, setAuditLog] = useState([]);
  const [latency, setLatency] = useState(12);

  // WebRTC Hook
  const { 
    startCall, 
    acceptCall, 
    endCall, 
    isInCall, 
    callerName, 
    hasIncomingCall 
  } = useWebRTC(socket);

  const feedEndRef = useRef(null);
  const auditEndRef = useRef(null);

  const pushAudit = useCallback((text, type = 'default') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAuditLog((prev) => [...prev, { timestamp, text, type }].slice(-11));
  }, []);

  const scrollToBottom = () => {
    feedEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    auditEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [auditLog]);

  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      setLatency(() => Math.floor(Math.random() * (16 - 9) + 9));
    }, 5000);
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    pushAudit('INIT Channel network routing context...', 'sys');
    socket.connect();

    function onConnect() {
      setIsConnected(true);
      pushAudit('HANDSHAKE established securely.', 'ok');
    }

    function onDisconnect() {
      setIsConnected(false);
      pushAudit('CONNECTION_CLOSED by host pipeline.', 'sys');
    }

    function onMembers(data) {
      setMember(data);
      pushAudit(`NODE_SWEEP done. Relays: ${data}`, 'default');
    }

    function onMessageReceived(value) {
      const verifiedPayload = typeof value === 'string' 
        ? { sender: 'RemoteOperator', text: value, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        : value;

      setMessages((previous) => [...previous, verifiedPayload].slice(-100));
      pushAudit(`RECV package from @${verifiedPayload.sender || 'system'}`);
    }

    let refreshing = false;
    async function onRefresh(error) {
      if (error.message !== "ACCESS_TOKEN_EXPIRED") {
        pushAudit("Invalid session. Login required.", "sys");
        return;
      }
      if (refreshing) return;
      if (error.message === "ACCESS_TOKEN_EXPIRED") {
        refreshing = true;
        try {
          const res = await refreshSession();
          if (res) {
            socket.connect();
          } else {
            navigate('/auth');
          }
        } finally {
          refreshing = false;
        }
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('members', onMembers);
    socket.on('chat:receive', onMessageReceived);
    socket.on("connect_error", onRefresh);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('members', onMembers);
      socket.off('chat:receive', onMessageReceived);
      socket.off("connect_error", onRefresh);
      socket.disconnect();
    };
  }, [navigate, pushAudit]);

  const handleStartCall = useCallback(() => {
    const currentUsername = user?.username || 'GuestOperator';
    pushAudit(`VOICE_LINK initialized as @${currentUsername}...`, 'sys');
    startCall(currentUsername);
  }, [user, pushAudit, startCall]);

  const handleAcceptCall = useCallback(() => {
    pushAudit(`VOICE_LINK connected with @${callerName}`, 'ok');
    acceptCall();
  }, [callerName, pushAudit, acceptCall]);

  const handleEndCall = useCallback(() => {
    pushAudit('VOICE_LINK terminated.', 'sys');
    endCall();
  }, [pushAudit, endCall]);

  const executeSystemCommand = (command) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (command === '/clear') {
      setMessages([]);
      pushAudit('MEM_PURGE triggered successfully', 'ok');
      return;
    }

    if (command === '/call') {
      if (!isConnected) {
        pushAudit('Cannot initiate call: Network offline.', 'sys');
        return;
      }
      handleStartCall();
      return;
    }
    if (command === '/end') {
      if (!isInCall) {
        pushAudit('No active VOICE_LINK stream to terminate.', 'sys');
        return;
      }
      handleEndCall();
      return;
    }

    if (command === '/help') {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'system',
          text: 'AVAILABLE CONSOLE SHELL COMMANDS:\n' +
                '  /help    - Prints list of diagnostic operations.\n' +
                '  /clear   - Purges message memory snapshot buffers.\n' +
                '  /call    - Initiates outward WebRTC voice stream link.\n' +
                '  /end     - Terminates active WebRTC voice stream link.\n' +
                '  /status  - Executes trace route checks for network health.',
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
                `  [VOICE_STREAM] ${isInCall ? 'CONNECTED' : 'IDLE'}\n` +
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
      <audio id="remoteAudio" autoPlay />

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
              <span className="hud-label">VOICE_STREAM</span>
              <span className="hud-value">
                <span className={`chat-status-dot ${isInCall ? 'connected' : 'disconnected'}`} />
                {isInCall ? 'ACTIVE' : 'IDLE'}
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

        {/* Live system logs pipeline */}
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
        <header className="chat-header">
          <div className="chat-header-channel">
            <Hash size={16} className="text-muted" />
            <span>stdout_stream</span>
          </div>

          {/* Voice Call UI Controls in Header */}
          <div className="chat-call-controls">
            {hasIncomingCall && !isInCall && (
              <button className="chat-call-btn call-accept" onClick={handleAcceptCall}>
                <PhoneCall size={14} /> Accept Call from @{callerName}
              </button>
            )}

            {!isInCall && !hasIncomingCall && (
              <button 
                className="chat-call-btn call-start" 
                onClick={handleStartCall}
                disabled={!isConnected}
              >
                <Phone size={14} /> Start Voice Link
              </button>
            )}

            {isInCall && (
              <button className="chat-call-btn call-end" onClick={handleEndCall}>
                <PhoneOff size={14} /> Disconnect ({callerName ? `@${callerName}` : 'In Call'})
              </button>
            )}
          </div>

          {/* Mobile Status Panel */}
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
              STREAM IDLE. Enter <code className="chat-empty-highlight">/help</code>...
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