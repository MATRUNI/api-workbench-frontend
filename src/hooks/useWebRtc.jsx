import { useEffect, useRef, useState, useCallback } from "react";

const CALL_EVENTS = {
  CREATE:"CREATE",
  JOIN:"JOIN",
  INVITE:"INVITE",
  LEFT:"LEFT",
  KICK:"KICK",
  REJECT:"REJECT",
  END:"END",
  INCOMING:"INCOMING"
};
export default function useWebRTC(socket,invitee=[]) {
  const peers = useRef(new Map());
  const localStream = useRef(null);
  const iceQueue = useRef(new Map());
  const membersRef = useRef([]);
  const inviteeRef = useRef(invitee);
  const currentCallId = useRef('');

  useEffect(() => {
    inviteeRef.current = invitee;
  }, [invitee]);

  const [isInCall, setIsInCall] = useState(false);
  const [incomingData, setIncomingData] = useState(null);
  const [inCallMembers, setInCallMembers] = useState([]);
  const [, update] = useState(0);
  const [callEvents,setCallEvents] = useState([]);

  const forceUpdate = useCallback(() => {
    update((x) => x + 1);
  }, []);
  const updateMembers = (members)=>{
      membersRef.current = members;
      setInCallMembers(members);
  }
  const addCallEvent = useCallback((type,user,extra={})=>{
      setCallEvents(prev=>[
          ...prev.slice(-99),
          {
              type,
              user,
              time:Date.now(),
              ...extra
          }
      ]);
  },[]);

  const getLocalAudio = useCallback(async () => {
    if (localStream.current) {
      return localStream.current;
    }

    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl:true,
          channelCount:1
        },
      });
    } catch (err) {
      console.warn("Advanced audio failed, using basic audio", err);
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    }

    return localStream.current;
  }, []);

  const removePeer = useCallback((peer) => {
    const peerConnection = peers.current.get(peer);
    if (!peerConnection) return;

    peerConnection.pc.onconnectionstatechange = null;
    peerConnection.pc.close();

    peerConnection.stream = null;
    peers.current.delete(peer);
    iceQueue.current.delete(peer);

    if (peers.current.size === 0) {
      setIsInCall(false);
    }

    forceUpdate();
  }, [forceUpdate]);

  const createPeer = useCallback(async ({ caller }) => {
    const existing = peers.current.get(caller);
    if (existing) {
      return existing.pc;
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    const peer = {
      pc,
      stream: null,
    };

    peers.current.set(caller, peer);

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "closed" ||
        pc.connectionState === "disconnected"
      ) {
        removePeer(caller);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice", {
          to:caller,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = ({ streams }) => {
      const currentPeer = peers.current.get(caller);
      if (!currentPeer) return;

      currentPeer.stream = streams[0];
      forceUpdate();
    };

    const stream = await getLocalAudio();
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    return pc;
  }, [socket, getLocalAudio, forceUpdate, removePeer]);

  const processIceQueue = useCallback(async (caller) => {
    const peer = peers.current.get(caller);
    if (!peer) return;

    const queue = iceQueue.current.get(caller);
    if (!queue) return;

    while (queue.length) 
    {
      if(!peer.pc.remoteDescription) break;

      const candidate = queue.shift();

      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("ICE error", err);
      }
    }

    iceQueue.current.delete(caller);
  }, []);

  const startCall = useCallback(async () => {
    if (isInCall) return;
    socket.emit("call:create");
  }, [isInCall,socket]);

  const acceptCall = useCallback(async () => {
    if (!incomingData) return;

    currentCallId.current = incomingData.callId;
    socket.emit("call:join", {
      callId:currentCallId.current
    });

    setIncomingData(null);
    setIsInCall(true);
  }, [incomingData]);

  const rejectCall = useCallback(async()=>{
    if(!incomingData) return;
    const caller = incomingData.from;
    addCallEvent(
      CALL_EVENTS.REJECT,
      "you"
    )
    setIncomingData(null)
    socket.emit("call:reject",{callerId:caller})
  },[incomingData])

  const inviteMorePeers = useCallback((peer)=>{
    if(!isInCall) return;
    addCallEvent(
      CALL_EVENTS.INVITE,
      peer
    )
    socket.emit("call:invite", { to: peer, callId:currentCallId.current });
  },[isInCall,socket,addCallEvent])

  const endCall = useCallback((notify = true) => {
    addCallEvent(
      CALL_EVENTS.END,
      "you"
    );
    peers.current.forEach((peer) => {
      peer.pc.onconnectionstatechange = null;
      peer.pc.close();
    });

    peers.current.clear();
    currentCallId.current = '';
    forceUpdate();

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        track.stop();
      });

      localStream.current = null;
    }

    iceQueue.current.clear();
    updateMembers([]);
    setIncomingData(null);
    setIsInCall(false);

    if (notify) {
      socket.emit("call:end");
    }
  }, [socket,forceUpdate,addCallEvent]);

  const makeOffer = useCallback(async(users)=>{

    for (const peer of users) {
        const pc = await createPeer({caller: peer});

        const offer = await pc.createOffer();

        await pc.setLocalDescription(offer);

        socket.emit("offer", {
            to: peer,
            offer
        });
    }
  },[createPeer,socket])

  const getPeers = useCallback(() =>[...peers.current.entries()],[]);

  useEffect(() => {
    const handleOffer = async({ from, offer }) => {

      const pc = await createPeer({caller:from});
      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      const answer = await pc.createAnswer();

      await pc.setLocalDescription(answer);
      await processIceQueue(from)
      socket.emit("answer",{to:from,answer})
      setIsInCall(true);
    };

    const handleAnswer = async ({ from, answer }) => {
      const peer = peers.current.get(from);
      if (!peer) return;

      await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
      await processIceQueue(from);
    };

    const handleIce = async ({ from, candidate }) => {
      const peer = peers.current.get(from);

      if (!peer || !peer.pc.remoteDescription) {
        if (!iceQueue.current.has(from)) {
          iceQueue.current.set(from, []);
        }

        iceQueue.current.get(from).push(candidate);
        return;
      }

      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("ICE failed", err);
      }
    };

    const handlePeerLeft = ({ peer,reason }) => {
      removePeer(peer);
      addCallEvent(
          reason==="kicked"
          ? CALL_EVENTS.KICK
          : CALL_EVENTS.LEFT,
          peer,
          {
              reason
          }
      );
    };

    const handleCallEnd = () => {
      addCallEvent(
        CALL_EVENTS.END,
        "host"
      );
      endCall(false);
    };
    const handleCreated = (({callId})=>{
      setIsInCall(true)
      addCallEvent(
        CALL_EVENTS.CREATE,
        "you"
      );
      currentCallId.current = callId;
      inviteeRef.current.forEach(user => {
        socket.emit("call:invite", { to: user, callId });
      });
    })
    const handleInvited = (({from,callId})=>{
      setIncomingData({from,callId})
      addCallEvent(
          CALL_EVENTS.INCOMING,
          from
      );
    })
    const handleJoined = (({existingUsers})=>{
      updateMembers(existingUsers);
    
      makeOffer(existingUsers);
    })

    const handleCallUpdate = ({participants})=>{
      const oldMembers = membersRef.current;

      const joined = participants.filter(
          user => !oldMembers.includes(user)
      );

      joined.forEach(user=>{
          addCallEvent(
              CALL_EVENTS.JOIN,
              user
          );
      });
      const left = oldMembers.filter(
       user => !participants.includes(user)
      );
      
      left.forEach(user=>{
       addCallEvent(
         CALL_EVENTS.LEFT,
         user
       );
      });
      updateMembers(participants);   
    }
    const handleRejection = ({rejectedBy})=>{
      addCallEvent(
        CALL_EVENTS.REJECT,
        rejectedBy
      );
      setIncomingData(null);
      setIsInCall(false);
    }
    socket.on("call:created", handleCreated);
    socket.on("call:invited", handleInvited);
    socket.on("call:joined", handleJoined);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice", handleIce);
    socket.on("call:update", handleCallUpdate);
    socket.on("call:rejected",handleRejection)
    socket.on("peer:left", handlePeerLeft);
    socket.on("call:end", handleCallEnd);
    
    return () => {
      socket.off("call:created", handleCreated);
      socket.off("call:invited", handleInvited);
      socket.off("call:joined", handleJoined);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice", handleIce);
      socket.off("call:update", handleCallUpdate);
      socket.off("call:rejected",handleRejection)
      socket.off("peer:left", handlePeerLeft);
      socket.off("call:end", handleCallEnd);
    };
  }, [socket, processIceQueue, removePeer, endCall,createPeer,makeOffer]);

  useEffect(() => {
    return () => {
      endCall(false);
    };
  }, [endCall]);

  return {
    startCall,
    acceptCall,
    endCall,
    rejectCall,
    inviteMorePeers,
    isInCall,
    getPeers,
    inCallMembers,
    callEvents,
    CALL_EVENTS,
    callerName: incomingData?.from,
    hasIncomingCall: !!incomingData,
  };
}