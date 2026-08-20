import React, { useState, useContext, useEffect, useRef } from 'react';
import { UserContext } from '../../context/UserContext.jsx';
import { SocketContext } from '../../context/SocketContext.jsx';
import { useNavigate } from 'react-router-dom';
import { 
  Radio, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Volume2, 
  VolumeX, 
  Users, 
  Zap, 
  Activity, 
  Terminal, 
  UserCheck, 
  PhoneCall,
  PhoneIncoming,
  History
} from 'lucide-react';
import useWebRTC from '../../hooks/useWebRtc.jsx';
import '../../style/VoiceCallRoom.css';

export default function VoiceCallRoom() {
  const { user } = useContext(UserContext);
  const { socket, onlineUsers, stopRing } = useContext(SocketContext);
  const navigate = useNavigate();

  const [targetUser, setTargetUser] = useState('');
  const [invitee,setInvitee] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const cleanPeers = (str) => {
    if (!str) return [];
    return str
      .split(/[\s,]+/)
      .map((u) => u.trim().replace(/^@/, ''))
      .filter(Boolean);
  };
  // Initialize WebRTC custom hook using the context socket
  const {
    startCall,
    acceptCall,
    endCall,
    rejectCall,
    inviteMorePeers,
    isInCall,
    getPeers,
    inCallMembers,
    callEvents,
    callerId,
    hasIncomingCall
  } = useWebRTC(socket, invitee);

  useEffect(() => {
    if (user === null) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) return null;

  // Handle direct call initiation via form submission
  const handleInitiateCall = (e) => {
    e?.preventDefault();
    if(isInCall)
    {
      const peers = cleanPeers(targetUser);
      peers.forEach(peer=>{
        inviteMorePeers(peer);
      })
      return;
    }
    if (!targetUser.trim()) return;
    const peersToInvite = cleanPeers(targetUser)
    if(peersToInvite.length===0) return;
    setInvitee((prev) => Array.from(new Set([...prev, ...peersToInvite])));
    setTargetUser("")
    startCall();
  };

  // Handle direct call via roster selection
  const handleDirectCall = (peerUserId) => {
    const peersToInvite = Array.from(new Set([...invitee,...cleanPeers(peerUserId)]))
    setInvitee(peersToInvite);
    
    startCall();
  };

  // Toggle local microphone track status
  const toggleMute = () => {
    setIsMuted((prev) => {
      const nextState = !prev;
      const peers = getPeers();
      peers.forEach(([_, peerData]) => {
        if (peerData.pc) {
          peerData.pc.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind === 'audio') {
              sender.track.enabled = !nextState;
            }
          });
        }
      });
      return nextState;
    });
  };

  const toggleDeafen = () => setIsDeafened((prev) => !prev);

  const getUsername = (id) => {
    if (id === 'you' || id === 'host') return id.toUpperCase();
    const found = onlineUsers.find(u => u.userId === id);
    return found ? found.username : id?.substring(0, 6) || id;
  };

  const activePeers = getPeers();
  const otherOperators = onlineUsers.filter((u) => u.username !== user.username);

  return (
    <div className="comm-deck-workbench">
      {/* TOP HUD HEADER */}
      <header className="comm-hud-topbar">
        <div className="comm-brand">
          <Radio size={16} className={isInCall ? "radio-glow active" : "radio-glow"} />
          <div className="comm-brand-text">
            <span className="comm-model-title">COMM_MATRIX // V3.0</span>
            <span className="comm-sub-status">
              STATUS: {isInCall ? <span className="status-online">STREAM_ACTIVE</span> : <span className="status-standby">AWAITING_PATCH</span>}
            </span>
          </div>
        </div>

        <div className="comm-metrics-group">
          <div className="comm-metric-chip">
            <Users size={12} className="chip-icon green" />
            <span>ONLINE_RELAYS: <strong>{onlineUsers.length}</strong></span>
          </div>
        </div>
      </header>

      {/* INCOMING CALL MODAL BANNER */}
      {hasIncomingCall && !isInCall && (
        <div className="incoming-call-alert-bar">
          <div className="alert-message">
            <PhoneIncoming size={16} className="pulse-icon" />
            <span>INCOMING PATCH SIGNAL FROM: <strong>@{getUsername(callerId)}</strong></span>
          </div>
          <div className="alert-actions">
            <button className="accept-btn" onClick={()=>{
              stopRing();
              acceptCall();
              }}>
              ACCEPT_LINK
            </button>
            <button className="decline-btn" onClick={() => {
              stopRing()
              rejectCall()
              }}>
              REJECT
            </button>
          </div>
        </div>
      )}

      {/* MAIN WORKBENCH PANEL */}
      <div className="comm-stage-body">
        {/* LEFT PANEL: ROUTER DIALER & NETWORK ROSTER */}
        <div className="comm-dialer-panel">
          <div className="panel-header">
            <Terminal size={14} />
            <span>ROUTER_DIALER</span>
          </div>

          <div className="dialer-content">
            <form onSubmit={handleInitiateCall} className="dialer-form">
              <div className="dialer-input-wrapper">
                <span className="dialer-prefix">@</span>
                <input 
                  type="text"
                  placeholder="operator_id..."
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  className="dialer-input"
                  disabled={isInCall}
                />
              </div>

              <button type="submit" className="dialer-connect-btn" disabled={!targetUser.trim() || isInCall}>
                <Zap size={14} /> INITIALIZE_CALL
              </button>
            </form>

            <div className="online-roster-wrapper">
              <div className="roster-header">
                <UserCheck size={12} className="roster-icon" />
                <span>ONLINE NETWORK NODES ({otherOperators.length})</span>
              </div>

              <div className="roster-list-scroll">
                {otherOperators.length === 0 ? (
                  <div className="roster-empty">NO OTHER OPERATORS ONLINE</div>
                ) : (
                  otherOperators.map((peerName) => {
                    const isConnected = inCallMembers.includes(peerName.userId);

                    return (
                      <div key={peerName.username} className="roster-item-row">
                        <div className="roster-user-info">
                          <span className="online-dot-led" />
                          <span className="roster-username">@{peerName.username}</span>
                        </div>

                        {!isConnected ? (
                          <button 
                            className="roster-call-action-btn" 
                            onClick={() => handleDirectCall(peerName.userId)}
                            disabled={isInCall}
                          >
                            <PhoneCall size={12} />
                            <span>CALL</span>
                          </button>
                        ) : (
                          <span className="roster-connected-tag">CONNECTED</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* CALL AUDIT LOG SYSTEM */}
            <div className="call-events-wrapper">
              <div className="roster-header">
                <History size={12} className="roster-icon" />
                <span>SYSTEM_LOGS</span>
              </div>
              <div className="events-list-scroll">
                {callEvents.length === 0 ? (
                  <div className="roster-empty">NO RECENT EVENTS</div>
                ) : (
                  callEvents.slice().reverse().map((ev, idx) => (
                    <div key={idx} className="event-log-item">
                      <span className="event-time">{new Date(ev.time).toLocaleTimeString()}</span>
                      <span className={`event-type ${ev.type.toLowerCase()}`}>[{ev.type}]</span>
                      <span className="event-user">@{getUsername(ev.user)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: CALL MANIFEST / OPERATOR TILES */}
        <div className="comm-manifest-panel">
          <div className="panel-header">
            <Activity size={14} />
            <span>CALL_MANIFEST ({isInCall ? activePeers.length + 1 : 0} IN CALL)</span>
          </div>

          <div className="manifest-grid-scroll">
            {!isInCall ? (
              <div className="manifest-empty-state">
                <span>NO ACTIVE SIGNAL CONNECTIONS</span>
                <p>Select an online operator or dial an ID to open audio patch.</p>
              </div>
            ) : (
              <div className="manifest-cards-grid">
                {/* LOCAL OPERATOR CARD */}
                <div className={`operator-card local-operator ${isMuted ? 'muted' : ''}`}>
                  <div className="op-card-top">
                    <span className="op-role-badge local">YOU</span>
                    <span className="op-handle">@{user.username}</span>
                  </div>
                  <div className="op-card-bottom">
                    <span className={`op-led ${!isMuted ? 'online' : 'off'}`} />
                    <span>{isMuted ? 'INPUT_MUTED' : 'TX_TRANSMITTING'}</span>
                  </div>
                </div>

                {/* REMOTE OPERATOR TILES */}
                {activePeers.map(([peerId, peerData]) => (
                  <div key={peerId} className="operator-card remote-operator">
                    <div className="op-card-top">
                      <span className="op-role-badge remote">PEER</span>
                      <span className="op-handle">@{getUsername(peerId)}</span>
                    </div>
                    <div className="op-card-bottom">
                      <span className="op-led online" />
                      <span>RX_RECEIVING</span>
                    </div>
                    <RemoteAudioTrack stream={peerData.stream} isDeafened={isDeafened} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER CONTROL BAR */}
      <footer className="comm-dock-bar">
        <div className="dock-actions-row">
          <button 
            className={`dock-control-btn ${isMuted ? 'active-mute' : ''}`} 
            onClick={toggleMute} 
            disabled={!isInCall}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            <span className="dock-btn-text">{isMuted ? 'UNMUTE_MIC' : 'MUTE_MIC'}</span>
          </button>

          <button 
            className={`dock-control-btn ${isDeafened ? 'active-deafen' : ''}`} 
            onClick={toggleDeafen} 
            disabled={!isInCall}
          >
            {isDeafened ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="dock-btn-text">{isDeafened ? 'ENABLE_AUDIO' : 'DEAFEN'}</span>
          </button>

          {isInCall && (
            <button className="dock-control-btn btn-sever" onClick={() => endCall(true)}>
              <PhoneOff size={16} />
              <span className="dock-btn-text">SEVER_LINK</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

// Sub-component for auto-playing incoming WebRTC audio tracks
function RemoteAudioTrack({ stream, isDeafened }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.muted = isDeafened;
      audioRef.current.play().catch((err) => console.warn("Autoplay block:", err));
    }
  }, [stream, isDeafened]);

  return <audio ref={audioRef} autoPlay playsInline controls={false} style={{ display: 'none' }} />;
}