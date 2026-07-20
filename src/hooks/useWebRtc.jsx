import { useEffect, useRef, useState, useCallback } from "react";

export default function useWebRTC(socket) {
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const iceQueue = useRef([]);
  const [isInCall, setIsInCall] = useState(false);
  const [incomingData, setIncomingData] = useState(null);

  const createPeer = useCallback(() => {
    const connection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice", event.candidate);
      }
    };

    connection.ontrack = (event) => {
      const audio = document.getElementById("remoteAudio");
      if (audio) {
        audio.srcObject = event.streams[0];
        audio.play().catch(err => console.log("Audio autoplay interrupted:", err));
      }
    };

    peerConnection.current = connection;
    return connection;
  }, [socket]);

  const getLocalAudio = useCallback(async () => {
    if (localStream.current) return localStream.current;
    localStream.current = await navigator.mediaDevices.getUserMedia({ audio: {echoCancellation:true,noiseSuppression:true} });
    return localStream.current;
  }, []);

  const processIceQueue = useCallback(async () => {
    while (iceQueue.current.length > 0 && peerConnection.current?.remoteDescription) {
      const candidate = iceQueue.current.shift();
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding queued ICE candidate", e);
      }
    }
  }, []);

  const addLocalAudio = useCallback(() => {
    if (localStream.current && peerConnection.current) {
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });
    }
  }, []);

  const startCall = useCallback(async (username) => {
    await getLocalAudio();
    createPeer();
    addLocalAudio();
    
    const offer = await peerConnection.current.createOffer();
    
    await peerConnection.current.setLocalDescription(offer); 
    
    socket.emit("offer", { offer, caller: username }); 
    
    setIsInCall(true);
  }, [createPeer, getLocalAudio, addLocalAudio, socket]);

  const acceptCall = useCallback(async () => {
    if (!incomingData) return;
    await getLocalAudio();
    createPeer();
    addLocalAudio();
    const rawOffer = incomingData.offer || incomingData; 
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(rawOffer));

    await processIceQueue();
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    
    socket.emit("answer", answer);
    setIncomingData(null);
    setIsInCall(true);
  }, [incomingData, createPeer, getLocalAudio, addLocalAudio, socket]);

  const endCall = useCallback((isInitiator=true) => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    iceQueue.current = [];
    setIsInCall(false);
    setIncomingData(null);
    if (isInitiator) {
      socket.emit("call:end");
    }
  }, [socket]);

  useEffect(() => {
    const handleReceiveOffer = (data) => {
      setIncomingData(data);
    };

    const handleReceiveAnswer = async (answer) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        await processIceQueue();
      }
    };

    const handleReceiveIce = async (candidate) => {
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
      else
      {
        iceQueue.current.push(candidate)
      }
    };

    const handleCallEnded = () => {
      endCall(false);
    };

    socket.on("offer", handleReceiveOffer);
    socket.on("answer", handleReceiveAnswer);
    socket.on("ice", handleReceiveIce);
    socket.on("call:end", handleCallEnded);

    return () => {
      socket.off("offer", handleReceiveOffer);
      socket.off("answer", handleReceiveAnswer);
      socket.off("ice", handleReceiveIce);
      socket.off("call:end", handleCallEnded);
    };
  }, [socket, endCall,processIceQueue]);

  return {
    startCall,
    acceptCall,
    endCall,
    isInCall,
    callerName: incomingData?.caller,
    hasIncomingCall: !!incomingData
  };
}